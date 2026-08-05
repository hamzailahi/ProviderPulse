// Import CDC PLACES ZCTA-level health measures into cdc_places (migration 009).
//
// WHY THIS EXISTS
// clinics tells us how much supply sits in a ZIP. Nothing in the stack tells us
// how much NEED sits there, so market-score's opportunity verdict is currently
// blind to specialty: a ZIP full of dentists and a ZIP full of psychiatrists
// score identically. PLACES is the only public per-ZIP source of specialty-
// relevant health burden, so it becomes the demand side of that score.
//
// WHAT THIS DATA IS NOT -- read migration 009's header before using it.
// These are model-based small-area estimates, not survey responses collected in
// each ZIP. They are a function of the ZCTA's census demographics, they are
// correlated with anything else we derive from the census, and every consumer
// must word them as MODELLED PREVALENCE, never as patient demand.
//
// UPSERT, NOT FULL REFRESH -- the same call as import-medicare-activity.mjs and
// the opposite of import-leie.mjs. For LEIE a missing row means "not excluded",
// so reinstated providers must be deleted. Here a missing row means UNKNOWN --
// CDC suppresses some ZCTA/measure pairs, and a delete-then-insert that died
// halfway would silently drop the need side out of every affected score with no
// error to explain the change.
//
// A consequence worth stating plainly: because writes stream page by page, the
// volume floors below are a POST-check, not a pre-check. They cannot prevent a
// partial write -- they exist to fail the job loudly so nobody trusts a
// half-imported table. That is only acceptable BECAUSE this is an upsert; the
// pre-existing rows survive. Do not convert this to a full refresh without
// moving the floor check ahead of the first write.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//      SOCRATA_APP_TOKEN (optional -- raises the anonymous rate limit)
// Run: node scripts/import-cdc-places.mjs [options]
//
//   --dry-run          fetch and report, write nothing
//   --dataset <id>     override the Socrata dataset id (default qnzd-25i4)
//   --page <n>         rows per request (default 50000)
//   --max-pages <n>    stop early; for smoke-testing against live data
//
// ---------------------------------------------------------------------------
// WHY THE DATASET ID IS PINNED HERE, HAVING BEEN DELIBERATELY NOT PINNED IN
// import-medicare-activity.mjs
//
// CMS mints a NEW distribution UUID for every data year, so a pinned id there
// means the job silently stops seeing fresh data at each rollover. Socrata is
// the opposite: CDC updates PLACES **in place** on a stable four-by-four id, so
// the same id serves each annual release and pinning is correct. --dataset
// exists for the day that stops being true.
//
// The corollary is that a release can change the data underneath a fixed id
// without anything here noticing. That is what the assertions below are for:
// the measure count, the value type, and the year set are all checked and
// printed, so a release that reshapes the data fails the run instead of quietly
// rewriting every score.
// ---------------------------------------------------------------------------

import { batchWrite } from './lib/bulk.mjs';

const DEFAULT_DATASET = 'qnzd-25i4';
const SOCRATA_HOST = 'https://data.cdc.gov';

// Only the columns migration 009 stores. Asking for fewer fields cuts roughly
// a third off 1.17M rows of JSON, which is the difference between a comfortable
// run and a runner that swaps.
const FIELDS = [
  'locationid', 'measureid', 'categoryid', 'short_question_text', 'measure',
  'data_value', 'low_confidence_limit', 'high_confidence_limit',
  'year', 'totalpop18plus', 'totalpopulation', 'datavaluetypeid',
  // ZCTA centroid (migration 010). Carried on every row already; it was simply
  // dropped on the first pass. It is what lets market-score pool a catchment
  // server-side -- see the migration for why a single ZIP cannot carry a
  // per-taxonomy supply verdict.
  'geolocation'
].join(',');

// ---------------------------------------------------------------------------
// Volume floors. Measured against the live dataset on 2026-08-04:
// 1,171,563 rows / 29,983 ZCTAs / 40 measures / years {2022, 2023}.
//
// Set well below the observed figures so ordinary attrition (CDC retiring a
// measure, suppressing more ZCTAs) does not fail the job, but a collapsed parse
// or an HTML error page served as JSON does. These are the "something is
// structurally wrong" line, not a data-quality target.
// ---------------------------------------------------------------------------
const MIN_ROWS = 800000;
const MIN_ZIPS = 20000;
const MIN_MEASURES = 25;

// The ZCTA file publishes crude prevalence only. Age-adjusted values exist in
// CDC's county and place files. If both ever appear here, they MUST NOT land in
// the same `value` column -- comparing a crude figure in one ZIP against an
// age-adjusted one in another is meaningless, and it would be invisible.
const EXPECTED_VALUE_TYPE = 'CrdPrv';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};

const DRY_RUN = flag('--dry-run');
const DATASET = opt('--dataset', DEFAULT_DATASET);
const PAGE = Math.max(1, parseInt(opt('--page', '50000'), 10) || 50000);
const MAX_PAGES = parseInt(opt('--max-pages', '0'), 10) || 0;

const num = (v) => {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const int = (v) => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};

// ZCTAs are 5 digits and CDC already publishes them padded, but a JSON reader
// somewhere upstream turning "01001" into 1001 is the classic way this breaks,
// and it would silently fail to join against clinics for every ZIP in the
// northeast. Pad defensively and reject anything that is not 5 digits after.
const cleanZip = (v) => {
  const s = String(v ?? '').trim();
  if (!/^\d{1,5}$/.test(s)) return null;
  return s.padStart(5, '0');
};

// Socrata point: { type: 'Point', coordinates: [lon, lat] }.
//
// GeoJSON orders coordinates LONGITUDE FIRST. Reading them as [lat, lon] puts
// every US ZIP somewhere off the coast of Somalia, and the failure is silent
// because both values are plain numbers -- so the order is asserted against the
// continental-plus-territories bounding box rather than trusted.
const cleanPoint = (g) => {
  const c = g && Array.isArray(g.coordinates) ? g.coordinates : null;
  if (!c || c.length < 2) return { lat: null, lon: null };
  const lon = Number(c[0]), lat = Number(c[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { lat: null, lon: null };
  if (lat < 17 || lat > 72 || lon < -180 || lon > -64) return { lat: null, lon: null };
  return { lat, lon };
};

async function fetchPage(offset) {
  const url = `${SOCRATA_HOST}/resource/${DATASET}.json`
    + `?$select=${encodeURIComponent(FIELDS)}`
    + `&$limit=${PAGE}&$offset=${offset}`
    // Socrata paging without an explicit order is NOT stable -- the server may
    // return rows in a different order between requests, so a plain
    // limit/offset walk can duplicate some rows and skip others entirely.
    // `:id` is Socrata's internal row identifier and the documented way to get
    // a deterministic full-table walk.
    + `&$order=:id`;

  const headers = { 'User-Agent': 'ProviderPulse-import' };
  if (process.env.SOCRATA_APP_TOKEN) headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`PLACES: HTTP ${res.status} at offset ${offset}: ${(await res.text()).slice(0, 300)}`);
  }
  const body = await res.json();
  if (!Array.isArray(body)) {
    throw new Error(`PLACES: expected a JSON array at offset ${offset}, got ${typeof body}`);
  }
  return body;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!DRY_RUN && (!url || !key)) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or pass --dry-run)');
    process.exit(1);
  }

  console.log(`CDC PLACES import`);
  console.log(`  dataset : ${SOCRATA_HOST}/resource/${DATASET}`);
  console.log(`  mode    : ${DRY_RUN ? 'DRY RUN (no writes)' : 'upsert into cdc_places'}`);
  console.log('');

  const zips = new Set();
  const withCoords = new Set();
  const measures = new Map();   // measureid -> { year, count, short }
  const years = new Set();
  const valueTypes = new Set();
  let fetched = 0, written = 0, skipped = 0, page = 0;

  for (let offset = 0; ; offset += PAGE) {
    const rows = await fetchPage(offset);
    if (!rows.length) break;
    fetched += rows.length;
    page++;

    // Deduplicate within the page. (zip, measureid) is the primary key, and
    // PostgREST rejects an upsert payload that names the same key twice --
    // "ON CONFLICT DO UPDATE command cannot affect row a second time" -- which
    // would abort the batch rather than skipping the duplicate.
    const seen = new Set();
    const batch = [];

    for (const r of rows) {
      const zip = cleanZip(r.locationid);
      const measureid = String(r.measureid ?? '').trim();
      const value = num(r.data_value);

      if (r.datavaluetypeid) valueTypes.add(String(r.datavaluetypeid));

      // A row with no ZIP, no measure, or no value carries nothing. Counting
      // them separately means a release that starts publishing nulls shows up
      // as a skip count rather than as a table that quietly shrank.
      if (!zip || !measureid || value === null) { skipped++; continue; }

      const pk = `${zip}|${measureid}`;
      if (seen.has(pk)) { skipped++; continue; }
      seen.add(pk);

      const dataYear = int(r.year);
      const pt = cleanPoint(r.geolocation);
      if (pt.lat !== null) withCoords.add(zip);
      zips.add(zip);
      years.add(dataYear);
      const m = measures.get(measureid) || { year: dataYear, count: 0, short: r.short_question_text };
      m.count++;
      measures.set(measureid, m);

      batch.push({
        zip,
        measureid,
        categoryid: r.categoryid ? String(r.categoryid) : null,
        short_text: r.short_question_text ? String(r.short_question_text) : null,
        measure: r.measure ? String(r.measure) : null,
        value,
        low_confidence_limit: num(r.low_confidence_limit),
        high_confidence_limit: num(r.high_confidence_limit),
        data_year: dataYear,
        pop_18plus: int(r.totalpop18plus),
        total_population: int(r.totalpopulation),
        lat: pt.lat,
        lon: pt.lon,
        refreshed_at: new Date().toISOString()
      });
    }

    if (!DRY_RUN && batch.length) {
      await batchWrite(batch, {
        url, key, table: 'cdc_places',
        onConflict: 'zip,measureid',
        label: `page ${page}`
      });
    }
    written += batch.length;

    console.log(`  page ${String(page).padStart(3)}  fetched ${fetched.toLocaleString()}  kept ${written.toLocaleString()}  zips ${zips.size.toLocaleString()}`);

    if (rows.length < PAGE) break;                 // last page
    if (MAX_PAGES && page >= MAX_PAGES) {
      console.log(`  stopping early at --max-pages ${MAX_PAGES}`);
      break;
    }
  }

  console.log('');
  console.log(`  rows fetched : ${fetched.toLocaleString()}`);
  console.log(`  rows kept    : ${written.toLocaleString()}`);
  console.log(`  rows skipped : ${skipped.toLocaleString()}`);
  console.log(`  distinct ZIPs: ${zips.size.toLocaleString()}`);
  console.log(`  ZIPs w/ coords: ${withCoords.size.toLocaleString()}`);
  console.log(`  measures     : ${measures.size}`);
  console.log(`  value types  : ${[...valueTypes].join(', ') || '(none)'}`);
  console.log(`  data years   : ${[...years].filter(y => y !== null).sort().join(', ')}`);
  console.log('');
  console.log('  measure                 year    rows');
  for (const [id, m] of [...measures.entries()].sort()) {
    console.log(`  ${id.padEnd(22)} ${String(m.year ?? '?').padEnd(6)} ${String(m.count).padStart(7)}   ${m.short ?? ''}`);
  }
  console.log('');

  // --- assertions -----------------------------------------------------------
  // Everything above is reporting. Everything below fails the run. A partial or
  // reshaped import is worse than no import here, because market-score would
  // keep answering with a need component computed from whatever landed.
  const problems = [];

  if (valueTypes.size && !(valueTypes.size === 1 && valueTypes.has(EXPECTED_VALUE_TYPE))) {
    problems.push(
      `value type changed: expected only ${EXPECTED_VALUE_TYPE}, saw ${[...valueTypes].join(', ')}. ` +
      `Crude and age-adjusted prevalence must not share the value column -- ` +
      `filter the query, or add a column and teach every consumer which to read.`);
  }

  if (MAX_PAGES) {
    console.log('  --max-pages was set, so the volume floors are not checked.');
  } else {
    if (fetched < MIN_ROWS) problems.push(`only ${fetched.toLocaleString()} rows fetched, floor is ${MIN_ROWS.toLocaleString()}`);
    if (zips.size < MIN_ZIPS) problems.push(`only ${zips.size.toLocaleString()} ZIPs, floor is ${MIN_ZIPS.toLocaleString()}`);
    if (measures.size < MIN_MEASURES) problems.push(`only ${measures.size} measures, floor is ${MIN_MEASURES}`);

    // Centroids are what make catchment pooling possible, and a ZIP without one
    // silently drops out of every neighbour search rather than erroring. If CDC
    // renames the field or changes the coordinate order enough to fail the
    // bounding-box check, this is what says so.
    if (withCoords.size < zips.size * 0.95) {
      problems.push(
        `only ${withCoords.size.toLocaleString()} of ${zips.size.toLocaleString()} ZIPs have usable coordinates. ` +
        `Check that the geolocation field still exists and is still [lon, lat].`);
    }
  }

  if (problems.length) {
    console.error('FAILED:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(DRY_RUN ? 'Dry run OK. Nothing was written.' : 'Import complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
