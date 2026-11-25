// Tests for demand-stats.js, the public read of demand_log: groups under
// MIN_GROUP are published with no count, suppression happens before sorting,
// the total is withheld whenever it could reconstruct a hidden count, and a
// failed or missing table is "not available", never zero. No network.
// Run: node scripts/test-demand-stats.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };

process.env.SUPABASE_URL = 'https://db.example';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
const fn = require('../v2/netlify/functions/demand-stats.js');
let rows = [], status = 200, urls = [];
globalThis.fetch = async (url) => { urls.push(String(url)); if (status === 'throw') throw new Error('timeout'); return { ok: status === 200, status, json: async () => rows }; };
const get = async (q) => { const r = await fn.handler({ httpMethod: 'GET', queryStringParameters: q }); return { status: r.statusCode, body: JSON.parse(r.body) }; };
const searches = (term, n, matched = 3) => Array.from({ length: n }, () => ({ taxonomies: [term], matched_count: matched }));

ok((await get({ zip: '123' })).status === 400, 'a ZIP must be 5 digits');
ok((await fn.handler({ httpMethod: 'POST' })).statusCode === 405, 'GET only');

rows = [...searches('Family Medicine', 10), ...searches('Endocrinology', 2)];
{
  const { body } = await get({ zip: '38017' });
  const endo = body.groups.find(g => g.taxonomy === 'Endocrinology');
  ok(endo && endo.suppressed === true && !('count' in endo) && !('mean_matched' in endo), 'a group under 5 has no count and no mean');
  ok(body.groups[0].taxonomy === 'Family Medicine' && body.groups[0].count === 10, 'visible groups keep their count');
  ok(body.total_searches === null && body.total_suppressed === true, 'one hidden group: the total is withheld (12 - 10 would reveal 2)');
  ok(!JSON.stringify(body).includes('"count":2'), 'the hidden count appears nowhere');
  ok(urls[0].includes('zip=eq.38017') && urls[0].includes('select=taxonomies,matched_count'), 'reads only taxonomies and matched_count');
  ok(/select=taxonomies,matched_count&/.test(urls[0]), 'selects nothing about who searched');
}
rows = [...searches('Family Medicine', 10), ...searches('Dental', 7)];
{
  const { body } = await get({ zip: '38017' });
  ok(body.total_searches === 17 && body.suppressed_groups === 0, 'no hidden group: the total is published');
}
rows = [...searches('Family Medicine', 10), ...searches('Endocrinology', 3), ...searches('Urology', 4)];
{
  const { body } = await get({ zip: '38017' });
  ok(body.total_searches === 17, 'two hidden groups whose sum is 5 or more: the total stays (it only reveals their combined count)');
}
rows = [...searches('Family Medicine', 10), ...searches('Endocrinology', 1), ...searches('Urology', 1)];
{
  const { body } = await get({ zip: '38017' });
  ok(body.total_searches === null, 'two hidden groups summing under 5: the total is withheld');
}
rows = searches('Family Medicine', 3);
{
  const { body } = await get({ zip: '38017' });
  ok(body.total_searches === null && body.total_suppressed === true && body.groups[0].suppressed, 'fewer than 5 searches in all: everything suppressed');
}
rows = [...searches('Family Medicine', 10), ...searches('Endocrinology', 2), { taxonomies: ['Family Medicine', 'Family Medicine'], matched_count: 3 }];
{
  const { body } = await get({ zip: '38017' });
  ok(body.groups[0].count === 11, 'a term repeated in one search counts once');
}
rows = [...searches('Family Medicine Physician', 6), ...searches('Neurology', 6)];
{
  const { body } = await get({ zip: '38017', taxonomy: 'Family Medicine' });
  ok(body.groups.length === 1 && body.groups[0].taxonomy === 'Family Medicine Physician', 'taxonomy filter matches at a word boundary');
  const n = await get({ zip: '38017', taxonomy: 'urology' });
  ok(n.body.groups.length === 0, '"urology" does not match "Neurology"');
}
status = 404;
{ const { body } = await get({ zip: '38017' }); ok(body.available === false && body.groups.length === 0 && body.total_searches === undefined, 'a missing table is not available, never zero'); }
status = 'throw';
{ const { body } = await get({ zip: '38017' }); ok(body.available === false, 'a network failure is not available'); }
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
status = 200;
{ const { body } = await get({ zip: '38017' }); ok(body.available === false, 'no service key: not available'); }

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
