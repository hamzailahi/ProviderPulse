#!/usr/bin/env node
// Runs the market assistant's get_procedures tool (v2/netlify/functions/lib/procedures.js)
// against the live database through the publishable key, the way the assistant
// calls it, and prints each answer's timing, totals, top codes and whether it
// came back complete. Read only. Run by procedures-panel-check.yml.
import { createRequire } from 'node:module';
import { appendFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { getProcedures } = require('../../v2/netlify/functions/lib/procedures.js');
const env = { SUPABASE_URL: 'https://khkmdultmrggpfvkbfzj.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ' };
const zip = process.argv[2] || '76104';

const CASES = [
  { source: 'medicare_clinicians', specialty: 'Gastroenterology', query: 'colonoscopy', radius_miles: 10 },
  { source: 'medicare_clinicians', specialty: 'Gastroenterology', query: null, radius_miles: 10 },
  { source: 'medicare_clinicians', specialty: null, query: '45380', radius_miles: 10 },
  { source: 'medicare_clinicians', specialty: null, query: null, radius_miles: 5 },
  { source: 'medicare_clinicians', specialty: 'Obstetrics & Gynecology', query: null, radius_miles: 10 },
  { source: 'medicaid', specialty: 'Obstetrics', query: 'delivery', radius_miles: 10 },
  { source: 'medicaid', specialty: null, query: 'pregnancy ultrasound', radius_miles: 10 },
  { source: 'hospital_outpatient', specialty: null, query: 'endoscopy', radius_miles: 0 },
  { source: 'hospital_inpatient', specialty: null, query: null, radius_miles: 0 }
];
const out = [`# get_procedures, live, around ${zip}`, ''];
for (const c of CASES) {
  const t0 = Date.now();
  const r = await getProcedures(Object.assign({ zip }, c), { env });
  const ms = Date.now() - t0;
  out.push(`## ${c.source} · specialty ${c.specialty || 'any'} · query ${c.query || 'any'} · ${c.radius_miles} mi (${(ms / 1000).toFixed(1)}s)`, '');
  if (r.error) { out.push(`**error:** ${r.error}`, ''); continue; }
  out.push(`- complete: ${!r.incomplete}${r.incomplete ? ' (' + r.incomplete_reason + ')' : ''}; area ${JSON.stringify(r.area)}; terms ${JSON.stringify(r.filters.matched_terms)}`);
  out.push(`- totals ${JSON.stringify(r.totals)}`);
  (r.top_codes || []).slice(0, 6).forEach(x => out.push(`  - ${JSON.stringify(x)}`));
  if (r.by_specialty) out.push(`- by specialty: ${r.by_specialty.slice(0, 4).map(s => s.specialty).join(', ')}`);
  if (r.hospitals) out.push(`- hospitals: ${r.hospitals.slice(0, 4).map(h => h.hospital + ' ' + h.miles + 'mi').join('; ')}`);
  out.push('');
}
console.log(out.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n');
