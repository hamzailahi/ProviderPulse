// The whole-area "Provider supply" comparison must be like for like: this
// state's listings per 1,000 residents, from the same tables and counting rule
// as the local figure, and never a made-up number when it is unavailable.
//
// node scripts/test-density-benchmark.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

process.env.SUPABASE_URL = 'https://db.test';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

// ---- mocked Supabase: one ZIP (38017, TN, 40,000 people) ---------------------
let stateBench = { per_1k: 25.2 };        // null = the builder has not run
const asked = [];
const dem = { zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 };
const orgs = Array.from({ length: 3 }, (_, i) => ({ npi: '100000000' + i, primary_taxonomy: 'Family Medicine Physician' }));
const people = Array.from({ length: 7 }, (_, i) => ({ npi: '200000000' + i, primary_taxonomy: 'Internal Medicine Physician' }));
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = rows => ({ ok: true, status: 200, json: async () => rows });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('market_benchmarks')) { asked.push(u); return J(u.includes('state_density') && stateBench ? [{ data: stateBench }] : []); }
  if (u.includes('demographics_raw?zip=eq')) return J([dem]);
  if (u.includes('demographics_raw?state')) return J([dem, { ...dem, zip: '38018', 'Insured Population': 34000 }, { ...dem, zip: '38019', 'Insured Population': 36000 }]);
  if (u.includes('clinics?or=')) return J(orgs);
  if (u.includes('provider_individuals?or=')) return J(people);
  if (u.includes('hpsa_designations')) return J([{ id: 1, hpsa_score: 14, discipline: 'Primary Care', county: 'Shelby' }]);
  return J([]);
};

const { handler } = require('../v2/netlify/functions/market-score.js');
const run = async () => {
  const r = await handler({ httpMethod: 'GET', queryStringParameters: { zip: '38017' }, headers: {} });
  return JSON.parse(r.body);
};

console.log('1. Benchmark built: compare with the state, like for like');
let d = await run();
const m = d.metrics, c = d.components;
check('asks the benchmark table for this state', asked.some(u => /kind=eq\.state_density/.test(u) && /key=eq\.TN/.test(u)), asked.join(' | '));
check('local density counts organizations plus individuals over Census population', Math.abs(m.providers_per_1k - (10 / 40000) * 1000) < 1e-9, String(m.providers_per_1k));
check('benchmark is the state figure, labelled as a state benchmark', m.benchmark_per_1k === 25.2 && m.benchmark_scope === 'state' && m.benchmark_state === 'TN');
check('the finding names the state, never "national"', /TN average/.test(d.finding) && !/national/i.test(d.finding), d.finding);
check('a market far below its state reads as "fewer than"', /fewer than the TN average/.test(d.finding), d.finding);
check('supply term is used', typeof c.supply === 'number' && c.supply > 90, String(c.supply));
const expected = Math.round(c.supply * 0.4 + c.payer * 0.3 + c.shortage * 0.3);
check('score is the 40/30/30 blend', Math.abs(d.score - expected) <= 1, `${d.score} vs ${expected}`);

console.log('\n2. Benchmark missing: unknown is never average');
stateBench = null;
d = await run();
check('no benchmark is reported as null, not a stand-in number', d.metrics.benchmark_per_1k === null && d.metrics.benchmark_scope === 'state');
check('the supply term is left out, not set to 50', d.components.supply === null);
const exp2 = Math.round((d.components.payer * 0.3 + d.components.shortage * 0.3) / 0.6);
check('the score re-weights over payer and shortage', Math.abs(d.score - exp2) <= 1, `${d.score} vs ${exp2}`);
check('the finding still reports the density and says it was not compared', /0\.3 providers per 1,000 residents/.test(d.finding) && /not compared/.test(d.finding), d.finding);
check('the finding makes no national or state comparison claim', !/national|fewer than|more than|in line with/i.test(d.finding), d.finding);

console.log('\n3. A comparable market reads as in line');
stateBench = { per_1k: 0.26 };
d = await run();
check('within 10 percent of the state is "in line with"', /in line with the TN average/.test(d.finding), d.finding);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
