#!/usr/bin/env node
// Runs market-score.js against the live database through the publishable key
// for a few ZIPs and prints how long it took and what its catchment held:
// ZIPs, reach, listings loaded, whether the load was capped or failed, and
// one specialty's score and clinician count. Read only. Run by
// procedures-panel-check.yml. Added 2026-10-22 with the 10-mile catchment,
// which loads far more listings in a city than the old 10 nearest ZIPs.
import { createRequire } from 'node:module';
import { appendFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
process.env.SUPABASE_URL = 'https://khkmdultmrggpfvkbfzj.supabase.co';
process.env.SUPABASE_ANON_KEY = 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';
const { handler } = require('../../v2/netlify/functions/market-score.js');
const spec = process.argv[2] || 'Digestive / gastroenterology';
const zips = process.argv.slice(3).length ? process.argv.slice(3) : ['76117', '76104', '38017', '10001', '59601'];
const out = [`# market-score, live, ${spec}`, ''];
for (const zip of zips) {
  const t0 = Date.now();
  const res = await handler({ httpMethod: 'GET', queryStringParameters: { zip, specialty: spec }, headers: {} });
  const ms = Date.now() - t0;
  let d = {};
  try { d = JSON.parse(res.body); } catch (e) {}
  const c = d.catchment || {};
  const s = d.model && Array.isArray(d.model.specialties) ? d.model.specialties.find(x => x.specialty === spec) : null;
  out.push(`## ${zip}: ${(ms / 1000).toFixed(1)}s, HTTP ${res.statusCode}${ms > 20000 ? ' (OVER the 20s function limit)' : ''}`);
  out.push(`- catchment: ${c.zip_count} ZIPs within ${c.furthest_miles} mi, ${c.adults_18plus} adults; listings ${c.clinic_rows} organizations + ${c.individual_rows} individuals; truncated ${!!c.truncated}; failed ${!!c.listings_failed}${c.listings_error ? ' (' + c.listings_error + ')' : ''}`);
  out.push(s ? `- ${spec}: score ${s.score} (${s.archetype_name}, ${s.confidence}), ${s.clinicians} clinicians, factors ${JSON.stringify(s.factors)}${s.caveats && s.caveats.length ? '; caveats: ' + s.caveats.join(' | ') : ''}`
    : `- model: ${d.model && d.model.reason ? d.model.reason : 'none'}`);
  // Places patients go (2026-10-25): sites, per 10k adults vs the US, verdict.
  const f = d.model && Array.isArray(d.model.facilities) ? d.model.facilities : null;
  out.push(f ? '- places: ' + f.map(x => `${x.type} ${x.sites} (${x.per_10k_adults} vs US ${x.national_per_10k}, ${x.verdict})`).join('; ') : '- places: none returned');
  out.push('');
}
console.log(out.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n');
