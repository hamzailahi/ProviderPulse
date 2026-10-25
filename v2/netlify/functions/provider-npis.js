// provider-npis.js
// One account, many NPIs (2026-10-25, migration 044). A provider account owns
// its registered NPI (provider_profiles) and may add more: a practice's other
// offices, a pharmacy chain's stores, the clinicians in a group. Each added
// NPI is its own listing (hours, insurance, availability) in provider_npis.
//
//   GET                -> {primary, npis: [...]} the account's listings
//   POST {npi}         -> add one: Luhn, active in NPPES, not claimed by any
//                         account, OIG screened like registration. It goes live
//                         at once when the registry's person (the clinician for
//                         NPI-1, the authorized official for NPI-2) has the
//                         account's verified name; otherwise, or on an OIG name
//                         and state match, it waits for review (admin-review).
//   PUT {id, ...}      -> edit an added NPI's listing (the same fields as
//                         profile.js) and, with `insurances`, replace its plans
//   DELETE ?id=        -> remove an added NPI from the account
//
// Signed-in providers only. Every write runs under the service role after the
// caller's ownership is checked here (provider_npis has no write policy at
// all), and only the whitelisted fields are ever sent, so nobody can set npi,
// review_status or account_id.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const { getUser, isProvider } = require('./lib/auth.js');
const { validNpi, nppesRecord, describeRecord, namesMatch, isExcluded, exclusionNameHits, npiClaimed, audit, svc } = require('./lib/npi-verify.js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};
const reply = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

// What a provider may edit on an added listing: profile.js's PROVIDER_FIELDS.
const LISTING_FIELDS = ['phone', 'address_line', 'city', 'state', 'zip', 'accepting_new_patients', 'telehealth', 'bio', 'org_name',
  'office_hours', 'appointment_minutes', 'booking_mode', 'booking_url', 'hours_note'];
const READ_COLUMNS = 'id,npi,entity_type,first_name,last_name,org_name,phone,address_line,city,state,zip,taxonomy_code,taxonomy_desc,' +
  'accepting_new_patients,telehealth,bio,office_hours,appointment_minutes,booking_mode,booking_url,hours_note,review_status,review_reason,created_at';
const MAX_ADDED = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}
// The review reason a provider sees is plain words; nothing about other people.
function statusWords(r) {
  if (r.review_status === 'clear') return 'live';
  if (r.review_status === 'blocked') return 'blocked';
  return 'review';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not configured' });

  const user = await getUser(env, event);
  if (!user) return reply(401, { error: 'Sign in again' });
  if (!(await isProvider(env, user))) return reply(403, { error: 'Providers only' });
  const ip = (event.headers || {})['x-nf-client-connection-ip'] || (event.headers || {})['x-forwarded-for'] || '';
  const H = { ...svc(env), 'Content-Type': 'application/json' };
  const rest = (path, init = {}) => fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) }, signal: AbortSignal.timeout(6000) });

  // The account's own listing: its NPI and the verified person's name.
  let primary;
  try {
    const r = await rest(`provider_profiles?id=eq.${encodeURIComponent(user.id)}&select=npi,entity_type,first_name,last_name,org_name,city,state,review_status`);
    const rows = r.ok ? await r.json() : null;
    if (!Array.isArray(rows)) return reply(503, { error: 'Your account did not load. Try again.' });
    primary = rows[0] || null;
  } catch { return reply(503, { error: 'Your account did not load. Try again.' }); }
  if (!primary) return reply(404, { error: 'This account has no provider listing yet' });

  const loadOwn = async () => {
    const r = await rest(`provider_npis?account_id=eq.${encodeURIComponent(user.id)}&select=${READ_COLUMNS}&order=created_at`);
    if (r.status === 404) return { rows: [], missing: true };
    if (!r.ok) throw new Error('load failed');
    return { rows: await r.json() };
  };
  const owned = async id => {
    if (!UUID_RE.test(String(id || ''))) return null;
    const r = await rest(`provider_npis?id=eq.${id}&account_id=eq.${encodeURIComponent(user.id)}&select=id,npi`);
    const rows = r.ok ? await r.json() : null;
    if (!Array.isArray(rows)) throw new Error('lookup failed');
    return rows[0] || null;
  };

  if (event.httpMethod === 'GET') {
    try {
      const own = await loadOwn();
      const ids = own.rows.map(r => r.id);
      const ins = {};
      if (ids.length) {
        const r = await rest(`provider_npi_insurance?npi_id=in.(${ids.join(',')})&select=npi_id,payer_name,plan_type&order=npi_id,payer_name&limit=1000`);
        for (const row of (r.ok ? await r.json() : [])) (ins[row.npi_id] = ins[row.npi_id] || []).push(row.payer_name);
      }
      return reply(200, {
        primary: { npi: primary.npi, name: primary.org_name || [primary.first_name, primary.last_name].filter(Boolean).join(' '), status: statusWords(primary) },
        npis: own.rows.map(r => ({ ...r, status: statusWords(r), insurance: ins[r.id] || [] })),
        enabled: !own.missing
      });
    } catch { return reply(503, { error: 'Your NPIs did not load. Try again.' }); }
  }

  let body = {};
  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid JSON' }); }
  }

  if (event.httpMethod === 'POST') {
    const npi = String(body.npi || '').trim();
    if (!validNpi(npi)) return reply(400, { error: 'That is not a valid NPI number' });
    if (npi === String(primary.npi).trim()) return reply(409, { error: 'That is already this account\'s NPI' });
    let own;
    try { own = await loadOwn(); } catch { return reply(503, { error: 'Your NPIs did not load. Try again.' }); }
    if (own.missing) return reply(503, { error: 'Adding NPIs is not switched on yet (migration 044).' });
    if (own.rows.length >= MAX_ADDED) return reply(400, { error: `An account can add at most ${MAX_ADDED} NPIs` });
    let claimed;
    try { claimed = await npiClaimed(env, npi); } catch { return reply(503, { error: 'Could not check this NPI just now. Try again in a minute.' }); }
    if (claimed) return reply(409, { error: 'This NPI is already claimed on ProviderPulse. Contact support if you believe this is an error.' });

    let record;
    try { record = await nppesRecord(npi); } catch { return reply(502, { error: 'The NPI registry did not answer. Try again shortly.' }); }
    if (!record) return reply(404, { error: 'NPI not found in the NPPES registry' });
    const d = describeRecord(record);
    if (d.deactivated) {
      await audit(env, { actor: user.id, actor_role: 'provider', action: 'provider_npi_add_deactivated', target: npi, ip });
      return reply(403, { error: 'This NPI is listed as deactivated in the NPPES registry and cannot be added.' });
    }
    if (await isExcluded(env, npi)) {
      await audit(env, { actor: user.id, actor_role: 'provider', action: 'provider_npi_add_oig_excluded', target: npi, ip });
      return reply(403, { error: 'This NPI appears on the OIG exclusion list and cannot be added. Contact support if you believe this is an error.' });
    }
    const nameHits = await exclusionNameHits(env, { entityType: d.entityType, lastName: d.personLast, firstName: d.personFirst, orgName: d.orgName, state: d.state });
    const sameName = namesMatch(d.personFirst, d.personLast, primary.first_name, primary.last_name);
    const reasons = [];
    const tc = s => String(s || '').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
    if (!sameName) reasons.push(`The registry lists ${tc([d.personFirst, d.personLast].filter(Boolean).join(' ')) || 'no one'} as ` +
      `${d.entityType === 2 ? 'its authorized official' : 'the clinician'}; this account is in the name of ` +
      `${tc([primary.first_name, primary.last_name].filter(Boolean).join(' ')) || 'no one yet'}`);
    if (nameHits > 0) reasons.push(`OIG name match: ${nameHits} exclusion record(s) share this name and state`);
    const row = {
      account_id: user.id, npi, entity_type: d.entityType,
      first_name: d.entityType === 1 ? d.personFirst || null : null, last_name: d.entityType === 1 ? d.personLast || null : null,
      org_name: d.orgName, phone: d.phone, address_line: d.address_line, city: d.city, state: d.state, zip: d.zip,
      taxonomy_code: d.taxonomy_code, taxonomy_desc: d.taxonomy_desc,
      review_status: reasons.length ? 'pending' : 'clear', review_reason: reasons.join('; ') || null
    };
    const ins = await rest('provider_npis', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
    if (!ins.ok) {
      const text = await ins.text().catch(() => '');
      if (ins.status === 409 || /already/.test(text)) return reply(409, { error: 'This NPI is already claimed on ProviderPulse.' });
      return reply(503, { error: 'Could not add this NPI just now. Try again.' });
    }
    const saved = (await ins.json())[0] || {};
    await audit(env, { actor: user.id, actor_role: 'provider', action: 'provider_npi_added', target: npi, ip,
      detail: { review_status: row.review_status, name_matched: sameName, name_exclusion_hits: nameHits } });
    return reply(200, {
      npi: { ...saved, status: statusWords(saved), insurance: [] },
      message: row.review_status === 'clear'
        ? 'Added and live. Patients now see this NPI as part of your practice.'
        : 'Added. It is held for a short review before patients see it' + (!sameName ? ', because the name on the registry is not the account\'s.' : '.')
    });
  }

  if (event.httpMethod === 'PUT') {
    let row;
    try { row = await owned(body.id); } catch { return reply(503, { error: 'Your NPIs did not load. Try again.' }); }
    if (!row) return reply(404, { error: 'No such NPI on this account' });
    const updates = pick(body, LISTING_FIELDS);
    if (Object.keys(updates).length) {
      const r = await rest(`provider_npis?id=eq.${row.id}&account_id=eq.${encodeURIComponent(user.id)}`, {
        method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(updates)
      });
      const changed = r.ok ? await r.json().catch(() => []) : null;
      if (!Array.isArray(changed) || !changed.length) return reply(400, { error: 'Update failed' });
    }
    if (Array.isArray(body.insurances)) {
      const del = await rest(`provider_npi_insurance?npi_id=eq.${row.id}`, { method: 'DELETE' });
      if (!del.ok) return reply(503, { error: 'Insurance did not save. Try again.' });
      const plans = [...new Set(body.insurances.slice(0, 50).map(p => String(p).trim().slice(0, 120)).filter(Boolean))];
      if (plans.length) {
        const add = await rest('provider_npi_insurance', { method: 'POST', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(plans.map(payer_name => ({ npi_id: row.id, payer_name }))) });
        if (!add.ok) return reply(503, { error: 'Insurance did not save. Try again.' });
      }
    }
    await audit(env, { actor: user.id, actor_role: 'provider', action: 'provider_npi_updated', target: row.npi, ip,
      detail: { fields: Object.keys(updates), insurance_replaced: Array.isArray(body.insurances) } });
    return reply(200, { ok: true });
  }

  if (event.httpMethod === 'DELETE') {
    const id = (event.queryStringParameters || {}).id;
    let row;
    try { row = await owned(id); } catch { return reply(503, { error: 'Your NPIs did not load. Try again.' }); }
    if (!row) return reply(404, { error: 'No such NPI on this account' });
    const r = await rest(`provider_npis?id=eq.${row.id}&account_id=eq.${encodeURIComponent(user.id)}`, { method: 'DELETE' });
    if (!r.ok) return reply(503, { error: 'Could not remove it just now. Try again.' });
    await audit(env, { actor: user.id, actor_role: 'provider', action: 'provider_npi_removed', target: row.npi, ip });
    return reply(200, { ok: true });
  }

  return reply(405, { error: 'GET, POST, PUT or DELETE only' });
};

exports.LISTING_FIELDS = LISTING_FIELDS;
