// Import ACS 5-year detail by ZIP Code Tabulation Area into census_acs_zcta
// (migration 023): household income in 16 bands, median household income,
// poverty, age by sex in 18 five-year bands, race and ethnicity, education.
//
// The existing demographics_raw table is coarser (income stops at "$100,000 and
// over"). This adds detail beside it; demographics_raw is not touched.
//
// The Census publishes ZIP-level household income only up to "$200,000 or
// more", so that is the top band. Nothing finer exists at this geography.
//
// Checks before anything is written (a wrong table silently is the failure to
// avoid): every variable's Census label must contain the fragment in
// EXPECTED_LABELS; the ZCTA count must clear a floor; and income and age bands
// must add up to their totals on at least 99% of rows.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CENSUS_API_KEY (the
// Census data API requires one: free, https://api.census.gov/data/key_signup.html), ACS_YEAR
// (otherwise the newest year the Census serves).
// Run: node scripts/import-census-acs.mjs [--dry-run]

import { VARIABLES, EXPECTED_LABELS, toRow, rowProblems, INSURANCE_TABLES, pickInsuranceVars, insuranceVarIds,
  SIGNAL_RULES, pickSignalVars, signalVarIds } from './lib/acs.mjs';

const dryRun = process.argv.includes('--dry-run');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CENSUS_API_KEY, ACS_YEAR } = process.env;
if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const MIN_ZCTAS = Number(process.env.MIN_ZCTAS) || 30000;       // the Census publishes about 33,000
const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };
let keyParam = CENSUS_API_KEY ? `&key=${encodeURIComponent(CENSUS_API_KEY)}` : '';

async function getJson(url, label, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ProviderPulse-import' } });
  const text = await res.text();
  if (!res.ok) {
    if (attempt < 3 && res.status >= 500) { await new Promise(r => setTimeout(r, attempt * 3000)); return getJson(url, label, attempt + 1); }
    const e = new Error(`${label}: HTTP ${res.status} ${text.slice(0, 200)}`); e.status = res.status; throw e;
  }
  try { return JSON.parse(text); }
  catch (e) {
    // The Census answers a bad or inactive API key with an HTML page and a 200.
    const err = new Error(`${label}: reply was not JSON: ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)}`);
    err.notJson = true; throw err;
  }
}

async function pickYear() {
  const start = ACS_YEAR ? Number(ACS_YEAR) : new Date().getFullYear() - 1;
  for (let y = start; y >= (ACS_YEAR ? start : start - 4); y--) {
    try { await getJson(`https://api.census.gov/data/${y}/acs/acs5/groups/B19001.json`, `ACS ${y}`); return y; }
    catch (e) { console.log(`  ACS ${y} not available (${e.status || e.message})`); }
  }
  throw new Error('no ACS 5-year release found');
}

async function checkLabels(year) {
  const labels = {};
  for (const g of ['B19001', 'B19013', 'B17001', 'B01001', 'B03002', 'B15003']) {
    const d = await getJson(`https://api.census.gov/data/${year}/acs/acs5/groups/${g}.json`, `${g} metadata`);
    Object.entries(d.variables || {}).forEach(([k, v]) => { labels[k] = String(v.label || ''); });
  }
  const bad = Object.entries(EXPECTED_LABELS).filter(([k, frag]) => !(labels[k] || '').includes(frag));
  if (bad.length) throw new Error('Census labels changed, refusing to import:\n' + bad.map(([k, f]) => `  ${k}: expected "${f}", got "${labels[k]}"`).join('\n'));
  console.log(`  ${Object.keys(EXPECTED_LABELS).length} variable labels verified`);
}

// Insurance cells are discovered from the Census labels. Best effort: if the
// tables or labels are not what we expect, the rest of the import still runs and
// the insurance columns are left null (unknown), with the reason in the log.
async function insurancePicks(year) {
  const labels = {}, found = {};
  for (const [k, names] of Object.entries(INSURANCE_TABLES)) {
    for (const g of names) {
      try {
        const d = await getJson(`https://api.census.gov/data/${year}/acs/acs5/groups/${g}.json`, `${g} metadata`);
        Object.entries(d.variables || {}).forEach(([id, v]) => { labels[id] = String(v.label || ''); });
        found[k] = g;
        break;
      } catch (e) { console.log(`  insurance: ${g} not available (${e.status || e.message.slice(0, 80)})`); }
    }
  }
  const picks = pickInsuranceVars(labels, found);
  if (!picks) { console.log('  insurance: no cells matched the expected labels; insurance columns will be empty'); return null; }
  for (const k of ['uninsured', 'medicare', 'medicaid']) {
    console.log(`  insurance cells: ${k} ${picks[k].length} from ${found[k] || 'none'}${picks[k].length ? ' (e.g. ' + labels[picks[k][0]] + ')' : ''}`);
  }
  return picks;
}

// Market signals: same discovery, one figure at a time, each optional.
async function signalPicks(year) {
  const labels = {}, found = {};
  for (const [k, rule] of Object.entries(SIGNAL_RULES)) {
    for (const g of rule.tables) {
      if (Object.values(found).includes(g)) { found[k] = g; break; }
      try {
        const d = await getJson(`https://api.census.gov/data/${year}/acs/acs5/groups/${g}.json`, `${g} metadata`);
        Object.entries(d.variables || {}).forEach(([id, v]) => { labels[id] = String(v.label || ''); });
        found[k] = g;
        break;
      } catch (e) { console.log(`  signals: ${g} not available (${e.status || e.message.slice(0, 80)})`); }
    }
  }
  const sig = pickSignalVars(labels, found);
  for (const k of Object.keys(SIGNAL_RULES)) {
    const s = sig && sig[k];
    console.log(`  signal cells: ${k} ${s ? s.cells.length : 0} from ${found[k] || 'none'}${s ? ' (e.g. ' + labels[s.cells[0]] + ')' : ''}`);
  }
  return sig;
}

// Total population from the release five years earlier, for growth. Optional:
// any failure leaves growth unknown and the rest of the import untouched.
async function priorPopulation(year) {
  for (const y of [year - 5, year - 6]) {
    try {
      const data = await getJson(`https://api.census.gov/data/${y}/acs/acs5?get=B01003_001E&for=zip%20code%20tabulation%20area:*${keyParam}`, `ACS ${y} population`);
      const head = data[0], zi = head.indexOf('zip code tabulation area'), vi = head.indexOf('B01003_001E');
      const out = new Map();
      for (const row of data.slice(1)) {
        const v = Number(row[vi]);
        if (Number.isFinite(v) && v >= 0) out.set(String(row[zi]).padStart(5, '0'), v);
      }
      console.log(`  growth baseline: ACS ${y} population for ${out.size.toLocaleString()} ZCTAs`);
      return { year: y, values: out };
    } catch (e) { console.log(`  growth baseline: ACS ${y} not available (${e.status || e.message.slice(0, 80)})`); }
  }
  return null;
}

async function fetchAll(year, extraVars) {
  const byZip = new Map();
  const CHUNK = 45;                                              // the API allows 50 per call
  const ALL = VARIABLES.concat(extraVars || []);
  for (let i = 0; i < ALL.length; i += CHUNK) {
    const vars = ALL.slice(i, i + CHUNK);
    const call = () => getJson(`https://api.census.gov/data/${year}/acs/acs5?get=${vars.join(',')}&for=zip%20code%20tabulation%20area:*${keyParam}`, 'ACS data');
    let data;
    try { data = await call(); }
    catch (e) {
      if (e.notJson && /missing key/i.test(e.message)) {
        throw new Error('The Census API now requires a key for data requests. Get a free one at https://api.census.gov/data/key_signup.html, click the activation link it emails you, then add it as the GitHub Actions secret CENSUS_API_KEY and run this again.');
      }
      if (!e.notJson || !keyParam) throw e;
      console.log(`  ${e.message}\n  CENSUS_API_KEY looks invalid or not yet activated; retrying without it`);
      keyParam = ''; data = await call();
    }
    const head = data[0], zi = head.indexOf('zip code tabulation area');
    for (const row of data.slice(1)) {
      const zip = row[zi];
      const rec = byZip.get(zip) || {};
      vars.forEach(v => { rec[v] = row[head.indexOf(v)]; });
      byZip.set(zip, rec);
    }
    console.log(`  variables ${i + 1}-${i + vars.length}: ${data.length - 1} ZCTAs`);
  }
  return byZip;
}

// zip -> state from demographics_raw, so market-score can rank within a state.
async function zipStates() {
  const map = new Map();
  let last = '';
  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/demographics_raw?select=zip,state${last ? `&zip=gt.${last}` : ''}&order=zip&limit=1000`, { headers: H });
    if (!res.ok) throw new Error(`demographics_raw: HTTP ${res.status}`);
    const rows = await res.json();
    rows.forEach(r => { if (r.state) map.set(String(r.zip).padStart(5, '0'), String(r.state).trim().toUpperCase()); });
    if (rows.length < 1000) return map;
    last = rows[rows.length - 1].zip;
  }
}

async function main() {
  const year = await pickYear();
  console.log(`ACS ${year} 5-year, by ZCTA`);
  await checkLabels(year);
  const picks = await insurancePicks(year);
  const sig = await signalPicks(year);
  const prior = await priorPopulation(year);
  const raw = await fetchAll(year, [...new Set(insuranceVarIds(picks).concat(signalVarIds(sig)))]);
  if (raw.size < MIN_ZCTAS) throw new Error(`only ${raw.size} ZCTAs returned (floor ${MIN_ZCTAS}); refusing to write`);

  const states = dryRun && !SUPABASE_URL ? new Map() : await zipStates();
  const rows = [];
  let unsound = 0, noState = 0;
  for (const [zip, rec] of raw) {
    const row = toRow(zip, rec, year, states.get(String(zip).padStart(5, '0')), picks, sig,
      prior ? { year: prior.year, value: prior.values.has(String(zip).padStart(5, '0')) ? prior.values.get(String(zip).padStart(5, '0')) : null } : null);
    if (!row.state) noState++;
    if (rowProblems(row).length) unsound++;
    rows.push(row);
  }
  console.log(`${rows.length} rows; ${noState} without a state (no demographics_raw row); ${unsound} whose bands do not add up`);
  if (unsound > rows.length * 0.01) throw new Error(`${unsound} rows fail the band-total check; the Census layout may have changed`);
  const sample = rows.find(r => r.zip === '38017');
  if (sample) console.log('38017:', JSON.stringify({ households: sample.households, median: sample.median_hh_income, income: sample.income_bands,
    insurance: { universe: sample.ins_universe, uninsured: sample.ins_uninsured, medicare: sample.ins_medicare, medicaid: sample.ins_medicaid },
    pop: sample.pop_total, pop_prior: sample.pop_prior, pop_prior_year: sample.pop_prior_year, signals: sample.signals }));

  if (dryRun) { console.log('dry run, nothing written'); return; }
  for (let i = 0; i < rows.length; i += 500) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/census_acs_zcta?on_conflict=zip`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(rows.slice(i, i + 500))
    });
    if (!res.ok) throw new Error(`write ${i}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  console.log('written');
}

main().catch(e => { console.error(e); process.exit(1); });
