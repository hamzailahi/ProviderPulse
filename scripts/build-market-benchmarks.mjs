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
//                    Listings nationally whose primary_taxonomy contains any of
//                    the specialty's mapTerms, per 1,000 US adults. ilike is a
//                    substring match where the live code matches at a word
//                    start; on these taxonomy strings the two agree, and the
//                    count is a rate denominator, not a listing.
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

async function countWhere(table, terms) {
  const or = terms.map(t => `primary_taxonomy.ilike."*${t.replace(/"/g, '')}*"`).join(',');
  const res = await rest(`${table}?select=npi&or=(${encodeURIComponent(or)})&limit=1`,
    { headers: { Prefer: 'count=exact', Range: '0-0' } });
  const total = Number((res.headers.get('content-range') || '').split('/')[1]);
  if (!isFinite(total)) throw new Error(`${table}: no count in Content-Range`);
  return total;
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

  for (const [label, mapTerms] of SPECIALTIES) {
    const terms = mapTerms.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const [c, i] = await Promise.all([countWhere('clinics', terms), countWhere('provider_individuals', terms)]);
      const clinicians = c + i;
      const data = { rate_per_1k: Number(((clinicians / adults) * 1000).toFixed(4)), clinicians, adults };
      console.log(`  ${label}: ${clinicians.toLocaleString()} listings, ${data.rate_per_1k}/1k`);
      if (clinicians > 0) rows.push({ kind: 'specialty', key: label, data });
    } catch (e) {
      // One slow count must not sink the rest; that specialty falls back.
      console.log(`  ${label}: count failed (${e.message}), left out`);
    }
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
