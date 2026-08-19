// Import current-month Medicare enrollment by county into
// medicare_county_enrollment (migration 019): total beneficiaries and the
// Original Medicare vs. Medicare Advantage split, from CMS's "Medicare Monthly
// Enrollment" dataset.
//
// CURRENT MONTH ONLY -- BY DESIGN. The source CSV is not a monthly slice; it is
// the FULL history back to 2013 (577k+ rows for the April 2026 publication,
// confirmed live 2026-08-19), republished in full every month with one more
// month appended. This script buffers only County-level rows, finds the newest
// (year, month) pair actually present, and keeps just that period -- then
// UPSERTS BY fips, so a re-run overwrites last month's numbers rather than
// accumulating history. If a trend line is ever wanted, that is a different
// table and a different import strategy (keyed on fips+year+month, insert not
// upsert) -- do not repurpose this one for it.
//
// SUPPRESSED CELLS ARE "*", NOT ZERO. CMS blanks small counts for privacy.
// Coercing "*" to 0 would be the same class of bug accuracy-signals.js already
// hit with Number(null) -- a suppressed county reading as "zero beneficiaries"
// rather than "unknown". Every numeric field is null when the source cell is
// "*" or blank.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/import-medicare-enrollment.mjs [options]
//
//   --dry-run        parse and report, write nothing
//   --discover       print the matching CMS catalog entries and exit
//   --csv-url <url>  skip catalog resolution, use this CSV URL directly
//   --file <path>    parse a local CSV instead of downloading
//
// ---------------------------------------------------------------------------
// WHY THE DATASET URL IS RESOLVED AT RUNTIME, NOT PINNED
//
// Same reasoning as import-medicare-activity.mjs: CMS publishes a new
// distribution (new title, new download path) every month. A pinned URL would
// silently stop refreshing the moment the next month's file replaces this
// one's path. The catalog is queried by dataset title and the newest-dated
// distribution wins -- see dateOf() below, which reads the "YYYY-MM-DD" the
// distribution title carries (e.g. "Medicare Monthly Enrollment : 2026-04-01").
//
// STILL AN ASSUMPTION, flagged honestly: the catalog URL, the DCAT field
// names, and the dataset title pattern below. Run with --discover first; the
// log is the verification step.
// ---------------------------------------------------------------------------

import { fetchCsvRows, fileCsvRows, columnIndex, batchWrite } from './lib/bulk.mjs';

const CMS_CATALOG = 'https://data.cms.gov/data.json';

// Matched on the DATASET title (not a distribution title). Confirmed live
// 2026-08-19 against https://data.cms.gov/data.json.
const DATASET_TITLE = /^medicare monthly enrollment$/i;

// Columns, confirmed against the live April 2026 CSV header 2026-08-19.
const COL = {
  YEAR: 'YEAR', MONTH: 'MONTH', GEO: 'BENE_GEO_LVL',
  STATE: 'BENE_STATE_ABRVTN', COUNTY: 'BENE_COUNTY_DESC', FIPS: 'BENE_FIPS_CD',
  TOTAL: 'TOT_BENES', ORIGINAL: 'ORGNL_MDCR_BENES', MA: 'MA_AND_OTH_BENES',
  AGED: 'AGED_TOT_BENES', DISABLED: 'DSBLD_TOT_BENES'
};
const REQUIRED_COLS = Object.values(COL);

const MONTH_ORDER = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
};

// A real month is ~3,140 US counties + DC + territories at BENE_GEO_LVL=County.
// This is a floor, not a target -- anything near it means a collapsed parse or
// the wrong geo level was matched.
const MIN_COUNTY_ROWS = 2500;

const TABLE = 'medicare_county_enrollment';
const BATCH = 1000;

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d = null) => (args.indexOf(n) !== -1 ? args[args.indexOf(n) + 1] : d);

const dryRun = flag('--dry-run');
const discover = flag('--discover');
const csvUrlArg = opt('--csv-url');
const fileArg = opt('--file');

const rowsFrom = (file, url) => (file ? fileCsvRows(file) : fetchCsvRows(url, 'enrollment'));

// ---------------------------------------------------------------------------
// CMS catalog resolution -- same shape as import-medicare-activity.mjs
// ---------------------------------------------------------------------------

const CSV_RE = /\.csv(\?|$)/i;

function csvDistributions(ds) {
  const dists = ds.distribution || ds.distributions || [];
  return dists
    .map(d => ({
      url: d.downloadURL || d.accessURL || d.downloadUrl || null,
      title: d.title || d.name || '',
      format: (d.format || d.mediaType || '').toLowerCase()
    }))
    .filter(d => d.url && (CSV_RE.test(d.url) || d.format.includes('csv')));
}

/** Pull a full date out of a distribution title/URL as YYYYMMDD, for sorting. */
function dateOf(s) {
  const t = String(s || '');
  const dash = t.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (dash) return Number(dash[1] + dash[2] + dash[3]);
  const plain = t.match(/(20\d{2})(\d{2})(\d{2})/);
  if (plain) {
    const mm = Number(plain[2]), dd = Number(plain[3]);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) return Number(plain[1] + plain[2] + plain[3]);
  }
  return null;
}

async function resolve() {
  console.log(`catalog: fetching ${CMS_CATALOG}`);
  const res = await fetch(CMS_CATALOG, { headers: { 'User-Agent': 'ProviderPulse-import' } });
  if (!res.ok) throw new Error(`catalog: HTTP ${res.status} from ${CMS_CATALOG}. Pass --csv-url to bypass.`);
  const json = await res.json();
  const sets = Array.isArray(json) ? json : (json.dataset || json.datasets || []);
  if (!sets.length) throw new Error('catalog: parsed but found no datasets. Shape may have changed; pass --csv-url to bypass.');
  console.log(`catalog: ${sets.length.toLocaleString()} datasets`);

  const hits = sets.filter(d => DATASET_TITLE.test(String(d.title || '').trim()));
  if (!hits.length) {
    const near = sets
      .filter(d => /enrollment/i.test(String(d.title || '')))
      .slice(0, 15)
      .map(d => `      - ${d.title}`);
    throw new Error(
      `enrollment: no catalog entry matched ${DATASET_TITLE}\n` +
      (near.length ? `    similar titles present:\n${near.join('\n')}\n` : '') +
      `    Pass --csv-url with a direct CSV link to bypass the catalog.`
    );
  }

  console.log(`enrollment: ${hits.length} catalog match(es)`);
  const options = [];
  for (const ds of hits) {
    for (const d of csvDistributions(ds)) {
      options.push({ dataset: ds.title, date: dateOf(d.title) || dateOf(d.url) || null, ...d });
    }
  }
  if (!options.length) {
    throw new Error(
      `enrollment: matched "${hits[0].title}" but it exposes no CSV distribution.\n` +
      `    distributions seen: ${JSON.stringify((hits[0].distribution || []).slice(0, 5))}\n` +
      `    Pass --csv-url to bypass.`
    );
  }
  // Newest publication first. Without this, selection falls through to
  // whatever order the catalog returns, which is not a real ordering.
  options.sort((a, b) => (b.date || 0) - (a.date || 0));
  for (const o of options.slice(0, 6)) {
    console.log(`    ${o.date || '????????'}  ${o.title || '(untitled)'}  ${o.url}`);
  }
  const pick = options[0];
  console.log(`enrollment: using ${pick.title} -> ${pick.url}`);
  return pick;
}

// ---------------------------------------------------------------------------

/** "*" and blank are CMS's privacy-suppression markers, not zero. */
function suppressedInt(v) {
  const s = String(v ?? '').trim();
  if (s === '' || s === '*') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n) : null;
}

async function main() {
  if (discover) {
    try { await resolve(); console.log('\ndiscover: dataset resolved'); process.exit(0); }
    catch (e) { console.error(`\n${e.message}\n`); process.exit(1); }
  }

  let csvUrl = csvUrlArg;
  if (!fileArg && !csvUrl) csvUrl = (await resolve()).url;

  console.log(`\nreading: ${fileArg || csvUrl}`);
  let header = null, at = null, n = 0;

  // BENE_GEO_LVL=County rows only, keyed by fips, one object per row kept in
  // memory. ~500k total rows across all geo levels and 13 years of history;
  // County-level rows alone are a few hundred thousand at most, well within a
  // GitHub Actions runner's default heap -- no need for the on-disk staging
  // the much larger NPPES/PUF files require.
  const byFips = new Map();
  let maxPeriod = 0; // year*12 + monthIndex, for whichever row is newest

  for await (const row of rowsFrom(fileArg, csvUrl)) {
    if (!header) {
      header = row;
      at = columnIndex(header, REQUIRED_COLS, 'enrollment');
      console.log(`  header OK: ${header.length} columns`);
      continue;
    }
    if (row.length < 2) continue;
    if (String(row[at(COL.GEO)] || '').trim() !== 'County') continue;

    const monthName = String(row[at(COL.MONTH)] || '').trim().toLowerCase();
    const monthIdx = MONTH_ORDER[monthName];
    if (!monthIdx) continue; // skips the annual "Year" aggregate row
    const year = Number(String(row[at(COL.YEAR)] || '').trim());
    if (!Number.isInteger(year)) continue;

    const fips = String(row[at(COL.FIPS)] || '').trim();
    if (!fips) continue;

    const period = year * 12 + monthIdx;
    byFips.set(fips, {
      fips,
      state: String(row[at(COL.STATE)] || '').trim(),
      county: String(row[at(COL.COUNTY)] || '').trim(),
      data_year: year,
      data_month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      total_benes: suppressedInt(row[at(COL.TOTAL)]),
      original_medicare_benes: suppressedInt(row[at(COL.ORIGINAL)]),
      ma_and_other_benes: suppressedInt(row[at(COL.MA)]),
      aged_total_benes: suppressedInt(row[at(COL.AGED)]),
      disabled_total_benes: suppressedInt(row[at(COL.DISABLED)]),
      _period: period
    });
    if (period > maxPeriod) maxPeriod = period;

    n++;
    if (n % 100000 === 0) process.stdout.write(`\r  scanned ${n.toLocaleString()} county rows`);
  }
  if (n) process.stdout.write(`\r  scanned ${n.toLocaleString()} county rows total\n`);

  if (!maxPeriod) {
    throw new Error('enrollment: found no usable County-level rows with a real month. The file layout may have changed.');
  }

  // Every fips ever seen is in the map, but only the newest period's value
  // survived each key's last write for THAT fips -- except older rows for a
  // fips that stopped appearing this month would still be in the map at their
  // old period. Filter explicitly rather than relying on overwrite order.
  const refreshedAt = new Date().toISOString();
  const records = [...byFips.values()]
    .filter(r => r._period === maxPeriod)
    .map(({ _period, ...r }) => ({ ...r, refreshed_at: refreshedAt }));

  console.log(`\nnewest period found: ${records[0].data_month} ${records[0].data_year}`);
  console.log(`counties: ${records.length.toLocaleString()}`);

  if (records.length < MIN_COUNTY_ROWS) {
    throw new Error(
      `enrollment: only ${records.length.toLocaleString()} counties for the newest period, below the ${MIN_COUNTY_ROWS.toLocaleString()} floor. ` +
      `Refusing to write -- this usually means the download was truncated or the file layout changed.`
    );
  }

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
    onConflict: 'fips', // upsert: this table holds the current month only, see the file header
    label: 'upsert'
  });
  console.log('Medicare county enrollment import complete');
}

main().catch(e => { console.error('\nMedicare enrollment import failed:', e.message); process.exit(1); });
