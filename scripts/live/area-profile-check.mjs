#!/usr/bin/env node
// Runs the market assistant's get_area_profile tool (v2/netlify/functions/lib/area-profile.js)
// against the live database through the publishable key, the way the assistant
// calls it: once with a one-ZIP map (topped up to 8 nearest), once with a
// city's map of ZIPs, once with area "nearest". Prints timing, the area,
// headline totals, a few per-ZIP lines and whether it came back complete.
// Read only. Run by procedures-panel-check.yml.
import { createRequire } from 'node:module';
import { appendFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { getAreaProfile } = require('../../v2/netlify/functions/lib/area-profile.js');
const env = { SUPABASE_URL: 'https://khkmdultmrggpfvkbfzj.supabase.co', SUPABASE_ANON_KEY: 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ' };
const zip = process.argv[2] || '76104';
const cityZips = (process.argv[3] || '76102,76103,76104,76105,76107,76109,76110,76111,76112,76115,76116,76119,76132,76133,76134').split(',');
const dash = zips => [{ role: 'user', content: [{ type: 'text', text: `<dashboard>\nmode: explore\nzip: ${zip}\nspecialty: Primary care / family doctor\narea_zips: ${zips.length} on the map: ${zips.join(',')}\n</dashboard>` }, { type: 'text', text: 'q' }] }];
const CASES = [
  { label: 'one-ZIP map', input: { zip, area: 'map', specialty: 'Family Practice' }, messages: dash([zip]) },
  { label: `${cityZips.length}-ZIP map`, input: { zip, area: 'map', specialty: 'Gastroenterology' }, messages: dash(cityZips) },
  { label: 'nearest, all specialties', input: { zip, area: 'nearest', specialty: null }, messages: [] }
];
const out = [`# get_area_profile, live, around ${zip}`, ''];
for (const c of CASES) {
  const t0 = Date.now();
  const r = await getAreaProfile(c.input, { env, messages: c.messages, keyMeasures: ['BPHIGH', 'DIABETES', 'OBESITY', 'CHECKUP'] });
  const ms = Date.now() - t0;
  out.push(`## ${c.label} · procedures ${c.input.specialty || 'all'} (${(ms / 1000).toFixed(1)}s, ${JSON.stringify(r).length} chars)`, '');
  if (r.error) { out.push(`**error:** ${r.error}`, ''); continue; }
  out.push(`- complete: ${!r.incomplete}${r.incomplete ? ' (' + r.incomplete_reason + ')' : ''}; ${r.area.zips} ZIPs (${r.area.from_map} from the map): ${r.area.zip_list.join(',')}`);
  r.notes.forEach(n => out.push(`- note: ${n}`));
  const d = r.demographics;
  if (d) out.push(`- people ${d.population}, households ${d.households}, median income ~${d.median_household_income}, 65+ ${JSON.stringify(d.age_65_plus)}, uninsured ${JSON.stringify(d.insurance && d.insurance.uninsured)}, poverty ${JSON.stringify(d.below_poverty)}`);
  else out.push('- demographics: none');
  out.push(`- health: ${r.health.measures.length} measures; ${r.health.measures.filter(m => ['DIABETES', 'OBESITY', 'DEPRESSION'].includes(m.id)).map(m => m.id + ' ' + m.pct_of_adults + '% (' + m.est_adults + ' adults, ' + m.zips + ' ZIPs)').join('; ')}`);
  const pm = r.procedures.medicare_clinicians, pd = r.procedures.medicaid;
  out.push(`- Medicare: ${pm.error ? 'error ' + pm.error : JSON.stringify(pm.totals) + (pm.incomplete ? ' INCOMPLETE ' + pm.incomplete_reason : '') + '; top ' + (pm.top_codes || []).slice(0, 3).map(x => x.code).join(',')}`);
  out.push(`- Medicaid: ${pd.error ? 'error ' + pd.error : JSON.stringify(pd.totals) + (pd.incomplete ? ' INCOMPLETE ' + pd.incomplete_reason : '')}`);
  if (d && d.medicare_age_bands) out.push(`- Medicare-eligible ages: ${d.medicare_age_bands.map(b => b.ages.split(' ')[0] + ' ' + b.people).join(', ')}`);
  out.push(`- county Medicare: ${r.medicare ? JSON.stringify(r.medicare.counties) : 'none'}`);
  r.per_zip.slice(0, 5).forEach(z => out.push(`  - ${JSON.stringify(z)}`));
  out.push('');
}
console.log(out.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n');
