// Geocodes the Medicare addresses chosen by scripts/address-check.mjs (moves
// CSV: npi,address,city,state,zip,facility) with the refresh's rule: Census
// exact in the same ZIP (or the same address written another way), Google off;
// anything else is stored with no pin (not drawn) rather than a guess.
// node scripts/address-geocode.mjs IN OUT
import { readFileSync, writeFileSync } from 'node:fs';
import { geocodeAll } from './lib/geocode-batch.mjs';
import { splitCsv } from './lib/dac.mjs';
const [inp, outp] = process.argv.slice(2);
const rows = readFileSync(inp, 'utf8').split('\n').filter(Boolean).map(splitCsv);
const items = rows.map(([npi, address, city, state, zip]) => ({ id: npi, address, city, state, zip }));
const { coords, failed, stats } = await geocodeAll(items, { log: m => console.error(m) });
console.log('geocode', JSON.stringify(stats));
if (items.length && failed.size / items.length > 0.05) { console.error(`::error::${failed.size} of ${items.length} geocodes failed (outage); nothing written`); process.exit(1); }
const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
writeFileSync(outp, rows.map(([npi, a, c, s, z, f]) => { const g = coords.get(npi); return [npi, q(a), q(c), s, z, q(f), g ? g.lat : '', g ? g.lng : ''].join(','); }).join('\n') + (rows.length ? '\n' : ''));
console.log('placed', [...coords.keys()].length, 'of', items.length);
