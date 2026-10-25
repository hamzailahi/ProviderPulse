// Tests for the public listing-report function: only the NPI, the issue and
// the source are written (no free text, no caller address), bad input is
// refused, repeats are throttled, and a failed insert is never "ok".
// No network. Run: node scripts/test-listing-report.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

process.env.SUPABASE_URL = 'https://db.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
const fn = require('../v2/netlify/functions/listing-report.js');
const sent = [];
let answer = () => ({ ok: true, status: 201 });
globalThis.fetch = async (url, opts) => { sent.push({ url: String(url), body: opts && opts.body }); return answer(); };
const post = (body, ip = '203.0.113.7') => fn.handler({ httpMethod: 'POST', body: JSON.stringify(body), headers: { 'x-nf-client-connection-ip': ip } })
  .then(r => ({ status: r.statusCode, body: JSON.parse(r.body) }));

ok(fn.ISSUES.join() === 'closed,moved,wrong_phone,wrong_specialty,not_accepting,other', 'the issue list matches migration 041');
{
  const r = await post({ npi: '1234567890', issue: 'closed', note: 'my name is Jane and I have diabetes', email: 'x@y.z' });
  ok(r.status === 200 && r.body.ok === true, 'a report is accepted');
  ok(sent.length === 1 && sent[0].url === 'https://db.example/rest/v1/listing_reports', 'one insert into listing_reports');
  ok(sent[0].body === JSON.stringify({ npi: '1234567890', issue: 'closed', source: 'patient_app' }), 'only npi, issue and source are written: no free text, no email');
  ok(!sent[0].body.includes('203.0.113.7'), 'the caller address is never written');
}
ok((await post({ npi: '1234567890', issue: 'moved' })).status === 429, 'the same caller and NPI again is throttled');
ok((await post({ npi: '1234567890', issue: 'moved' }, '198.51.100.2')).status === 200, 'another caller may report the same listing');
ok((await post({ npi: '12345', issue: 'closed' })).status === 400, 'NPI must be 10 digits');
ok((await post({ npi: '1234567891', issue: 'rude staff' })).status === 400, 'issue must be from the list');
ok((await fn.handler({ httpMethod: 'POST', body: '{bad', headers: {} })).statusCode === 400, 'bad JSON refused');
ok((await fn.handler({ httpMethod: 'GET', headers: {} })).statusCode === 405, 'POST only');
{
  let n = 0;
  for (let i = 0; i < 25; i++) if ((await post({ npi: String(1300000000 + i), issue: 'wrong_phone' }, '192.0.2.9')).status === 200) n++;
  ok(n === 20, `one caller files at most 20 an hour (got ${n})`);
}
{
  answer = () => ({ ok: false, status: 404 });
  const r = await post({ npi: '1999999999', issue: 'closed' }, '192.0.2.50');
  ok(r.status === 503 && !r.body.ok, 'a missing table is 503, never ok');
  answer = () => { throw new Error('timeout'); };
  ok((await post({ npi: '1999999998', issue: 'closed' }, '192.0.2.51')).status === 503, 'a network failure is 503');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
