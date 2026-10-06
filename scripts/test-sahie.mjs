// Census SAHIE county uninsured estimates: parsing, the importer against a fake
// Census and Supabase, and how market-score reports the ZIP's main county.
//
// node scripts/test-sahie.mjs
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { toRows, val, SAHIE_VARS } from './lib/sahie.mjs';
const require = createRequire(import.meta.url);

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const HEAD = SAHIE_VARS.concat(['time', 'AGECAT', 'RACECAT', 'SEXCAT', 'IPRCAT', 'state', 'county']);
const row = (st, co, name, pct, moe = '0.9') => [name, '780000', '64000', pct, moe, '2023', '0', '0', '0', '0', st, co];

console.log('1. Parsing');
const parsed = toRows([HEAD, row('47', '157', 'Shelby County, TN', '8.2'), row('47', '047', 'Fayette County, TN', '-1'), row('47', '000', 'Tennessee', '9')], 2023);
check('one row per county, keyed by 5-digit FIPS; the state total is skipped', parsed.length === 2 && parsed[0].fips === '47157' && parsed[0].county === 'Shelby County, TN');
check('rate, margin, counts and year carry through', parsed[0].uninsured_pct === 8.2 && parsed[0].uninsured_pct_moe === 0.9 && parsed[0].uninsured === 64000 && parsed[0].under65 === 780000 && parsed[0].year === 2023);
check('a suppressed rate is unknown, not zero', parsed[1].uninsured_pct === null);
check('sentinels and blanks are unknown', val('') === null && val('-666666666') === null && val('0') === 0);
let threw = null; try { toRows([['NAME', 'state', 'county'], ['x', '47', '157']], 2023); } catch (e) { threw = e; }
check('a reply missing a column stops the import', threw && /missing column NIPR_PT/.test(threw.message));

console.log('\n2. The importer, offline');
const dir = mkdtempSync(join(tmpdir(), 'sahie-'));
const out = join(dir, 'written.json');
const preload = join(dir, 'preload.mjs');
const many = [HEAD].concat(Array.from({ length: 12 }, (_, i) => row('47', String(100 + i), 'County ' + i, String(5 + i))));
writeFileSync(preload, `
import { writeFileSync } from 'node:fs';
const DATA = ${JSON.stringify(many)};
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes('timeseries/healthins/sahie')) {
    const y = u.match(/time=(\\d+)/)[1];
    if (y === process.env.EMPTY_YEAR) return { ok: true, status: 204, text: async () => '' };
    if (y === process.env.HAVE_YEAR) return { ok: true, status: 200, text: async () => JSON.stringify(DATA) };
    return { ok: false, status: 400, text: async () => 'error: unknown/unsupported geography' };
  }
  if (u.includes('sahie_county')) { writeFileSync(${JSON.stringify(out)}, init.body); return { ok: true, status: 201, text: async () => '' }; }
  throw new Error('unexpected fetch ' + u);
};
`);
const now = new Date().getFullYear();
const run = env => spawnSync(process.execPath, ['--import', preload, 'scripts/import-sahie.mjs'], { env: { ...process.env, SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', CENSUS_API_KEY: 'k', MIN_COUNTIES: '10', ...env }, encoding: 'utf8' });
let p = run({ EMPTY_YEAR: String(now - 1), HAVE_YEAR: String(now - 2) });
const written = (() => { try { return JSON.parse(readFileSync(out, 'utf8')); } catch (e) { return null; } })();
check('the newest published year is found by trying back from last year', p.status === 0 && new RegExp(`SAHIE ${now - 2}: 12 counties`).test(p.stdout), p.stdout + p.stderr);
check('every county is written with its year', written && written.length === 12 && written.every(r => r.year === now - 2));
p = run({ HAVE_YEAR: String(now - 2), MIN_COUNTIES: '3000' });
check('too few counties stops the import', p.status !== 0 && /refusing to write/.test(p.stderr));
p = run({ HAVE_YEAR: '1999' });
check('no year at all stops the import', p.status !== 0 && /no SAHIE year/.test(p.stderr));
p = spawnSync(process.execPath, ['--import', preload, 'scripts/import-sahie.mjs'], { env: { ...process.env, SUPABASE_URL: 'x', SUPABASE_SERVICE_ROLE_KEY: 'y', CENSUS_API_KEY: '' }, encoding: 'utf8' });
check('a missing Census key says how to get one', p.status !== 0 && /key_signup/.test(p.stderr));

console.log('\n3. market-score reports the ZIP\'s main county');
process.env.SUPABASE_URL = 'https://db.test'; process.env.SUPABASE_ANON_KEY = 'anon'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
let sahieRows = [{ fips: '47157', county: 'Shelby County, TN', year: 2023, uninsured_pct: 8.2, uninsured_pct_moe: 0.9, uninsured: 64000, under65: 780000 }];
const asked = [];
globalThis.fetch = async (url) => {
  const u = decodeURIComponent(String(url));
  const J = r => ({ ok: true, status: 200, json: async () => r });
  if (/[?&](npi|zip|fips|id)=gt\./.test(u)) return J([]);
  if (u.includes('demographics_raw')) return J([{ zip: '38017', state: 'TN', 'Total Population': 40000, 'Insured Population': 37000 }]);
  if (u.includes('zip_county_crosswalk')) return J([{ id: 1, fips: '47047', res_ratio: 0.09 }, { id: 2, fips: '47157', res_ratio: 0.91 }]);
  if (u.includes('sahie_county')) { asked.push(u); return J(sahieRows); }
  return J([]);
};
const { handler } = require('../v2/netlify/functions/market-score.js');
const score = async () => JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { zip: '38017' }, headers: {} })).body);
let d = await score();
check('the county holding most of the ZIP\'s homes is the one asked for', asked.some(u => /fips=eq\.47157/.test(u)) && !asked.some(u => /47047/.test(u)), asked.join(' | '));
check('the rate, margin, year and the ZIP share are reported', d.sahie && d.sahie.available && d.sahie.uninsured_pct === 8.2 && d.sahie.moe === 0.9 && d.sahie.year === 2023 && d.sahie.share_of_zip === 91, JSON.stringify(d.sahie));
sahieRows = [];
d = await score();
check('no SAHIE row means "not available", never a guessed rate', d.available && d.sahie && d.sahie.available === false);
sahieRows = [{ fips: '47157', county: 'Shelby', year: 2023, uninsured_pct: null }];
d = await score();
check('a county with no rate is not available either', d.sahie.available === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
