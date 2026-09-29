// Build the national benchmarks the market model scores against, into
// market_benchmarks (migration 021).
//
// Two kinds of row:
//
//   kind 'measure'   key = PLACES measure id (CHD, DIABETES, ...)
//                    data = { p05, p25, p50, p75, p95, n, data_year }
//                    Percentiles of the ZIP-level crude prevalence across every
//                    ZCTA PLACES publishes. Unweighted by population on purpose:
//                    the question the model asks is "how does this catchment
//                    compare with a typical US ZIP", not with a typical adult.
//
//   kind 'specialty' key = specialty label from assets/specialties.js
//                    data = { rate_per_1k, clinicians, adults }
//                    Listings nationally whose primary_taxonomy matches any of
//                    the specialty's mapTerms, per 1,000 US adults, using the
//                    same word-start match market-score.js applies locally.
//
// WHY A FULL SCAN, NOT count=exact + ilike. primary_taxonomy has no index, so
// an ilike count over ~7M rows hits the statement timeout (57014, confirmed
// on the first run). Instead every row's taxonomy is read in 1,000-row pages
// keyed on npi (the primary key / unique index on both tables, so each page
// is an index range scan), split into 20 NPI-prefix slices fetched in
// parallel, and tallied per distinct taxonomy string here.
//
// Until this has run, market-score.js falls back to the six broad groups and
// says so in every specialty's caveats and confidence.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/build-market-benchmarks.mjs [--dry-run]

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MarketModel = require('../v2/assets/market-model.js');
const SPECIALTIES = require('../v2/assets/specialties.js');

const TABLE = 'market_benchmarks';
const GEO_MEASURE = 'DENTAL';   // same measure market-score.js reads pop_18plus from
const dryRun = process.argv.includes('--dry-run');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
const H = { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` };

async function rest(path, init = {}, attempt = 1) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  if (!res.ok) {
    if (attempt < 3 && res.status >= 500) { await new Promise(r => setTimeout(r, attempt * 2000)); return rest(path, init, attempt + 1); }
    throw new Error(`${path.slice(0, 80)}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return res;
}

// Keyset on zip is safe here: (zip, measureid) is the primary key, so zip is
// unique within one measure.
async function measureRows(id) {
  const out = [];
  let last = '';
  for (;;) {
    const res = await rest(`cdc_places?measureid=eq.${id}${last ? `&zip=gt.${last}` : ''}&select=zip,value,pop_18plus,data_year&order=zip&limit=1000`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
    last = rows[rows.length - 1].zip;
  }
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return Number((sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)).toFixed(3));
}

const taxNorm = s => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const taxMatches = (stored, terms) => terms.some(t => (' ' + taxNorm(stored)).includes(' ' + taxNorm(t)));

// NPIs are 10 digits beginning 1 or 2: slices "10".."29" cover every row.
const SLICES = Array.from({ length: 20 }, (_, i) => String(10 + i));

async function tallySlice(table, prefix, tally) {
  const upper = String(Number(prefix) + 1);
  let last = null, n = 0;
  for (;;) {
    const seek = last ? `npi=gt.${last}` : `npi=gte.${prefix}`;
    const res = await rest(`${table}?select=npi,primary_taxonomy&${seek}&npi=lt.${upper}&order=npi&limit=1000`);
    const rows = await res.json();
    for (const r of rows) { const t = r.primary_taxonomy || ''; tally.set(t, (tally.get(t) || 0) + 1); }
    n += rows.length;
    if (rows.length < 1000) return n;
    last = rows[rows.length - 1].npi;
  }
}

async function tallyTable(table) {
  const tally = new Map();
  let total = 0, next = 0;
  const worker = async () => {
    // Not `total += await ...`: that reads `total` before awaiting, so
    // parallel workers overwrite each other (the first run logged 1.8M of ~9M).
    while (next < SLICES.length) { const n = await tallySlice(table, SLICES[next++], tally); total += n; }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`  ${table}: ${total.toLocaleString()} rows, ${tally.size} distinct taxonomies`);
  return { tally, total };
}

async function main() {
  const rows = [];

  // US adults, from the same PLACES population column the catchment uses.
  const geo = await measureRows(GEO_MEASURE);
  const adults = geo.reduce((s, r) => s + (Number(r.pop_18plus) || 0), 0);
  console.log(`US adults (PLACES ${GEO_MEASURE} pop_18plus): ${adults.toLocaleString()} across ${geo.length} ZCTAs`);
  if (adults < 150e6) throw new Error(`adult total ${adults} is implausibly low; PLACES import incomplete?`);

  for (const id of MarketModel.measureIds()) {
    const got = id === GEO_MEASURE ? geo : await measureRows(id);
    const vals = got.map(r => Number(r.value)).filter(v => isFinite(v)).sort((a, b) => a - b);
    if (vals.length < 1000) { console.log(`  ${id}: only ${vals.length} values, skipped`); continue; }
    const data = { p05: quantile(vals, 0.05), p25: quantile(vals, 0.25), p50: quantile(vals, 0.5),
      p75: quantile(vals, 0.75), p95: quantile(vals, 0.95), n: vals.length, data_year: got[0].data_year || null };
    console.log(`  ${id}: p05 ${data.p05}  p50 ${data.p50}  p95 ${data.p95}  (n ${data.n})`);
    rows.push({ kind: 'measure', key: id, data });
  }

  console.log('\nReading every listing\'s taxonomy (this takes a few minutes)');
  const clinics = await tallyTable('clinics');
  const individuals = await tallyTable('provider_individuals');
  if (clinics.total + individuals.total < 5e6) throw new Error('fewer than 5M listings read; NPPES load incomplete?');
  const merged = new Map(clinics.tally);
  for (const [t, n] of individuals.tally) merged.set(t, (merged.get(t) || 0) + n);

  for (const [label, mapTerms] of SPECIALTIES) {
    const terms = mapTerms.split(',').map(s => s.trim()).filter(Boolean);
    let clinicians = 0;
    for (const [t, n] of merged) if (taxMatches(t, terms)) clinicians += n;
    const data = { rate_per_1k: Number(((clinicians / adults) * 1000).toFixed(4)), clinicians, adults };
    console.log(`  ${label}: ${clinicians.toLocaleString()} listings, ${data.rate_per_1k}/1k`);
    if (clinicians > 0) rows.push({ kind: 'specialty', key: label, data });
  }

  console.log(`\n${rows.length} benchmark rows`);
  if (dryRun) { console.log('dry run, nothing written'); return; }
  const stamped = rows.map(r => ({ ...r, refreshed_at: new Date().toISOString() }));
  await rest(`${TABLE}?on_conflict=kind,key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(stamped)
  });
  console.log('written');
}

main().catch(e => { console.error(e); process.exit(1); });
