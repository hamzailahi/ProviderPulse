#!/usr/bin/env node
// Before/after check for the site weighting (step 1 of the scoring upgrade,
// 2026-11-19): runs market-score against the live database twice per ZIP,
// counting every clinician as 1 and with ?weighted=1 (a clinician with
// several sites counts 0.6 at the main address), and prints each
// specialty's clinicians, weighted supply, access factor, score and
// archetype side by side. Read only. Writes
// supabase/reference/weight-compare.md. National benchmarks are not yet
// weighted, so this shows the direction and size of the change, which the
// benchmark rebuild then partly offsets.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://khkmdultmrggpfvkbfzj.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';
const { handler } = require('../../v2/netlify/functions/market-score.js');
const SPECS = ['Primary care / family doctor', 'Heart / cardiology', 'Digestive / gastroenterology'];
const zips = process.argv.slice(2).length ? process.argv.slice(2) : ['38017', '76104', '59601', '10001'];
const run = async (zip, weighted) => {
  const res = await handler({ httpMethod: 'GET', queryStringParameters: { zip, ...(weighted ? { weighted: '1' } : {}) }, headers: {} });
  try { return JSON.parse(res.body); } catch { return {}; }
};
const out = ['# Site weighting: before and after', '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/live/weight-compare.mjs (read only). "Before" counts every clinician as 1; "after" counts a clinician with several sites as 0.6 at the main address. National rates are still unweighted here, and where drive-time access is stored (every state now) the access factor reads that stored figure, which was computed unweighted; it changes only after the benchmark rebuild and the drive-time rerun. So this compares the 10-mile supply rate, before and after.`, ''];
for (const zip of zips) {
  const [a, b] = [await run(zip, false), await run(zip, true)];
  const c = a.catchment || {};
  out.push(`## ${zip}`, '', `${c.zip_count} ZIPs within ${c.furthest_miles} mi, ${c.adults_18plus} adults${c.truncated ? ' (capped: counts are floors)' : ''}`, '',
    '| Specialty | Clinicians | 10-mile per 1k before | after | US per 1k | Access factor (current basis) | Score | Verdict |', '|---|---|---|---|---|---|---|---|');
  for (const sp of SPECS) {
    const f = d => d.model && Array.isArray(d.model.specialties) ? d.model.specialties.find(x => x.specialty === sp) : null;
    const x = f(a), y = f(b);
    if (!x || !y) { out.push(`| ${sp} | n/a | | | | | | ${a.model && a.model.reason || ''} | |`); continue; }
    const ea = x.evidence && x.evidence.access || {}, eb = y.evidence && y.evidence.access || {};
    const crude = e => e.crude_per_1k ?? e.per_1k;
    out.push(`| ${sp} | ${x.clinicians} | ${crude(ea)} | ${crude(eb)} | ${ea.national_per_1k} | ${ea.basis} ${x.factors.access} | ${x.score} | ${x.archetype_name} |`);
  }
  out.push('');
}
writeFileSync('supabase/reference/weight-compare.md', out.join('\n') + '\n');
console.log(out.join('\n'));
