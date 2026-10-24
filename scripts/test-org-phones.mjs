// Organization phones from NPPES (scripts/org-phone-backfill.sh): which
// numbers are usable, which rows change, and the parser end to end on a small
// file shaped like the npidata_pfile.
//
// node scripts/test-org-phones.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cleanPhone, phoneChanges } from './lib/phones.mjs';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

console.log('1. Usable numbers');
check('10 digits pass', cleanPhone('8175550123') === '8175550123');
check('a leading 1 is dropped', cleanPhone('18175550123') === '8175550123');
check('punctuation is ignored', cleanPhone('(817) 555-0123') === '8175550123');
check('too short or with an extension is dropped', cleanPhone('5550123') === null && cleanPhone('81755501231234') === null);
check('an area code starting 0 or 1 is not a US number', cleanPhone('0175550123') === null && cleanPhone('1175550123') === null);
check('an exchange starting 0 or 1 is not a US number', cleanPhone('8171550123') === null);
check('a repeated digit is a placeholder', cleanPhone('9999999999') === null);

console.log('\n2. Which rows change');
const r = phoneChanges([['1000000001', ''], ['1000000002', '8175550123'], ['1000000003', '8175550000'], ['1000000004', '']],
  [['1000000001', '8175551111'], ['1000000002', '8175550123'], ['1000000003', '8175559999']]);
check('a new phone and a changed phone are written', r.changes.map(c => c[0]).join() === '1000000001,1000000003');
check('a phone already right is skipped', r.stats.already_right === 1);
check('no NPPES phone leaves the row alone (never blanked)', r.stats.no_nppes_phone === 1 && !r.changes.some(c => c[0] === '1000000004'));

console.log('\n3. Parser and matcher end to end');
const dir = mkdtempSync(join(tmpdir(), 'phones-'));
const head = ['NPI', 'Entity Type Code', 'Provider Organization Name (Legal Business Name)', 'NPI Deactivation Date', 'Provider Business Practice Location Address Telephone Number'];
const rows = [
  ['1000000001', '2', 'CITY PHARMACY', '', '8175551111'],
  ['1000000002', '1', '', '', '8175552222'],            // an individual: not this job
  ['1000000003', '2', 'OLD CLINIC, INC', '01/01/2020', '8175553333'],   // deactivated
  ['1000000004', '2', 'NO PHONE LLC', '', ''],
  ['1000000005', '2', 'BAD PHONE LLC', '', '123']];
const csv = [head, ...rows].map(r => r.map(v => '"' + v + '"').join(',')).join('\n') + '\n';
const out = execFileSync('node', ['scripts/nppes-phones.mjs'], { input: csv, env: { ...process.env, NPPES_MIN_ROWS: '1' }, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
check('only active organizations with a usable phone are written', out === 'npi,phone\n1000000001,8175551111\n', JSON.stringify(out));
writeFileSync(join(dir, 'nppes.csv'), out);
writeFileSync(join(dir, 'clinics.csv'), 'npi,phone\n1000000001,\n1000000004,\n');
execFileSync('node', ['scripts/org-phone-assign.mjs', '--rows', join(dir, 'clinics.csv'), '--nppes', join(dir, 'nppes.csv'),
  '--assign', join(dir, 'assign.csv'), '--summary', join(dir, 'summary.md')], { stdio: 'pipe' });
check('the assignment file holds the one phone to write', readFileSync(join(dir, 'assign.csv'), 'utf8') === 'npi,phone\n1000000001,8175551111\n');
check('the summary counts it', /to write: \*\*1\*\*/.test(readFileSync(join(dir, 'summary.md'), 'utf8')));
let threw = false;
try { execFileSync('node', ['scripts/nppes-phones.mjs'], { input: 'NPI,Entity Type Code\n1,2\n', env: { ...process.env, NPPES_MIN_ROWS: '1' }, stdio: 'pipe' }); } catch (e) { threw = true; }
check('a file without the phone column is refused', threw);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
