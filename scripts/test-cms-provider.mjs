// Tests for cms-provider.js: only a 2xx answer with a results array counts.
// A CMS error is "unavailable" and is never cached as "not found"; a
// confirmed empty answer is cached; CMS's lowercase snake_case fields map to
// the sheet's fields. No network: https.request and fetch are stubbed.
// Run: node scripts/test-cms-provider.mjs
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };

const https = require('https');
let cms = [];                         // queue of {status, body} answers, one per request
https.request = (opts, cb) => {
  const req = new EventEmitter();
  req.write = () => {}; req.setTimeout = () => {}; req.destroy = () => {};
  req.end = () => { const a = cms.shift() || { status: 500, body: '{}' }; const res = new EventEmitter(); res.statusCode = a.status;
    setImmediate(() => { cb(res); res.emit('data', a.body); res.emit('end'); }); };
  return req;
};
const writes = [];
let cacheRows = [];
globalThis.fetch = async (url, o = {}) => {
  if (o.method === 'POST') { writes.push(JSON.parse(o.body)); return { ok: true }; }
  return { ok: true, json: async () => cacheRows };
};
process.env.SUPABASE_URL = 'https://db.example'; process.env.SUPABASE_ANON_KEY = 'anon'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
const fn = require('../v2/netlify/functions/cms-provider.js');
const get = async npi => { const r = await fn.handler({ httpMethod: 'GET', queryStringParameters: { npi } }); return JSON.parse(r.body); };
const quiet = console.log; console.log = () => {};

ok((await fn.handler({ httpMethod: 'GET', queryStringParameters: { npi: '123' } })).statusCode === 400, 'NPI must be 10 digits');

cms = [{ status: 503, body: '{"message":"down"}' }, { status: 500, body: '{}' }];
{ const b = await get('1234567893'); ok(b.unavailable === true && b.found === false, 'both CMS calls failing is unavailable'); ok(writes.length === 0, 'a CMS failure is never cached'); }

cms = [{ status: 200, body: '{"error":"no results key"}' }, { status: 200, body: '{"oops":1}' }];
{ const b = await get('1234567893'); ok(b.unavailable === true, 'a 200 with no results array is not an answer'); ok(writes.length === 0, 'and is not cached'); }

cms = [{ status: 500, body: '{}' }, { status: 200, body: '{"results":[]}' }];
{ const b = await get('1234567893'); ok(b.found === false && !b.unavailable, 'POST fails, GET answers empty: not found'); ok(writes.length === 1 && writes[0].found === false, 'a confirmed empty answer is cached'); }

cms = [{ status: 200, body: JSON.stringify({ results: [{ provider_first_name: 'ANA', provider_last_name: 'LEE', pri_spec: 'CARDIOLOGY', sec_spec_1: 'INTERNAL MEDICINE', grd_yr: '2001', telehlth: 'Y', ind_assgn: 'Y', adr_ln_1: '1 MAIN ST', citytown: 'MEMPHIS', state: 'TN', zip_code: '38103' }] }) }];
{
  const b = await get('1234567893');
  ok(b.found && b.first_name === 'ANA' && b.primary_specialty === 'CARDIOLOGY', 'lowercase CMS keys map to the sheet fields');
  ok(b.secondary_specialties.length === 1 && b.telehealth === true && b.medicare_participant === true, 'specialties, telehealth and assignment read');
  ok(b.address === '1 MAIN ST, MEMPHIS, TN, 38103', 'address joined');
}
cacheRows = [{ npi: '1234567893', found: true, first_name: 'CACHED', fetched_at: new Date().toISOString() }];
cms = [];
{ const b = await get('1234567893'); ok(b.first_name === 'CACHED' && !('fetched_at' in b), 'a fresh cache row answers without CMS'); }
cacheRows = [{ npi: '1234567893', found: false, fetched_at: new Date(Date.now() - 8 * 86400000).toISOString() }];
cms = [{ status: 200, body: '{"results":[]}' }];
{ const n = writes.length; await get('1234567893'); ok(writes.length === n + 1, 'a not-found row older than 7 days is looked up again'); }

console.log = quiet;
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
