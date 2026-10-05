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
//   --discover          print the matching CMS catalog entries and exit
//   --puf-url <url>     skip catalog resolution, use this CSV URL
//   --or-url <url>      skip catalog resolution, use this CSV URL
//   --puf-file <path>   parse a local PUF CSV instead of downloading
//   --or-file <path>    parse a local Order & Referring CSV instead
//   --year <yyyy>       override the data year recorded for PUF rows
//   --skip-or           import PUF only (Order & Referring is the slower file)
//
// ---------------------------------------------------------------------------
// WHY THE DATASET URL IS RESOLVED AT RUNTIME
//
// The first version of this script hardcoded dataset UUIDs. They were guesses
// -- data.cms.gov is unreachable from the environment this was written in --
// and the PUF one 404'd on the first Action run.
//
// Hardcoding was the wrong shape regardless of the guess: CMS publishes each
// year as a NEW distribution with a NEW UUID, so a pinned UUID means this job
// silently stops picking up fresh data every time a year rolls over, which is
// precisely the staleness the accuracy product exists to detect.
//
// So the URL is resolved from the CMS DCAT catalog by title at run time, and
// the newest distribution wins. --puf-url / --or-url still override for the
// case where the catalog is down or a specific year is wanted.
//
// STILL ASSUMPTIONS, flagged honestly: the catalog URL, the DCAT field names,
// and the two title patterns below. Run with --discover to have the runner
// print exactly what it matched; the log is the verification step.
// ---------------------------------------------------------------------------

import {
  fetchCsvRows, fileCsvRows, columnIndex, cleanNpi, cleanInt, batchWrite
} from './lib/bulk.mjs';
import { resolve } from './lib/cms-catalog.mjs';

// The DCAT-US catalog every data.gov-family portal publishes. ASSUMPTION: that
// data.cms.gov serves it here and uses the standard shape
// ({ dataset: [{ title, identifier, modified, distribution: [...] }] }).
// The catalog URL and the resolution logic live in scripts/lib/cms-catalog.mjs.

// --- Source 1: Medicare Physician & Other Practitioners - by Provider -------
// Landing page + data dictionary:
//   https://data.cms.gov/provider-summary-by-type-of-service/medicare-physician-other-practitioners/medicare-physician-other-practitioners-by-provider
//
// Matched on title. Deliberately excludes "by Provider and Service" and "by
// Geography and Service", which are the same programme sliced differently and
// are one row per HCPCS code rather than one per NPI -- picking one of those by
// accident would multiply every provider's service count.
const PUF_TITLE = /medicare physician .* practitioners\s*[-–]\s*by provider$/i;

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
const OR_TITLE = /^order and referring$/i;

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
const discover = flag('--discover');
const skipOr = flag('--skip-or');
const pufUrlArg = opt('--puf-url');
const orUrlArg = opt('--or-url');
const pufFile = opt('--puf-file');
const orFile = opt('--or-file');
const yearArg = opt('--year');

const rowsFrom = (file, url, label) => (file ? fileCsvRows(file) : fetchCsvRows(url, label));

// ---------------------------------------------------------------------------
// CMS catalog resolution
// ---------------------------------------------------------------------------


/**
 * Pass 1 - the PUF. One row per NPI per year in the "by Provider" file, so we
 * take the services count directly. Keyed into a Map so pass 2 can merge.
 */
async function readPuf(pufUrl) {
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
async function readOrderReferring(orUrl) {
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
  // --discover: resolve and report only. Turns the Action log into the probe
  // for an environment that cannot reach data.cms.gov at authoring time.
  if (discover) {
    let bad = 0;
    for (const [re, label] of [[PUF_TITLE, 'PUF'], [OR_TITLE, 'O&R']]) {
      try { await resolve(re, label); }
      catch (e) { bad++; console.error(`\n${e.message}\n`); }
    }
    console.log(discover && !bad ? '\ndiscover: both datasets resolved' : '\ndiscover: see errors above');
    process.exit(bad ? 1 : 0);
  }

  // A local file needs no URL; an explicit --puf-url skips the catalog.
  let pufUrl = pufUrlArg, orUrl = orUrlArg;
  let year = yearArg ? Number(yearArg) : null;

  if (!pufFile && !pufUrl) {
    const pick = await resolve(PUF_TITLE, 'PUF');
    pufUrl = pick.url;
    // Prefer the year the distribution itself declares over any guess.
    if (!year && pick.year) year = pick.year;
  }
  if (!skipOr && !orFile && !orUrl) {
    orUrl = (await resolve(OR_TITLE, 'O&R')).url;
  }
  if (!year) {
    throw new Error(
      'Could not determine the PUF data year from the catalog. Pass --year explicitly ' +
      '(recording the wrong year would misdate every activity signal).'
    );
  }
  console.log(`data year: ${year}\n`);

  const puf = await readPuf(pufUrl);
  if (puf.size < MIN_PUF_NPIS) {
    throw new Error(
      `PUF yielded only ${puf.size.toLocaleString()} distinct NPIs, below the ${MIN_PUF_NPIS.toLocaleString()} floor. ` +
      `Refusing to write -- this usually means the download was truncated or the URL served something that is not the PUF.`
    );
  }

  let enrolled = new Set();
  if (!skipOr) {
    enrolled = await readOrderReferring(orUrl);
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

  // Belt and braces on the year. The guard above already refuses to run without
  // a plausible one, but a bad value here misdates every signal derived from it
  // -- a stored 0 once produced "2026 years before the reference year" and a
  // confident false-positive `likely_inactive` in a report. Cheap to assert.
  if (!Number.isInteger(year) || year < 1990 || year > new Date().getUTCFullYear() + 1) {
    throw new Error(`Refusing to write an implausible data year: ${year}`);
  }

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
