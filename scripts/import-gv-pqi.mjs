// Writes avoidable admission rates per county and year to a CSV for
// scripts/import-gv-pqi.sh: fips,year,<21 columns>. Read only.
// Usage: node scripts/import-gv-pqi.mjs --out FILE [--url CSV]
import { createWriteStream } from 'node:fs';
import { resolve } from './lib/cms-catalog.mjs';
import { fetchCsvRows } from './lib/bulk.mjs';
import { mapHeader, COLUMNS, num } from './lib/gv-pqi.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : ''; };
const url = arg('url') || (await resolve(/^Medicare Geographic Variation\s*-\s*by National, State\s*(&|and)\s*County$/i, 'gv')).url;
const out = createWriteStream(arg('out'));
out.write(['fips', 'year', ...COLUMNS].join(',') + '\n');
let header = null, idx, m, n = 0, kept = 0, levels = new Map(), ages = new Map();
for await (const row of fetchCsvRows(url, 'gv')) {
  if (!header) {
    header = row;
    const H = row.map(h => String(h).toUpperCase());
    idx = k => H.indexOf(k);
    m = mapHeader(row);
    console.log('columns', row.length, 'PQI mapped', Object.keys(m.map).length, 'missing', m.missing.join(' ') || 'none', 'unused', m.unused.join(' ') || 'none');
    if (m.missing.length === COLUMNS.length) { console.log('header:', row.join(' ')); throw new Error('no PQI column found'); }
    for (const k of ['BENE_GEO_LVL', 'BENE_GEO_CD', 'YEAR']) if (idx(k) < 0) { console.log('header:', row.join(' ')); throw new Error('missing ' + k); }
    continue;
  }
  n++;
  const lvl = row[idx('BENE_GEO_LVL')], age = idx('BENE_AGE_LVL') >= 0 ? row[idx('BENE_AGE_LVL')] : 'All';
  levels.set(lvl, (levels.get(lvl) || 0) + 1); ages.set(age, (ages.get(age) || 0) + 1);
  if (!/^county$/i.test(lvl) || !/^all$/i.test(String(age).trim())) continue;
  const fips = String(row[idx('BENE_GEO_CD')]).trim().padStart(5, '0');
  if (!/^\d{5}$/.test(fips)) continue;
  if (kept < 3 || (kept % 5000 === 0)) console.log('sample', fips, row[idx('YEAR')], Object.entries(m.map).slice(0, 6).map(([c, i]) => c + '=' + JSON.stringify(row[i])).join(' '));
  const vals = COLUMNS.map(c => (c in m.map ? num(row[m.map[c]]) : null));
  out.write([fips, String(row[idx('YEAR')]).trim(), ...vals.map(v => v ?? '')].join(',') + '\n'); kept++;
}
out.end();
console.log('rows', n, 'county rows kept', kept, 'levels', JSON.stringify([...levels]), 'age levels', JSON.stringify([...ages]));
if (kept < 2500) throw new Error('fewer than 2,500 county rows');
