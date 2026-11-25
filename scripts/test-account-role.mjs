// Tests for the database-held role (lib/auth.js accountRole, 2026-11-25):
// the appointment, navigator and document endpoints decide patient or
// provider from the account's own provider_profiles / patient_profiles row,
// never from user_metadata.role, which the account holder can edit. A failed
// lookup is 503, never either role. No network.
// Run: node scripts/test-account-role.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) { pass++; console.log('  PASS ', n); } else { fail++; console.log('  FAIL ', n); } };

Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'svc', ANTHROPIC_API_KEY: 'k' });
const PAT = '11111111-0000-4000-8000-000000000001';
const PRO = '22222222-0000-4000-8000-000000000002';
const NONE = '33333333-0000-4000-8000-000000000003';
let rows, users, down, calls;
function reset() {
  rows = { provider_profiles: [PRO], patient_profiles: [PAT] };
  users = {
    tPat: { id: PAT, user_metadata: { role: 'patient' } },
    tPro: { id: PRO, user_metadata: { role: 'provider' } },
    // An account that edited its own metadata: no patient row, says patient.
    tFake: { id: NONE, user_metadata: { role: 'patient' } },
    // A provider that relabelled itself a patient: still a provider.
    tProAsPat: { id: PRO, user_metadata: { role: 'patient' } }
  };
  down = false; calls = [];
}
const J = (b, status = 200) => ({ ok: status < 300, status, json: async () => b, text: async () => JSON.stringify(b) });
globalThis.fetch = async (url, o = {}) => {
  const u = new URL(String(url)); calls.push({ url: String(url), m: o.method || 'GET' });
  if (u.pathname === '/auth/v1/user') {
    const t = String((o.headers || {}).Authorization || '').replace('Bearer ', '');
    return users[t] ? J(users[t]) : J({}, 401);
  }
  const table = u.pathname.replace('/rest/v1/', '');
  if (table === 'provider_profiles' || table === 'patient_profiles') {
    const svc = String((o.headers || {}).Authorization || '') === 'Bearer svc';
    if (svc && down) return J({ message: 'timeout' }, 500);
    const id = (u.searchParams.get('id') || '').replace('eq.', '');
    if (svc && u.searchParams.get('select') === 'id') return J(rows[table].includes(id) ? [{ id }] : []);
    return J(rows[table].includes(id) ? [{ id }] : []);
  }
  return J([]);
};
const { accountRole } = require('../v2/netlify/functions/lib/auth.js');
const env = process.env;

reset();
ok(await accountRole(env, users.tPat) === 'patient', 'a patient_profiles row makes a patient');
ok(await accountRole(env, users.tPro) === 'provider', 'a provider_profiles row makes a provider');
ok(await accountRole(env, users.tFake) === '', 'metadata saying "patient" with no row is no role');
ok(await accountRole(env, users.tProAsPat) === 'provider', 'a provider relabelled "patient" stays a provider');
ok(await accountRole(env, { id: NONE, user_metadata: { role: 'provider' } }) === '', 'metadata saying "provider" with no row is no role');
down = true;
ok(await accountRole(env, users.tPat) === null, 'a failed lookup is null, never a role');
ok(await accountRole(env, null) === null, 'no user is null');

const call = async (file, tok, method = 'GET', body = null, qs = {}) => {
  const fn = require(`../v2/netlify/functions/${file}`);
  // A throw happens only after the role check, where this fake database
  // stops answering like the real one; it counts as "got past the check".
  try {
    const r = await fn.handler({ httpMethod: method, headers: { authorization: `Bearer ${tok}` }, queryStringParameters: qs, body: body ? JSON.stringify(body) : null });
    return r.statusCode;
  } catch { return 'past-check'; }
};

// Patient-only endpoints: the navigator and the document endpoints.
for (const [file, method, body] of [
  ['patient-match.js', 'POST', { message: 'knee pain', zip: '38017' }],
  ['doc-list.js', 'GET', null],
  ['doc-delete.js', 'POST', { document_id: '44444444-0000-4000-8000-000000000004' }]
]) {
  reset();
  ok(await call(file, 'tFake', method, body) === 403, `${file}: edited metadata with no patient row is refused`);
  reset();
  ok(await call(file, 'tProAsPat', method, body) === 403, `${file}: a provider calling itself a patient is refused`);
  reset(); down = true;
  ok(await call(file, 'tPat', method, body) === 503, `${file}: a failed role lookup is 503, not a pass`);
  reset();
  ok(await call(file, 'tPat', method, body) !== 403, `${file}: a real patient gets past the role check`);
}
process.env.DOCUMENT_UPLOAD_ENABLED = 'true';
const DOC_BODIES = {
  'doc-upload-url.js': { mime_type: 'application/pdf', size_bytes: 1000, filename: 'a.pdf' },
  'doc-confirm.js': { accept: ['44444444-0000-4000-8000-000000000004'] },
  'doc-extract.js': { document_id: '44444444-0000-4000-8000-000000000004' }
};
for (const [file, body] of Object.entries(DOC_BODIES)) {
  reset();
  ok(await call(file, 'tFake', 'POST', body) === 403, `${file}: edited metadata with no patient row is refused`);
  reset();
  ok(await call(file, 'tPat', 'POST', body) !== 403, `${file}: a real patient gets past the role check`);
}
delete process.env.DOCUMENT_UPLOAD_ENABLED;

// Appointments: the side comes from the row.
reset();
await call('appointment-request.js', 'tProAsPat');
ok(calls.some(c => c.url.includes('/appointment_requests?provider_id=eq.' + PRO)), 'appointments: a provider relabelled "patient" lists as the provider');
reset();
await call('appointment-request.js', 'tPat');
ok(calls.some(c => c.url.includes('/appointment_requests?patient_id=eq.' + PAT)), 'appointments: a patient lists as the patient');
reset();
ok(await call('appointment-request.js', 'tFake') === 403, 'appointments: no row, no role, whatever the metadata says');
reset();
ok(await call('appointment-request.js', 'tProAsPat', 'POST', { npi: '1234567893', reason: 'x' }) === 403, 'appointments: a provider cannot book as a patient by editing its metadata');
reset(); down = true;
ok(await call('appointment-request.js', 'tPat') === 503, 'appointments: a failed role lookup is 503');

// No function reads the role from user_metadata for a decision any more
// (login and refresh still return it as a routing hint).
const fs = require('node:fs');
const dir = new URL('../v2/netlify/functions/', import.meta.url);
const offenders = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !['auth-login.js', 'auth-refresh.js', 'profile.js'].includes(f))
  .filter(f => fs.readFileSync(new URL(f, dir), 'utf8').split('\n').some(l => !/^\s*\/\//.test(l) && /user_metadata[^\n]*\.role/.test(l)));
ok(offenders.length === 0, 'no endpoint decides access from user_metadata.role' + (offenders.length ? ': ' + offenders.join(', ') : ''));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
