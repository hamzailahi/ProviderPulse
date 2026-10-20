#!/usr/bin/env node
// The Procedures panel's word search (v2/assets/procedure-search.js), tested
// against CMS's real descriptions in supabase/reference/procedure-codes.csv:
// every alias phrase must appear in at least one description, and the words a
// clinician types must find the codes they mean.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../v2/assets/procedure-search.js');

let passed = 0, failed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.log('  FAIL  ' + m); } };

function parseCsv(text) {
  const out = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); out.push(row); row = []; f = ''; }
    else f += ch;
  }
  if (f || row.length) { row.push(f); out.push(row); }
  return out;
}
const rows = parseCsv(readFileSync(new URL('../supabase/reference/procedure-codes.csv', import.meta.url), 'utf8')).slice(1)
  .filter(r => r[0]).map(r => ({ code: r[0], desc: r[1] }));
ok(rows.length > 3000, `reference has ${rows.length} codes`);
const find = q => { const m = S.match(q); return rows.filter(r => m(r.code, r.desc)).map(r => r.code); };

// Every phrase is real CMS wording.
for (const [k, phrases] of Object.entries(S.ALIASES)) {
  for (const p of phrases) ok(rows.some(r => r.desc.toLowerCase().includes(p)), `alias "${k}" phrase "${p}" appears in no CMS description`);
}

// What people type finds what they mean.
const expect = {
  'colonoscopy': ['45378', '45380', '45385', 'G0105', 'G0121'],
  'screening colonoscopy': ['G0105', 'G0121', '45378'],
  'EGD': ['43235', '43239'],
  'upper endoscopy': ['43235', '43239'],
  'ercp': ['43264'],
  'pap smear': ['Q0091'],
  'pregnancy ultrasound': ['76805', '76815', '76817'],
  'delivery': ['59400', '59510'],
  'c-section': ['59510'],
  'postpartum': ['59430'],
  'vaginal delivery': ['59409', '59400'],
  'mammogram': ['77067'],
  'dexa': ['77080'],
  'ekg': ['93000'],
  'echo': ['93306'],
  'stress test': ['93015'],
  'knee replacement': ['27447'],
  'hip replacement': ['27130'],
  'cataract': ['66984'],
  'physical therapy': ['97110'],
  'flu shot': ['90686'],
  'mohs': ['17311'],
  'cardiac cath': ['93458'],
  '45380': ['45380'],
  'g0105': ['G0105']
};
for (const [q, codes] of Object.entries(expect)) {
  const got = find(q);
  codes.forEach(c => ok(got.includes(c), `"${q}" should find ${c}`));
}

// Aliases fire on whole words only, and stay narrow.
ok(!S.aliasesIn('colonic').includes('colon'), '"colonic" does not name "colon"');
ok(S.aliasesIn('screening colonoscopy').includes('colonoscopy'), '"screening colonoscopy" names "colonoscopy"');
ok(!find('cataract').includes('92004'), 'cataract does not sweep in every lens or eye exam code');
{
  const preg = rows.filter(r => find('pregnancy').includes(r.code));
  const off = preg.filter(r => !/pregnan|fetal|fetus|obstetric|antepartum|postpartum|delivery/i.test(r.desc));
  ok(preg.length > 10 && off.length === 0, `"pregnancy" finds pregnancy codes only (${preg.length}; off-topic: ${off.map(r => r.code).join(', ') || 'none'})`);
  ok(!preg.some(r => /drug delivery|delivery system/i.test(r.desc)), '"pregnancy" does not sweep in drug delivery');
}
ok(S.match('')('anything'), 'an empty query matches everything');
ok(!S.match('colonoscopy')('99213', 'established patient office visit'), 'an office visit is not a colonoscopy');
ok(S.match('gastro')('Gastroenterology'), 'the typed text still matches a specialty name');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
