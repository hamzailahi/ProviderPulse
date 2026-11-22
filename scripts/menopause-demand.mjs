// Menopause care demand dry run (read only). See scripts/lib/menopause.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { CORE, BROAD, womenInAge, perClinician } from './lib/menopause.mjs';
const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const rows = p => { const L = readFileSync(p, 'utf8').trim().split('\n'); return L.slice(1).map(l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; }); };
const ST = arg('state');
const women = new Map(), stateOf = new Map();
for (const [z, st, a] of rows(arg('women'))) { let b; try { b = JSON.parse(a); } catch { continue; } const v = womenInAge(b); if (v != null) women.set(z, v); stateOf.set(z, st); }
const zips = new Map();
for (const [z, lat, lon] of rows(arg('geo'))) if (Number.isFinite(+lat) && Number.isFinite(+lon)) zips.set(z, { lat: +lat, lon: +lon });
const core = new Map(), broad = new Map();
for (const [z, code, n] of rows(arg('supply'))) {
  if (CORE.includes(code)) core.set(z, (core.get(z) || 0) + +n);
  broad.set(z, (broad.get(z) || 0) + +n);
}
// Only ZIPs near the state matter; prefilter the region for speed.
const focus = [...zips.keys()].filter(z => stateOf.get(z) === ST && (women.get(z) || 0) >= 100);
if (focus.length < 30) throw new Error('too few ZIPs in ' + ST + ': ' + focus.length);
const box = focus.map(z => zips.get(z));
const pad = 0.4, la = [Math.min(...box.map(p => p.lat)) - pad, Math.max(...box.map(p => p.lat)) + pad], lo = [Math.min(...box.map(p => p.lon)) - pad, Math.max(...box.map(p => p.lon)) + pad];
const region = new Map([...zips].filter(([, p]) => p.lat >= la[0] && p.lat <= la[1] && p.lon >= lo[0] && p.lon <= lo[1]));
const res = focus.map(z => ({ z, own: women.get(z), core: perClinician(z, region, women, core), broad: perClinician(z, region, women, broad) })).filter(r => r.core);
const fin = res.filter(r => Number.isFinite(r.core.ratio)).map(r => r.core.ratio).sort((a, b) => a - b);
const med = fin[fin.length >> 1];
const none = res.filter(r => !Number.isFinite(r.core.ratio));
const top = res.filter(r => Number.isFinite(r.core.ratio)).sort((a, b) => b.core.ratio - a.core.ratio).slice(0, 25);
const totW = res.reduce((t, r) => t + r.own, 0);
const f = n => Math.round(n).toLocaleString();
const L = [`# Menopause care demand dry run: ${ST}`, '',
  `Run ${new Date().toISOString().slice(0, 10)} by scripts/menopause-demand.mjs. Read only; nothing on the site changed.`, '',
  'Demand: women aged 45 to 59 (Census ACS 5-year, by ZIP). Supply, core: OB-GYN and gynecology physicians, reproductive endocrinologists, OB-GYN and women\'s health nurse practitioners, women\'s health clinical nurse specialists. Broad adds family and internal medicine physicians and family and adult health nurse practitioners. Both are counted within 10 straight-line miles of each ZIP centre, so each figure is women in the area per clinician in the same area. No public source says which clinicians actually treat menopause or charge cash; this measures population against the clinicians able to, not demand that is proven.', '',
  `- ZIPs in ${ST} with 100+ women aged 45 to 59: ${res.length.toLocaleString()} (${f(totW)} women)`,
  `- State median: ${f(med)} women aged 45 to 59 per core clinician within 10 miles`,
  `- ZIPs with no core clinician within 10 miles: ${none.length} (${f(none.reduce((t, r) => t + r.own, 0))} women in those ZIPs)`, '',
  '## Most women per core clinician', '',
  '| ZIP | Women 45-59 in ZIP | Women 45-59 within 10 mi | Core clinicians | Women per core clinician | vs state median | Women per broad clinician |', '|---|---|---|---|---|---|---|',
  ...top.map(r => `| ${r.z} | ${f(r.own)} | ${f(r.core.women)} | ${r.core.clinicians} | ${f(r.core.ratio)} | ${(r.core.ratio / med).toFixed(1)}x | ${Number.isFinite(r.broad.ratio) ? f(r.broad.ratio) : 'none'} |`), '',
  '## No core clinician within 10 miles (largest first)', '',
  '| ZIP | Women 45-59 in ZIP | Women within 10 mi | Women per broad clinician |', '|---|---|---|---|',
  ...none.sort((a, b) => b.core.women - a.core.women).slice(0, 25).map(r => `| ${r.z} | ${f(r.own)} | ${f(r.core.women)} | ${Number.isFinite(r.broad.ratio) ? f(r.broad.ratio) : 'none'} |`), ''];
writeFileSync(arg('report'), L.join('\n'));
console.log(L.slice(0, 12).join('\n'));
