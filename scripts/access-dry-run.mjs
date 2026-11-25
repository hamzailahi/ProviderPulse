// E2SFCA access dry run (read only): compares the current crude access ratio
// with drive-time E2SFCA access for every ZIP in the focus area, per scored
// specialty. See scripts/lib/e2sfca.mjs for the method and its sources.
//
//   node scripts/access-dry-run.mjs --zips zips.csv --supply supply.csv \
//     --bench bench.csv --osrm http://127.0.0.1:5000 --focus 370-385 \
//     --label Tennessee --report out.md --csv out.csv
//
// zips.csv   zip,lat,lon,adults        every ZIP in the region (focus + border strip)
// supply.csv zip,taxonomy_code,n       listings per ZIP and code (both tables)
// bench.csv  key,rate_per_1k           national specialty rates (market_benchmarks)
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { e2sfca, e2sfcaMulti, crudeRatio, accessFactor, catchmentFor, milesBetween, spearman } from './lib/e2sfca.mjs';
const require = createRequire(import.meta.url);
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const { SCORED } = require('../v2/assets/specialties.js');

const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const csv = p => readFileSync(p, 'utf8').trim().split('\n').slice(1).map(l => l.split(','));

const zips = csv(arg('zips')).map(([zip, lat, lon, adults]) => ({ zip, lat: +lat, lon: +lon, adults: +adults || 0 }))
  .filter(z => /^\d{5}$/.test(z.zip) && Number.isFinite(z.lat) && Number.isFinite(z.lon));
const idx = new Map(zips.map((z, i) => [z.zip, i]));
// ZIP3 ranges, comma separated: "300-319,398-399" (a state can own several).
const ranges = arg('focus').split(',').map(r => { const [a, b] = r.trim().split('-').map(Number); return [a, Number.isFinite(b) ? b : a]; });
const inFocus = z => { const p = +z.zip.slice(0, 3); return ranges.some(([a, b]) => p >= a && p <= b); };
const focus = zips.filter(inFocus);
console.log(`region ZIPs ${zips.length}, focus ZIPs ${focus.length}`);
if (focus.length < 15) throw new Error('too few focus ZIPs: ' + focus.length);

// ---- drive-time matrix (minutes), OSRM table service in chunks
const N = zips.length, T = new Float32Array(N * N).fill(NaN);
const osrm = arg('osrm'), SRC = 100, DST = 400;
let failed = 0;
for (let s = 0; s < N; s += SRC) {
  for (let d = 0; d < N; d += DST) {
    const src = zips.slice(s, s + SRC), dst = zips.slice(d, d + DST);
    const coords = src.concat(dst).map(z => `${z.lon.toFixed(5)},${z.lat.toFixed(5)}`).join(';');
    const url = `${osrm}/table/v1/driving/${coords}?sources=${src.map((_, i) => i).join(';')}&destinations=${dst.map((_, i) => src.length + i).join(';')}&annotations=duration`;
    let body = null;
    for (let t = 0; t < 3 && !body; t++) {
      try { const r = await fetch(url); const b = await r.json(); if (b.code === 'Ok') body = b; } catch (e) { /* retry */ }
    }
    if (!body) { failed++; continue; }
    body.durations.forEach((row, a) => row.forEach((sec, b) => { if (sec != null) T[(s + a) * N + d + b] = sec / 60; }));
  }
  if ((s / SRC) % 5 === 0) console.log(`  routed ${Math.min(s + SRC, N)} of ${N} origins`);
}
if (failed) throw new Error(`${failed} table requests failed; not reporting a partial matrix`);

// ---- routing sanity check (2026-11-17, the user's go-ahead after the first
// Tennessee run showed a few ZIPs, e.g. 37218, jumping 60 to 100 points in
// nearly every specialty). A ZIP centre that OSRM snaps onto a road cut off
// from the network (a riverfront, park or private road) makes every drive
// from it look long. Per ZIP: the median drive minutes per straight-line mile
// to its 12 nearest ZIPs; flagged when over FLAG_X times the regional median,
// or when under half of those neighbours are reachable. A flagged ZIP is
// re-anchored: points on a small grid around its centre (up to about 2.5 km)
// are snapped to roads, each is routed to the same neighbours, and the best
// one replaces the centre if it is clearly better; its whole row and column
// are then routed again. A ZIP still implausible afterwards is reported and
// left out of the rank comparison (its result is shown as unreliable).
const FLAG_X = 2.5, K = 12;
const near12 = zips.map((z, i) => zips.map((y, j) => [j, milesBetween(z, y)]).filter(([j, m]) => j !== i && m > 0.5).sort((a, b) => a[1] - b[1]).slice(0, K));
const detour = i => {
  const rs = [], nb = near12[i]; let ok = 0;
  for (const [j, m] of nb) { const t = T[i * N + j], u = T[j * N + i]; if (Number.isFinite(t) && Number.isFinite(u)) { ok++; rs.push(Math.max(t, u) / m); } }
  rs.sort((a, b) => a - b);
  return { med: rs.length ? rs[rs.length >> 1] : Infinity, reach: nb.length ? ok / nb.length : 0 };
};
let D = zips.map((_, i) => detour(i));
const gmed = (() => { const v = D.map(d => d.med).filter(Number.isFinite).sort((a, b) => a - b); return v[v.length >> 1]; })();
const isBad = d => !(d.med <= FLAG_X * gmed) || d.reach < 0.5;
const flagged = zips.map((z, i) => i).filter(i => isBad(D[i]));
console.log(`regional median ${gmed.toFixed(2)} drive min per mile; ${flagged.length} ZIPs flagged`);
const getJson = async url => { for (let t = 0; t < 3; t++) { try { const r = await fetch(url); const b = await r.json(); if (b.code === 'Ok') return b; } catch (e) { /* retry */ } } return null; };
const fixes = [];
for (const i of flagged) {
  const z = zips[i], before = D[i];
  const cands = new Map();
  for (const dy of [-0.02, -0.01, 0, 0.01, 0.02]) for (const dx of [-0.02, -0.01, 0, 0.01, 0.02]) {
    const b = await getJson(`${osrm}/nearest/v1/driving/${(z.lon + dx).toFixed(5)},${(z.lat + dy).toFixed(5)}?number=2`);
    for (const w of (b && b.waypoints) || []) cands.set(w.location.join(','), w.location);
  }
  const C = [...cands.values()], nb = near12[i].map(([j]) => zips[j]);
  if (!C.length || !nb.length) { fixes.push({ zip: z.zip, before, after: before, moved: false }); continue; }
  const coords = C.map(c => c.join(',')).concat(nb.map(y => `${y.lon},${y.lat}`)).join(';');
  const tb = await getJson(`${osrm}/table/v1/driving/${coords}?sources=${C.map((_, k) => k).join(';')}&destinations=${nb.map((_, k) => C.length + k).join(';')}&annotations=duration`);
  let best = null;
  if (tb) C.forEach((c, k) => {
    const rs = []; tb.durations[k].forEach((sec, q) => { if (sec != null) rs.push(sec / 60 / near12[i][q][1]); });
    rs.sort((a, b) => a - b);
    const med = rs.length ? rs[rs.length >> 1] : Infinity, reach = rs.length / nb.length;
    if (reach >= 0.5 && (!best || med < best.med)) best = { c, med, reach };
  });
  if (!best || !(best.med < before.med * 0.8 || before.reach < 0.5)) { fixes.push({ zip: z.zip, before, after: before, moved: false }); continue; }
  // Re-route the ZIP's whole row and column from the new anchor.
  const anchor = `${best.c[0]},${best.c[1]}`;
  for (let d = 0; d < N; d += DST) {
    const dst = zips.slice(d, d + DST);
    const b = await getJson(`${osrm}/table/v1/driving/${anchor};${dst.map(y => `${y.lon},${y.lat}`).join(';')}?sources=0&destinations=${dst.map((_, k) => k + 1).join(';')}&annotations=duration`);
    if (!b) throw new Error('re-anchor routing failed for ' + z.zip);
    b.durations[0].forEach((sec, k) => { T[i * N + d + k] = sec == null ? NaN : sec / 60; });
    const c = await getJson(`${osrm}/table/v1/driving/${dst.map(y => `${y.lon},${y.lat}`).join(';')};${anchor}?sources=${dst.map((_, k) => k).join(';')}&destinations=${dst.length}&annotations=duration`);
    if (!c) throw new Error('re-anchor routing failed for ' + z.zip);
    c.durations.forEach((row, k) => { T[(d + k) * N + i] = row[0] == null ? NaN : row[0] / 60; });
  }
  const off = milesBetween(z, { lat: best.c[1], lon: best.c[0] });
  fixes.push({ zip: z.zip, before, moved: true, offMiles: off });
}
D = zips.map((_, i) => detour(i));
for (const f of fixes) f.after = D[idx.get(f.zip)];
const unreliable = new Set(fixes.filter(f => isBad(f.after)).map(f => f.zip));
console.log(`re-anchored ${fixes.filter(f => f.moved).length}; still implausible ${unreliable.size}`);
// Travel inside a ZIP: half the drive to its nearest other ZIP, 2 to 10 minutes.
for (let i = 0; i < N; i++) {
  let m = Infinity;
  for (let j = 0; j < N; j++) if (j !== i && T[i * N + j] > 0) m = Math.min(m, T[i * N + j]);
  T[i * N + i] = Math.max(2, Math.min(10, Number.isFinite(m) ? m / 2 : 5));
}
let unroutable = 0;
for (const z of focus) { const i = idx.get(z.zip); let any = false; for (let j = 0; j < N; j++) if (j !== i && Number.isFinite(T[i * N + j])) { any = true; break; } if (!any) unroutable++; }
const minutes = (a, b) => { const v = T[idx.get(a) * N + idx.get(b)]; return Number.isFinite(v) ? v : null; };

// ---- people without a car (2026-11-19, the user's choice: option 3). The
// share of households with no vehicle (ACS B25044) is applied to each ZIP's
// adults; that group is scored on walking times over OpenStreetMap paths
// (OSRM foot profile), the same catchment edge in minutes as by car (Mao &
// Nekorchuk 2013 use one time threshold per mode). A car-time slowdown
// (SLOWDOWN x the drive) is computed beside it as a sensitivity check only.
const SLOWDOWN = 2.5;
const footUrl = arg('osrm-foot');
let W = null, walkFailed = 0;
if (footUrl) {
  W = new Float32Array(N * N).fill(NaN);
  for (let s0 = 0; s0 < N; s0 += SRC) for (let d = 0; d < N; d += DST) {
    const src = zips.slice(s0, s0 + SRC), dst = zips.slice(d, d + DST);
    const coords = src.concat(dst).map(z => `${z.lon.toFixed(5)},${z.lat.toFixed(5)}`).join(';');
    const b = await getJson(`${footUrl}/table/v1/walking/${coords}?sources=${src.map((_, i) => i).join(';')}&destinations=${dst.map((_, i) => src.length + i).join(';')}&annotations=duration`);
    if (!b) { walkFailed++; continue; }
    b.durations.forEach((row, a) => row.forEach((sec, q) => { if (sec != null) W[(s0 + a) * N + d + q] = sec / 60; }));
  }
  if (walkFailed) throw new Error(`${walkFailed} walking table requests failed; not reporting a partial matrix`);
  // Walking inside a ZIP: half the walk to its nearest other ZIP, 5 to 20 minutes.
  for (let i = 0; i < N; i++) {
    let m = Infinity;
    for (let j = 0; j < N; j++) if (j !== i && W[i * N + j] > 0) m = Math.min(m, W[i * N + j]);
    W[i * N + i] = Math.max(5, Math.min(20, Number.isFinite(m) ? m / 2 : 10));
  }
}
const walkMinutes = (a, b) => { const v = W[idx.get(a) * N + idx.get(b)]; return Number.isFinite(v) ? v : null; };
// Transit pilot (2026-11-25): r5py times on GTFS plus walking for ZIP pairs
// reachable within 120 minutes (scripts/access-transit.py). The no-car group
// takes the faster of walking and transit; a pair transit cannot reach, and
// travel inside a ZIP, stay on foot. Reported beside walking, never stored.
const TR = new Map();
if (arg('transit')) for (const [f, t, m] of csv(arg('transit'))) { const v = +m; if (Number.isFinite(v)) TR.set(f + '|' + t, v); }
const transitMinutes = (a, b) => { const w = walkMinutes(a, b), t = a === b ? undefined : TR.get(a + '|' + b); return t == null ? w : w == null ? t : Math.min(w, t); };
const transitReach = new Set([...TR.keys()].map(k => k.split('|')[0]));
const slowMinutes = (a, b) => { const v = minutes(a, b); return v == null ? null : v * SLOWDOWN; };
const noCar = new Map();
if (arg('nocar')) for (const [z, sh] of csv(arg('nocar'))) { const v = +sh; if (/^\d{5}$/.test(z) && Number.isFinite(v)) noCar.set(z, Math.max(0, Math.min(1, v))); }
const shareNoCar = z => noCar.get(z) ?? 0;   // no Census figure: scored as if every household has a car (counted below)
const focusNoShare = focus.filter(z => !noCar.has(z.zip)).length;
const focusAdults = focus.reduce((t, z) => t + z.adults, 0);
const focusNoCarAdults = focus.reduce((t, z) => t + z.adults * shareNoCar(z.zip), 0);
const miles = (a, b) => milesBetween(zips[idx.get(a)], zips[idx.get(b)]);

// ---- supply per specialty per ZIP (listings whose code the reviewed table puts in it)
const byCode = new Map();               // code -> Map zip -> n
let supplyRows = 0, supplyOutside = 0;
for (const [zip, code, n] of csv(arg('supply'))) {
  supplyRows += +n;
  if (!idx.has(zip)) { supplyOutside += +n; continue; }
  if (!byCode.has(code)) byCode.set(code, new Map());
  byCode.get(code).set(zip, (byCode.get(code).get(zip) || 0) + +n);
}
// Labels can hold commas ("Acupuncture, massage & naturopathy"); the rate is the last field.
const bench = new Map(readFileSync(arg('bench'), 'utf8').trim().split('\n').slice(1)
  .map(l => { const i = l.lastIndexOf(','); return [l.slice(0, i).replace(/^"|"$/g, '').replace(/""/g, '"'), +l.slice(i + 1)]; }));

// ---- per specialty: both measures for every focus ZIP
const rows = [], summary = [], load = [];
const fmt = v => (v == null ? '' : (v * 1000).toFixed(3));
for (const [label] of SCORED) {
  const codes = TaxonomyMap.codesFor(label);
  const supply = new Map();
  for (const c of codes) for (const [z, n] of byCode.get(c) || []) supply.set(z, (supply.get(z) || 0) + n);
  const d0 = catchmentFor(label), rate = bench.get(label) || null;
  const A0 = e2sfca(zips, supply, minutes, d0), C = crudeRatio(zips, supply, miles);
  // Scored: car for households with one, walking for those without.
  const MM = W ? e2sfcaMulti(zips, supply, [{ minutes, share: z => 1 - shareNoCar(z) }, { minutes: walkMinutes, share: shareNoCar }], d0) : null;
  const SS = W ? e2sfcaMulti(zips, supply, [{ minutes, share: z => 1 - shareNoCar(z) }, { minutes: slowMinutes, share: shareNoCar }], d0) : null;
  const TT = W && TR.size ? e2sfcaMulti(zips, supply, [{ minutes, share: z => 1 - shareNoCar(z) }, { minutes: transitMinutes, share: shareNoCar }], d0) : null;
  const tPairs = [], tCar = [], tGain = []; let tMoved = 0;
  const A = MM ? new Map([...MM].map(([z, v]) => [z, v.total])) : A0;
  const sensPairs = [], carPairs = []; let movedByCar = 0; const carDrop = [];
  const pairs = [];
  let moved = 0, bigUp = [], bigDown = [];
  for (const z of focus) {
    const a = A.get(z.zip), c = C.get(z.zip);
    const fa = accessFactor(a == null ? null : a * 1000, rate), fc = accessFactor(c == null ? null : c * 1000, rate);
    // Every focus ZIP is stored (the user's rule, 2026-11-19: no ZIP left out).
    // A ZIP with no road link to any supply is scored on its own listings and
    // adults, the E2SFCA result for an isolated place; unreliable routing is
    // stored as computed and still marked in the CSV and the report.
    const own = z.adults > 0 ? (supply.get(z.zip) || 0) / z.adults : null;
    const store = a ?? own;
    if (store != null) load.push([z.zip, '"' + label.replace(/"/g, '""') + '"', (store * 1000).toFixed(4), d0].join(','));
    const a0 = A0.get(z.zip), sv = SS ? SS.get(z.zip).total : null;
    const f0 = accessFactor(a0 == null ? null : a0 * 1000, rate), fs = accessFactor(sv == null ? null : sv * 1000, rate);
    if (fa != null && f0 != null && !unreliable.has(z.zip)) { carPairs.push([f0, fa]); if (Math.abs(fa - f0) >= 15) movedByCar++; carDrop.push([fa - f0, z.zip]); }
    if (fa != null && fs != null && !unreliable.has(z.zip)) sensPairs.push([fa, fs]);
    const tv = TT ? TT.get(z.zip).total : null, ft = accessFactor(tv == null ? null : tv * 1000, rate);
    if (fa != null && ft != null && !unreliable.has(z.zip)) { tPairs.push([fa, ft]); if (Math.abs(ft - fa) >= 15) tMoved++; tGain.push([ft - fa, z.zip]); if (f0 != null) tCar.push([f0, ft]); }
    rows.push([label, z.zip, z.adults, fmt(c), fmt(a), fc ?? '', fa ?? '', d0, unreliable.has(z.zip) ? 'unreliable_routing' : '',
      fmt(a0), f0 ?? '', fmt(sv), fs ?? '', noCar.has(z.zip) ? shareNoCar(z.zip).toFixed(3) : '', fmt(tv), ft ?? ''].join(','));
    if (fa != null && fc != null && !unreliable.has(z.zip)) {
      pairs.push([fc, fa]);
      if (Math.abs(fa - fc) >= 15) moved++;
      bigUp.push([fa - fc, z.zip]); bigDown.push([fa - fc, z.zip]);
    }
  }
  const rho = spearman(pairs.map(p => p[0]), pairs.map(p => p[1]));
  bigUp.sort((a, b) => b[0] - a[0]); bigDown.sort((a, b) => a[0] - b[0]);
  carDrop.sort((x, y) => y[0] - x[0]);
  summary.push({ label, d0, rate, n: pairs.length, rho, moved, up: bigUp.slice(0, 3), down: bigDown.slice(0, 3),
    carRho: spearman(carPairs.map(p => p[0]), carPairs.map(p => p[1])), movedByCar, carN: carPairs.length, carWorst: carDrop.slice(0, 3),
    tRho: spearman(tPairs.map(p => p[0]), tPairs.map(p => p[1])), tCarRho: spearman(tCar.map(p => p[0]), tCar.map(p => p[1])), tMoved, tN: tPairs.length,
    tBest: tGain.sort((x, y) => x[0] - y[0]).filter(([d]) => d < 0).slice(0, 3),
    sensRho: spearman(sensPairs.map(p => p[0]), sensPairs.map(p => p[1])),
    listings: [...supply.values()].reduce((x, y) => x + y, 0) });
}
if (arg('load')) writeFileSync(arg('load'), 'zip,specialty,per_1k,catchment_minutes\n' + load.join('\n') + '\n');
writeFileSync(arg('csv'), 'specialty,zip,adults,crude_per_1k,e2sfca_per_1k,crude_access,e2sfca_access,catchment_minutes,flag,car_only_per_1k,car_only_access,slowdown_per_1k,slowdown_access,no_car_share,transit_per_1k,transit_access\n' + rows.join('\n') + '\n');


// ---- step 8 (2026-11-22): travel burden against CMS Medicare Advantage time
// standards. Per focus ZIP and mapped specialty: drive minutes from the ZIP
// centre to the nearest ZIP holding a listing, against CMS's maximum minutes
// for the ZIP's main county (HUD crosswalk, most homes), matched to the HSD
// file by state and county name (the HSD file keys counties by SSA code, and
// no FIPS is in it). A fact for review, not a score.
const qcsv = p => readFileSync(p, 'utf8').trim().split('\n').slice(1).map(l => { const o = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(cur); cur = ''; } else cur += ch; } o.push(cur); return o; });
// Accents dropped (Doña Ana), "(formerly ...)" dropped (Kusilvak, Oglala Lakota).
const normCounty = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(formerly[^)]*\)/i, '').toLowerCase().replace(/\b(county|parish|borough|census area|municipality|city and borough)\b/g, '').replace(/^st\.? /, 'saint ').replace(/[^a-z]/g, '');
let burden = null;
if (arg('td') && arg('specmap') && arg('zipcounty')) {
  const td = new Map();   // state|county|code -> {min, des}
  for (const [, st, county, des, code, , mx] of qcsv(arg('td'))) td.set(`${st}|${normCounty(county)}|${code}`, { max: +mx, des });
  // Reviewed aliases (Connecticut's 2022 planning regions to the old counties the HSD file uses).
  const alias = new Map();
  if (arg('aliases')) for (const [st, county, hsd] of qcsv(arg('aliases'))) alias.set(`${st}|${normCounty(county)}`, hsd);
  const zc = new Map(qcsv(arg('zipcounty')).map(([z, st, county]) => [z, { st, county: alias.get(`${st}|${normCounty(county)}`) || county }]));
  // A row may narrow the label to NUCC classifications (mental health is split
  // into CMS's psychiatry, clinical psychology and clinical social work).
  const smap = qcsv(arg('specmap')).map(([label, code, cms, , cls]) => [label, code, cms, (cls || '').split(';').filter(Boolean)]);
  burden = { rows: [], unmatched: new Set(), out: [], basis: 'zip_centres' };
  // Practice locations (step 10, 2026-11-23): the middle of each ZIP's pinned
  // listings per code (listing_counts_zip), so the drive ends where the
  // practices are, not at a ZIP centre. Each focus ZIP is routed to the
  // PIN_K nearest such points per specialty by straight line, in one request.
  const PIN_K = 8;
  const pinsByCode = new Map();
  if (arg('pins')) for (const [z, code, n, lat, lng] of csv(arg('pins'))) {
    if (!(+n > 0) || !Number.isFinite(+lat) || !Number.isFinite(+lng)) continue;
    if (!pinsByCode.has(code)) pinsByCode.set(code, []);
    pinsByCode.get(code).push({ z, n: +n, lat: +lat, lon: +lng });
  }
  const labelPoints = (codes) => {
    const m = new Map();
    for (const c of codes) for (const p of pinsByCode.get(c) || []) {
      const a = m.get(p.z) || { z: p.z, n: 0, la: 0, lo: 0 };
      a.n += p.n; a.la += p.lat * p.n; a.lo += p.lon * p.n; m.set(p.z, a);
    }
    return [...m.values()].map(a => ({ z: a.z, lat: a.la / a.n, lon: a.lo / a.n }));
  };
  const plans = smap.map(([label0, code, cms, cls]) => {
    const codes = TaxonomyMap.codesFor(label0).filter(c => !cls.length || cls.includes((TaxonomyMap.get(c) || {}).classification));
    return { label0, code, cms, cls, codes, points: labelPoints(codes) };
  });
  const pinMin = new Map();   // zip|plan index -> minutes to the nearest practice point
  if (pinsByCode.size) {
    burden.basis = 'practice_locations';
    let reqFailed = 0;
    for (const z of focus) {
      const want = new Map();   // "lon,lat" -> [plan indexes]
      plans.forEach((pl, k) => {
        if (!pl.points.length) return;
        pl.points.map(p => [milesBetween(z, p), p]).sort((a, b) => a[0] - b[0]).slice(0, PIN_K).forEach(([, p]) => {
          const key = `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`;
          if (!want.has(key)) want.set(key, []);
          want.get(key).push(k);
        });
      });
      if (!want.size) continue;
      const keys = [...want.keys()];
      const b = await getJson(`${osrm}/table/v1/driving/${z.lon.toFixed(5)},${z.lat.toFixed(5)};${keys.join(';')}?sources=0&destinations=${keys.map((_, q) => q + 1).join(';')}&annotations=duration`);
      if (!b) { reqFailed++; continue; }
      b.durations[0].forEach((sec, q) => {
        if (sec == null) return;
        for (const k of want.get(keys[q])) { const id = z.zip + '|' + k, v = sec / 60; if (!(pinMin.get(id) <= v)) pinMin.set(id, v); }
      });
    }
    if (reqFailed) throw new Error(`${reqFailed} practice-location routing requests failed; not reporting a partial check`);
  }
  for (const [k, { label0, code, cms, cls, codes }] of plans.entries()) {
    const label = cls.length ? `${label0}: ${cms}` : label0;
    const supply = new Map();
    for (const c of codes) for (const [z, n] of byCode.get(c) || []) supply.set(z, (supply.get(z) || 0) + n);
    const has = [...supply.keys()].filter(z => idx.has(z)).map(z => idx.get(z));
    const agg = {}; let ok = 0, over = 0, adOk = 0, adOver = 0, none = 0;
    for (const z of focus) {
      const c = zc.get(z.zip); const lim = c && td.get(`${c.st}|${normCounty(c.county)}|${code}`);
      if (!lim) { if (c) burden.unmatched.add(`${c.st} ${c.county}`); continue; }
      const i = idx.get(z.zip); let m = Infinity;
      // Practice locations when routed; else ZIP centre to ZIP centre.
      if (pinMin.has(z.zip + '|' + k)) m = pinMin.get(z.zip + '|' + k);
      else for (const j of has) { const v = T[i * N + j]; if (Number.isFinite(v) && v < m) m = v; }
      const a = agg[lim.des] || (agg[lim.des] = { n: 0, over: 0, ad: 0, adOver: 0 });
      a.n++; a.ad += z.adults;
      if (!Number.isFinite(m)) none++;
      const bad = !Number.isFinite(m) || m > lim.max;
      if (bad) { over++; adOver += z.adults; a.over++; a.adOver += z.adults; burden.out.push([label, z.zip, c.county, lim.des, Number.isFinite(m) ? m.toFixed(0) : 'none', lim.max, z.adults]); }
      else { ok++; adOk += z.adults; }
    }
    burden.rows.push({ label, code, n: ok + over, over, ad: adOk + adOver, adOver, none, agg });
  }
}

// ---- report
const r2 = v => (v == null ? 'n/a' : v.toFixed(2));
const SAMPLE = (arg('sample') || '').split(/[ ,]+/).filter(z => idx.has(z));
const lines = [
  `# E2SFCA access dry run: ${arg('label')}`, '',
  `Run ${new Date().toISOString().slice(0, 10)} by scripts/access-dry-run.mjs. Read only: nothing in the database or on the site changed.`, '',
  'Compares the access factor the market model uses today (listings per adult within about 10 straight-line miles, against the national rate) with the Enhanced Two-Step Floating Catchment Area method (Luo & Qi 2009) using drive time and a Gaussian distance decay (Dai 2010), per scored specialty. Both are mapped to the same 0 to 100 access factor (100 = no supply, 50 = the national rate, 0 = twice it or more), so they can be compared directly.', '',
  '## Inputs', '',
  `- ZIP areas in the region (focus plus a border strip of about 60 miles): ${zips.length.toLocaleString()}; in ${arg('label')}: ${focus.length.toLocaleString()}`,
  `- Drive times: OSRM on OpenStreetMap roads (car profile), ${N.toLocaleString()} x ${N.toLocaleString()} ZIP centre pairs; travel inside a ZIP is half the drive to its nearest neighbour, 2 to 10 minutes`,
  `- Focus ZIPs with no road link to any other ZIP (islands, unrouted centres): ${unroutable}`,
  `- Listings read: ${supplyRows.toLocaleString()}; outside the region's ZIP list (no centre, or a mistyped ZIP): ${supplyOutside.toLocaleString()}`,
  '- Catchment edges: 30 minutes for everyday care, 60 for most specialties, 90 for oncology, genetics, infectious disease and plastic surgery (reviewable assumptions, listed per row below)', '',
  '## Routing sanity check', '',
  `Regional median: ${gmed.toFixed(2)} drive minutes per straight-line mile to a ZIP's 12 nearest ZIPs. A ZIP is flagged above ${FLAG_X}x that (${(FLAG_X * gmed).toFixed(2)}), or when fewer than half of its neighbours are reachable, then re-anchored to the best-connected road point within about 2.5 km and routed again.`, '',
  `- Flagged: ${fixes.length}; re-anchored: ${fixes.filter(f => f.moved).length}; still implausible (left out of the rank comparison, still stored, marked in the CSV): ${unreliable.size}${unreliable.size ? ' (' + [...unreliable].join(', ') + ')' : ''}`, '',
  ...(fixes.length ? ['| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |', '|---|---|---|---|---|---|---|',
    ...fixes.map(f => `| ${f.zip} | ${inFocus({ zip: f.zip }) ? 'yes' : 'no'} | ${Number.isFinite(f.before.med) ? f.before.med.toFixed(2) : 'none'} | ${Math.round(f.before.reach * 100)}% | ${Number.isFinite(f.after.med) ? f.after.med.toFixed(2) : 'none'} | ${Math.round(f.after.reach * 100)}% | ${f.moved ? 'yes (' + f.offMiles.toFixed(2) + ')' : 'no'} |`), ''] : []),
  '## By specialty', '',
  'Rank agreement is Spearman\'s rho between the two access factors across the state\'s ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.', '',
  '| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |',
  '|---|---|---|---|---|---|---|---|',
  ...summary.map(s => `| ${s.label} | ${s.d0} | ${s.listings.toLocaleString()} | ${r2(s.rate)} | ${r2(s.rho)} | ${s.moved} of ${s.n} | ${s.down.map(([d, z]) => `${z} (${d})`).join(', ')} | ${s.up.map(([d, z]) => `${z} (+${d})`).join(', ')} |`),
  '', 'In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.', ''
];
if (W) {
  lines.push('## People without a car', '',
    `The stored figure (\`e2sfca\` above) splits each ZIP's adults by the share of households with no vehicle (ACS B25044) and routes that group on foot (OSRM foot profile on OpenStreetMap paths), with the same catchment edge in minutes as by car; both groups compete for the same clinicians (Mao & Nekorchuk 2013, multi-mode E2SFCA). Walking inside a ZIP is half the walk to its nearest neighbour, 5 to 20 minutes. Households are applied to adults (no ACS table gives vehicles per adult at ZIP level).`, '',
    `- Adults in ${arg('label')} in households with no vehicle: about ${Math.round(focusNoCarAdults).toLocaleString()} of ${Math.round(focusAdults).toLocaleString()} (${(100 * focusNoCarAdults / Math.max(1, focusAdults)).toFixed(1)}%)`,
    `- Focus ZIPs with no Census vehicle figure (scored as if every household has a car): ${focusNoShare}`,
    `- Sensitivity check: the same split with the no-car group at ${SLOWDOWN}x the drive time instead of walking (a stand-in for transit, rides and waiting; an assumption, not a published figure). It is not stored.`, '',
    '| Specialty | Rank agreement with car-only | ZIPs moved 15+ vs car-only | Most worsened by the no-car split | Rank agreement, walking vs slowdown |', '|---|---|---|---|---|',
    ...summary.map(s => `| ${s.label} | ${r2(s.carRho)} | ${s.movedByCar} of ${s.carN} | ${s.carWorst.filter(([d]) => d > 0).map(([d, z]) => `${z} (+${d})`).join(', ')} | ${r2(s.sensRho)} |`), '',
    'A positive change is worse access once people without a car are counted. Rank agreement near 1 between walking and the slowdown means the conclusion does not hinge on which no-car assumption is used.', '');
}
if (W && TR.size) {
  const feeds = existsSync(arg('transit') + '.feeds.json') ? JSON.parse(readFileSync(arg('transit') + '.feeds.json', 'utf8')) : [];
  const dep = existsSync(arg('transit') + '.departure') ? readFileSync(arg('transit') + '.departure', 'utf8').trim() : 'unknown';
  lines.push('## Public transit pilot', '',
    `The no-car group again, now taking the faster of walking and public transit (r5py on the region's GTFS feeds plus OpenStreetMap paths; median door-to-door minutes over a 60-minute window leaving ${dep}, a weekday mid-morning chosen as an assumption; pairs over 120 minutes or with no service stay on foot). Car households are unchanged. Not stored and not used by the live score.`, '',
    `- GTFS feeds used (Mobility Database catalog, boxes overlapping the region, national and multi-state feeds left out): ${feeds.length}${feeds.length ? ' (' + feeds.map(f => f.provider).join('; ') + ')' : ''}`,
    `- ZIP pairs reachable by transit within 120 minutes: ${TR.size.toLocaleString()}; focus ZIPs that reach at least one other ZIP by transit: ${focus.filter(z => transitReach.has(z.zip)).length} of ${focus.length}`, '',
    '| Specialty | Rank agreement, walking vs transit | ZIPs moved 15+ vs walking | Most improved by transit (transit minus walking) | Rank agreement, transit vs car-only |', '|---|---|---|---|---|',
    ...summary.map(s => `| ${s.label} | ${r2(s.tRho)} | ${s.tMoved} of ${s.tN} | ${s.tBest.map(([d, z]) => `${z} (${d})`).join(', ')} | ${r2(s.tCarRho)} |`), '',
    'A negative change is better access once transit is counted. Rank agreement near 1 means walking alone already ordered the ZIPs the same way.', '');
}
if (SAMPLE.length) {
  lines.push('## Sample ZIPs', '', '| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |', '|---|---|---|---|---|---|');
  const want = new Set(['Primary care / family doctor', 'Heart / cardiology', 'Cancer care / oncology', 'Mental health & counseling', 'Urgent care & emergency']);
  for (const z of SAMPLE) for (const r of rows) { const c = r.split(','); if (c[1] === z && want.has(c[0])) lines.push(`| ${z} | ${c[0]} | ${c[3]} | ${c[4]} | ${c[5]} | ${c[6]} |`); }
  lines.push('');
}
if (burden) {
  const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
  lines.push('## Travel burden against CMS Medicare Advantage limits', '',
    (burden.basis === 'practice_locations' ? 'Drive minutes from each ZIP centre to the nearest practice location (the middle of each ZIP\'s pinned listings in the specialty, the 8 nearest by straight line routed on roads),' : 'Drive minutes from each ZIP centre to the nearest ZIP with a listing in the specialty,') + ' against the maximum minutes CMS sets for Medicare Advantage networks (2026 HSD Reference File) in the ZIP\'s main county. The CMS limit applies to a plan\'s network; here it is read against every listing, so a ZIP over the limit has no clinician of that kind within the limit at all. Specialty pairs are in `supabase/reference/network-adequacy/specialty-map.csv` (reviewable). Not scored.', '',
    `- Counties not matched by name to the HSD file: ${burden.unmatched.size}${burden.unmatched.size ? ' (' + [...burden.unmatched].slice(0, 20).join(', ') + ')' : ''}`, '',
    '| Specialty | CMS code | ZIPs over the limit | Adults in them | Large Metro | Metro | Micro | Rural | CEAC |', '|---|---|---|---|---|---|---|---|---|',
    ...burden.rows.map(r => `| ${r.label} | ${r.code} | ${r.over} of ${r.n} | ${Math.round(r.adOver).toLocaleString()} (${pct(r.adOver, r.ad)}) | ${['Large Metro', 'Metro', 'Micro', 'Rural', 'CEAC'].map(d => r.agg[d] ? `${r.agg[d].over}/${r.agg[d].n}` : '').join(' | ')} |`), '',
    'Designation cells are ZIPs over the limit out of ZIPs of that county type.', '');
  if (arg('burden')) writeFileSync(arg('burden'), 'specialty,zip,county,designation,nearest_minutes,cms_max_minutes,adults\n' + burden.out.map(r => r.map((v, k) => k === 0 || k === 2 ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n') + '\n');
}
lines.push('## Reading this', '',
  '- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).',
  '- It also divides each practice\'s capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.',
  '- Nothing here changes the live score. Adopting it is a separate decision.', '');
writeFileSync(arg('report'), lines.join('\n'));
console.log('report written');
