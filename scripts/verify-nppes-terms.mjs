#!/usr/bin/env node
// Read-only check of every specialty's nppesTerm (assets/specialties.js)
// against the live NPPES registry API, the way patient-match.js sends it:
// taxonomy_description=<term> with a ZIP prefix. For each term and a few
// large metro prefixes it records how many providers came back and which
// taxonomies they carry, then writes supabase/reference/nppes-terms-check.md.
// A term passes when some area returns providers and most of them carry a
// taxonomy whose name contains the term. Nothing is written anywhere else.
//
// Run: node scripts/verify-nppes-terms.mjs [out.md]

import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const SPECIALTIES = createRequire(import.meta.url)('../v2/assets/specialties.js');

const OUT = process.argv[2] || 'supabase/reference/nppes-terms-check.md';
const AREAS = ['100*', '770*', '900*', '606*', '381*'];   // New York, Houston, Los Angeles, Chicago, Memphis
const NEW = new Set(['Hearing & audiology', 'Behavior therapy (ABA)', 'Nursing (RN, LPN)', 'Physician assistant',
  'Care coordination & community health', 'Hospital-based clinicians', 'General surgery', 'Infectious disease',
  'Genetics & genetic counseling', 'Hospice & palliative care', 'Other health services']);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function query(term, zip) {
  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&postal_code=${encodeURIComponent(zip)}&taxonomy_description=${encodeURIComponent(term)}&limit=200`;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (r.ok) { const j = await r.json(); if (!j.Errors) return j.results || []; throw new Error(JSON.stringify(j.Errors)); }
    } catch (e) { if (i === 2) throw e; }
    await sleep(1500 * (i + 1));
  }
  return [];
}

const lines = ['<!-- Written by scripts/verify-nppes-terms.mjs. Read only. -->',
  `# NPPES taxonomy terms, checked live ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`, '',
  `Each specialty's \`nppesTerm\` sent as \`taxonomy_description\` with ZIP prefixes ${AREAS.join(', ')} (limit 200 each). ` +
  '"Relevant" is the share of returned providers with any taxonomy whose name contains the term. New categories (2026-10-09) are marked ★.', '',
  '| Specialty | nppesTerm | Providers | Relevant | Most common taxonomies returned | Verdict |', '|---|---|---|---|---|---|'];
let failed = 0;
for (const [label, , term] of SPECIALTIES) {
  let all = [], err = '';
  for (const z of AREAS) { try { all = all.concat(await query(term, z)); } catch (e) { err = e.message; } await sleep(300); }
  const t = term.toLowerCase();
  const rel = all.filter(p => (p.taxonomies || []).some(x => String(x.desc || '').toLowerCase().includes(t))).length;
  const tally = new Map();
  for (const p of all) { const x = (p.taxonomies || []).find(x => x.primary) || (p.taxonomies || [])[0]; if (x) tally.set(x.desc, (tally.get(x.desc) || 0) + 1); }
  const top = [...tally].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([d, n]) => `${d} (${n})`).join('; ');
  const share = all.length ? rel / all.length : 0;
  const ok = all.length > 0 && share >= 0.8;
  if (!ok) failed++;
  lines.push(`| ${NEW.has(label) ? '★ ' : ''}${label} | ${term} | ${all.length} | ${all.length ? Math.round(share * 100) + '%' : '-'} | ${top || (err ? 'error: ' + err : 'none')} | ${ok ? 'ok' : '**check**'} |`);
  console.log(`${ok ? 'ok   ' : 'CHECK'} ${label}: ${term} -> ${all.length}, ${Math.round(share * 100)}%`);
}
lines.push('', `${SPECIALTIES.length - failed} ok, ${failed} to check.`);
writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`wrote ${OUT}`);
