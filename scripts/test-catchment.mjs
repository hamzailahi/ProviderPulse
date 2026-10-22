// The market model's catchment (market-score.js, 2026-10-22, the user's
// choice): every ZIP whose centre is within 10 miles, at least the 10 nearest
// out to 25 miles, at most 60; listings loaded in ZIP groups; a listing load
// that fails even after a retry refuses to score instead of undercounting.
//
// node scripts/test-catchment.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

process.env.SUPABASE_URL = 'https://db.test';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const home = { zip: '38017', lat: 35.04, lon: -89.66, pop_18plus: 30000 };
const dem = { zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 };
// A ZIP `miles` north of home (69 miles per degree of latitude).
const zipAt = (i, miles) => ({ zip: String(38100 + i), lat: home.lat + miles / 69, lon: home.lon, pop_18plus: 1000 });
let box = [], listingFails = 0, listingCalls = [];
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = rows => ({ ok: true, status: 200, json: async () => rows });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('cdc_places?zip=eq.')) return J([home]);
  if (u.includes('cdc_places?measureid=eq.DENTAL&lat=gte')) return J([home].concat(box));
  if (u.includes('cdc_places?zip=in.(')) return J([{ zip: '38017', measureid: 'CHD', value: 8.5, pop_18plus: 30000, data_year: 2023 }]);
  if (u.includes('demographics_raw?zip=eq') || u.includes('demographics_raw?state')) return J([dem]);
  if (/(clinics|provider_individuals)\?zip=in\.\(/.test(u)) {
    listingCalls.push(u);
    if (u.includes('provider_individuals') && listingFails > 0) { listingFails--; return { ok: false, status: 500, json: async () => ({ code: '57014' }) }; }
    return J([]);
  }
  if (u.includes('market_benchmarks')) return J([]);
  return J([]);
};
const { handler } = require('../v2/netlify/functions/market-score.js');
const run = async () => JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { zip: '38017', specialty: 'Heart / cardiology' }, headers: {} })).body);

console.log('1. A city: every ZIP within 10 miles');
box = Array.from({ length: 30 }, (_, i) => zipAt(i, 0.3 + i * 0.3)).concat(Array.from({ length: 10 }, (_, i) => zipAt(50 + i, 12 + i)));
listingCalls = [];
let d = await run();
check('all 30 ZIPs within 10 miles are in, none past it', d.catchment.zip_count === 31 && d.catchment.furthest_miles <= 10, JSON.stringify([d.catchment.zip_count, d.catchment.furthest_miles]));
check('the response names the rule', d.catchment.core_miles === 10 && d.catchment.min_neighbors === 10 && d.catchment.max_zips === 60);
const clinicCalls = listingCalls.filter(u => u.includes('/clinics?'));
check('listings load in ZIP groups (6 ZIPs, both padded forms)', clinicCalls.length === 6 && clinicCalls.every(u => (u.match(/zip=in\.\(([^)]*)\)/)[1].split(',').length) <= 12), clinicCalls.length);
check('the model scored', d.model && Array.isArray(d.model.specialties));

console.log('\n2. A sparse area: the 10 nearest, out to 25 miles');
box = [zipAt(0, 3), zipAt(1, 6), zipAt(2, 9)].concat(Array.from({ length: 20 }, (_, i) => zipAt(10 + i, 14 + i * 0.5)));
d = await run();
check('three close ZIPs are topped up to the 10 nearest', d.catchment.zip_count === 11 && d.catchment.furthest_miles > 10 && d.catchment.furthest_miles <= 25, JSON.stringify([d.catchment.zip_count, d.catchment.furthest_miles]));

console.log('\n3. A dense core stops at 60 ZIPs');
box = Array.from({ length: 100 }, (_, i) => zipAt(i, 0.05 + i * 0.09));
d = await run();
check('at most 60 ZIPs, the nearest', d.catchment.zip_count === 60 && d.catchment.furthest_miles < 6, JSON.stringify([d.catchment.zip_count, d.catchment.furthest_miles]));

console.log('\n3b. A crowded core stops near 1 million adults');
box = Array.from({ length: 50 }, (_, i) => Object.assign(zipAt(i, 0.2 + i * 0.15), { pop_18plus: 60000 }));
d = await run();
check('ZIPs are added nearest first until 1M adults, keeping at least 10', d.catchment.zip_count === 18 && d.catchment.adults_18plus === 1050000 && d.catchment.max_adults === 1000000, JSON.stringify([d.catchment.zip_count, d.catchment.adults_18plus]));
box = Array.from({ length: 30 }, (_, i) => Object.assign(zipAt(i, 0.2 + i * 0.15), { pop_18plus: 200000 }));
d = await run();
check('never fewer than the 10 nearest, however crowded', d.catchment.zip_count === 11);

console.log('\n4. A failed listing load is never an empty area');
box = Array.from({ length: 12 }, (_, i) => zipAt(i, 1 + i * 0.5));
listingFails = 1;
d = await run();
check('one failure is retried and the model still scores', d.model && Array.isArray(d.model.specialties) && d.catchment.listings_failed === false);
listingFails = 50;
d = await run();
check('a load that keeps failing refuses to score, with a reason', d.model && d.model.available === false && /did not answer/.test(d.model.reason) && d.catchment.listings_failed === true);
listingFails = 0;

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
