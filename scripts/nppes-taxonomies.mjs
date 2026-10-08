// Reads the NPPES monthly full file (npidata_pfile_*.csv) on stdin and writes
// one line per NPI that lists a taxonomy: npi,code,source  (source is
// nppes_primary or nppes_first, see pickNppesTaxonomy). NPIs with no taxonomy
// (deactivated records are blank apart from the NPI and dates) are counted and
// skipped. Summary counts go to stderr as JSON on the last line.
//
// Usage: unzip -p NPPES.zip npidata_pfile_X.csv | node scripts/nppes-taxonomies.mjs > nppes-taxonomy.csv
import { streamCsvRows } from './lib/bulk.mjs';
import { pickNppesTaxonomy } from './lib/taxonomy-map.mjs';

const out = process.stdout;
let header = null, ix = null;
const n = { rows: 0, primary: 0, first: 0, none: 0, deactivated_blank: 0 };
let buf = [];
const flush = () => { if (buf.length) { out.write(buf.join('')); buf = []; } };

for await (const row of streamCsvRows(process.stdin)) {
  if (!header) {
    header = row.map(h => h.trim());
    const col = name => {
      const i = header.indexOf(name);
      if (i < 0) throw new Error(`NPPES: no column "${name}". Is this the npidata_pfile (not the fileheader or pl_pfile)?`);
      return i;
    };
    ix = { npi: col('NPI'), deact: col('NPI Deactivation Date'), codes: [], switches: [] };
    for (let k = 1; k <= 15; k++) {
      ix.codes.push(col(`Healthcare Provider Taxonomy Code_${k}`));
      ix.switches.push(col(`Healthcare Provider Primary Taxonomy Switch_${k}`));
    }
    out.write('npi,code,source\n');
    continue;
  }
  n.rows++;
  const npi = (row[ix.npi] || '').trim();
  if (!/^\d{10}$/.test(npi)) continue;
  const pick = pickNppesTaxonomy(ix.codes.map(i => row[i]), ix.switches.map(i => row[i]));
  if (!pick) {
    n.none++;
    if ((row[ix.deact] || '').trim()) n.deactivated_blank++;
    continue;
  }
  if (pick.source === 'nppes_primary') n.primary++; else n.first++;
  buf.push(`${npi},${pick.code},${pick.source}\n`);
  if (buf.length >= 5000) flush();
  if (n.rows % 1000000 === 0) process.stderr.write(`  ${n.rows.toLocaleString()} NPPES rows read\n`);
}
flush();
// The full file has about 9 million rows; fewer means a truncated download or
// the wrong member of the zip. NPPES_MIN_ROWS exists only for tests.
const MIN_ROWS = Number(process.env.NPPES_MIN_ROWS || 5000000);
if (n.rows < MIN_ROWS) throw new Error(`NPPES: only ${n.rows} rows; the full file has about 9 million`);
process.stderr.write(JSON.stringify(n) + '\n');
