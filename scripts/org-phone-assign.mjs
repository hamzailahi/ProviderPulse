// Joins the exported clinics rows (npi,phone) with the NPPES phones and writes
// the rows to update plus a markdown summary. Used by org-phone-backfill.sh.
//
// node scripts/org-phone-assign.mjs --rows clinics.csv --nppes nppes-phones.csv --assign assign.csv --summary summary.md
import { readFileSync, writeFileSync } from 'node:fs';
import { phoneChanges } from './lib/phones.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); if (i < 0) throw new Error('missing --' + k); return process.argv[i + 1]; };
const lines = f => readFileSync(f, 'utf8').split('\n').slice(1).filter(Boolean).map(l => l.split(','));
const directory = lines(arg('rows')).map(([npi, phone]) => [npi, phone || '']);
const nppes = lines(arg('nppes')).map(([npi, phone]) => [npi, phone]);
const { changes, stats } = phoneChanges(directory, nppes);
writeFileSync(arg('assign'), 'npi,phone\n' + changes.map(c => c.join(',')).join('\n') + (changes.length ? '\n' : ''));
const f = v => v.toLocaleString('en-US');
writeFileSync(arg('summary'), [
  '## Organization phones', '',
  `- clinics rows: ${f(stats.directory_rows)}`,
  `- with a phone in NPPES: ${f(stats.matched)} (${(stats.matched / Math.max(1, stats.directory_rows) * 100).toFixed(1)}%)`,
  `- already right: ${f(stats.already_right)}`,
  `- to write: **${f(stats.to_write)}**`,
  `- no NPPES phone (deactivated, missing from the file, or no usable number): ${f(stats.no_nppes_phone)}`, ''].join('\n'));
console.log(JSON.stringify(stats));
