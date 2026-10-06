// Import Census SAHIE county uninsured estimates (people under 65) into
// sahie_county (migration 027). See scripts/lib/sahie.mjs for what SAHIE is.
//
// The newest year is found at run time (SAHIE trails by about two years).
// Floor: 3,000 counties, or nothing is written.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CENSUS_API_KEY; optional SAHIE_YEAR.
// Run: node scripts/import-sahie.mjs [--dry-run]

import { SAHIE_VARS, toRows } from './lib/sahie.mjs';

const dryRun = process.argv.includes('--dry-run');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CENSUS_API_KEY, SAHIE_YEAR } = process.env;
if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
if (!CENSUS_API_KEY) throw new Error('CENSUS_API_KEY is required (free: https://api.census.gov/data/key_signup.html)');
const MIN_COUNTIES = Number(process.env.MIN_COUNTIES) || 3000;
const BASE = 'https://api.census.gov/data/timeseries/healthins/sahie';

async function getJson(url, label) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ProviderPulse-import' } });
  const text = await res.text();
  if (!res.ok) { const e = new Error(`${label}: HTTP ${res.status} ${text.slice(0, 200)}`); e.status = res.status; throw e; }
  if (!text.trim()) { const e = new Error(`${label}: empty reply`); e.status = 204; throw e; }
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`${label}: reply was not JSON: ${text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)}`); }
}

async function main() {
  const now = new Date().getFullYear();
  const years = SAHIE_YEAR ? [Number(SAHIE_YEAR)] : [now - 1, now - 2, now - 3, now - 4];
  let data = null, year = null;
  for (const y of years) {
    // All ages under 65, all races, both sexes, all incomes: the headline estimate.
    const url = `${BASE}?get=${SAHIE_VARS.join(',')}&for=county:*&time=${y}&AGECAT=0&RACECAT=0&SEXCAT=0&IPRCAT=0&key=${encodeURIComponent(CENSUS_API_KEY)}`;
    try { data = await getJson(url, `SAHIE ${y}`); year = y; break; }
    catch (e) { console.log(`  SAHIE ${y} not available (${e.status || e.message.slice(0, 120)})`); }
  }
  if (!data) throw new Error('no SAHIE year found');
  const rows = toRows(data, year);
  console.log(`SAHIE ${year}: ${rows.length.toLocaleString()} counties, ${rows.filter(r => r.uninsured_pct === null).length} without a rate`);
  if (rows.length < MIN_COUNTIES) throw new Error(`only ${rows.length} counties (floor ${MIN_COUNTIES}); refusing to write`);
  const shelby = rows.find(r => r.fips === '47157');
  if (shelby) console.log('47157:', JSON.stringify(shelby));
  if (dryRun) { console.log('dry run, nothing written'); return; }
  const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' };
  for (let i = 0; i < rows.length; i += 1000) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sahie_county?on_conflict=fips`, { method: 'POST', headers: H, body: JSON.stringify(rows.slice(i, i + 1000)) });
    if (!res.ok) throw new Error(`write ${i}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  console.log('written');
}

main().catch(e => { console.error(e); process.exit(1); });
