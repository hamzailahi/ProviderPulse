// Train the learned demand model (v2/assets/demand-model.js) and store one row
// per specialty in market_benchmarks, kind 'demand_model' (migration 025).
//
// LABEL. CMS "Medicare Physician & Other Practitioners - by Provider": one row
// per clinician with Tot_Benes (distinct Medicare fee-for-service patients) and
// the practice ZIP. Each clinician's specialty comes from OUR provider tables
// by NPI, matched with the same word-start rule market-score.js uses, so the
// model's specialties are exactly the 33 the product shows. Each ZIP is placed
// in the county holding most of its residents (HUD crosswalk). The label is
// patients per 1,000 traditional Medicare enrollees in the county
// (medicare_county_enrollment.original_medicare_benes): the claims file only
// covers traditional Medicare, so Medicare Advantage enrollees must not be in
// the denominator.
//
// INPUTS. County aggregates of census_acs_zcta and cdc_places, built with the
// same helpers market-score.js uses for a catchment (DemandModel.addAcs /
// addPlaces), weighted by the crosswalk's residential ratio. Each training row
// is a county POOLED with every county within 25 miles (label and inputs
// alike), because claims are counted where the doctor practises and patients
// travel to hubs. Supply (clinicians per enrollee) and urbanity (people within
// reach) are fitted as controls and held at average when scoring; see
// assets/demand-model.js for why the first, unpooled run was not usable.
//
// HONESTY CHECKS. Cross-validation holds out whole states. A specialty whose
// held-out R^2 is below DemandModel.MIN_R2 is stored as unusable, with the
// reason, and the market model keeps its hand-weighted need factor for it.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/train-demand-model.mjs [--dry-run] [--puf-url <csv>] [--puf-file <path>]

import { createRequire } from 'node:module';
import { fetchCsvRows, fileCsvRows, columnIndex, cleanNpi, cleanInt } from './lib/bulk.mjs';
import { resolve } from './lib/cms-catalog.mjs';
const require = createRequire(import.meta.url);
const DemandModel = require('../v2/assets/demand-model.js');
const MarketModel = require('../v2/assets/market-model.js');
const SPECIALTIES = require('../v2/assets/specialties.js').MARKET;   // the market side's frozen list until phase 3b

const args = process.argv.slice(2);
const opt = (n, d = null) => (args.indexOf(n) !== -1 ? args[args.indexOf(n) + 1] : d);
const dryRun = args.includes('--dry-run');
const pufUrlArg = opt('--puf-url'), pufFile = opt('--puf-file');

const PUF_TITLE = /medicare physician .* practitioners\s*[-–]\s*by provider$/i;
const MIN_PUF_NPIS = Number(process.env.MIN_PUF_NPIS) || 500000;
const MIN_ENROLLEES = 500;            // smaller areas are too noisy to learn from
const RADIUS = 25;                    // miles; the same reach market-score scores a catchment over
const GEO_MEASURE = 'DENTAL';         // the PLACES measure whose rows carry ZIP centroids
const miles = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

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

// Keyset paging on a unique column.
async function pageAll(table, select, key, extra = '') {
  const out = [];
  let last = null;
  for (;;) {
    const res = await rest(`${table}?select=${select}${extra}${last != null ? `&${key}=gt.${encodeURIComponent(last)}` : ''}&order=${key}&limit=1000`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
    last = rows[rows.length - 1][key];
  }
}

const taxNorm = s => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const taxMatches = (stored, terms) => terms.some(t => (' ' + taxNorm(stored)).includes(' ' + taxNorm(t)));

// ---- 1. the claims file -----------------------------------------------------
async function readPuf() {
  let url = pufUrlArg;
  if (!pufFile && !url) url = (await resolve(PUF_TITLE, 'PUF')).url;
  console.log(`PUF: reading ${pufFile || url}`);
  const out = new Map();
  let header = null, at = null, n = 0;
  for await (const row of (pufFile ? fileCsvRows(pufFile) : fetchCsvRows(url, 'PUF'))) {
    if (!header) { header = row; at = columnIndex(header, ['Rndrng_NPI', 'Rndrng_Prvdr_Zip5', 'Tot_Benes'], 'PUF'); continue; }
    if (row.length < 3) continue;
    const npi = cleanNpi(row[at('Rndrng_NPI')]);
    const zip = String(row[at('Rndrng_Prvdr_Zip5')] || '').trim().slice(0, 5).padStart(5, '0');
    const benes = cleanInt(row[at('Tot_Benes')]);
    if (!npi || !/^\d{5}$/.test(zip) || benes == null) continue;
    out.set(npi, { zip, benes });
    if (++n % 250000 === 0) process.stdout.write(`\r  ${n.toLocaleString()} clinicians`);
  }
  console.log(`\r  ${out.size.toLocaleString()} clinicians with patients and a ZIP`);
  if (out.size < MIN_PUF_NPIS) throw new Error(`only ${out.size} clinicians parsed (floor ${MIN_PUF_NPIS}); refusing to train`);
  return out;
}

// ---- 2. each clinician's specialty, from our own tables ----------------------
const SLICES = Array.from({ length: 20 }, (_, i) => String(10 + i));
async function taxonomies(puf) {
  const tax = new Map();
  let next = 0;
  const worker = async () => {
    while (next < SLICES.length) {
      const prefix = SLICES[next++], upper = String(Number(prefix) + 1);
      let last = null;
      for (;;) {
        const seek = last ? `npi=gt.${last}` : `npi=gte.${prefix}`;
        const rows = await (await rest(`provider_individuals?select=npi,primary_taxonomy&${seek}&npi=lt.${upper}&order=npi&limit=1000`)).json();
        for (const r of rows) if (puf.has(String(r.npi))) tax.set(String(r.npi), r.primary_taxonomy || '');
        if (rows.length < 1000) break;
        last = rows[rows.length - 1].npi;
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`  ${tax.size.toLocaleString()} of them found in provider_individuals`);
  return tax;
}

async function main() {
  const puf = await readPuf();
  const tax = await taxonomies(puf);

  // ---- 3. geography: ZIP -> county, county enrollees --------------------------
  const xw = await pageAll('zip_county_crosswalk', 'id,zip,fips,state,res_ratio', 'id');
  const zipCounties = new Map(), mainCounty = new Map(), stateOf = new Map();
  for (const r of xw) {
    const z = String(r.zip).padStart(5, '0'), ratio = Number(r.res_ratio) || 0;
    if (!zipCounties.has(z)) zipCounties.set(z, []);
    zipCounties.get(z).push({ fips: r.fips, ratio });
    const cur = mainCounty.get(z);
    if (!cur || ratio > cur.ratio) mainCounty.set(z, { fips: r.fips, ratio });
    stateOf.set(r.fips, r.state);
  }
  const enroll = new Map();
  for (const r of await pageAll('medicare_county_enrollment', 'fips,state,original_medicare_benes', 'fips')) {
    const v = Number(r.original_medicare_benes);
    if (v > 0) enroll.set(r.fips, v);
    if (!stateOf.has(r.fips)) stateOf.set(r.fips, r.state);
  }
  console.log(`geography: ${zipCounties.size.toLocaleString()} ZIPs in the crosswalk, ${enroll.size.toLocaleString()} counties with FFS enrollees`);

  // ---- 4. county areas from ACS and PLACES --------------------------------------
  const areas = new Map();
  const area = f => { if (!areas.has(f)) areas.set(f, {}); return areas.get(f); };
  const acs = await pageAll('census_acs_zcta', 'zip,pop_total,households,median_hh_income,poverty_universe,poverty_below,age_male,age_female,ins_universe,ins_uninsured,ins_medicaid,education', 'zip');
  for (const r of acs) for (const c of zipCounties.get(String(r.zip).padStart(5, '0')) || []) DemandModel.addAcs(area(c.fips), r, c.ratio);
  // Only measures with data: the PLACES import has no KIDNEY rows, and a
  // measure with no data used to drop every county of the specialties using it.
  const measures = [], centroid = new Map();
  for (const m of MarketModel.measureIds()) {
    const rows = await pageAll('cdc_places', m === GEO_MEASURE ? 'zip,value,pop_18plus,lat,lon' : 'zip,value,pop_18plus', 'zip', `&measureid=eq.${m}`);
    if (rows.length) measures.push(m);
    for (const r of rows) for (const c of zipCounties.get(String(r.zip).padStart(5, '0')) || []) {
      DemandModel.addPlaces(area(c.fips), m, r.value, r.pop_18plus, c.ratio);
      // County centre: adult-weighted mean of its ZIP centroids.
      const w = (Number(r.pop_18plus) || 0) * c.ratio;
      if (m === GEO_MEASURE && w > 0 && r.lat != null && r.lon != null) {
        const k = centroid.get(c.fips) || { w: 0, lat: 0, lon: 0 };
        k.w += w; k.lat += Number(r.lat) * w; k.lon += Number(r.lon) * w; centroid.set(c.fips, k);
      }
    }
  }
  const skipped = MarketModel.measureIds().filter(m => !measures.includes(m));
  console.log(`inputs: ${acs.length.toLocaleString()} ACS ZIPs and ${measures.length} PLACES measures folded into ${areas.size.toLocaleString()} counties` +
    (skipped.length ? ` (no data for ${skipped.join(', ')}, left out)` : ''));

  // Training areas: each county plus every county whose centre is within
  // RADIUS miles, so patients travelling to a nearby hub mostly stay inside.
  const centres = [...centroid.entries()].map(([f, k]) => ({ fips: f, lat: k.lat / k.w, lon: k.lon / k.w }));
  const near = new Map();
  for (const a of centres) near.set(a.fips, centres.filter(b => miles(a.lat, a.lon, b.lat, b.lon) <= RADIUS).map(b => b.fips));
  const avg = [...near.values()].reduce((t, v) => t + v.length, 0) / Math.max(1, near.size);
  console.log(`areas: ${near.size.toLocaleString()} counties with a centre, ${avg.toFixed(1)} counties within ${RADIUS} miles on average`);
  const pooledArea = new Map(), pooledEnroll = new Map();
  for (const [fips, members] of near) {
    const pooled = {};
    let e = 0;
    for (const f of members) { DemandModel.mergeArea(pooled, areas.get(f)); e += enroll.get(f) || 0; }
    pooledArea.set(fips, pooled); pooledEnroll.set(fips, e);
  }

  // ---- 5. labels per specialty per county ----------------------------------------
  const patients = new Map(), clinicians = new Map();     // label -> fips -> n
  let placed = 0;
  for (const [npi, p] of puf) {
    const t = tax.get(npi);
    const county = mainCounty.get(p.zip);
    if (t == null || !county) continue;
    placed++;
    for (const [label, mapTerms] of SPECIALTIES) {
      if (!taxMatches(t, mapTerms.split(',').map(s => s.trim()).filter(Boolean))) continue;
      if (!patients.has(label)) { patients.set(label, new Map()); clinicians.set(label, new Map()); }
      patients.get(label).set(county.fips, (patients.get(label).get(county.fips) || 0) + p.benes);
      clinicians.get(label).set(county.fips, (clinicians.get(label).get(county.fips) || 0) + 1);
    }
  }
  console.log(`labels: ${placed.toLocaleString()} clinicians placed in a county with a specialty\n`);

  // ---- 6. train ----------------------------------------------------------------
  const out = [];
  for (const [label] of SPECIALTIES) {
    const prof = MarketModel.PROFILES[label] || { m: [] };
    const ms = prof.m.map(x => x[0]).filter(m => measures.includes(m));
    // A specialty's own condition measures must push demand the way the
    // profile says (inverted measures, like missed checkups, the other way).
    const expect = {};
    prof.m.forEach(x => { if (ms.includes(x[0])) expect['m_' + x[0]] = x[2] ? -1 : 1; });
    const pts = patients.get(label) || new Map(), cls = clinicians.get(label) || new Map();
    const rows = [];
    for (const [fips, members] of near) {
      let p = 0, c = 0;
      for (const f of members) { p += pts.get(f) || 0; c += cls.get(f) || 0; }
      const pooled = pooledArea.get(fips), e = pooledEnroll.get(fips);
      if (e < MIN_ENROLLEES || c === 0) continue;     // nobody to see patients is supply, not need
      const x = DemandModel.features(pooled, ms);
      x.c_supply = Math.log1p((c / e) * 1000);         // clinicians per 1,000 enrollees within reach
      x.c_logpop = pooled.pop > 0 ? Math.log(pooled.pop) : null;   // urbanity: people within reach
      rows.push({ group: stateOf.get(fips) || '??', x, y: (p / e) * 1000 });
    }
    const m = DemandModel.train(label, rows, ms, { controls: ['c_supply', 'c_logpop'], expect });
    const top = m.coef ? m.features.map((f, j) => [f, m.coef[j]]).filter(([f]) => !f.startsWith('c_'))
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3).map(([f, c]) => `${f} ${c >= 0 ? '+' : ''}${c.toFixed(2)}`).join(', ') : '';
    const scores = m.r2_cv != null ? `, held-out R2 ${m.r2_cv} (supply and urbanity alone ${m.r2_controls_only}, demand adds ${m.r2_gain})` : '';
    console.log(`  ${m.usable ? 'USE ' : 'skip'} ${label}: n ${m.n}${scores}${m.reason ? ` [${m.reason}]` : ''}${top ? `; strongest demand inputs: ${top}` : ''}`);
    out.push({ kind: 'demand_model', key: label, data: m });
  }
  const usable = out.filter(r => r.data.usable).length;
  console.log(`\n${usable} of ${out.length} specialties usable`);

  if (dryRun) { console.log('dry run, nothing written'); return; }
  const stamped = out.map(r => ({ ...r, refreshed_at: new Date().toISOString() }));
  await rest('market_benchmarks?on_conflict=kind,key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(stamped)
  });
  console.log('written');
}

main().catch(e => { console.error(e); process.exit(1); });
