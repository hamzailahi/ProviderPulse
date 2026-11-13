// Joins an exported table's rows (npi,fax) with the NPPES faxes for one
// entity type and writes the rows to update plus a markdown summary. Run
// once per table by scripts/fax-backfill.sh.
//
// node scripts/fax-assign.mjs --table clinics --rows clinics.csv --nppes nppes-fax-orgs.csv --assign assign-clinics.csv --summary assign-clinics.md
import { readFileSync, writeFileSync } from 'node:fs';
import { phoneChanges } from './lib/phones.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); if (i < 0) throw new Error('missing --' + k); return process.argv[i + 1]; };
const lines = f => readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map(l => l.split(','));
const table = arg('table');
const directory = lines(arg('rows')).map(([npi, fax]) => [npi, fax || '']);
const nppes = lines(arg('nppes')).map(([npi, fax]) => [npi, fax]);
const { changes, stats } = phoneChanges(directory, nppes);
writeFileSync(arg('assign'), 'npi,fax\n' + changes.map(c => c.join(',')).join('\n') + (changes.length ? '\n' : ''));
const f = v => v.toLocaleString('en-US');
writeFileSync(arg('summary'), [
  `## ${table} faxes`, '',
  `- ${table} rows: ${f(stats.directory_rows)}`,
  `- with a fax in NPPES: ${f(stats.matched)} (${(stats.matched / Math.max(1, stats.directory_rows) * 100).toFixed(1)}%)`,
  `- already right: ${f(stats.already_right)}`,
  `- to write: **${f(stats.to_write)}**`,
  `- no NPPES fax (deactivated, missing from the file, no usable number, or NPPES simply has none on file): ${f(stats.no_nppes_phone)}`, ''].join('\n'));
console.log(JSON.stringify(stats));
