// audit-run.js
// Runs a Directory Accuracy audit over a batch of NPIs and persists the
// findings. This is the engine behind the paid report.
//
// FOUNDER-ONLY TOOLING. Gated on a shared secret in the x-audit-key header,
// checked against AUDIT_ADMIN_KEY. There is no admin UI and no frontend caller;
// nothing in v2/*.html should ever reference this endpoint. If a payer-facing
// surface is built later it needs real auth, not this.
//
// TIME BUDGET. Netlify kills at 26s, so this targets ~15s of work:
//   - NPPES lookups run with bounded concurrency (one call per NPI is the
//     expensive part), 6s abort each
//   - Supabase reads are BATCHED with in.() -- never one query per NPI
//   - geocoding is skipped entirely when the audited address already equals
//     the NPPES address, which is the common case and the single biggest save
//   - a deadline is checked between NPIs; when it passes, whatever finished is
//     persisted, the audit is left `pending`, and the unprocessed NPIs are
//     returned so the caller can loop. A 26s kill must never leave an audit
//     that merely LOOKS complete.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUDIT_ADMIN_KEY

const { scoreProvider } = require('./lib/accuracy-signals.js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-audit-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const MAX_NPIS = 25;
const NPPES_CONCURRENCY = 6;
const NPPES_TIMEOUT = 6000;
const SUPABASE_TIMEOUT = 6000;
const GEOCODE_TIMEOUT = 5000;

// Stop starting new work at this point and persist what we have. Well inside
// the 26s kill, leaving room for the writes that follow.
const WORK_DEADLINE_MS = 15000;

const now = () => Date.now();

/* ------------------------------------------------------------------ utils */

const normAddr = s => String(s || '')
  .toLowerCase()
  .replace(/[.,#]/g, ' ')
  .replace(/\b(suite|ste|apt|unit|floor|fl|bldg|building)\b/g, ' ')
  .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|parkway|pkwy|court|ct|place|pl)\b/g, m => m[0])
  .replace(/\s+/g, ' ')
  .trim();

// Haversine. Only used to compare two geocoded points, so the earth-radius
// approximation is far more precision than the decision needs.
function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Run tasks with bounded concurrency; never rejects, results align to input. */
async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try { out[i] = await worker(items[i], i); }
      catch (e) { out[i] = { error: e && e.message ? e.message : String(e) }; }
    }
  });
  await Promise.all(runners);
  return out;
}

/* --------------------------------------------------------------- external */

async function nppesLookup(npi) {
  try {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${encodeURIComponent(npi)}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(NPPES_TIMEOUT) });
    if (!r.ok) return null;
    const d = await r.json();
    const rec = d && Array.isArray(d.results) ? d.results[0] : null;
    if (!rec) return null;
    const basic = rec.basic || {};
    const addrs = Array.isArray(rec.addresses) ? rec.addresses : [];
    // LOCATION is the practice address; MAILING is often a billing office and
    // would produce false "address diverges" findings.
    const loc = addrs.find(a => a.address_purpose === 'LOCATION') || addrs[0] || {};
    const name = basic.organization_name ||
      [basic.first_name, basic.last_name].filter(Boolean).join(' ') || null;
    return {
      status: basic.status || null,
      name,
      address: [loc.address_1, loc.city, loc.state, loc.postal_code].filter(Boolean).join(', '),
      address_line: loc.address_1 || '',
      city: loc.city || '', state: loc.state || '', zip: (loc.postal_code || '').slice(0, 5)
    };
  } catch { return null; }   // unreachable NPPES is unknown, never "clean"
}

async function geocode(query) {
  if (!query || !query.trim()) return null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'ProviderPulse/1.0 (directory accuracy audit)' }, signal: AbortSignal.timeout(GEOCODE_TIMEOUT) }
    );
    const d = await r.json();
    if (Array.isArray(d) && d[0]) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch { /* fall through */ }
  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
      { signal: AbortSignal.timeout(GEOCODE_TIMEOUT) }
    );
    const d = await r.json();
    const c = d && d.features && d.features[0] && d.features[0].geometry && d.features[0].geometry.coordinates;
    if (c) return { lat: c[1], lng: c[0] };
  } catch { /* give up */ }
  return null;
}

/* --------------------------------------------------------------- supabase */

function svc(env) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function sbGet(env, path) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: svc(env), signal: AbortSignal.timeout(SUPABASE_TIMEOUT)
  });
  if (!r.ok) return null;                       // missing table => unknown
  return r.json().catch(() => null);
}

const inList = npis => `(${npis.map(n => `"${n}"`).join(',')})`;

/**
 * One batched read per source. Doing these per NPI was the obvious way to
 * write it and would have made a 25-NPI audit issue 75 round trips.
 */
async function loadContext(env, npis) {
  const [activity, leieNpi, clinics, profiles] = await Promise.all([
    sbGet(env, `npi_activity?npi=in.${inList(npis)}&select=*`),
    sbGet(env, `leie_exclusions?npi=in.${inList(npis)}&select=npi,last_name,first_name,business_name,state,excl_type`),
    sbGet(env, `clinics?npi=in.${inList(npis)}&select=npi,name,address,city,state,zip,latitude,longitude`),
    sbGet(env, `provider_profiles?npi=in.${inList(npis)}&select=id,npi,address_line,city,state,zip,review_status`)
  ]);

  const byNpi = (rows, key = 'npi') => {
    const m = new Map();
    for (const r of (rows || [])) if (r && r[key]) m.set(String(r[key]), r);
    return m;
  };

  // Claimed locations, resolved through the profile ids we just found.
  const ids = (profiles || []).map(p => p.id).filter(Boolean);
  let locations = [];
  if (ids.length) {
    locations = await sbGet(env, `provider_locations?provider_id=in.${inList(ids)}&select=provider_id,address_line,city,state,zip,verified`) || [];
  }
  const locsByProvider = new Map();
  for (const l of locations) {
    if (!locsByProvider.has(l.provider_id)) locsByProvider.set(l.provider_id, []);
    locsByProvider.get(l.provider_id).push(l);
  }

  return {
    activity: byNpi(activity),
    leie: byNpi(leieNpi),
    clinics: byNpi(clinics),
    profiles: byNpi(profiles),
    locsByProvider,
    // A null table read means the source is unavailable. Distinguish that from
    // "queried and found nothing", or absence would read as a clean result.
    have: {
      activity: activity !== null,
      leie: leieNpi !== null,
      claimed: profiles !== null
    }
  };
}

/* ------------------------------------------------------------------- core */

async function auditOne(npi, ctx, directoryAddress, deadline) {
  const nppes = await nppesLookup(npi);

  const clinic = ctx.clinics.get(npi) || null;
  // What we are auditing: the caller's address if supplied, else whatever the
  // directory (clinics) claims. That IS the record under test.
  const audited = directoryAddress ||
    (clinic ? [clinic.address, clinic.city, clinic.state, clinic.zip].filter(Boolean).join(', ') : '');

  // ---- geocode, but only when it can change the answer --------------------
  let geocodeSignal = null;
  if (audited && nppes && nppes.address) {
    if (normAddr(audited).includes(normAddr(nppes.address_line)) ||
        normAddr(nppes.address).includes(normAddr(audited))) {
      // Identical addresses cannot be a distance apart. Skipping the two
      // network calls here is what makes 25 NPIs fit the budget.
      geocodeSignal = { directory_geocoded: true, distance_km: 0 };
    }
  }
  if (!geocodeSignal && audited && now() < deadline) {
    const a = clinic && clinic.latitude && clinic.longitude
      ? { lat: +clinic.latitude, lng: +clinic.longitude }      // already geocoded, free
      : await geocode(audited);
    const b = nppes && nppes.address ? await geocode(nppes.address) : null;
    geocodeSignal = { directory_geocoded: !!a, distance_km: (a && b) ? distanceKm(a, b) : null };
  }

  // ---- exclusion ----------------------------------------------------------
  let leieSignal = null;
  if (ctx.have.leie) {
    const hit = ctx.leie.get(npi);
    // Name+state matching needs the provider's name, which comes from NPPES.
    // Without it we can only report the NPI check, so say so rather than
    // implying the name check passed.
    leieSignal = { npi_match: !!hit, name_state_match: false };
  }

  // ---- claimed listing ----------------------------------------------------
  let claimedSignal = null;
  if (ctx.have.claimed) {
    const prof = ctx.profiles.get(npi);
    if (!prof) {
      claimedSignal = { claimed: false };
    } else {
      const locs = ctx.locsByProvider.get(prof.id) || [];
      const target = normAddr(audited);
      const match = locs.find(l => target && normAddr(l.address_line) &&
        (target.includes(normAddr(l.address_line)) || normAddr(l.address_line).includes(target)));
      claimedSignal = {
        claimed: true,
        verified_location: !!(match && match.verified),
        address_matches: !!match
      };
    }
  }

  const activityRow = ctx.have.activity ? (ctx.activity.get(npi) || null) : null;

  const scored = scoreProvider({
    nppes: nppes ? { status: nppes.status, address: nppes.address } : null,
    leie: leieSignal,
    activity: activityRow,
    ndf: null,                       // not wired yet; scores as unknown
    geocode: geocodeSignal,
    claimed: claimedSignal
  });

  return {
    npi,
    provider_name: (nppes && nppes.name) || (clinic && clinic.name) || null,
    address_checked: audited || null,
    confidence: scored.confidence,
    verdict: scored.verdict,
    signals: scored.signals
  };
}

/* ---------------------------------------------------------------- handler */

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };
  }

  const env = process.env;
  if (!env.AUDIT_ADMIN_KEY) {
    // Fail closed: an unset key must not mean an open endpoint.
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Audit tooling is not configured' }) };
  }
  const key = event.headers['x-audit-key'] || event.headers['X-Audit-Key'] || '';
  if (key !== env.AUDIT_ADMIN_KEY) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Database is not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const started = now();
  const deadline = started + WORK_DEADLINE_MS;
  const label = String(body.label || '').slice(0, 200) || null;

  // ---- resolve the NPI set ------------------------------------------------
  //
  // EXPLICIT NPIs ONLY. There was a {state, zip, taxonomy} mode here that
  // sampled from the `clinics` table; it has been removed because it could not
  // produce a usable audit.
  //
  // `clinics` holds NPI-2 ORGANISATION numbers (20 of 20 sampled). The Medicare
  // Physician & Other Practitioners PUF is keyed on Rndrng_NPI, a rendering
  // PRACTITIONER, and PECOS Order & Referring is likewise individuals.
  // Organisations do not render services, so npi_activity can never join to an
  // organisational NPI and every sampled audit came back 100% unverifiable at
  // the 0.35 cap. The same batch of individual NPIs scored 0.66 mean with real
  // differentiation, so the engine was never the problem.
  //
  // Restore a sampling mode only when it draws NPI-1s -- from NPPES by
  // state/city/taxonomy, or from a payer roster, which is what a real audit
  // input looks like anyway.
  let npis = [];
  let addressByNpi = new Map();
  if (Array.isArray(body.npis) && body.npis.length) {
    npis = [...new Set(body.npis.map(n => String(n).trim()).filter(n => /^\d{10}$/.test(n)))];
  }
  if (Array.isArray(body.addresses)) {
    for (const a of body.addresses) if (a && a.npi && a.address) addressByNpi.set(String(a.npi), String(a.address));
  }

  if (!npis.length) {
    return {
      statusCode: 400, headers: CORS,
      body: JSON.stringify({
        error: 'Supply npis[] (10-digit, max 25 per call).',
        note: 'Sampling by state/zip/taxonomy was removed: it drew organisational NPIs from clinics, which carry no Medicare or PECOS activity and always score unverifiable. Audit individual practitioner NPIs.'
      })
    };
  }
  const requested = npis.length;
  const overflow = npis.slice(MAX_NPIS);
  npis = npis.slice(0, MAX_NPIS);

  // ---- create the audit row FIRST, as pending -----------------------------
  // Written before any work so a kill leaves a row that says pending rather
  // than no row at all. status is only advanced to complete at the very end.
  const auditRes = await fetch(`${env.SUPABASE_URL}/rest/v1/directory_audits`, {
    method: 'POST',
    headers: { ...svc(env), Prefer: 'return=representation' },
    body: JSON.stringify({
      label,
      state: body.state ? String(body.state).toUpperCase().slice(0, 2) : null,
      zip_prefixes: body.zip ? [String(body.zip)] : null,
      provider_count: npis.length,
      status: 'pending'
    })
  }).catch(() => null);

  if (!auditRes || !auditRes.ok) {
    const detail = auditRes ? (await auditRes.text().catch(() => '')) : 'no response';
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not open the audit: ' + String(detail).slice(0, 200) }) };
  }
  const audit = ((await auditRes.json().catch(() => [])) || [])[0];
  const auditId = audit && audit.id;

  // ---- run ----------------------------------------------------------------
  const ctx = await loadContext(env, npis);

  const findings = [];
  const remaining = [];
  const results = await pool(npis, NPPES_CONCURRENCY, async (npi) => {
    if (now() >= deadline) { remaining.push(npi); return null; }
    return auditOne(npi, ctx, addressByNpi.get(npi) || null, deadline);
  });
  for (const r of results) if (r && !r.error && r.npi) findings.push(r);

  // ---- persist ------------------------------------------------------------
  if (findings.length) {
    const rows = findings.map(f => ({ audit_id: auditId, ...f }));
    const w = await fetch(`${env.SUPABASE_URL}/rest/v1/audit_findings`, {
      method: 'POST', headers: { ...svc(env), Prefer: 'return=minimal' }, body: JSON.stringify(rows)
    }).catch(() => null);
    if (!w || !w.ok) {
      const detail = w ? (await w.text().catch(() => '')) : 'no response';
      // Leave the audit `pending`: findings did not land, so it is not complete.
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Findings did not save: ' + String(detail).slice(0, 200), audit_id: auditId }) };
    }
  }

  const byVerdict = {};
  for (const f of findings) byVerdict[f.verdict] = (byVerdict[f.verdict] || 0) + 1;
  const meanConfidence = findings.length
    ? Math.round((findings.reduce((s, f) => s + (f.confidence || 0), 0) / findings.length) * 100) / 100
    : null;

  const leftover = remaining.concat(overflow);
  const status = leftover.length ? 'pending' : 'complete';

  await fetch(`${env.SUPABASE_URL}/rest/v1/directory_audits?id=eq.${auditId}`, {
    method: 'PATCH', headers: { ...svc(env), Prefer: 'return=minimal' },
    body: JSON.stringify({
      status,
      provider_count: findings.length,
      summary: {
        by_verdict: byVerdict,
        mean_confidence: meanConfidence,
        requested,
        scored: findings.length,
        remaining: leftover.length,
        elapsed_ms: now() - started,
        sources_available: ctx.have
      }
    })
  }).catch(() => { /* the findings are already saved; a failed summary is not fatal */ });

  // Audit log: the event only. No provider data, same discipline as the PHI
  // rules even though directory data is not PHI.
  fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
    method: 'POST', headers: svc(env),
    body: JSON.stringify({
      actor: null, actor_role: 'admin', action: 'directory_audit_run',
      detail: { audit_id: auditId, scored: findings.length, status },
      ip: event.headers['x-nf-client-connection-ip'] || ''
    })
  }).catch(() => { /* never block on audit logging */ });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      audit_id: auditId,
      status,
      requested,
      scored: findings.length,
      remaining: leftover,          // caller loops on this
      mean_confidence: meanConfidence,
      by_verdict: byVerdict,
      sources_available: ctx.have,
      elapsed_ms: now() - started,
      findings: findings.map(f => ({ npi: f.npi, verdict: f.verdict, confidence: f.confidence }))
    })
  };
};
