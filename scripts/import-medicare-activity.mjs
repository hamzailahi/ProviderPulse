// Import Medicare behavioural activity into npi_activity (migration 008).
//
// WHY THIS EXISTS
// NPPES proves an NPI was issued. It cannot say whether anyone still practises
// under it, and a directory full of NPIs that no longer see patients is exactly
// what the accuracy product is measuring. Medicare claims volume and PECOS
// enrolment are the closest public proxies for "actually active".
//
// UPSERT, NOT FULL REFRESH -- the opposite of import-leie.mjs, on purpose.
// For LEIE, a missing row means "not excluded", so reinstated providers must be
// deleted and a full refresh is correct. Here a missing row means UNKNOWN, not
// inactive. A delete-then-insert would be pointless churn, and a partially
// failed refresh would make half the country look like it stopped practising.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/import-medicare-activity.mjs [options]
//
//   --dry-run           parse and report, write nothing
//   --puf-url <url>     override the Physician & Other Practitioners CSV URL
//   --or-url <url>      override the Order & Referring CSV URL
//   --puf-file <path>   parse a local PUF CSV instead of downloading
//   --or-file <path>    parse a local Order & Referring CSV instead
//   --year <yyyy>       data year to record for PUF rows
//   --skip-or           import PUF only (Order & Referring is the slower file)
//
// ---------------------------------------------------------------------------
// !! EVERY CONSTANT IN THE NEXT BLOCK IS AN UNVERIFIED ASSUMPTION !!
//
// data.cms.gov is unreachable from the environment this script was written in,
// so the URLs, the dataset UUIDs and the column names below were written from
// the published data dictionaries and NOT confirmed against a live response.
// GitHub Actions runners CAN reach data.cms.gov, so the first workflow run is
// the verification step.
//
// The script is built to fail loudly rather than quietly: a missing column
// aborts and prints every column that WAS present (see columnIndex in
// scripts/lib/bulk.mjs), and every URL is overridable from the command line so
// a wrong guess can be corrected without editing this file.
// ---------------------------------------------------------------------------

import {
  fetchCsvRows, fileCsvRows, columnIndex, cleanNpi, cleanInt, batchWrite
} from './lib/bulk.mjs';

// --- Source 1: Medicare Physician & Other Practitioners - by Provider -------
// Landing page + data dictionary:
//   https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners/medicare-physician-other-practitioners-by-provider
// CMS serves each year as its own distribution; the UUID below identifies one
// year's CSV. ASSUMPTION: this UUID and the year it maps to. If the run 404s,
// open the landing page, copy the current year's CSV link, and pass --puf-url.
const PUF_YEAR = 2023;
const PUF_URL = 'https://data.cms.gov/data-api/v1/dataset-distribution/6fea9d79-0129-4e4c-b1b8-23cd86a4ed1b/data?format=csv';

// ASSUMPTION: column names, from the "by Provider" data dictionary.
// Rndrng_NPI is the rendering provider's NPI; Tot_Srvcs is total services.
const PUF_NPI = 'Rndrng_NPI';
const PUF_SERVICES = 'Tot_Srvcs';

// --- Source 2: PECOS Order and Referring ------------------------------------
// Landing page + data dictionary:
//   https://data.cms.gov/provider-characteristics/medicare-provider-supplier-enrollment/order-and-referring
// Presence in this file means the provider is currently enrolled and eligible
// to order/refer -- a much better "still practising" signal than claims volume
// alone, because it is a current enrolment status rather than a lagging year.
const OR_URL = 'https://data.cms.gov/data-api/v1/dataset/d1e97b30-2c9b-4e3a-9d1a-1e5b0a2a6f4b/data?format=csv';

// ASSUMPTION: the Order & Referring file's NPI column is literally "NPI".
const OR_NPI = 'NPI';

// --- Abort thresholds -------------------------------------------------------
// A collapsed parse (wrong delimiter, HTML error page served as CSV, truncated
// download) must never be written. These are floors, not targets: the real
// files are far larger, so anything near these numbers means something broke.
const MIN_PUF_NPIS = 500000;
const MIN_OR_NPIS = 1000000;

const TABLE = 'npi_activity';
const BATCH = 1000;

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d = null) => (args.indexOf(n) !== -1 ? args[args.indexOf(n) + 1] : d);

const dryRun = flag('--dry-run');
const skipOr = flag('--skip-or');
const pufUrl = opt('--puf-url', PUF_URL);
const orUrl = opt('--or-url', OR_URL);
const pufFile = opt('--puf-file');
const orFile = opt('--or-file');
const year = Number(opt('--year', PUF_YEAR));

const rowsFrom = (file, url, label) => (file ? fileCsvRows(file) : fetchCsvRows(url, label));

/**
 * Pass 1 - the PUF. One row per NPI per year in the "by Provider" file, so we
 * take the services count directly. Keyed into a Map so pass 2 can merge.
 */
async function readPuf() {
  console.log(`PUF: reading ${pufFile || pufUrl}`);
  const out = new Map();
  let header = null, at = null, n = 0, skipped = 0;

  for await (const row of rowsFrom(pufFile, pufUrl, 'PUF')) {
    if (!header) {
      header = row;
      at = columnIndex(header, [PUF_NPI, PUF_SERVICES], 'PUF');
      console.log(`  header OK: ${header.length} columns`);
      continue;
    }
    if (row.length < 2) continue;                       // blank trailing line
    const npi = cleanNpi(row[at(PUF_NPI)]);
    if (!npi) { skipped++; continue; }
    const services = cleanInt(row[at(PUF_SERVICES)]);

    // The by-Provider file is one row per NPI, but sum defensively in case a
    // future layout splits by place of service.
    const prev = out.get(npi);
    if (prev) prev.services += (services || 0);
    else out.set(npi, { services: services || 0 });
    n++;
    if (n % 250000 === 0) process.stdout.write(`\r  parsed ${n.toLocaleString()} rows`);
  }
  process.stdout.write(`\r  parsed ${n.toLocaleString()} rows, ${out.size.toLocaleString()} distinct NPIs`);
  if (skipped) process.stdout.write(`, ${skipped.toLocaleString()} rows had no usable NPI`);
  console.log('');
  return out;
}

/** Pass 2 - Order & Referring. Presence is the signal; no other column needed. */
async function readOrderReferring() {
  console.log(`O&R: reading ${orFile || orUrl}`);
  const enrolled = new Set();
  let header = null, at = null, n = 0;

  for await (const row of rowsFrom(orFile, orUrl, 'O&R')) {
    if (!header) {
      header = row;
      at = columnIndex(header, [OR_NPI], 'O&R');
      console.log(`  header OK: ${header.length} columns`);
      continue;
    }
    const npi = cleanNpi(row[at(OR_NPI)]);
    if (npi) enrolled.add(npi);
    n++;
    if (n % 500000 === 0) process.stdout.write(`\r  parsed ${n.toLocaleString()} rows`);
  }
  console.log(`\r  parsed ${n.toLocaleString()} rows, ${enrolled.size.toLocaleString()} distinct enrolled NPIs`);
  return enrolled;
}

async function main() {
  const puf = await readPuf();
  if (puf.size < MIN_PUF_NPIS) {
    throw new Error(
      `PUF yielded only ${puf.size.toLocaleString()} distinct NPIs, below the ${MIN_PUF_NPIS.toLocaleString()} floor. ` +
      `Refusing to write -- this usually means the download was truncated or the URL served something that is not the PUF.`
    );
  }

  let enrolled = new Set();
  if (!skipOr) {
    enrolled = await readOrderReferring();
    if (enrolled.size < MIN_OR_NPIS) {
      throw new Error(
        `Order & Referring yielded only ${enrolled.size.toLocaleString()} distinct NPIs, below the ${MIN_OR_NPIS.toLocaleString()} floor. ` +
        `Refusing to write. Re-run with --skip-or to import PUF data alone if O&R is genuinely unavailable.`
      );
    }
  } else {
    console.log('O&R: skipped (--skip-or); pecos_enrolled will be left unknown');
  }

  // Union of both sources. An NPI present only in O&R still deserves a row:
  // "enrolled but bills no Medicare" is a meaningful, and quite different,
  // signal from "we have never heard of this NPI".
  const npis = new Set([...puf.keys(), ...enrolled]);
  const source = `cms_puf_${year}` + (skipOr ? '' : '+pecos_or');
  const refreshedAt = new Date().toISOString();

  const records = [];
  for (const npi of npis) {
    const p = puf.get(npi);
    records.push({
      npi,
      // Only claim an activity year for NPIs actually in the PUF. Writing the
      // year for an O&R-only NPI would invent claims activity that the data
      // does not show.
      last_medicare_activity_year: p ? year : null,
      medicare_services_count: p ? p.services : null,
      // Unknown, not false, when O&R was skipped -- null is the fail-closed
      // value the scoring module expects.
      pecos_enrolled: skipOr ? null : enrolled.has(npi),
      source,
      refreshed_at: refreshedAt
    });
  }

  const both = [...puf.keys()].filter(n => enrolled.has(n)).length;
  console.log('');
  console.log(`summary:`);
  console.log(`  in PUF only        : ${(puf.size - both).toLocaleString()}`);
  console.log(`  in O&R only        : ${(enrolled.size - both).toLocaleString()}`);
  console.log(`  in both            : ${both.toLocaleString()}`);
  console.log(`  rows to upsert     : ${records.length.toLocaleString()}`);
  console.log(`  source tag         : ${source}`);

  if (dryRun) { console.log('\n--dry-run: nothing written'); return; }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('');
  await batchWrite(records, {
    url: SUPABASE_URL,
    key: SUPABASE_SERVICE_ROLE_KEY,
    table: TABLE,
    batch: BATCH,
    onConflict: 'npi',          // upsert; see the header comment for why
    label: 'upsert'
  });
  console.log('Medicare activity import complete');
}

main().catch(e => { console.error('\nMedicare activity import failed:', e.message); process.exit(1); });
