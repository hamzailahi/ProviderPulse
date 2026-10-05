// The learned demand model (v2/assets/demand-model.js) and its trainer
// (scripts/train-demand-model.mjs), offline: synthetic data with a known answer,
// and the trainer end to end against a fake CMS file and a fake Supabase.
//
// node scripts/test-demand-model.mjs
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const D = require('../v2/assets/demand-model.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

// Deterministic pseudo-random numbers.
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

console.log('1. Ridge regression');
const X = [], y = [];
for (let i = 0; i < 400; i++) { const a = rnd(), b = rnd(); X.push([a, b]); y.push(2 + 3 * a - 1 * b + (rnd() - 0.5) * 0.05); }
const m = D.fitRidge(X, y, 0.001);
const unstd = j => m.coef[j] / m.sd[j];
check('recovers known slopes', Math.abs(unstd(0) - 3) < 0.05 && Math.abs(unstd(1) + 1) < 0.05, `${unstd(0)} ${unstd(1)}`);
check('predicts', Math.abs(D.predictRaw(m, [0.5, 0.5]) - 3) < 0.05);
check('an unknown input gives no prediction, not an average one', D.predictRaw(m, [0.5, null]) === null);
const big = D.fitRidge(X, y, 1e6);
check('a heavy penalty shrinks toward the mean', Math.abs(big.coef[0]) < 0.01);

console.log('\n2. Held-out states');
const groups = X.map((_, i) => 'S' + (i % 10));
const r2 = D.groupedCv(X, y, groups, 0.01);
check('real signal scores high on states it never saw', r2 > 0.95, String(r2));
const noise = X.map(() => rnd());
const r2n = D.groupedCv(X, noise, groups, 0.01);
check('pure noise scores near zero or below', r2n < 0.05, String(r2n));

console.log('\n3. Training a specialty');
const meas = ['CHD'];
const rows = [];
for (let i = 0; i < 300; i++) {
  const old = 0.1 + rnd() * 0.25, chd = 4 + rnd() * 6;
  rows.push({ group: 'S' + (i % 12), x: { share_65plus: old, share_under18: 0.2 + rnd() * 0.05, log_median_income: Math.log(40000 + rnd() * 60000),
    poverty_rate: rnd() * 0.3, uninsured_rate: rnd() * 0.15, medicaid_rate: rnd() * 0.3, bachelor_rate: rnd() * 0.5, m_CHD: chd },
    y: Math.expm1(1 + 6 * old + 0.2 * chd + (rnd() - 0.5) * 0.2) });
}
const heart = D.train('Heart / cardiology', rows, meas);
check('a real relationship is usable, with a held-out score', heart.usable && heart.r2_cv > 0.8 && heart.features.length === 8, JSON.stringify({ u: heart.usable, r2: heart.r2_cv }));
check('older population and heart disease are the strongest drivers', ['share_65plus', 'm_CHD'].includes(heart.features[heart.coef.map(Math.abs).indexOf(Math.max(...heart.coef.map(Math.abs)))]));
const junk = D.train('Heart / cardiology', rows.map(r => ({ ...r, y: rnd() * 100 })), meas);
check('noise is stored as unusable, with the reason', !junk.usable && /below/.test(junk.reason));
check('paediatrics is never trained on Medicare', !D.train('Pediatrics (children)', rows, []).usable);
check('too few counties is unusable', /too few/.test(D.train('Heart / cardiology', rows.slice(0, 40), meas).reason));
check('rows with a missing input are dropped, not filled', D.train('Heart / cardiology', rows.map((r, i) => i % 2 ? { ...r, x: { ...r.x, m_CHD: null } } : r), meas).n === 150);

console.log('\n4. Applying a model');
const rich = { ...rows[0].x, share_65plus: 0.34, m_CHD: 9.8 }, young = { ...rows[0].x, share_65plus: 0.11, m_CHD: 4.2 };
const a = D.apply(heart, rich, x => x === 'CHD' ? 'coronary heart disease' : x), b = D.apply(heart, young);
check('an older, sicker area reads as higher demand', a.percentile > 80 && b.percentile < 25 && a.per_1k > b.per_1k, `${a.percentile} ${b.percentile}`);
check('drivers are named in plain words, with a direction', a.drivers.length === 3 && a.drivers.some(d => d.label === 'older population' && d.direction === 'up') && a.drivers.some(d => d.label === 'coronary heart disease'));
check('an unusable model is never applied', D.apply(junk, rich) === null);
check('a missing input means no learned value', D.apply(heart, { ...rich, m_CHD: null }) === null);

console.log('\n5. Areas are built the same way for counties and catchments');
const acsRow = { pop_total: 1000, households: 400, median_hh_income: 60000, poverty_universe: 900, poverty_below: 90, ins_universe: 950, ins_uninsured: 95, ins_medicaid: 190,
  age_male: Array(18).fill(10), age_female: Array(18).fill(20), education: { universe: 600, bachelor: 120, graduate: 60 } };
const ar = D.addAcs({}, acsRow, 0.5);
const f = D.features(ar, []);
check('ratios are weight-free: half a ZIP has the same shares', Math.abs(f.poverty_rate - 0.1) < 1e-9 && Math.abs(f.bachelor_rate - 0.3) < 1e-9 && Math.abs(f.share_65plus - 150 / 1000) < 1e-9 && Math.abs(Math.exp(f.log_median_income) - 60000) < 1e-6);
const ar2 = D.addAcs(D.addAcs({}, acsRow, 1), { ...acsRow, median_hh_income: 120000, households: 200 }, 1);
check('area income is household-weighted', Math.abs(ar2.median_income - 80000) < 1e-6);
check('a suppressed cell leaves that input unknown', D.features(D.addAcs({}, { ...acsRow, poverty_below: null }, 1), []).poverty_rate === null);
const pl = D.addPlaces(D.addPlaces({}, 'CHD', 10, 100, 1), 'CHD', 4, 300, 1);
check('PLACES is adult-weighted', Math.abs(pl.places.CHD - 5.5) < 1e-9);

console.log('\n6. The trainer, end to end, offline');
const dir = mkdtempSync(join(tmpdir(), 'dm-'));
const out = join(dir, 'written.json');
const puf = join(dir, 'puf.csv');
// 200 counties in 10 states, one ZIP each; one cardiologist per ZIP whose
// patients follow age and heart disease.
const counties = Array.from({ length: 200 }, (_, i) => {
  const old = 0.1 + rnd() * 0.25, chd = 4 + rnd() * 6;
  return { fips: String(47000 + i), zip: String(37000 + i), state: 'S' + (i % 10), old, chd, enroll: 10000,
    benes: Math.round(Math.expm1(1 + 6 * old + 0.2 * chd + (rnd() - 0.5) * 0.2) * 10) };
});
writeFileSync(puf, 'Rndrng_NPI,Rndrng_Prvdr_Zip5,Tot_Benes,Other\n' + counties.map((c, i) => `${1000000000 + i},${c.zip},${c.benes},x`).join('\n') + '\n');
const preload = join(dir, 'preload.mjs');
writeFileSync(preload, `
import { writeFileSync } from 'node:fs';
const C = ${JSON.stringify(counties)};
const J = b => ({ ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) });
const page = (u, rows, key) => { const m = u.match(new RegExp(key + '=gt\\\\.([^&]+)')); return m ? [] : rows; };
globalThis.fetch = async (url, init) => {
  const u = decodeURIComponent(String(url));
  if (u.includes('provider_individuals')) return J(u.includes('npi=gt.') ? [] : C.map((c, i) => ({ npi: String(1000000000 + i), primary_taxonomy: 'Cardiovascular Disease Physician' })).filter(r => r.npi.startsWith(u.match(/npi=gte\\.(\\d+)/)[1])));
  if (u.includes('zip_county_crosswalk')) return J(page(u, C.map((c, i) => ({ id: i + 1, zip: c.zip, fips: c.fips, state: c.state, res_ratio: 1 })), 'id'));
  if (u.includes('medicare_county_enrollment')) return J(page(u, C.map(c => ({ fips: c.fips, state: c.state, original_medicare_benes: c.enroll })), 'fips'));
  if (u.includes('census_acs_zcta')) return J(page(u, C.map(c => ({ zip: c.zip, pop_total: 1000, households: 400, median_hh_income: 50000 + (Number(c.zip) % 7) * 3000, poverty_universe: 900, poverty_below: 50 + (Number(c.zip) % 5) * 10,
    ins_universe: 950, ins_uninsured: 60 + (Number(c.zip) % 3) * 5, ins_medicaid: 150 + (Number(c.zip) % 4) * 10,
    age_male: Array.from({ length: 18 }, (_, b) => b >= 13 ? Math.round(c.old * 100) : 30), age_female: Array.from({ length: 18 }, (_, b) => b >= 13 ? Math.round(c.old * 100) : 30),
    education: { universe: 600, bachelor: 100 + (Number(c.zip) % 6) * 10, graduate: 50 } })), 'zip'));
  if (u.includes('cdc_places')) { const m = u.match(/measureid=eq\\.(\\w+)/)[1]; return J(page(u, C.map(c => ({ zip: c.zip, value: m === 'CHD' ? c.chd : 5 + (Number(c.zip) % 9) * 0.3, pop_18plus: 800 })), 'zip')); }
  if (u.includes('market_benchmarks')) { writeFileSync(${JSON.stringify(out)}, init.body); return J([]); }
  throw new Error('unexpected fetch ' + u);
};
`);
const run = (extra = {}, a = []) => spawnSync(process.execPath, ['--import', preload, 'scripts/train-demand-model.mjs', '--puf-file', puf, ...a],
  { env: { ...process.env, SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', MIN_PUF_NPIS: '100', ...extra }, encoding: 'utf8', timeout: 120000 });
let p = run();
const written = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch (e) { return null; } })();
const hm = written && written.find(r => r.key === 'Heart / cardiology');
check('the trainer runs and writes one row per specialty', p.status === 0 && written && written.length === 33 && written.every(r => r.kind === 'demand_model'), (p.stdout + p.stderr).slice(-600));
check('cardiology is learned from the claims and usable', hm && hm.data.usable && hm.data.r2_cv > 0.5, hm && JSON.stringify({ r2: hm.data.r2_cv, reason: hm.data.reason }));
check('specialties with no clinicians in the file are stored as unusable', written && !written.find(r => r.key === 'Skin / dermatology').data.usable);
check('the log names held-out scores', /held-out R2/.test(p.stdout));
p = run({ MIN_PUF_NPIS: '100000' });
check('a short claims file stops training', p.status !== 0 && /refusing to train/.test(p.stderr));

console.log('\n7. market-score uses a stored model, and only a usable one');
process.env.SUPABASE_URL = 'https://db.test'; process.env.SUPABASE_ANON_KEY = 'anon'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
const homeZ = { zip: '38017', lat: 35.04, lon: -89.66, pop_18plus: 30000 };
const demZ = { zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 };
const oldAcs = { zip: '38017', pop_total: 1000, households: 400, median_hh_income: 70000, poverty_universe: 900, poverty_below: 60, ins_universe: 950, ins_uninsured: 50, ins_medicaid: 100,
  age_male: Array.from({ length: 18 }, (_, b) => b >= 13 ? 30 : 25), age_female: Array.from({ length: 18 }, (_, b) => b >= 13 ? 30 : 25), education: { universe: 600, bachelor: 150, graduate: 60 } };
let models = [{ kind: 'demand_model', key: 'Heart / cardiology', data: heart }, { kind: 'demand_model', key: 'Skin / dermatology', data: { ...junk, specialty: 'Skin / dermatology' } }];
let acsOn = true;
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = r => ({ ok: true, status: 200, json: async () => r });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('cdc_places?zip=eq.')) return J([homeZ]);
  if (u.includes('cdc_places?measureid=eq.DENTAL&lat=gte')) return J([homeZ]);
  if (u.includes('cdc_places?zip=in.(')) return J([{ zip: '38017', measureid: 'CHD', value: 9.5, pop_18plus: 30000, data_year: 2023 }]);
  if (u.includes('demographics_raw')) return J([demZ]);
  if (u.includes('census_acs_zcta?zip=in.')) return J(acsOn ? [oldAcs] : []);
  if (u.includes('market_benchmarks?select=kind')) return J(models);
  return J([]);
};
const { handler } = require('../v2/netlify/functions/market-score.js');
const specOf = async name => JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { zip: '38017' }, headers: {} })).body).model.specialties.find(x => x.specialty === name);
let card = await specOf('Heart / cardiology');
check('a usable model sets need, says it is learned, and names its drivers', card.evidence.need && card.evidence.need.basis === 'learned' && card.factors.need === Math.round(card.evidence.need.percentile) && card.evidence.need.drivers.length === 3, JSON.stringify(card.evidence.need));
check('the caveat says it is Medicare fee-for-service only', card.caveats.some(c => /Medicare fee-for-service/.test(c)));
check('a learned need does not cost confidence the way a group fallback does', card.confidence !== 'low');
check('the plain-English reason uses the learned wording when need is a top reason', !card.reasons.some(r => r.factor === 'need') || card.reasons.some(r => /learned from Medicare use/.test(r.text)));
const derm = await specOf('Skin / dermatology');
check('an unusable model is ignored: the hand-weighted need stays', !derm.evidence.need || derm.evidence.need.basis !== 'learned');
acsOn = false;
card = await specOf('Heart / cardiology');
check('without Census detail for the catchment there is no learned value', !card.evidence.need || card.evidence.need.basis !== 'learned');
acsOn = true; models = [];
card = await specOf('Heart / cardiology');
check('with no trained models the score works as before', card && (!card.evidence.need || card.evidence.need.basis !== 'learned'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
