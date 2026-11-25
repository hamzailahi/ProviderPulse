// National drive-time vs 10-mile comparison (2026-11-25). Read only.
// 1. Per scored specialty, Spearman's rho across every ZIP between the access
//    factor from the stored drive-time figure (access_e2sfca, site-weighted,
//    against the weighted national rate, as market-score reads it) and the
//    access factor from the 10-mile count (the rule in crudeRatio(): every ZIP
//    centre within 10 straight-line miles, else the 10 nearest out to 25, at
//    most 60; site-weighted supply against the weighted rate), with a 95% CI.
// 2. Site weighting: per specialty, ZIPs whose 10-mile rate is above the
//    national rate before (every listing 1, the plain rate) and after (0.6 at
//    the main office, the weighted rate), and how many cross either way.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { accessFactor, milesBetween, spearman } from './lib/e2sfca.mjs';
import { ciSpearman, pSpearman } from './lib/stats.mjs';
const require = createRequire(import.meta.url);
const SPEC = require('../v2/assets/specialties.js'), TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const arg = k => { const i = process.argv.indexOf('--' + k); return i < 0 ? null : process.argv[i + 1]; };
const read = k => { const r = parseCsv(readFileSync(arg(k), 'utf8')); r.shift(); return r; };
const SCORED = SPEC.SCORED || SPEC.SPECIALTIES.SCORED;
const labels = (Array.isArray(SCORED) ? SCORED : []).map(x => Array.isArray(x) ? x[0] : x);

const zips = read('zips').map(([zip, lat, lon, adults, state]) => ({ zip, lat: +lat, lon: +lon, adults: +adults || 0, state }))
  .filter(z => Number.isFinite(z.lat) && Number.isFinite(z.lon));
const byCode = new Map();
for (const [z, code, n, w] of read('supply')) { const m = byCode.get(code) || byCode.set(code, new Map()).get(code); const o = m.get(z) || { n: 0, w: 0 }; o.n += +n; o.w += +w; m.set(z, o); }
const e2 = new Map(); for (const [z, sp, per] of read('e2sfca')) { if (per === '') continue; (e2.get(sp) || e2.set(sp, new Map()).get(sp)).set(z, +per); }
const bench = new Map(read('bench').map(([k, r, rw]) => [k, { plain: r === '' ? null : +r, weighted: rw === '' ? null : +rw }]));

// Neighbour lists once (grid of half a degree).
const grid = new Map(), g = v => Math.floor(v * 2);
for (const z of zips) { const k = g(z.lat) + ',' + g(z.lon); (grid.get(k) || grid.set(k, []).get(k)).push(z); }
const pick = new Map();
for (const z of zips) {
  const near = [];
  for (let a = -1; a <= 1; a++) for (let b = -2; b <= 2; b++) for (const y of grid.get((g(z.lat) + a) + ',' + (g(z.lon) + b)) || []) { const m = milesBetween(z, y); if (m <= 25) near.push({ y, m }); }
  near.sort((p, q) => p.m - q.m);
  let p = near.filter(x => x.m <= 10); if (p.length < 10) p = near.slice(0, 10); p = p.slice(0, 60);
  pick.set(z.zip, p.map(x => x.y));
}
const f2 = v => (v == null ? 'n/a' : v.toFixed(2)), ci = c => (c ? `[${c[0].toFixed(2)}, ${c[1].toFixed(2)}]` : 'n/a');
const pv = p => (p == null ? 'n/a' : p < 0.001 ? '<0.001' : p.toFixed(3));
const rowsR = [], rowsF = []; let allA = [], allC = [];
for (const label of labels) {
  const codes = TaxonomyMap.codesFor(label), sup = new Map();
  for (const c of codes) for (const [z, o] of byCode.get(c) || []) { const s = sup.get(z) || { n: 0, w: 0 }; s.n += o.n; s.w += o.w; sup.set(z, s); }
  const r = bench.get(label) || {}, E = e2.get(label) || new Map();
  const xs = [], ys = []; let above0 = 0, above1 = 0, up = 0, down = 0, nF = 0, aboveW = 0;
  for (const z of zips) {
    if (!(z.adults > 0)) continue;
    let n = 0, w = 0, ad = 0; for (const y of pick.get(z.zip)) { const s = sup.get(y.zip); if (s) { n += s.n; w += s.w; } ad += y.adults; }
    if (!(ad > 0)) continue;
    const plain = n / ad * 1000, wtd = w / ad * 1000;
    if (r.plain > 0 && r.weighted > 0) {
      nF++; const b = plain > r.plain, a = wtd > r.weighted, aw = wtd > r.plain;
      if (b) above0++; if (a) above1++; if (aw) aboveW++; if (b && !a) down++; if (!b && a) up++;
    }
    if (E.has(z.zip) && r.weighted > 0) { const fa = accessFactor(E.get(z.zip), r.weighted), fc = accessFactor(wtd, r.weighted); if (fa != null && fc != null) { xs.push(fa); ys.push(fc); } }
  }
  const rho = spearman(xs, ys);
  rowsR.push({ label, n: xs.length, rho, ci: ciSpearman(rho, xs.length), p: pSpearman(rho, xs.length) });
  rowsF.push({ label, nF, above0, above1, down, up, aboveW, plain: r.plain, weighted: r.weighted });
}
const L = ['# Drive time vs 10-mile count, and site weighting, nationally', '',
  `Run ${new Date().toISOString().slice(0, 10)} by scripts/access-national.mjs (exports: scripts/access-national.sh). Read only.`, '',
  `- ZIPs with a centre: ${zips.length.toLocaleString()}; drive-time figures read from access_e2sfca (the stored, site-weighted E2SFCA per 1,000 adults).`,
  '- 10-mile count: every ZIP centre within 10 straight-line miles of the ZIP\'s population-weighted centre, else the 10 nearest out to 25 miles, at most 60 (the rule in scripts/lib/e2sfca.mjs crudeRatio and the back-test). Both figures go through the model\'s access factor (100 = none, 50 = the national rate).',
  '- 95% CI: Fisher z with the Bonett and Wright (2000) standard error; p two-sided from the t approximation.', '',
  '## 1. Rank agreement across all ZIPs', '',
  '| Specialty | ZIPs | Spearman rho | 95% CI | p |', '|---|---|---|---|---|',
  ...rowsR.map(r => `| ${r.label} | ${r.n.toLocaleString()} | ${f2(r.rho)} | ${ci(r.ci)} | ${pv(r.p)} |`), '',
  '## 2. Site weighting: ZIPs above the national rate (10-mile count)', '',
  '"Before": every listing counts 1, against the plain national rate. "After": a clinician with several sites counts 0.6 at the main office, against the site-weighted national rate (the pair market-score uses since 2026-11-24). "Fell below" and "rose above" count ZIPs that cross the national rate between the two. The last column is weighted supply against the plain rate, for comparison.', '',
  '| Specialty | ZIPs | Plain rate per 1k | Weighted rate per 1k | Above before | Above after | Fell below | Rose above | Above (weighted supply, plain rate) |', '|---|---|---|---|---|---|---|---|---|',
  ...rowsF.map(r => `| ${r.label} | ${r.nF.toLocaleString()} | ${r.plain ?? 'n/a'} | ${r.weighted ?? 'n/a'} | ${r.above0.toLocaleString()} | ${r.above1.toLocaleString()} | ${r.down.toLocaleString()} | ${r.up.toLocaleString()} | ${r.aboveW.toLocaleString()} |`), ''];
writeFileSync(arg('report'), L.join('\n'));
console.log(L.join('\n'));
