#!/usr/bin/env node
// Writes the procedure_codes table (CMS's plain-language code descriptions,
// the same wording the Medicare procedures rows carry) to
// supabase/reference/procedure-codes.csv, so the procedures panel's word
// aliases (v2/assets/procedure-search.js) can be tested against real text.
// Read only against the database; run by procedure-codes-reference.yml.
import { writeFileSync } from 'node:fs';
const U = 'https://khkmdultmrggpfvkbfzj.supabase.co/rest/v1';
const K = 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';
const rows = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(`${U}/procedure_codes?select=code,description,source&order=code&limit=1000&offset=${off}`, { headers: { apikey: K } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' at offset ' + off);
  const b = await r.json();
  rows.push(...b);
  if (b.length < 1000) break;
}
if (rows.length < 3000) throw new Error('only ' + rows.length + ' codes; refusing to write');
const q = s => /[",\n]/.test(String(s ?? '')) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s ?? '');
writeFileSync('supabase/reference/procedure-codes.csv', 'code,description,source\n' + rows.map(r => [r.code, r.description, r.source].map(q).join(',')).join('\n') + '\n');
console.log(rows.length + ' codes written');
