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
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { e2sfca, crudeRatio, accessFactor, catchmentFor, milesBetween, spearman } from './lib/e2sfca.mjs';
const require = createRequire(import.meta.url);
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const { SCORED } = require('../v2/assets/specialties.js');

const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const csv = p => readFileSync(p, 'utf8').trim().split('\n').slice(1).map(l => l.split(','));

const zips = csv(arg('zips')).map(([zip, lat, lon, adults]) => ({ zip, lat: +lat, lon: +lon, adults: +adults || 0 }))
  .filter(z => /^\d{5}$/.test(z.zip) && Number.isFinite(z.lat) && Number.isFinite(z.lon));
const idx = new Map(zips.map((z, i) => [z.zip, i]));
const [lo, hi] = arg('focus').split('-').map(Number);
const inFocus = z => +z.zip.slice(0, 3) >= lo && +z.zip.slice(0, 3) <= hi;
const focus = zips.filter(inFocus);
console.log(`region ZIPs ${zips.length}, focus ZIPs ${focus.length}`);
if (focus.length < 100) throw new Error('too few focus ZIPs: ' + focus.length);

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
  const A = e2sfca(zips, supply, minutes, d0), C = crudeRatio(zips, supply, miles);
  const pairs = [];
  let moved = 0, bigUp = [], bigDown = [];
  for (const z of focus) {
    const a = A.get(z.zip), c = C.get(z.zip);
    const fa = accessFactor(a == null ? null : a * 1000, rate), fc = accessFactor(c == null ? null : c * 1000, rate);
    if (a != null && !unreliable.has(z.zip)) load.push([z.zip, '"' + label.replace(/"/g, '""') + '"', (a * 1000).toFixed(4), d0].join(','));
    rows.push([label, z.zip, z.adults, fmt(c), fmt(a), fc ?? '', fa ?? '', d0, unreliable.has(z.zip) ? 'unreliable_routing' : ''].join(','));
    if (fa != null && fc != null && !unreliable.has(z.zip)) {
      pairs.push([fc, fa]);
      if (Math.abs(fa - fc) >= 15) moved++;
      bigUp.push([fa - fc, z.zip]); bigDown.push([fa - fc, z.zip]);
    }
  }
  const rho = spearman(pairs.map(p => p[0]), pairs.map(p => p[1]));
  bigUp.sort((a, b) => b[0] - a[0]); bigDown.sort((a, b) => a[0] - b[0]);
  summary.push({ label, d0, rate, n: pairs.length, rho, moved, up: bigUp.slice(0, 3), down: bigDown.slice(0, 3),
    listings: [...supply.values()].reduce((x, y) => x + y, 0) });
}
if (arg('load')) writeFileSync(arg('load'), 'zip,specialty,per_1k,catchment_minutes\n' + load.join('\n') + '\n');
writeFileSync(arg('csv'), 'specialty,zip,adults,crude_per_1k,e2sfca_per_1k,crude_access,e2sfca_access,catchment_minutes,flag\n' + rows.join('\n') + '\n');

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
  `- Flagged: ${fixes.length}; re-anchored: ${fixes.filter(f => f.moved).length}; still implausible (left out of the rank comparison, marked in the CSV): ${unreliable.size}${unreliable.size ? ' (' + [...unreliable].join(', ') + ')' : ''}`, '',
  ...(fixes.length ? ['| ZIP | In focus state | Minutes per mile before | Reachable before | After | Reachable after | Re-anchored (miles moved) |', '|---|---|---|---|---|---|---|',
    ...fixes.map(f => `| ${f.zip} | ${inFocus({ zip: f.zip }) ? 'yes' : 'no'} | ${Number.isFinite(f.before.med) ? f.before.med.toFixed(2) : 'none'} | ${Math.round(f.before.reach * 100)}% | ${Number.isFinite(f.after.med) ? f.after.med.toFixed(2) : 'none'} | ${Math.round(f.after.reach * 100)}% | ${f.moved ? 'yes (' + f.offMiles.toFixed(2) + ')' : 'no'} |`), ''] : []),
  '## By specialty', '',
  'Rank agreement is Spearman\'s rho between the two access factors across the state\'s ZIPs (1 = same order). "Moved 15+" counts ZIPs whose access factor changed by 15 points or more.', '',
  '| Specialty | Catchment (min) | Listings in region | US rate per 1k | Rank agreement | ZIPs moved 15+ | Most improved access (new minus old) | Most worsened |',
  '|---|---|---|---|---|---|---|---|',
  ...summary.map(s => `| ${s.label} | ${s.d0} | ${s.listings.toLocaleString()} | ${r2(s.rate)} | ${r2(s.rho)} | ${s.moved} of ${s.n} | ${s.down.map(([d, z]) => `${z} (${d})`).join(', ')} | ${s.up.map(([d, z]) => `${z} (+${d})`).join(', ')} |`),
  '', 'In the last two columns a negative change means E2SFCA finds **better** access than the crude ratio (a lower access factor), a positive one **worse**.', ''
];
if (SAMPLE.length) {
  lines.push('## Sample ZIPs', '', '| ZIP | Specialty | Crude per 1k | E2SFCA per 1k | Crude access | E2SFCA access |', '|---|---|---|---|---|---|');
  const want = new Set(['Primary care / family doctor', 'Heart / cardiology', 'Cancer care / oncology', 'Mental health & counseling', 'Urgent care & emergency']);
  for (const z of SAMPLE) for (const r of rows) { const c = r.split(','); if (c[1] === z && want.has(c[0])) lines.push(`| ${z} | ${c[0]} | ${c[3]} | ${c[4]} | ${c[5]} | ${c[6]} |`); }
  lines.push('');
}
lines.push('## Reading this', '',
  '- E2SFCA counts clinicians just outside a fixed 10-mile circle (with a smaller weight) and stops counting ones that are close in a straight line but a long drive away (across a river or mountain).',
  '- It also divides each practice\'s capacity among every community that can reach it, so a cluster of clinicians serving a whole region no longer makes only its own ZIP look oversupplied.',
  '- Nothing here changes the live score. Adopting it is a separate decision.', '');
writeFileSync(arg('report'), lines.join('\n'));
console.log('report written');
