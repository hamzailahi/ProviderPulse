#!/usr/bin/env node
// Builds the PROPOSED insurance plan list for review (2026-10-11). Nothing is
// written to the database: the output is a CSV and a summary in
// supabase/reference/payer-sources/ that the user reviews as a spreadsheet.
//
// Sources (columns recorded live in payer-sources/discovery.md):
//   - CMS Medical Loss Ratio public use file: every insurer selling
//     individual, small-group or large-group medical coverage per state, with
//     covered lives per market.
//   - data.medicaid.gov Managed Care Enrollment by Program and Plan, newest
//     year, comprehensive managed care programs only.
//
// Names: the insurer's marketing name (DBA) or the Medicaid plan name, with
// corporate suffixes removed, unless supabase/reference/payer-brand-map.csv
// (reviewed, exact matches only) says otherwise. Insurers with fewer than
// MIN_MEMBERS (default 1,000) members in a state are left out and counted.
//
// Run: node scripts/build-payer-proposal.mjs [--mlr URL] [--medicaid URL] [--out DIR]

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { objects, coveredLivesCode, mlrInsurers, medicaidPlans, rollUp, parseBrandMap } from './lib/payers.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MLR_URL = arg('--mlr', 'https://www.cms.gov/files/zip/mlr-public-use-file-2024.zip');
const MCD_URL = arg('--medicaid', 'https://download.medicaid.gov/data/managed-care-enrollment-by-program-and-plan2024-table4.csv');
const OUT = arg('--out', 'supabase/reference/payer-sources');
const MIN = Number(process.env.MIN_MEMBERS) || 1000;
const UA = { 'User-Agent': 'ProviderPulse payer proposal (github.com/hamzailahi/ProviderPulse)' };
mkdirSync(OUT, { recursive: true });

const get = async (url, ms = 300000) => {
  if (!/^https?:/.test(url)) return { buf: readFileSync(url) };                // local file (tests)
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return { buf: Buffer.from(await r.arrayBuffer()) };
};

const work = mkdtempSync(join(tmpdir(), 'payer-proposal-'));
const summary = ['<!-- Written by scripts/build-payer-proposal.mjs. A proposal for review; nothing is loaded. -->',
  `# Insurance plan proposal, ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, '',
  `Sources: ${MLR_URL} and ${MCD_URL}. Cutoff: at least ${MIN.toLocaleString()} members in the state.`, ''];
const say = s => { summary.push(s); console.log(s); };

const brandFile = 'supabase/reference/payer-brand-map.csv';
const brandMap = existsSync(brandFile) ? parseBrandMap(readFileSync(brandFile, 'utf8')) : new Map();
say(`Reviewed brand map entries: ${brandMap.size}.`);

// ---- MLR ----
const zip = join(work, 'mlr.zip');
writeFileSync(zip, (await get(MLR_URL)).buf);
const mlrDir = join(work, 'mlr');
mkdirSync(mlrDir);
execFileSync('unzip', ['-q', '-o', '-j', zip, '-d', mlrDir]);
const read = f => objects(readFileSync(join(mlrDir, f), 'latin1'));
const rowLookup = read('MR_Submission_Row_Lookup.csv');
const codes = coveredLivesCode(rowLookup);
say(`\nCovered-lives rows used: ${codes.map(c => '`' + c + '` (' + (rowLookup.find(r => r.lookup_code === c) || {}).lookup_name + ')').join(', ')}.`);
const headers = read('MR_Submission_Template_Header.csv');
const part12 = read('Part1_2_Summary_Data_Premium_Claims.csv').filter(r => codes.includes(r.row_lookup_code));
const mlr = mlrInsurers(headers, part12, codes, brandMap);
say(`MLR: ${headers.length.toLocaleString()} filings, ${mlr.length.toLocaleString()} state filings with covered lives, ${mlr.reduce((a, x) => a + x.members, 0).toLocaleString()} covered lives in all.`);
// Sanity: the biggest filings, so a wrong column shows up as nonsense here.
say('\nLargest state filings (check these look right):\n');
say('| State | Company | Individual | Small group | Large group |');
say('|---|---|---|---|---|');
mlr.slice().sort((a, b) => b.members - a.members).slice(0, 12).forEach(x =>
  say(`| ${x.state} | ${x.legal_name} | ${x.markets.individual.toLocaleString()} | ${x.markets.small_group.toLocaleString()} | ${x.markets.large_group.toLocaleString()} |`));

// ---- Medicaid ----
const mcdRows = objects((await get(MCD_URL)).buf.toString('utf8'));
const mcd = medicaidPlans(mcdRows, brandMap);
say(`\nMedicaid: ${mcdRows.length.toLocaleString()} rows; newest year ${mcd[0] ? mcd[0].year : '?'}; ${mcd.length.toLocaleString()} comprehensive managed care plan rows, ${mcd.reduce((a, x) => a + x.members, 0).toLocaleString()} enrollees.`);

// ---- roll up and compare with what is already listed ----
const { kept, dropped, excluded } = rollUp(mlr.concat(mcd), MIN);
const seeded = new Set();
for (const m of readFileSync('supabase/migrations/003_insurance_payers.sql', 'utf8').matchAll(/\('([^']+)',\s*(null|'([A-Z]{2})')/g)) seeded.add((m[3] || '*') + '|' + m[1].toLowerCase());
const already = x => seeded.has(x.state + '|' + x.brand.toLowerCase()) || seeded.has('*|' + x.brand.toLowerCase());
say(`\nProposed: **${kept.length.toLocaleString()}** state plans (${kept.filter(x => x.categories.includes('medicaid')).length} with Medicaid, ${kept.filter(x => x.category === 'marketplace').length} individual-market only, ${kept.filter(x => x.category === 'commercial').length} commercial); ${kept.filter(already).length} are already in the list. Below the cutoff and left out: ${dropped.length.toLocaleString()}. Left out by the reviewed map as not medical plans: ${excluded.length} (${[...new Set(excluded.map(x => x.legal_name))].join(', ') || 'none'}).`);

const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const lines = [['state', 'category', 'brand', 'members', 'already_listed', 'brand_basis', 'source_names', 'parent_group', 'sources', 'markets'].join(',')];
kept.sort((a, b) => a.state.localeCompare(b.state) || a.category.localeCompare(b.category) || b.members - a.members).forEach(x =>
  lines.push([x.state, x.category, x.brand, x.members, already(x) ? 'yes' : '', x.bases.join('; '), x.names.join('; '), x.groups.join('; '), x.sources.join('; '), x.categories.join('; ')].map(q).join(',')));
writeFileSync(join(OUT, 'payer-proposal.csv'), lines.join('\n') + '\n');

// Parent groups by members, for the reviewed brand map.
const groups = new Map();
for (const x of mlr.concat(mcd)) if (x.group) groups.set(x.group, (groups.get(x.group) || 0) + x.members);
say('\nLargest parent groups (candidates for the reviewed brand map):\n');
[...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([g, n]) => say(`- ${g}: ${n.toLocaleString()}`));

writeFileSync(join(OUT, 'payer-proposal-summary.md'), summary.join('\n') + '\n');
console.log(`\nwrote ${join(OUT, 'payer-proposal.csv')} and the summary`);
