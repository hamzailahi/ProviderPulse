#!/usr/bin/env node
// Read-only discovery for the insurance-plan expansion (2026-10-11). Finds the
// newest copy of the two official CMS files the payer list will be built from,
// downloads them, and records their URLs, the files inside, every column name,
// a few sample rows and row counts in supabase/reference/payer-sources/
// discovery.md. Nothing is written to the database.
//
//   1. Medical Loss Ratio (MLR) public use files: every insurer selling
//      individual, small-group or large-group medical coverage, per state,
//      with covered lives. Published as yearly zip files on cms.gov.
//   2. Medicaid Managed Care Enrollment by Program and Plan: every Medicaid
//      managed care plan per state with enrollment, on data.medicaid.gov.
//
// The parser that builds the reviewed payer list is written against what this
// records, never against guessed column names (see CLAUDE.md: "verify field
// names against a live query").
//
// Run: node scripts/payer-sources-discover.mjs [outdir]

import { writeFileSync, readFileSync, mkdirSync, mkdtempSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const OUT = process.argv[2] || 'supabase/reference/payer-sources';
mkdirSync(OUT, { recursive: true });
const work = mkdtempSync(join(tmpdir(), 'payers-'));
const lines = ['<!-- Written by scripts/payer-sources-discover.mjs. Read only. -->', `# Payer source discovery, ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, ''];
const note = s => { lines.push(s); console.log(s); };
const UA = { 'User-Agent': 'ProviderPulse payer discovery (github.com/hamzailahi/ProviderPulse)' };

async function get(url, ms = 60000) {
  const r = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r;
}

// CSV: a quoted-field parser good enough to read headers and sample rows.
function parseLine(s) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
}
function describeCsv(text, label) {
  const rows = text.split(/\r?\n/).filter(Boolean);
  note(`\n#### ${label}\n`);
  note(`${(rows.length - 1).toLocaleString()} data rows. Columns:\n`);
  note('`' + parseLine(rows[0]).join('`, `') + '`\n');
  note('Sample rows:\n');
  note('```');
  rows.slice(1, 6).forEach(r => note(r.slice(0, 400)));
  note('```');
}

// ---------------------------------------------------------------- 1. MLR ----
async function mlr() {
  note('## 1. Medical Loss Ratio public use files (cms.gov)\n');
  const pages = [
    'https://www.cms.gov/marketplace/resources/data/medical-loss-ratio-data-systems-resources',
    'https://www.cms.gov/CCIIO/Resources/Data-Resources/mlr',
    'https://www.cms.gov/cciio/resources/data-resources/mlr'
  ];
  const links = new Map();
  for (const p of pages) {
    try {
      const html = await (await get(p)).text();
      note(`- read ${p} (${html.length.toLocaleString()} bytes)`);
      for (const m of html.matchAll(/href="([^"]+?\.zip)"/gi)) {
        const href = new URL(m[1], p).href;
        if (/mlr|loss/i.test(href)) links.set(href, true);
      }
    } catch (e) { note(`- could not read ${p}: ${e.message}`); }
  }
  const zips = [...links.keys()];
  note(`\nZip links found (${zips.length}):\n`);
  zips.forEach(z => note(`- ${z}`));
  if (!zips.length) { console.log('::warning::No MLR zip links found'); return; }
  // Newest reporting year: the largest 4-digit year in the file name.
  const year = z => Math.max(0, ...(decodeURIComponent(z).match(/20\d\d/g) || []).map(Number));
  const pick = zips.sort((a, b) => year(b) - year(a))[0];
  note(`\nNewest (by the year in its name): **${pick}**`);
  const file = join(work, 'mlr.zip');
  writeFileSync(file, Buffer.from(await (await get(pick, 300000)).arrayBuffer()));
  note(`Downloaded ${(statSync(file).size / 1e6).toFixed(1)} MB.\n`);
  const listing = execFileSync('unzip', ['-l', file], { encoding: 'utf8' });
  note('Files inside:\n\n```\n' + listing.trim() + '\n```');
  const dir = join(work, 'mlr'); mkdirSync(dir);
  execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
  const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  for (const f of walk(dir).filter(f => /\.(csv|txt)$/i.test(f))) {
    describeCsv(readFileSync(f, 'latin1'), f.slice(dir.length + 1));
  }
}

// ----------------------------------------------- 2. Medicaid managed care ----
async function medicaid() {
  note('\n## 2. Medicaid managed care enrollment (data.medicaid.gov)\n');
  const items = await (await get('https://data.medicaid.gov/api/1/metastore/schemas/dataset/items?show-reference-ids=false', 120000)).json();
  const hits = items.filter(d => /managed care/i.test(d.title || '') && /(plan|program)/i.test(d.title || ''));
  note(`Datasets whose title mentions managed care and plan or program (${hits.length}):\n`);
  for (const d of hits) {
    const dl = (d.distribution || []).map(x => x.downloadURL || (x.data && x.data.downloadURL)).filter(Boolean);
    note(`- **${d.title}** (modified ${d.modified || '?'}, id ${d.identifier})${dl.length ? ': ' + dl.join(' , ') : ''}`);
  }
  const best = hits.filter(d => /by program and plan/i.test(d.title)).sort((a, b) => String(b.modified).localeCompare(String(a.modified)))[0]
    || hits.sort((a, b) => String(b.modified).localeCompare(String(a.modified)))[0];
  if (!best) { console.log('::warning::No Medicaid managed care plan dataset found'); return; }
  const url = (best.distribution || []).map(x => x.downloadURL || (x.data && x.data.downloadURL)).find(u => /\.csv/i.test(u || ''));
  note(`\nUsing **${best.title}**: ${url || 'no CSV distribution'}`);
  if (url) describeCsv(await (await get(url, 300000)).text(), best.title);
}

let failed = false;
for (const step of [mlr, medicaid]) {
  try { await step(); } catch (e) { failed = true; note(`\n**${step.name} failed:** ${e.message}`); console.log(`::error::${step.name}: ${e.message}`); }
}
writeFileSync(join(OUT, 'discovery.md'), lines.join('\n') + '\n');
console.log(`\nwrote ${join(OUT, 'discovery.md')}`);
process.exit(failed ? 1 : 0);
