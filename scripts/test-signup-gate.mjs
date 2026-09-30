// Patient sign-up stores PHI, so it must be closed unless deliberately opened.
// node scripts/test-signup-gate.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { handler } = require('../v2/netlify/functions/auth-register-patient.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };
const CLOSED = /not open yet/;
const run = async (value) => {
  if (value === undefined) delete process.env.PATIENT_SIGNUP_ENABLED; else process.env.PATIENT_SIGNUP_ENABLED = value;
  const r = await handler({ httpMethod: 'POST', headers: {}, body: '{}' });
  return { status: r.statusCode, error: (JSON.parse(r.body || '{}').error) || '' };
};

console.log('Patient sign-up gate');
let r = await run(undefined);
check('unset means closed', r.status === 503 && CLOSED.test(r.error), JSON.stringify(r));
for (const v of ['false', '', 'TRUE', '1', 'yes', ' true']) {
  r = await run(v);
  check(`"${v}" means closed (only exactly "true" opens it)`, r.status === 503 && CLOSED.test(r.error), JSON.stringify(r));
}
r = await run('true');
check('"true" gets past the gate', !CLOSED.test(r.error), JSON.stringify(r));
r = await run(undefined);
check('OPTIONS is still answered while closed (CORS preflight)', (await handler({ httpMethod: 'OPTIONS', headers: {} })).statusCode === 200);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
