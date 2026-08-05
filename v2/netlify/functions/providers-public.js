// providers-public.js
// Public, read-only lookup of REGISTERED providers by NPI, used to enrich the map
// and the care navigator with details only the provider can supply: whether they
// are accepting new patients, offer telehealth, and which payers they take.
//
// provider_profiles is RLS self-only, so this runs under the service role. That
// makes the allowlist below the security boundary: every field returned here is
// published to anyone, and NOTHING that identifies the account (id, email) or is
// patient data may be added to it. Providers opt into this by registering.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Safe to publish. `id` is deliberately absent: it is the auth user id.
// address_line is the PRACTICE street address. It is already public in the
// federal NPPES registry, and without it the map could show a claimed listing's
// city but not where it actually is. Still business data, never PHI.
const PUBLIC_COLUMNS = 'npi,npi_verified,accepting_new_patients,telehealth,bio,org_name,first_name,last_name,address_line,city,state,zip,phone,taxonomy_desc,office_hours,hours_note,booking_mode,booking_url';
// Availability columns arrive with migration 005. Until it runs, selecting them
// 400s and would take the whole endpoint down with it — including the verified
// badge, which already works. Fall back to the columns that definitely exist.
const BASE_COLUMNS = 'npi,npi_verified,accepting_new_patients,telehealth,bio,org_name,first_name,last_name,city,state,zip,phone,taxonomy_desc';
// Locations arrive with migration 006; absent until it runs.
const LOCATION_COLUMNS = 'provider_id,npi,label,address_line,city,state,zip,latitude,longitude,verified,is_primary,phone,accepting_new_patients,telehealth,office_hours,hours_note';

const MAX_NPIS = 80;

// PostgREST caps every response at 1000 rows regardless of `limit`, and a
// truncated reply is byte-for-byte indistinguishable from a complete one. The
// `?all=1` path asked for `limit=500` with no loop at all, so once registered
// providers passed 500 the map would silently stop drawing some of their pins
// — the exact bug already found and fixed in market-score.js and patient.js.
// There is only one registered provider today, so this was latent rather than
// observed, but it is the same class of bug and the fix is the same shape:
// walk with a keyset cursor rather than trust a single page.
const ALL_PAGE_CAP = 20000;
async function pagedAll(url, key, headers) {
  const rows = [];
  let cursor = '';
  while (rows.length < ALL_PAGE_CAP) {
    const seek = cursor === '' ? '' : `&${key}=gt.${encodeURIComponent(cursor)}`;
    const res = await fetch(`${url}${seek}&order=${key}&limit=1000`,
      { headers, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { rows, ok: rows.length > 0, truncated: false };
    const batch = await res.json();
    if (!Array.isArray(batch) || !batch.length) return { rows, ok: true, truncated: false };
    rows.push(...batch);
    if (batch.length < 1000) return { rows, ok: true, truncated: false };
    const next = batch[batch.length - 1][key];
    if (next == null || next === cursor) return { rows, ok: true, truncated: true };
    cursor = next;
  }
  return { rows, ok: true, truncated: true };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const env = process.env;
  let raw = '';
  if (event.httpMethod === 'GET') {
    raw = (event.queryStringParameters || {}).npis || '';
  } else if (event.httpMethod === 'POST') {
    try { raw = String((JSON.parse(event.body || '{}')).npis || ''); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  } else {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET or POST only' }) };
  }

  // Registered providers are far rarer than clinics on the map, so the map asks for
  // all of them once and joins locally rather than batching NPI lists per search.
  const wantAll = event.httpMethod === 'GET' && (event.queryStringParameters || {}).all === '1';

  const npis = [...new Set(String(raw).split(',').map(s => s.trim()).filter(s => /^\d{10}$/.test(s)))].slice(0, MAX_NPIS);
  if (!npis.length && !wantAll) return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {} }) };

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  // The npi=in.(...) path is bounded by MAX_NPIS (80) and can never truncate.
  // `?all=1` has no such bound — it is exactly the case pagedAll exists for.
  const filter = wantAll ? 'npi=not.is.null' : `npi=in.(${npis.join(',')})`;
  const inList = `(${npis.join(',')})`;

  // Listings flagged by exclusion screening stay unpublished until reviewed. If the
  // review column does not exist yet the query 400s, so fall back to the unfiltered
  // form — before that migration there is nothing flagged to hide.
  const REVIEW_FILTER = 'review_status=not.eq.pending';

  let truncated = false;

  try {
    let rows;
    if (wantAll) {
      let page = await pagedAll(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&${REVIEW_FILTER}&select=${PUBLIC_COLUMNS}`,
        'npi', svc);
      if (!page.ok) {
        page = await pagedAll(
          `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${PUBLIC_COLUMNS}`, 'npi', svc);
      }
      // Neither worked: retry without the availability columns, in case
      // migration 005 has not been applied yet.
      if (!page.ok) {
        page = await pagedAll(
          `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${BASE_COLUMNS}`, 'npi', svc);
      }
      if (!page.ok) throw new Error('profile lookup failed');
      rows = page.rows;
      truncated = page.truncated;
    } else {
      let profRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&${REVIEW_FILTER}&select=${PUBLIC_COLUMNS}`,
        { headers: svc, signal: AbortSignal.timeout(6000) }
      );
      if (!profRes.ok) {
        profRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${PUBLIC_COLUMNS}`,
          { headers: svc, signal: AbortSignal.timeout(6000) }
        );
      }
      // Neither worked: retry without the availability columns, in case migration
      // 005 has not been applied yet.
      if (!profRes.ok) {
        profRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${BASE_COLUMNS}`,
          { headers: svc, signal: AbortSignal.timeout(6000) }
        );
      }
      if (!profRes.ok) throw new Error('profile lookup failed');
      rows = await profRes.json();
    }
    if (!Array.isArray(rows) || !rows.length) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {} }) };
    }

    // Insurance is keyed by provider id, which we must not expose, so resolve it
    // through a second query and fold the payer names into the NPI-keyed result.
    // Same truncation risk as the profile fetch above when wantAll, so it gets
    // the same paged treatment rather than a bare limit=500.
    let idRows;
    if (wantAll) {
      const idPage = await pagedAll(`${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=not.is.null&select=id,npi`, 'npi', svc);
      idRows = idPage.rows;
      truncated = truncated || idPage.truncated;
    } else {
      const idRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=in.${inList}&select=id,npi`,
        { headers: svc, signal: AbortSignal.timeout(6000) }
      );
      idRows = idRes.ok ? await idRes.json() : [];
    }
    const npiById = {};
    for (const r of (Array.isArray(idRows) ? idRows : [])) npiById[r.id] = r.npi;

    // provider_insurance and provider_locations are both fetched with an
    // `in.(...)` over provider ids and no `limit`. Two separate ceilings apply
    // once the id list is long enough (which `?all=1` makes possible): the
    // PostgREST 1000-row response cap (max 50 payers/provider means 20
    // providers alone can produce 1000 insurance rows), and the URL-length
    // limit of putting thousands of UUIDs in one query string. Chunking the
    // `in.()` list AND paging each chunk's response handles both.
    const ID_BATCH = 100;
    async function fetchByProviderIds(table, selectCols) {
      const out = [];
      for (let i = 0; i < ids.length; i += ID_BATCH) {
        const chunk = ids.slice(i, i + ID_BATCH);
        const inClause = `(${chunk.map(x => `"${x}"`).join(',')})`;
        const page = await pagedAll(
          `${env.SUPABASE_URL}/rest/v1/${table}?provider_id=in.${inClause}&select=${selectCols}`,
          'provider_id', svc);
        out.push(...page.rows);
      }
      return out;
    }

    const payersByNpi = {};
    const ids = Object.keys(npiById);
    if (ids.length) {
      const insRows = await fetchByProviderIds('provider_insurance', 'provider_id,payer_name');
      for (const row of insRows) {
        const npi = npiById[row.provider_id];
        if (!npi || !row.payer_name) continue;
        (payersByNpi[npi] = payersByNpi[npi] || []).push(row.payer_name);
      }
    }

    // Practice locations (migration 006). A provider can list more than one
    // site, and only the one tied to the registered NPI is NPPES-verified --
    // `verified` per location is what lets the map ring them differently.
    // Missing table means the migration has not run: publish none rather than
    // failing the whole overlay, which still carries the verified badge.
    const locsByNpi = {};
    if (ids.length) {
      try {
        const locRows = await fetchByProviderIds('provider_locations', LOCATION_COLUMNS);
        for (const row of locRows) {
          const npi = npiById[row.provider_id];
          if (!npi) continue;
          const { provider_id, ...pub } = row;   // never publish the auth user id
          (locsByNpi[npi] = locsByNpi[npi] || []).push(pub);
        }
      } catch (e) { /* locations are additive; the overlay stands without them */ }
    }

    const providers = {};
    for (const r of rows) {
      providers[r.npi] = {
        npi: r.npi,
        registered: true,
        verified: !!r.npi_verified,
        accepting_new_patients: r.accepting_new_patients,
        telehealth: r.telehealth,
        org_name: r.org_name || null,
        name: r.org_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || null,
        city: r.city || null,
        state: r.state || null,
        zip: r.zip || null,
        phone: r.phone || null,
        specialty: r.taxonomy_desc || null,
        address_line: r.address_line || null,
        bio: r.bio || null,
        locations: locsByNpi[r.npi] || [],
        office_hours: r.office_hours || null,
        hours_note: r.hours_note || null,
        booking_mode: r.booking_mode || 'phone',
        booking_url: r.booking_url || null,
        payers: payersByNpi[r.npi] || []
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, max-age=120' },
      body: JSON.stringify({ providers })
    };
  } catch (e) {
    // The map must still render if this enrichment is unavailable
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {}, degraded: true }) };
  }
};
