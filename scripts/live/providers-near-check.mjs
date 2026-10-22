#!/usr/bin/env node
// Runs the market assistant's find_providers tool (v2/netlify/functions/lib/providers-near.js)
// against the live database through the publishable key: gastroenterology
// around Haltom City (76117) at 10 and 25 miles and across a map of ZIPs.
// Prints timing, counts, whether the lookup was complete, and the nearest
// organizations and individual clinicians. Read only. Run by procedures-panel-check.yml.
import { createRequire } from 'node:module';
import { appendFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { findProviders } = require('../../v2/netlify/functions/lib/providers-near.js');
const env = { SUPABASE_URL: 'https://khkmdultmrggpfvkbfzj.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ' };
const zip = process.argv[2] || '76117';
const MAP = '76117,76111,76148,76137,76180,76118,76103,76112,76119,76105,76104,76102,76106,76164,76131,76179,76244,76248,76053,76054'.split(',');
const CASES = [
  { label: 'GI within 10 miles', input: { zip, specialty: 'Digestive / gastroenterology', radius_miles: 10 } },
  { label: 'GI within 25 miles', input: { zip, specialty: 'Digestive / gastroenterology', radius_miles: 25 } },
  { label: `GI across a ${MAP.length}-ZIP map`, input: { zip, specialty: 'Digestive / gastroenterology', radius_miles: 10 }, opts: { zips: MAP } },
  { label: 'Primary care within 25 miles (many rows)', input: { zip, specialty: 'Primary care / family doctor', radius_miles: 25 } }
];
const out = [`# find_providers, live, around ${zip}`, ''];
for (const c of CASES) {
  const t0 = Date.now();
  const r = await findProviders(c.input, Object.assign({ env }, c.opts || {}));
  out.push(`## ${c.label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`, '');
  if (r.error) { out.push(`**error:** ${r.error}`, ''); continue; }
  out.push(`- total ${r.total}: ${r.organizations} organizations, ${r.individuals} individuals; complete: ${!r.incomplete}${r.incomplete ? ' (' + r.incomplete_reason + ')' : ''}`);
  out.push(`- organizations: ${r.nearest_organizations.slice(0, 8).map(h => `${h.name} (${h.taxonomy}, ${h.zip}, ${h.miles} mi)`).join('; ')}`);
  out.push(`- individuals: ${r.nearest_individuals.slice(0, 8).map(h => `${h.name} (${h.taxonomy}, ${h.zip}, ${h.miles} mi)`).join('; ')}`);
  out.push(`- by ZIP: ${r.by_zip.slice(0, 10).map(z => z.zip + ' ' + z.listings).join(', ')}`, '');
}
console.log(out.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n');
