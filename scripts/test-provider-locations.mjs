// Tests for provider-locations.js: only an account with a provider listing
// may use it (decided from provider_profiles, never from user_metadata.role),
// `verified` and `provider_id` can never be set by the caller, the first site
// is primary, making one primary demotes the rest, every write is scoped to
// the caller's own rows, and a failed geocode saves without coordinates.
// No network. Run: node scripts/test-provider-locations.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };

process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_ANON_KEY = 'anon'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
const geo = require('../v2/netlify/functions/lib/geocode.js');
let geoHit = { lat: 35.1, lng: -89.9 };
geo.geocode = async () => geoHit;
const UID = '11111111-1111-1111-1111-111111111111';
let user = { id: UID, user_metadata: { role: 'provider' } }, hasProfile = true, existing = [], calls = [];
globalThis.fetch = async (url, o = {}) => {
  url = String(url); const m = o.method || 'GET'; calls.push({ url, m, body: o.body ? JSON.parse(o.body) : null });
  const j = (v, s = 200) => ({ ok: s < 300, status: s, json: async () => v, text: async () => JSON.stringify(v) });
  if (url.endsWith('/auth/v1/user')) return j(user);
  if (url.includes('/provider_profiles?')) return j(hasProfile ? [{ id: UID }] : []);
  if (url.includes('select=id') && m === 'GET') return j(existing);
  if (m === 'POST') return j([{ ...JSON.parse(o.body), id: 'loc1' }], 201);
  if (m === 'PATCH') return j([{ id: 'loc1' }]);
  return j([]);
};
const fn = require('../v2/netlify/functions/provider-locations.js');
const call = async (method, body, q) => { calls = []; const r = await fn.handler({ httpMethod: method, headers: { authorization: 'Bearer tok' }, body: body ? JSON.stringify(body) : undefined, queryStringParameters: q }); return { status: r.statusCode, body: JSON.parse(r.body || '{}') }; };

ok((await fn.handler({ httpMethod: 'GET', headers: {} })).statusCode === 401, 'no token: 401');
hasProfile = false; user = { id: UID, user_metadata: { role: 'provider' } };
ok((await call('GET')).status === 403, 'a self-written role of provider without a listing is refused');
hasProfile = true; user = { id: UID, user_metadata: { role: 'patient' } };
ok((await call('GET')).status === 200, 'a real listing is let in whatever user_metadata says');

existing = [];
{
  const r = await call('POST', { address_line: '1 Main St', city: 'Memphis', state: 'TN', zip: '38103', verified: true, provider_id: 'someone-else', is_primary: false });
  const ins = calls.find(c => c.m === 'POST').body;
  ok(r.status === 200, 'a location is added');
  ok(!('verified' in ins), 'verified is never sent');
  ok(ins.provider_id === UID, 'provider_id is the caller, not the request');
  ok(ins.is_primary === true, 'the first location is primary');
  ok(ins.latitude === 35.1 && ins.geocoded === true, 'coordinates stored at save');
}
existing = [{ id: 'a' }];
{
  await call('POST', { address_line: '2 Oak St', is_primary: true });
  const demote = calls.find(c => c.m === 'PATCH');
  ok(demote && demote.url.includes(`provider_id=eq.${UID}`) && demote.url.includes('is_primary=is.true') && demote.body.is_primary === false, 'a new primary demotes the old one, own rows only');
}
geoHit = null; existing = [{ id: 'a' }];
{
  await call('POST', { address_line: 'Nowhere' });
  const ins = calls.find(c => c.m === 'POST').body;
  ok(ins.geocoded === false && ins.latitude === null, 'a failed geocode saves with no coordinates (never drawn)');
}
ok((await call('POST', { city: 'Memphis' })).status === 400, 'a street address is required');
existing = Array.from({ length: 25 }, (_, i) => ({ id: String(i) }));
ok((await call('POST', { address_line: '3 Elm' })).status === 400, 'at most 25 locations');
geoHit = { lat: 1, lng: 2 };
{
  await call('PUT', { id: 'loc1', label: 'East', verified: true });
  const p = calls.find(c => c.m === 'PATCH');
  ok(p.url.includes('id=eq.loc1') && p.url.includes(`provider_id=eq.${UID}`), 'an edit is scoped to the caller\'s own row');
  ok(!('verified' in p.body) && p.body.label === 'East', 'verified cannot be edited');
}
ok((await call('PUT', { id: 'loc1', verified: true })).status === 400, 'an edit of only forbidden fields is refused');
{
  await call('DELETE', null, { id: 'loc1' });
  const d = calls.find(c => c.m === 'DELETE');
  ok(d && d.url.includes(`provider_id=eq.${UID}`), 'a delete is scoped to the caller\'s own row');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
