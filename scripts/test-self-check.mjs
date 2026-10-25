// Tests for listing-self-check (a provider runs the accuracy engine on their
// own listing): signed-in providers only, the NPI comes from their own
// profile (never the request), nothing is written, and the fixes match the
// signals. Fake network. Run: node scripts/test-self-check.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
delete process.env.GOOGLE_GEOCODING_KEY;
const fn = require('../v2/netlify/functions/listing-self-check.js');

let world;
const calls = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url), method = opts.method || 'GET';
  calls.push(method + ' ' + u);
  const j = (b, status = 200) => ({ ok: status < 300, status, json: async () => b });
  if (u.endsWith('/auth/v1/user')) return world.user ? j(world.user) : j({}, 401);
  if (u.includes('/provider_profiles?id=eq.')) return j(u.includes('select=id&') ? (world.provider ? [{ id: 'u1' }] : []) : world.profile ? [world.profile] : []);
  if (u.includes('npiregistry.cms.hhs.gov')) return j({ results: [{ basic: { status: world.nppesStatus || 'A', first_name: 'ANN', last_name: 'LEE' },
    addresses: [{ address_purpose: 'LOCATION', address_1: '1300 W TERRELL AVE', city: 'FORT WORTH', state: 'TX', postal_code: '761041234' }] }] });
  if (u.includes('/npi_activity?')) return j(world.activity || []);
  if (u.includes('/leie_exclusions?')) return j([]);
  if (u.includes('/clinics?')) return j([]);
  if (u.includes('/provider_profiles?npi=in.')) return j([{ id: 'u1', npi: '1234567893', address_line: '1300 W Terrell Ave', city: 'Fort Worth', state: 'TX', zip: '76104' }]);
  if (u.includes('/provider_locations?')) return j(world.locations || []);
  if (u.includes('/listing_reports?')) return j(world.reports || []);
  return j([]);
};
const run = (headers = { authorization: 'Bearer t' }, qs = {}) => fn.handler({ httpMethod: 'GET', headers, queryStringParameters: qs })
  .then(r => ({ status: r.statusCode, body: JSON.parse(r.body) }));

world = { user: null };
ok((await run({})).status === 401, 'no token: 401');
world = { user: { id: 'u1', email: 'a@b.c' }, provider: false };
ok((await run()).status === 403, 'a patient account: 403');
world = { user: { id: 'u1', email: 'a@b.c' }, provider: true, profile: null };
ok((await run()).status === 404, 'a provider account with no NPI: 404');

world = {
  user: { id: 'u1', email: 'a@b.c' }, provider: true,
  profile: { npi: '1234567893', address_line: '1300 W Terrell Ave', city: 'Fort Worth', state: 'TX', zip: '76104' },
  activity: [{ npi: '1234567893', last_medicare_activity_year: 2024, medicare_services_count: 500, pecos_enrolled: true }],
  locations: [{ provider_id: 'u1', address_line: '1300 W Terrell Ave', city: 'Fort Worth', state: 'TX', zip: '76104', verified: true }],
  reports: [{ npi: '1234567893', issue: 'moved' }, { npi: '1234567893', issue: 'closed' }]
};
calls.length = 0;
const r = await run({ authorization: 'Bearer t' }, { npi: '9999999999' });
ok(r.status === 200 && r.body.npi === '1234567893', 'the NPI is the caller\'s own, whatever the request says');
ok(!calls.some(c => c.includes('9999999999')), 'the requested NPI is never looked up');
ok(!calls.some(c => /^(POST|PATCH|DELETE|PUT) /.test(c)), 'nothing is written');
ok(r.body.address_checked === '1300 W Terrell Ave, Fort Worth, TX, 76104', 'the listing\'s own address is the one checked');
ok(typeof r.body.confidence === 'number' && typeof r.body.verdict === 'string', 'a confidence and a verdict');
ok(r.body.signals.every(s => 'name' in s && 'value' in s && 'direction' in s && 'detail' in s && !('weight' in s)), 'signals in words, no internal weights');
const rep = r.body.signals.find(s => s.name === 'patient_reports');
ok(rep && rep.value === 'closed_or_moved', 'patient reports reach the check');
ok(r.body.fixes.some(f => f.signal === 'patient_reports'), 'and come with what to do');
ok(!r.body.fixes.some(f => f.signal === 'claimed_listing'), 'a verified matching location needs no fix');

world.reports = []; world.locations = [{ provider_id: 'u1', address_line: '500 Main St', city: 'Dallas', state: 'TX', zip: '75201', verified: false }];
world.activity = [{ npi: '1234567893', last_medicare_activity_year: 2016, medicare_services_count: 3, pecos_enrolled: false }];
const r2 = await run();
ok(r2.body.fixes.some(f => f.signal === 'claimed_listing'), 'a location elsewhere: told to add this address');
ok(r2.body.fixes.some(f => f.signal === 'medicare_activity'), 'old Medicare claims: explained');
ok(r2.body.confidence < r.body.confidence, 'a worse listing scores lower');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
