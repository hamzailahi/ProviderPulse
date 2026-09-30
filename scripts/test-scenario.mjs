// "What if I open here?": market-score re-scores the same catchment with N
// extra listings of one specialty and reports before and after.
//
// node scripts/test-scenario.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

process.env.SUPABASE_URL = 'https://db.test';
process.env.SUPABASE_ANON_KEY = 'anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const SPEC = 'Heart / cardiology';
const home = { zip: '38017', lat: 35.04, lon: -89.66, pop_18plus: 30000 };
const dem = { zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 };
const heart = (i, lat, lon) => ({ npi: '10000000' + i, primary_taxonomy: 'Cardiovascular Disease Physician', latitude: lat, longitude: lon });
const dentist = { npi: '3000000001', primary_taxonomy: 'General Practice Dentistry', latitude: 35.04, longitude: -89.66 };
let cardiologists = [heart(1, 35.10, -89.66), heart(2, 35.12, -89.66)];   // 4 to 8 miles away
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = rows => ({ ok: true, status: 200, json: async () => rows });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('cdc_places?zip=eq.')) return J([home]);
  if (u.includes('cdc_places?measureid=eq.DENTAL&lat=gte')) return J([home]);
  if (u.includes('cdc_places?zip=in.(')) return J([{ zip: '38017', measureid: 'CHD', value: 8.5, pop_18plus: 30000, data_year: 2023 }]);
  if (u.includes('demographics_raw?zip=eq')) return J([dem]);
  if (u.includes('demographics_raw?state')) return J([dem]);
  if (u.includes('clinics?zip=in.(')) return J(cardiologists.concat([dentist]));
  if (u.includes('provider_individuals?zip=in.(')) return J([]);
  if (u.includes('market_benchmarks')) return J([{ kind: 'specialty', key: SPEC, data: { rate_per_1k: 0.22 } }]);
  return J([]);
};

const { handler } = require('../v2/netlify/functions/market-score.js');
const run = async q => JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: Object.assign({ zip: '38017', specialty: SPEC }, q), headers: {} })).body);

console.log('1. No scenario unless asked');
let d = await run({});
check('the model is present and there is no scenario by default', d.model && d.model.specialties.length === 33 && !d.model.scenario);
const base = d.model.specialties.find(s => s.specialty === SPEC);

console.log('\n2. Adding clinicians changes supply and nothing else');
d = await run({ add: '2' });
const sc = d.model && d.model.scenario;
check('a scenario block is returned', !!sc && sc.specialty === SPEC && sc.added === 2 && sc.at === '38017');
check('"before" is exactly the unmodified score', sc.before.score === base.score && sc.before.clinicians === base.clinicians);
check('two more clinicians are counted', sc.after.clinicians === sc.before.clinicians + 2, `${sc.before.clinicians} -> ${sc.after.clinicians}`);
check('access tightens', sc.after.factors.access < sc.before.factors.access, `${sc.before.factors.access} -> ${sc.after.factors.access}`);
check('the nearest competitor is now in the ZIP, so competition is at its floor', sc.after.nearest_competitor_miles <= 1 && sc.after.factors.competition === 30 && sc.before.factors.competition > 30);
check('need, pay and shortage are held fixed', ['need', 'pay', 'shortage'].every(k => sc.after.factors[k] === sc.before.factors[k]));
check('the score does not rise from adding supply', sc.after.score <= sc.before.score && sc.score_change === sc.after.score - sc.before.score);
check('other specialties are untouched', JSON.stringify(d.model.specialties.filter(s => s.specialty !== SPEC)) === JSON.stringify((await run({})).model.specialties.filter(s => s.specialty !== SPEC)));
check('the assumptions name the limits', /payer mix, practice size/.test(sc.assumptions) && /2 heart/.test(sc.assumptions), sc.assumptions);

console.log('\n3. Edges');
d = await run({ add: '99' });
check('the count is capped at 5', d.model.scenario.added === 5);
d = await run({ add: 'abc' });
check('junk means no scenario, not a crash', d.available && !d.model.scenario);
d = await run({ add: '1', specialty: 'Not a specialty' });
check('an unknown specialty means no scenario', !d.model.scenario);
cardiologists = [];
d = await run({ add: '1' });
check('from an unserved market the first clinician still moves access off 100', d.model.scenario.before.clinicians === 0 && d.model.scenario.after.clinicians === 1 && d.model.scenario.after.factors.access < 100);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
