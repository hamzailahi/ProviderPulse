// Import the ZIP-to-county crosswalk into zip_county_crosswalk (migration 020),
// from HUD's USPS ZIP Code Crosswalk API (type=2, zip-county), weighted by
// RES_RATIO -- the fraction of a ZIP's residential addresses in each county.
//
// WHY HUD, NOT THE FREE CENSUS ZCTA-COUNTY RELATIONSHIP FILE. Census's file
// (public, no auth) only carries a land-area overlap weight, which badly
// misweights a split ZIP whenever population concentrates away from the
// larger-area county. Confirmed live 2026-08-19: ZIP 38017 is 91% Shelby
// County / 9% Fayette County by HUD's residential-address ratio, but the
// Census land-area weight gives a misleading 43%/57% for the same ZIP. HUD
// requires a free account + API token (HUD_API_TOKEN); that tradeoff was
// made deliberately for the accuracy, not for convenience.
//
// WHY STATE-LEVEL CALLS, NOT ONE PER ZIP. The API's type=2 query accepts
// either a 5-digit ZIP or a 2-letter state and returns every ZIP-county pair
// for that state in one response -- confirmed live: query=TN returned 1,245
// rows / 761 distinct ZIPs in a single call, no pagination fields in the
// response. Looping 50 states + DC is ~51 calls; looping every ZIP
// individually would be ~41,000.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUD_API_TOKEN
// Run: node scripts/import-zip-county-crosswalk.mjs [options]
//
//   --dry-run        parse and report, write nothing
//   --state <ST>      import a single state only, for testing
//
// ---------------------------------------------------------------------------

import { batchWrite } from './lib/bulk.mjs';

const HUD_API = 'https://www.huduser.gov/hudapi/public/usps';
const TABLE = 'zip_county_crosswalk';
const BATCH = 1000;
const CONCURRENCY = 5;

// Same 50-states-+-DC footprint as the national NPPES bulk-load pipeline
// (CLAUDE.md: "all 50 states + DC are loaded ... territories + PR, not yet
// run") -- a ZIP outside this set has no clinics/provider_individuals data
// for market-score.js to allocate anyway, so importing its crosswalk row
// would be dead weight.
const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
];

// A real full run covers ~33,000-41,000 ZIPs. This is a floor, not a target
// -- anything near it means most state calls failed silently.
const MIN_ROWS = 25000;

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d = null) => (args.indexOf(n) !== -1 ? args[args.indexOf(n) + 1] : d);

const dryRun = flag('--dry-run');
const onlyState = opt('--state');

async function fetchState(token, state, attempt = 1) {
  const res = await fetch(`${HUD_API}?type=2&query=${state}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 429 && attempt <= 3) {
    const wait = attempt * 2000;
    console.log(`  ${state}: rate-limited, retrying in ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
    return fetchState(token, state, attempt + 1);
  }
  if (!res.ok) throw new Error(`${state}: HUD API HTTP ${res.status} ${await res.text().then(t => t.slice(0, 200))}`);
  const json = await res.json();
  const results = (json.data && json.data.results) || [];
  return results;
}

async function main() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HUD_API_TOKEN } = process.env;
  if (!HUD_API_TOKEN) throw new Error('HUD_API_TOKEN is required');
  if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const states = onlyState ? [onlyState.toUpperCase()] : STATES;
  console.log(`crosswalk: fetching ${states.length} state(s) from HUD, concurrency ${CONCURRENCY}`);

  const rows = [];
  let dataYear = null, dataQuarter = null;
  let done = 0;

  for (let i = 0; i < states.length; i += CONCURRENCY) {
    const chunk = states.slice(i, i + CONCURRENCY);
    const perState = await Promise.all(chunk.map(async st => {
      const results = await fetchState(HUD_API_TOKEN, st);
      return { st, results };
    }));
    for (const { st, results } of perState) {
      for (const r of results) {
        if (!r.zip || !r.geoid) continue;
        rows.push({
          zip: String(r.zip).trim(),
          fips: String(r.geoid).trim(),
          state: st,
          res_ratio: Number(r.res_ratio),
          data_year: r.year != null ? String(r.year) : null,
          data_quarter: r.quarter != null ? String(r.quarter) : null
        });
      }
      done++;
      process.stdout.write(`\r  ${done}/${states.length} states (${rows.length.toLocaleString()} rows so far)`);
    }
  }
  process.stdout.write('\n');

  // Dedup on (zip, fips) -- a ZIP straddling a state line could otherwise be
  // fetched twice (once under each state's query) with the same res_ratio;
  // last one wins, which is fine since HUD's ratio for a given (zip, fips)
  // pair does not depend on which state query found it.
  const byKey = new Map();
  for (const r of rows) byKey.set(`${r.zip}|${r.fips}`, r);
  const deduped = [...byKey.values()];

  console.log(`crosswalk: ${deduped.length.toLocaleString()} unique (zip, county) pairs across ${new Set(deduped.map(r => r.zip)).size.toLocaleString()} ZIPs`);

  if (deduped.length < MIN_ROWS) {
    throw new Error(
      `crosswalk: only ${deduped.length.toLocaleString()} rows, below the ${MIN_ROWS.toLocaleString()} floor. ` +
      `Refusing to write -- this usually means most state calls failed.`
    );
  }

  if (dryRun) { console.log('\n--dry-run: nothing written'); return; }

  const refreshedAt = new Date().toISOString();
  const records = deduped.map(r => ({ ...r, refreshed_at: refreshedAt }));

  console.log('');
  await batchWrite(records, {
    url: SUPABASE_URL,
    key: SUPABASE_SERVICE_ROLE_KEY,
    table: TABLE,
    batch: BATCH,
    onConflict: 'zip,fips',
    label: 'upsert'
  });
  console.log('ZIP-county crosswalk import complete');
}

main().catch(e => { console.error('\nZIP-county crosswalk import failed:', e.message); process.exit(1); });
