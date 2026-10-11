#!/usr/bin/env node
// Read-only discovery for the procedure-data expansion (2026-10-11): the two
// Medicare hospital files that sit beside the Part B file the Procedures panel
// already shows. For each it resolves the newest CSV from the CMS catalog,
// records the URL, size, every column and a few sample rows, and writes
// supabase/reference/procedure-sources/medicare-hospital.md. Nothing is
// written to the database. Parsers are written against what this records.
//
// Run: node scripts/procedure-sources-discover.mjs [outdir]

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { resolve } from './lib/cms-catalog.mjs';

const OUT = process.argv[2] || 'supabase/reference/procedure-sources';
mkdirSync(OUT, { recursive: true });
const lines = ['<!-- Written by scripts/procedure-sources-discover.mjs. Read only. -->',
  `# Medicare hospital procedure sources, ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, ''];
const note = s => { lines.push(s); console.log(s); };

const SOURCES = [
  ['Outpatient hospitals by provider and service', /^Medicare Outpatient Hospitals\s*-?\s*by Provider and Service$/i],
  ['Inpatient hospitals by provider and service', /^Medicare Inpatient Hospitals\s*-?\s*by Provider and Service$/i],
  ['Outpatient hospitals by geography and service', /^Medicare Outpatient Hospitals\s*-?\s*by Geography and Service$/i],
  ['Inpatient hospitals by geography and service', /^Medicare Inpatient Hospitals\s*-?\s*by Geography and Service$/i]
];

// First ~256 KB only: enough for the header and samples without the whole file.
async function head(url) {
  const r = await fetch(url, { headers: { Range: 'bytes=0-262143', 'User-Agent': 'ProviderPulse discovery' }, signal: AbortSignal.timeout(60000) });
  if (!r.ok && r.status !== 206) throw new Error(`HTTP ${r.status}`);
  const size = (r.headers.get('content-range') || '').split('/')[1] || r.headers.get('content-length') || '?';
  const text = await r.text();
  return { size, rows: text.split(/\r?\n/).slice(0, 7) };
}

let failed = false;
for (const [label, re] of SOURCES) {
  note(`\n## ${label}\n`);
  try {
    const pick = await resolve(re, label);
    note(`- dataset: ${pick.dataset}`);
    note(`- year: ${pick.year || '?'}; url: ${pick.url}`);
    const { size, rows } = await head(pick.url);
    note(`- size: ${size === '?' ? 'unknown' : (Number(size) / 1e6).toFixed(1) + ' MB'}`);
    note('\nColumns:\n\n`' + rows[0].split(',').map(s => s.replace(/^"|"$/g, '')).join('`, `') + '`\n');
    note('Sample rows:\n\n```');
    rows.slice(1, 6).forEach(r => note(r.slice(0, 400)));
    note('```');
  } catch (e) { failed = true; note(`**failed:** ${e.message}`); console.log(`::error::${label}: ${e.message}`); }
}
writeFileSync(join(OUT, 'medicare-hospital.md'), lines.join('\n') + '\n');
process.exit(failed ? 1 : 0);
