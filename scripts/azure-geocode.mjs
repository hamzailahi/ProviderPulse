// node scripts/azure-geocode.mjs --in rows.csv --out placed.csv --misses misses.csv --max N
// rows: tbl,key,address,city,state,zip. placed: tbl,key,lat,lng,how.
// misses: tbl,key,why,mzip,lat,lng,building. Needs AZURE_MAPS_KEY.
// Exits 2 when more than 5% of requests failed (an outage is not "no match").
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { azureAll } from './lib/azure-geocode.mjs';

const arg = (k, d = null) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const key = process.env.AZURE_MAPS_KEY;
if (!key) { console.error('AZURE_MAPS_KEY is not set'); process.exit(1); }
const rows = parseCsv(readFileSync(arg('in'), 'utf8'));
const head = rows.shift() || [];
const col = Object.fromEntries(head.map((h, i) => [h, i]));
const items = rows.map((r, i) => ({ id: String(i), tbl: r[col.tbl], key: r[col.key], address: r[col.address], city: r[col.city], state: r[col.state], zip: (r[col.zip] || '').slice(0, 5) }))
  .filter(it => it.address && /^\d{5}$/.test(it.zip));
const max = Number(arg('max', items.length));
const { coords, misses, failed, stats } = await azureAll(items, { key, max, log: m => console.error(m) });
const by = new Map(items.map(it => [it.id, it]));
writeFileSync(arg('out'), ['tbl,key,lat,lng,how', ...[...coords].map(([id, c]) => [by.get(id).tbl, by.get(id).key, c.lat.toFixed(7), c.lng.toFixed(7), c.how].join(','))].join('\n') + '\n');
if (arg('misses')) writeFileSync(arg('misses'), ['tbl,key,why,mzip,lat,lng,building', ...[...misses].map(([id, m]) => [by.get(id).tbl, by.get(id).key, m.why, m.zip || '', m.lat != null ? m.lat.toFixed(7) : '', m.lng != null ? m.lng.toFixed(7) : '', m.building ? 1 : 0].join(','))].join('\n') + '\n');
console.log('Azure: ' + JSON.stringify(stats));
if (stats.asked && stats.failed / stats.asked > 0.05) process.exit(2);
