// County Health Rankings' preventable hospital stays per county (2026-11-20),
// written as fips,rate,release_year,data_years for scripts/import-chr.sh.
// CHR's analytic CSV has two header rows: display names, then variable codes
// (v005_rawvalue). Columns are found by code, else by name. Read only.
// Usage: node scripts/import-chr.mjs --out FILE [--url CSV]
import { createWriteStream } from 'node:fs';
import { fetchCsvRows } from './lib/bulk.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : ''; };

export function candidateUrls(now = new Date()) {
  const out = [], y0 = now.getUTCFullYear() + 1;
  for (let y = y0; y >= y0 - 4; y--) for (const v of ['_v3', '_v2', '_v1', '']) {
    out.push(`https://www.countyhealthrankings.org/sites/default/files/media/document/analytic_data${y}${v}.csv`);
  }
  return out;
}

async function pickUrl() {
  if (arg('url')) return arg('url');
  for (const u of candidateUrls()) {
    try {
      const r = await fetch(u, { method: 'GET', headers: { Range: 'bytes=0-0', 'User-Agent': 'ProviderPulse-import' } });
      console.log(r.status, u);
      if (r.ok || r.status === 206) return u;
    } catch (e) { console.log('error', u, e.message); }
  }
  throw new Error('no County Health Rankings analytic file found; pass --url');
}

/** Find the columns from the two header rows. */
export function findColumns(names, codes) {
  const lc = a => a.map(x => String(x || '').trim().toLowerCase());
  const n = lc(names), c = lc(codes);
  const by = (code, re) => { let i = c.indexOf(code); if (i < 0) i = n.findIndex(x => re.test(x)); return i; };
  return {
    fips: by('fipscode', /5-digit fips/),
    county: by('countycode', /county fips code/),
    year: by('year', /release year/),
    rate: by('v005_rawvalue', /^preventable hospital stays raw value$/)
  };
}

if (process.argv[1] && process.argv[1].endsWith('import-chr.mjs')) {
  const url = await pickUrl();
  console.log('using', url);
  const out = createWriteStream(arg('out'));
  out.write('fips,rate,release_year,data_years\n');
  let names = null, codes = null, col, n = 0, kept = 0, blank = 0;
  for await (const row of fetchCsvRows(url, 'chr')) {
    if (!names) { names = row; continue; }
    if (!codes) {
      codes = row; col = findColumns(names, codes);
      console.log('columns', JSON.stringify(col), 'rate column', JSON.stringify(names[col.rate]));
      if (Object.values(col).some(i => i < 0)) { console.log('names:', names.join(' | ')); throw new Error('a needed column is missing'); }
      continue;
    }
    n++;
    const fips = String(row[col.fips] || '').trim().padStart(5, '0');
    if (!/^\d{5}$/.test(fips) || fips.endsWith('000')) continue;   // national and state rows
    const v = Number(String(row[col.rate] || '').replace(/,/g, ''));
    if (!String(row[col.rate] || '').trim() || !Number.isFinite(v)) { blank++; continue; }
    out.write([fips, v, String(row[col.year]).trim(), ''].join(',') + '\n'); kept++;
  }
  out.end();
  console.log('rows', n, 'counties with a rate', kept, 'counties blank', blank);
  if (kept < 2500) throw new Error('fewer than 2,500 counties with a rate');
}
