// The admin account (2026-10-25): its own email and password, recognised
// only through ADMIN_EMAILS on the server. It counts as staff, sign-in
// reports it, it opens the review queue without the shared password, and no
// other account (or an unset list) gets any of that. Fake network.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'svc',
  ADMIN_EMAILS: 'Owner@Example.org', STAFF_EMAILS: 'demo@example.org', ADMIN_PASSWORD: 'shared-pw' });
const users = { tokAdmin: { id: 'a1', email: 'owner@example.org' }, tokStaff: { id: 's1', email: 'demo@example.org' }, tokPat: { id: 'p1', email: 'p@example.org' } };
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(String(url));
  const J = (b, status = 200) => ({ ok: status < 300, status, json: async () => b, text: async () => JSON.stringify(b) });
  if (u.pathname === '/auth/v1/user') { const t = String((opts.headers || {}).Authorization || '').replace('Bearer ', ''); return users[t] ? J(users[t]) : J({}, 401); }
  if (u.pathname === '/auth/v1/token') { const b = JSON.parse(opts.body || '{}'); const user = Object.values(users).find(x => x.email === b.email);
    return user ? J({ access_token: 'x', refresh_token: 'y', expires_in: 3600, user }) : J({ error_description: 'bad' }, 400); }
  if (u.pathname.startsWith('/rest/v1/')) return J([]);
  return J({}, 404);
};
const { isAdmin, isStaff, isProvider } = require('../v2/netlify/functions/lib/auth.js');
ok(isAdmin(process.env, users.tokAdmin) && !isAdmin(process.env, users.tokStaff) && !isAdmin(process.env, users.tokPat), 'only the listed email is admin (case-insensitive)');
ok(isStaff(process.env, users.tokAdmin) && await isProvider(process.env, users.tokAdmin), 'the admin counts as staff, so staff tools let it in');
ok(!isAdmin({ ...process.env, ADMIN_EMAILS: '' }, users.tokAdmin), 'no list, no admin');

const login = require('../v2/netlify/functions/auth-login.js');
const signIn = email => login.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'whatever-long-1' }) }).then(r => JSON.parse(r.body));
ok((await signIn('owner@example.org')).admin === true, 'sign-in reports admin for the admin account');
ok((await signIn('demo@example.org')).admin === false && (await signIn('p@example.org')).admin === false, 'and for nobody else');

const review = require('../v2/netlify/functions/admin-review.js');
const get = (headers, qs = {}) => review.handler({ httpMethod: 'GET', headers, queryStringParameters: qs }).then(r => r.statusCode);
ok(await get({ authorization: 'Bearer tokAdmin' }) === 200, 'the admin session opens the review queue');
ok(await get({ authorization: 'Bearer tokStaff' }) === 401, 'a staff session does not');
ok(await get({ authorization: 'Bearer tokPat' }) === 401, 'a patient session does not');
ok(await get({}, { password: 'shared-pw' }) === 200, 'the shared password still works');
ok(await get({}, { password: 'wrong' }) === 401 && await get({}) === 401, 'a wrong or missing password with no admin session is refused');

const patient = readFileSync('v2/assets/patient.js', 'utf8');
ok(/if \(s\.admin\) return null;/.test(patient), 'the patient app browses as a guest for the admin');
const portal = readFileSync('v2/assets/portal.js', 'utf8');
ok(/session && session\.admin\) \{ S\.demo = true; S\.profile = DEMO_PROFILE/.test(portal), 'an admin with no listing gets the demo listing');
ok(/S\.demo && \(\(opts\.method && opts\.method !== 'GET'\)/.test(portal), 'the demo listing stops every write before it leaves the browser');
ok(/Demo Family Practice/.test(portal) && !/DEMO_PROFILE = \{[^}]*npi: '\d/.test(portal), 'the demo practice is fictional and carries no real NPI');
const sw = readFileSync('v2/assets/admin-switch.js', 'utf8');
ok(/!s\.admin/.test(sw) && !/innerHTML/.test(sw), 'the switch shows only for admin sessions and builds no HTML from strings');
for (const p of ['app.html', 'portal.html', 'index.html', 'admin-review.html'])
  ok(readFileSync('v2/' + p, 'utf8').includes('assets/admin-switch.js'), p + ' loads the switch');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
