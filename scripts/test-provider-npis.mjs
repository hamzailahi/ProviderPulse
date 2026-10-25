// Tests for one account, many NPIs (migration 044): provider-npis.js adds an
// NPI only after the registry and OIG checks, makes it live only when the
// registry's person is the account's, never lets the caller set npi,
// review_status or account_id, and only touches the caller's own rows;
// providers-public publishes cleared added NPIs only; a booking to an added
// NPI reaches its account; registration refuses an NPI another account added.
// Fake network. Run: node scripts/test-provider-npis.mjs
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });

// A tiny fake database behind PostgREST-shaped URLs.
const ACC = 'aaaaaaaa-0000-4000-8000-000000000001', OTHER = 'bbbbbbbb-0000-4000-8000-000000000002';
let db, nppes, calls, users;
function reset() {
  db = {
    provider_profiles: [{ id: ACC, npi: '1234567893', first_name: 'ANN', last_name: 'LEE', org_name: null, entity_type: 1, review_status: 'clear' },
      { id: OTHER, npi: '1407942097', first_name: 'BOB', last_name: 'KIM', review_status: 'clear' }],
    provider_npis: [], provider_npi_insurance: [], leie_exclusions: [], audit_log: [], provider_insurance: [], provider_locations: [], appointment_requests: []
  };
  nppes = {}; calls = [];
  users = { tokA: { id: ACC, email: 'a@x.org', user_metadata: { role: 'provider' } }, tokP: { id: 'cccccccc-0000-4000-8000-000000000003', email: 'p@x.org', user_metadata: { role: 'patient' } } };
}
const J = (b, status = 200) => ({ ok: status < 300, status, json: async () => b, text: async () => JSON.stringify(b) });
function match(row, params) {
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict'].includes(k)) continue;
    const val = row[k] == null ? null : String(row[k]);
    if (v.startsWith('eq.')) { if (val !== v.slice(3)) return false; }
    else if (v.startsWith('in.(')) { const set = v.slice(4, -1).split(',').map(x => x.replace(/"/g, '')); if (!set.includes(val)) return false; }
    else if (v === 'not.is.null') { if (val === null) return false; }
    else if (v.startsWith('gt.')) { if (!(val > v.slice(3))) return false; }
  }
  return true;
}
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(String(url)), method = opts.method || 'GET';
  calls.push(method + ' ' + u.pathname + u.search);
  if (u.hostname === 'npiregistry.cms.hhs.gov') { const n = u.searchParams.get('number'); return J({ results: nppes[n] ? [nppes[n]] : [] }); }
  if (u.pathname === '/auth/v1/user') { const t = String((opts.headers || {}).Authorization || '').replace('Bearer ', ''); return users[t] ? J(users[t]) : J({}, 401); }
  const table = u.pathname.replace('/rest/v1/', '');
  if (!(table in db)) return J({ message: 'not found' }, 404);
  const params = [...u.searchParams];
  const rows = db[table];
  if (method === 'GET') {
    const sel = (u.searchParams.get('select') || '*').split(',');
    let out = rows.filter(r => match(r, params));
    const lim = +(u.searchParams.get('limit') || 1000), off = +(u.searchParams.get('offset') || 0);
    out = out.slice(off, off + lim);
    return J(out.map(r => sel[0] === '*' ? r : Object.fromEntries(sel.map(c => [c.split(':').pop(), r[c.split(':').pop()]]))));
  }
  if (method === 'POST') {
    const body = JSON.parse(opts.body); const list = Array.isArray(body) ? body : [body];
    if (table === 'provider_npis' && list.some(b => rows.some(r => r.npi === b.npi) || db.provider_profiles.some(r => r.npi === b.npi))) return J({ code: '23505', message: 'already' }, 409);
    let seq = rows.length;
    list.forEach(b => rows.push({ id: b.id || crypto.randomUUID(), ...(table === 'provider_npis' ? { review_status: 'pending' } : {}), ...b, _seq: seq++ }));
    return J(list);
  }
  if (method === 'PATCH') {
    const body = JSON.parse(opts.body); const hit = rows.filter(r => match(r, params)); hit.forEach(r => Object.assign(r, body)); return J(hit);
  }
  if (method === 'DELETE') { const keep = rows.filter(r => !match(r, params)); const n = rows.length - keep.length; db[table] = keep; return J([], n >= 0 ? 204 : 404); }
  return J({}, 405);
};
// NPPES records
const person = (npi, first, last, extra = {}) => ({ number: npi, enumeration_type: 'NPI-1', basic: { first_name: first, last_name: last, status: 'A' },
  addresses: [{ address_purpose: 'LOCATION', address_1: '1 MAIN ST', city: 'FORT WORTH', state: 'TX', postal_code: '761041234', telephone_number: '817-555-0100' }],
  taxonomies: [{ primary: true, code: '207Q00000X', desc: 'Family Medicine' }], ...extra });
const org = (npi, name, offFirst, offLast) => ({ number: npi, enumeration_type: 'NPI-2', basic: { organization_name: name, authorized_official_first_name: offFirst, authorized_official_last_name: offLast, status: 'A' },
  addresses: [{ address_purpose: 'LOCATION', address_1: '2 OAK ST', city: 'HALTOM CITY', state: 'TX', postal_code: '76117', telephone_number: '817-555-0200' }],
  taxonomies: [{ primary: true, code: '261QP2300X', desc: 'Primary Care Clinic/Center' }] });

const fn = require('../v2/netlify/functions/provider-npis.js');
const call = (method, { token = 'tokA', body, qs } = {}) => fn.handler({ httpMethod: method, headers: token ? { authorization: 'Bearer ' + token } : {},
  body: body ? JSON.stringify(body) : undefined, queryStringParameters: qs || {} }).then(r => ({ status: r.statusCode, body: JSON.parse(r.body) }));

// Valid Luhn NPIs for the cases.
const NPI_ORG_SAME = '1245319599', NPI_ORG_OTHER = '1659399780', NPI_DOC_OTHER = '1730197880', NPI_DEAD = '1902818388', NPI_EXCL = '1497758544';

reset();
ok((await call('GET', { token: null })).status === 401, 'signed out: 401');
ok((await call('GET', { token: 'tokP' })).status === 403, 'a patient account: 403');

// Adding: the authorized official is the account holder -> live at once
nppes[NPI_ORG_SAME] = org(NPI_ORG_SAME, 'LEE FAMILY CLINIC PLLC', 'Ann', 'Lee');
let r = await call('POST', { body: { npi: NPI_ORG_SAME, review_status: 'clear', account_id: OTHER } });
ok(r.status === 200 && r.body.npi.status === 'live', 'same person on the registry: live at once');
const row1 = db.provider_npis.find(x => x.npi === NPI_ORG_SAME);
ok(row1 && row1.account_id === ACC && row1.review_status === 'clear', 'owned by the caller, not the account_id sent');
ok(row1.org_name === 'LEE FAMILY CLINIC PLLC' && row1.city === 'HALTOM CITY' && row1.zip === '76117' && row1.taxonomy_code === '261QP2300X', 'seeded from the registry');

// Different official -> review
nppes[NPI_ORG_OTHER] = org(NPI_ORG_OTHER, 'NORTH CLINIC LLC', 'Carl', 'Diaz');
r = await call('POST', { body: { npi: NPI_ORG_OTHER } });
ok(r.status === 200 && r.body.npi.status === 'review' && /Carl Diaz/.test(r.body.npi.review_reason), 'another name on the registry: held for review, with why');
// A clinician whose own name differs -> review
nppes[NPI_DOC_OTHER] = person(NPI_DOC_OTHER, 'Maya', 'Shah');
r = await call('POST', { body: { npi: NPI_DOC_OTHER } });
ok(r.status === 200 && r.body.npi.status === 'review', 'a different clinician: held for review');

// Refusals
ok((await call('POST', { body: { npi: '1234567890' } })).status === 400, 'a number that fails the Luhn check: 400');
ok((await call('POST', { body: { npi: '1234567893' } })).status === 409, 'the account\'s own NPI: 409');
ok((await call('POST', { body: { npi: '1407942097' } })).status === 409, 'another account\'s NPI: 409');
ok((await call('POST', { body: { npi: NPI_ORG_SAME } })).status === 409, 'an NPI already added: 409');
nppes[NPI_DEAD] = person(NPI_DEAD, 'Ann', 'Lee'); nppes[NPI_DEAD].basic.status = 'D';
ok((await call('POST', { body: { npi: NPI_DEAD } })).status === 403, 'a deactivated NPI: 403');
nppes[NPI_EXCL] = person(NPI_EXCL, 'Ann', 'Lee'); db.leie_exclusions.push({ npi: NPI_EXCL });
ok((await call('POST', { body: { npi: NPI_EXCL } })).status === 403, 'an OIG-excluded NPI: 403');
ok(!db.provider_npis.some(x => x.npi === NPI_DEAD || x.npi === NPI_EXCL), 'refused NPIs are never written');
ok((await call('POST', { body: { npi: '1003000126' } })).status === 404, 'not in the registry: 404');

// OIG name match with the same person -> review, not live
reset(); nppes[NPI_ORG_SAME] = person(NPI_ORG_SAME, 'Ann', 'Lee');
db.leie_exclusions.push({ npi: null, last_name: 'LEE', first_name: 'ANN', state: 'TX' });
r = await call('POST', { body: { npi: NPI_ORG_SAME } });
ok(r.body.npi.status === 'review' && /OIG name match/.test(r.body.npi.review_reason), 'an OIG name and state match: review even when the name matches');

// Editing: only listing fields, only own rows
reset(); nppes[NPI_ORG_SAME] = org(NPI_ORG_SAME, 'LEE FAMILY CLINIC PLLC', 'Ann', 'Lee');
await call('POST', { body: { npi: NPI_ORG_SAME } });
const id1 = db.provider_npis[0].id;
db.provider_npis.push({ id: 'dddddddd-0000-4000-8000-000000000004', account_id: OTHER, npi: '1104000006', review_status: 'clear' });
r = await call('PUT', { body: { id: id1, accepting_new_patients: true, phone: '8175550999', npi: '1999999999', review_status: 'clear', account_id: OTHER, insurances: ['Aetna', 'Aetna', 'Cigna'] } });
const row2 = db.provider_npis.find(x => x.id === id1);
ok(r.status === 200 && row2.accepting_new_patients === true && row2.phone === '8175550999', 'listing fields save');
ok(row2.npi === NPI_ORG_SAME && row2.account_id === ACC, 'npi and account_id never change');
ok(db.provider_npi_insurance.filter(x => x.npi_id === id1).map(x => x.payer_name).join() === 'Aetna,Cigna', 'its own insurance, duplicates dropped');
ok((await call('PUT', { body: { id: 'dddddddd-0000-4000-8000-000000000004', phone: 'x' } })).status === 404, 'another account\'s row: 404');
ok(db.provider_npis.find(x => x.id === 'dddddddd-0000-4000-8000-000000000004').phone === undefined, 'and it is untouched');
ok((await call('DELETE', { qs: { id: 'dddddddd-0000-4000-8000-000000000004' } })).status === 404, 'removing another account\'s NPI: 404');

// GET lists own rows with insurance
r = await call('GET');
ok(r.status === 200 && r.body.primary.npi === '1234567893' && r.body.npis.length === 1 && r.body.npis[0].insurance.length === 2, 'GET: the account and its added NPIs with insurance');
ok(!('account_id' in r.body.npis[0]), 'the account id is not echoed');

// providers-public: cleared only, no ids
const pub = require('../v2/netlify/functions/providers-public.js');
db.provider_npis.push({ id: 'eeeeeeee-0000-4000-8000-000000000005', account_id: ACC, npi: '1972641942', review_status: 'pending', org_name: 'HELD' });
let p = JSON.parse((await pub.handler({ httpMethod: 'GET', queryStringParameters: { npis: `${NPI_ORG_SAME},1972641942,1234567893` }, headers: {} })).body);
ok(p.providers[NPI_ORG_SAME] && p.providers[NPI_ORG_SAME].registered && p.providers[NPI_ORG_SAME].payers.length === 2, 'a cleared added NPI is published with its plans');
ok(!p.providers['1972641942'], 'one under review is not');
ok(p.providers['1234567893'], 'the account\'s own NPI still is');
ok(!JSON.stringify(p).includes(ACC) && !JSON.stringify(p).includes(id1), 'no account or row id is published');
p = JSON.parse((await pub.handler({ httpMethod: 'GET', queryStringParameters: { all: '1' }, headers: {} })).body);
ok(p.providers[NPI_ORG_SAME] && !p.providers['1972641942'], 'all=1 too');

// Booking an added NPI reaches its account and records which NPI
const appt = require('../v2/netlify/functions/appointment-request.js');
r = await appt.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer tokP' }, body: JSON.stringify({ npi: NPI_ORG_SAME }) });
const made = db.appointment_requests[0];
ok(r.statusCode === 200 && made && made.provider_id === ACC && made.npi === NPI_ORG_SAME, 'booking an added NPI goes to its account, with the NPI');
r = await appt.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer tokP' }, body: JSON.stringify({ npi: '1972641942' }) });
ok(r.statusCode === 404, 'an added NPI under review cannot be booked');
r = JSON.parse((await appt.handler({ httpMethod: 'GET', headers: { authorization: 'Bearer tokA' }, queryStringParameters: {} })).body);
ok(r.appointments[0].npi === NPI_ORG_SAME && /LEE FAMILY CLINIC/.test(r.appointments[0].listing_name), 'the provider sees which listing was booked');

// Registration refuses an NPI another account added
const reg = require('../v2/netlify/functions/auth-register-provider.js');
nppes[NPI_ORG_SAME] = org(NPI_ORG_SAME, 'LEE FAMILY CLINIC PLLC', 'Ann', 'Lee');
r = await reg.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ npi: NPI_ORG_SAME, first_name: 'Ann', last_name: 'Lee', email: 'z@x.org', password: 'a-long-password-1' }) });
ok(r.statusCode === 409, 'registration refuses an NPI already added to an account');

// Removing own
r = await call('DELETE', { qs: { id: id1 } });
ok(r.status === 200 && !db.provider_npis.some(x => x.id === id1), 'removing an added NPI');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
