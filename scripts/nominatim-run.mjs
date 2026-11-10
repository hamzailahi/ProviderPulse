// The full Nominatim pass, in daily batches (2026-11-10, the user's go-ahead).
// For unpinned listings that ArcGIS placed at a building (PointAddress or
// Subaddress) but that failed the strict cut, ask Nominatim (OpenStreetMap)
// for the same address, one request a second, and record whether it found an
// object with the same house number and ZIP and how far that sits from the
// ArcGIS point. Two independent sources agreeing within 50 m is the test for
// a later, separately approved apply. This script never touches the database.
//
//   node scripts/nominatim-run.mjs --input input.csv --results results.csv --report report.md [--batch 3000]
// input (from a tmp/ branch, holds the ArcGIS points, never committed):
//   tbl, npi, address, city, state, zip, arcgis_lat, arcgis_lng, arcgis_type
// results (committed; OpenStreetMap data, ODbL, no ArcGIS coordinates):
//   tbl, npi, result, osm_kind, osm_type, dist_m, lat, lng
// Exit code 0 always when it ran; prints "remaining=N" for the workflow.
import fs from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { metres } from './lib/nad-match.mjs';
import { classify, lookup } from './nominatim-sample.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const COLS = ['tbl', 'npi', 'result', 'osm_kind', 'osm_type', 'dist_m', 'lat', 'lng'];
const AGREE_M = 50;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const table = f => { const [h, ...r] = parseCsv(fs.readFileSync(f, 'utf8')); return r.filter(x => x.length > 1).map(x => Object.fromEntries(h.map((c, i) => [c, x[i] ?? '']))); };

export function record(row, hit) {
  const result = classify(row, hit);
  const out = { tbl: row.tbl, npi: row.npi, result, osm_kind: '', osm_type: '', dist_m: '', lat: '', lng: '' };
  if (result !== 'building') return out;
  const p = { lat: Number(hit.lat), lng: Number(hit.lon) };
  out.osm_kind = `${hit.category || hit.class || '?'}/${hit.type || '?'}`;
  out.osm_type = String(hit.osm_type || '');
  out.dist_m = String(Math.round(metres({ lat: Number(row.arcgis_lat), lng: Number(row.arcgis_lng) }, p)));
  if (Number(out.dist_m) <= AGREE_M) { out.lat = p.lat.toFixed(7); out.lng = p.lng.toFixed(7); }   // kept only where an apply could use it
  return out;
}

export function summary(input, results) {
  const st = {}, kinds = {};
  let agree = 0, agreeStrict = 0;
  for (const r of results) {
    st[r.result] = (st[r.result] || 0) + 1;
    if (r.result === 'building' && Number(r.dist_m) <= AGREE_M) {
      agree++; kinds[r.osm_kind] = (kinds[r.osm_kind] || 0) + 1;
      // An address point or a building outline, not a bare "house" on a way (which may be a street-range estimate).
      if (!(r.osm_kind === 'place/house' && r.osm_type === 'way')) agreeStrict++;
    }
  }
  const n = results.length, pct = v => (n ? (100 * (v || 0) / n).toFixed(1) + '%' : 'n/a');
  return [
    '# Nominatim (OpenStreetMap) pass over unpinned listings', '',
    `Updated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by scripts/nominatim-run.mjs. Daily batches, one request a second. Nothing has been written to the database; an apply needs the operator's go-ahead.`, '',
    `- Listings to check (ArcGIS found a building, but the pin failed the strict cut): ${input.length}`,
    `- Checked so far: **${n}**; still to do: ${Math.max(0, input.length - n)}`,
    `- OpenStreetMap has an object with the same house number and ZIP: ${st.building || 0} (${pct(st.building)})`,
    `- ... and it is within ${AGREE_M} m of the ArcGIS point (two sources agree): **${agree}** (${pct(agree)})`,
    `- ... leaving out bare "house" matches on a street way, which may be estimates: **${agreeStrict}**`,
    `- Only the street or a wider area: ${st.street_or_area || 0}; another house number: ${st.other_house_number || 0}; the right number in another ZIP: ${st.other_zip || 0}; a street estimate: ${st.street_estimate || 0}; no result: ${st.no_result || 0}`, '',
    'Agreeing matches by kind of OpenStreetMap object:', '',
    ...Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `- ${k}: ${v}`), '',
    'Points in nominatim-run/results.csv are © OpenStreetMap contributors (ODbL).', ''
  ];
}

if (process.argv[1] && process.argv[1].endsWith('nominatim-run.mjs')) {
  const input = table(arg('input'));
  const resFile = arg('results');
  const results = fs.existsSync(resFile) ? table(resFile) : [];
  const done = new Set(results.map(r => r.tbl + '|' + r.npi));
  const todo = input.filter(r => !done.has(r.tbl + '|' + r.npi)).slice(0, Number(arg('batch') || 3000));
  const q = v => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  const save = () => fs.writeFileSync(resFile, [COLS.join(','), ...results.map(r => COLS.map(c => q(r[c] ?? '')).join(','))].join('\n') + '\n');
  let failed = 0, refused = 0;
  for (let i = 0; i < todo.length; i++) {
    const res = await lookup(todo[i]);
    if (res.failed) { failed++; refused = res.failed === 'refused' ? refused + 1 : 0; if (refused >= 10 || failed > 200) { console.log('too many failures; stopping this batch'); break; } }
    else { refused = 0; results.push(record(todo[i], res.hit)); }
    if ((i + 1) % 250 === 0) { save(); console.log(`${i + 1}/${todo.length}, failed ${failed}`); }
    await sleep(1100);
  }
  save();
  const lines = summary(input, results);
  fs.writeFileSync(arg('report'), lines.join('\n'));
  console.log(lines.slice(0, 12).join('\n'));
  console.log('remaining=' + Math.max(0, input.length - results.length));
}
