// Reads the NPPES monthly full file (npidata_pfile_*.csv) on stdin and writes
// one line per organization (entity type 2) with a usable practice phone:
// npi,phone (10 digits). Deactivated and blank records are skipped. Counts go
// to stderr as JSON on the last line. Used by scripts/org-phone-backfill.sh.
//
// Usage: unzip -p NPPES.zip npidata_pfile_X.csv | node scripts/nppes-phones.mjs > nppes-phones.csv
import { streamCsvRows } from './lib/bulk.mjs';
import { cleanPhone } from './lib/phones.mjs';

const out = process.stdout;
let ix = null;
const n = { rows: 0, organizations: 0, with_phone: 0, bad_phone: 0, deactivated: 0 };
let buf = [];
const flush = () => { if (buf.length) { out.write(buf.join('')); buf = []; } };

for await (const row of streamCsvRows(process.stdin)) {
  if (!ix) {
    const header = row.map(h => h.trim());
    const col = name => {
      const i = header.indexOf(name);
      if (i < 0) throw new Error(`NPPES: no column "${name}". Is this the npidata_pfile (not the fileheader or pl_pfile)?`);
      return i;
    };
    ix = { npi: col('NPI'), type: col('Entity Type Code'), deact: col('NPI Deactivation Date'),
      phone: col('Provider Business Practice Location Address Telephone Number') };
    out.write('npi,phone\n');
    continue;
  }
  n.rows++;
  if ((row[ix.type] || '').trim() !== '2') continue;
  const npi = (row[ix.npi] || '').trim();
  if (!/^\d{10}$/.test(npi)) continue;
  n.organizations++;
  if ((row[ix.deact] || '').trim()) { n.deactivated++; continue; }
  const raw = (row[ix.phone] || '').trim();
  if (!raw) continue;
  const phone = cleanPhone(raw);
  if (!phone) { n.bad_phone++; continue; }
  n.with_phone++;
  buf.push(`${npi},${phone}\n`);
  if (buf.length >= 5000) flush();
  if (n.rows % 1000000 === 0) process.stderr.write(`  ${n.rows.toLocaleString()} NPPES rows read\n`);
}
flush();
const MIN_ROWS = Number(process.env.NPPES_MIN_ROWS || 5000000);
if (n.rows < MIN_ROWS) throw new Error(`NPPES: only ${n.rows} rows; the full file has about 9 million`);
process.stderr.write(JSON.stringify(n) + '\n');
