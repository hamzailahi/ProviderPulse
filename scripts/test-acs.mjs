// The ACS detail import: variable checks, row shaping, and the importer end to
// end against a fake Census and a fake Supabase (no network).
//
// node scripts/test-acs.mjs
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import { VARIABLES, EXPECTED_LABELS, INCOME_LABELS, AGE_LABELS, toRow, rowProblems, num } from './lib/acs.mjs';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

console.log('1. Values');
check('suppression sentinels are unknown, not zero', num('-666666666') === null && num('-555555555') === null && num(null) === null && num('') === null);
check('real numbers pass, including zero', num('0') === 0 && num('1234') === 1234);

console.log('\n2. Variables');
check('103 variables, none repeated', VARIABLES.length === 103 && new Set(VARIABLES).size === 103);
check('every expected-label variable is one we request', Object.keys(EXPECTED_LABELS).every(k => VARIABLES.includes(k)));
check('16 income bands, 18 age bands', INCOME_LABELS.length === 16 && AGE_LABELS.length === 18);

// A synthetic ZCTA whose bands add up.
function fakeRecord(zip, scale = 1) {
  const r = {};
  VARIABLES.forEach(v => { r[v] = 0; });
  for (let i = 2; i <= 17; i++) r[`B19001_${String(i).padStart(3, '0')}E`] = (i - 1) * scale;      // 1..16
  r.B19001_001E = 136 * scale;
  for (let i = 3; i <= 25; i++) { r[`B01001_${String(i).padStart(3, '0')}E`] = scale; r[`B01001_${String(i + 24).padStart(3, '0')}E`] = 2 * scale; }
  r.B01001_001E = 69 * scale;                                                                       // 23 male + 46 female
  r.B19013_001E = 71234; r.B17001_001E = 1000; r.B17001_002E = 90;
  r.B03002_001E = 500; r.B03002_003E = 300; r.B03002_004E = 100; r.B03002_006E = 50; r.B03002_012E = 40;
  r.B15003_001E = 400; r.B15003_017E = 100; r.B15003_018E = 20; r.B15003_022E = 80; r.B15003_023E = 30; r.B15003_024E = 10; r.B15003_025E = 5;
  return r;
}

console.log('\n3. Row shaping');
const row = toRow('38017', fakeRecord('38017'), 2024, 'TN');
check('income bands in order, sixteen of them', row.income_bands.length === 16 && row.income_bands[0] === 1 && row.income_bands[15] === 16);
check('age bands fold the single-year groups', row.age_male.length === 18 && row.age_male[3] === 2 && row.age_male[4] === 3 && row.age_male[12] === 2 && row.age_female[4] === 6);
check('male and female are read from their own variables', row.age_male[0] === 1 && row.age_female[0] === 2);
check('bands add up to the totals', rowProblems(row).length === 0, rowProblems(row).join('; '));
check('a band that does not add up is reported', rowProblems({ ...row, households: 999 }).length === 1);
check('median, poverty and race carry through', row.median_hh_income === 71234 && row.poverty_below === 90 && row.race.white === 300 && row.race.hispanic === 40);
check('education groups combine the right levels', row.education.high_school === 120 && row.education.graduate === 45 && row.education.bachelor === 80 && row.education.universe === 400);
const supp = fakeRecord('38017'); supp.B19013_001E = '-666666666'; supp.B01001_010E = '-555555555';
const sr = toRow('38017', supp, 2024, 'TN');
check('a suppressed median is null', sr.median_hh_income === null);
check('a suppressed age cell makes its band unknown, not smaller', sr.age_male[4] === null && sr.age_male[3] === 2);
check('an unknown band is not reported as a mismatch', rowProblems(sr).length === 0);
check('ZIPs are zero-padded', toRow('501', fakeRecord('501'), 2024, null).zip === '00501');

console.log('\n4. The importer, against a fake Census and Supabase');
const dir = mkdtempSync(join(tmpdir(), 'acs-'));
const out = join(dir, 'written.json');
const fakeZips = ['38017', '38138', '00501'];
const preload = join(dir, 'preload.mjs');
writeFileSync(preload, `
import { writeFileSync } from 'node:fs';
const labels = ${JSON.stringify(EXPECTED_LABELS)};
const vars = ${JSON.stringify(VARIABLES)};
const zips = ${JSON.stringify(fakeZips)};
const rec = ${JSON.stringify(fakeRecord('x'))};
const J = (b, ok = true, status = 200) => ({ ok, status, json: async () => b, text: async () => JSON.stringify(b) });
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes('/groups/')) {
    const g = u.match(/groups\\/(\\w+)\\.json/)[1];
    const v = {};
    Object.entries(labels).filter(([k]) => k.startsWith(g)).forEach(([k, f]) => { v[k] = { label: process.env.BAD_LABEL === k ? 'Estimate!!Total:!!Something else' : 'Estimate!!Total:!!' + f }; });
    return J({ variables: v });
  }
  if (u.includes('api.census.gov') && u.includes('?get=')) {
    const want = decodeURIComponent(u.split('get=')[1].split('&')[0]).split(',');
    return J([want.concat(['zip code tabulation area'])].concat(zips.map(z => want.map(k => String(rec[k])).concat([z]))));
  }
  if (u.includes('demographics_raw')) return J(u.includes('zip=gt.') ? [] : [{ zip: '38017', state: 'TN' }, { zip: '38138', state: 'tn' }]);
  if (u.includes('census_acs_zcta')) { writeFileSync(${JSON.stringify(out)}, init.body); return J([]); }
  throw new Error('unexpected fetch ' + u);
};
`);
const runImporter = (extraEnv = {}, args = []) => spawnSync(process.execPath, ['--import', preload, 'scripts/import-census-acs.mjs', ...args], {
  env: { ...process.env, SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', MIN_ZCTAS: '3', ACS_YEAR: '2024', ...extraEnv }, encoding: 'utf8'
});
let p = runImporter();
const written = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch (e) { return null; } })();
check('a clean run succeeds and writes', p.status === 0 && /written/.test(p.stdout) && Array.isArray(written), p.stdout + p.stderr);
check('every ZCTA is written once', written && written.length === 3 && new Set(written.map(r => r.zip)).size === 3);
check('state comes from demographics_raw, upper-cased; unmatched ZIPs have none', written && written.find(r => r.zip === '38138').state === 'TN' && written.find(r => r.zip === '00501').state === null);
check('the Census label check ran', /variable labels verified/.test(p.stdout));
p = runImporter({ BAD_LABEL: 'B19001_017E' });
check('a renumbered table stops the import before anything is written', p.status !== 0 && /labels changed/.test(p.stderr), p.stderr.slice(0, 300));
p = runImporter({ MIN_ZCTAS: '30000' });
check('too few ZCTAs stops the import', p.status !== 0 && /floor/.test(p.stderr), p.stderr.slice(0, 300));

console.log('\n5. The market model uses the richer income when it can');
process.env.SUPABASE_URL = 'https://db.test'; process.env.SUPABASE_ANON_KEY = 'anon'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
const home = { zip: '38017', lat: 35.04, lon: -89.66, pop_18plus: 30000 };
const dem = { zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 };
// 40 TN ZIPs: 38017 is the wealthiest, lowest-poverty one.
const bands = (hi) => [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 10, 10, hi, hi, hi, hi].concat([]).slice(0, 16);   // 16 bands
const acsRow = (zip, median, hi, pov) => ({ zip, households: bands(hi).reduce((a, x) => a + x, 0), median_hh_income: median, poverty_universe: 1000, poverty_below: pov, income_bands: bands(hi) });
let acsRows = [acsRow('38017', 140000, 30, 20)].concat(Array.from({ length: 39 }, (_, i) => acsRow('37' + String(100 + i), 40000 + i * 1000, 3 + (i % 5), 100 + i * 3)));
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = rows => ({ ok: true, status: 200, json: async () => rows });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('cdc_places?zip=eq.')) return J([home]);
  if (u.includes('cdc_places?measureid=eq.DENTAL&lat=gte')) return J([home]);
  if (u.includes('cdc_places?zip=in.(')) return J([{ zip: '38017', measureid: 'CHD', value: 8.5, pop_18plus: 30000, data_year: 2023 }]);
  if (u.includes('demographics_raw?zip=eq') || u.includes('demographics_raw?state')) return J([dem]);
  if (u.includes('census_acs_zcta')) { if (acsRows === 'throw') throw new Error('boom'); return J(acsRows); }
  return J([]);
};
const { handler } = require('../v2/netlify/functions/market-score.js');
const payOf = async () => {
  const d = JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { zip: '38017' }, headers: {} })).body);
  return d.model.specialties[0].evidence.pay;
};
let pay = await payOf();
check('income is ranked from ACS detail, and says so', pay && pay.income_basis === 'acs', JSON.stringify(pay));
check('the detail carries the raw figures and the three percentiles', pay.income_detail && pay.income_detail.median_income === 140000
  && pay.income_detail.share_100k > 0 && pay.income_detail.poverty_rate === 2 && pay.income_detail.median_pct >= 95 && pay.income_detail.low_poverty_pct >= 95, JSON.stringify(pay.income_detail));
check('a rich, low-poverty ZIP lands at the top of the income rank', pay.income_pct >= 95, String(pay.income_pct));
acsRows = acsRows.slice(0, 10);
pay = await payOf();
check('too few ZIPs in the state to rank: back to the coarse measure', pay.income_basis !== 'acs' && !pay.income_detail);
acsRows = acsRows.slice(1).concat([]);
acsRows = Array.from({ length: 40 }, (_, i) => acsRow('37' + String(100 + i), 50000, 5, 100));
pay = await payOf();
check('this ZIP missing from ACS: back to the coarse measure', pay.income_basis !== 'acs');
acsRows = 'throw';
pay = await payOf();
check('a failed or missing ACS read never breaks the score', pay && pay.income_basis !== 'acs');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
