// Tests for the public npi-activity function (patient detail sheet): only the
// published columns are read, a missing NPI is left out (unknown, never
// "inactive"), nulls stay null, bad input is refused, failures fail soft.
// No network. Run: node scripts/test-npi-activity.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

process.env.SUPABASE_URL = 'https://db.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
const fn = require('../v2/netlify/functions/npi-activity.js');
const call = async (npis, fake) => {
  const urls = [];
  globalThis.fetch = async (url) => { urls.push(String(url)); return fake(url); };
  const r = await fn.handler({ httpMethod: 'GET', queryStringParameters: npis === undefined ? {} : { npis } });
  return { status: r.statusCode, body: JSON.parse(r.body), urls, headers: r.headers };
};
const rowsReply = rows => ({ ok: true, json: async () => rows });

ok(fn.ACTIVITY_COLUMNS === 'npi,last_medicare_activity_year,medicare_services_count,pecos_enrolled,refreshed_at', 'the published columns are exactly these');

{
  const r = await call('1111111111,2222222222,3333333333', () => rowsReply([
    { npi: '1111111111', last_medicare_activity_year: 2024, medicare_services_count: 812, pecos_enrolled: true, refreshed_at: '2026-10-12T04:00:00Z' },
    { npi: '2222222222', last_medicare_activity_year: null, medicare_services_count: null, pecos_enrolled: false, refreshed_at: null },
    { npi: '9999999999', last_medicare_activity_year: 2020 }
  ]));
  ok(r.status === 200 && r.headers['Cache-Control'], 'answers 200, cacheable');
  ok(r.urls.length === 1 && r.urls[0].includes('npi_activity?npi=in.(1111111111,2222222222,3333333333)') && r.urls[0].endsWith('select=' + fn.ACTIVITY_COLUMNS), 'one query, only the published columns');
  const a = r.body.activity;
  ok(a['1111111111'].last_medicare_year === 2024 && a['1111111111'].medicare_services === 812 && a['1111111111'].pecos_enrolled === true && a['1111111111'].as_of === '2026-10-12', 'a full row');
  ok(a['2222222222'].last_medicare_year === null && a['2222222222'].medicare_services === null, 'null stays null (never year 0)');
  ok(a['2222222222'].pecos_enrolled === false, 'not enrolled is false');
  ok(!('3333333333' in a), 'an NPI with no row is left out: unknown, not inactive');
  ok(!('9999999999' in a), 'a row not asked for is dropped');
}
ok((await call(undefined, () => rowsReply([]))).status === 400, 'npis required');
ok((await call('123', () => rowsReply([]))).status === 400, '10 digits only');
ok((await call('1111111111,abc', () => rowsReply([]))).status === 400, 'no other text');
ok((await call(Array.from({ length: 51 }, (_, i) => String(1000000000 + i)).join(','), () => rowsReply([]))).status === 400, 'at most 50');
{
  const r = await call('1111111111', () => ({ ok: false, status: 500, json: async () => ({ code: '57014' }) }));
  ok(r.status === 200 && r.body.degraded === true && Object.keys(r.body.activity).length === 0, 'a failed read is degraded, not empty-and-fine');
}
{
  const r = await call('1111111111', () => { throw new Error('timeout'); });
  ok(r.body.degraded === true, 'a network failure is degraded');
}
{
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await call('1111111111', () => rowsReply([]));
  ok(r.body.degraded === true && r.urls.length === 0, 'no key: degraded, no request');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
