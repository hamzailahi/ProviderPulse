// Gives listings with no coordinates an exact location where one exists
// (place-unmapped.yml, scripts/place-unmapped.sh). Rows the hourly ZIP job
// inserted, and rows the weekly refresh could not place, are stored with null
// coordinates and never drawn on any map. Same rule as the refresh
// (scripts/lib/geocode-batch.mjs): a Census Exact match in the same ZIP, or
// nothing; no ZIP centres.
//
// node scripts/place-unmapped.mjs --in rows.csv --out placed.csv --summary out.md [--sample 300]
//   rows.csv: tbl,key,address,city,state,zip (header first)
//   placed.csv: tbl,key,lat,lng (only rows that got a location)
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { geocodeAll } from './lib/geocode-batch.mjs';

const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const fmt = n => Number(n || 0).toLocaleString('en-US');
const rows = parseCsv(readFileSync(arg('in'), 'utf8'));
const head = rows.shift() || [];
const col = Object.fromEntries(head.map((h, i) => [h, i]));
for (const c of ['tbl', 'key', 'address', 'city', 'state', 'zip']) if (!(c in col)) throw new Error(`rows file has no ${c} column`);
let items = rows.map((r, i) => ({ id: String(i), tbl: r[col.tbl], key: r[col.key], address: r[col.address], city: r[col.city], state: r[col.state], zip: r[col.zip] }))
  .filter(it => it.address && /^\d{5}$/.test(it.zip));
const sample = Number(arg('sample', 0)) || 0;
if (sample) items = items.slice(0, sample);

const { coords, failed, stats } = await geocodeAll(items, { googleKey: process.env.GOOGLE_GEOCODING_KEY || null, log: m => console.error(m) });
const out = ['tbl,key,lat,lng'];
const per = {};
for (const it of items) {
  const t = per[it.tbl] || (per[it.tbl] = { asked: 0, placed: 0, failed: 0 });
  t.asked++;
  const c = coords.get(it.id);
  if (c) { t.placed++; out.push([it.tbl, it.key, c.lat.toFixed(7), c.lng.toFixed(7)].join(',')); }
  else if (failed.has(it.id)) t.failed++;
}
writeFileSync(arg('out'), out.join('\n') + '\n');
const lines = [`## Geocoding${sample ? ` (a sample of ${fmt(sample)})` : ''}`, '',
  '| Table | Tried | Placed (exact) | Left unplaced | Geocoder failed |', '|---|---|---|---|---|',
  ...Object.entries(per).map(([t, v]) => `| ${t} | ${fmt(v.asked)} | ${fmt(v.placed)} | ${fmt(v.asked - v.placed - v.failed)} | ${fmt(v.failed)} |`), '',
  `Census exact ${fmt(stats.census_exact)}, Google ${fmt(stats.google)} (off unless a key is passed); an address without an exact match keeps no coordinates.`];
writeFileSync(arg('summary'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
// A geocoder outage is not "no match": say so, and fail the run so it shows red.
if (items.length && failed.size / items.length > 0.05) { console.error(`geocoder failed for ${failed.size} of ${items.length}`); process.exit(2); }
