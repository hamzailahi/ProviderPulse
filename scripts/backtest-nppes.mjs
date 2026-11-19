// Back-test input (2026-11-19, the user's choice: score as of the end of
// 2020, then check where clinicians entered in 2021 to 2025). Reads the NPPES
// monthly full file on stdin and writes, per practice ZIP, primary NUCC code
// and entity type, how many active NPIs were enumerated by the end of
// CUTOFF_YEAR ("before") and in the window after it ("entered"):
//   zip,code,entity,before,entered
// Deactivated NPIs carry no address or taxonomy in the file, so they cannot be
// placed: the 2020 supply is a survivors' count (stated in the report).
// Usage: unzip -p NPPES.zip npidata_pfile_X.csv | node scripts/backtest-nppes.mjs > counts.csv
import { streamCsvRows } from './lib/bulk.mjs';
import { pickNppesTaxonomy } from './lib/taxonomy-map.mjs';

const CUTOFF = Number(process.env.CUTOFF_YEAR || 2020), LAST = Number(process.env.LAST_YEAR || 2025);
let ix = null;
const agg = new Map();
const n = { rows: 0, deactivated: 0, no_zip: 0, no_code: 0, no_date: 0, before: 0, entered: 0, later: 0 };
for await (const row of streamCsvRows(process.stdin)) {
  if (!ix) {
    const h = row.map(x => x.trim());
    const col = name => { const i = h.indexOf(name); if (i < 0) throw new Error(`NPPES: no column "${name}"`); return i; };
    ix = { type: col('Entity Type Code'), deact: col('NPI Deactivation Date'), react: col('NPI Reactivation Date'),
      zip: col('Provider Business Practice Location Address Postal Code'), enumd: col('Provider Enumeration Date'),
      codes: Array.from({ length: 15 }, (_, i) => col(`Healthcare Provider Taxonomy Code_${i + 1}`)),
      sw: Array.from({ length: 15 }, (_, i) => col(`Healthcare Provider Primary Taxonomy Switch_${i + 1}`)) };
    continue;
  }
  n.rows++;
  const e = (row[ix.type] || '').trim();
  if (e !== '1' && e !== '2') continue;
  if ((row[ix.deact] || '').trim() && !(row[ix.react] || '').trim()) { n.deactivated++; continue; }
  const zip = (row[ix.zip] || '').replace(/\D/g, '').slice(0, 5);
  if (zip.length !== 5) { n.no_zip++; continue; }
  const t = pickNppesTaxonomy(ix.codes.map(i => row[i]), ix.sw.map(i => row[i]));
  if (!t) { n.no_code++; continue; }
  const y = Number(((row[ix.enumd] || '').match(/(\d{4})$/) || [])[1]);
  if (!y) { n.no_date++; continue; }
  const k = `${zip},${t.code},${e}`;
  let a = agg.get(k); if (!a) agg.set(k, a = [0, 0]);
  if (y <= CUTOFF) { a[0]++; n.before++; } else if (y <= LAST) { a[1]++; n.entered++; } else n.later++;
  if (n.rows % 1000000 === 0) process.stderr.write(`  ${n.rows.toLocaleString()} rows\n`);
}
if (n.rows < Number(process.env.NPPES_MIN_ROWS || 5000000)) throw new Error(`NPPES: only ${n.rows} rows`);
process.stdout.write('zip,code,entity,before,entered\n');
for (const [k, [b, en]] of agg) process.stdout.write(`${k},${b},${en}\n`);
process.stderr.write(JSON.stringify(n) + '\n');
