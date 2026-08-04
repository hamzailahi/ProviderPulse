// Tests for the market-analyst query-plan validator.
// Plain node, no framework: node scripts/test-query-plan.mjs
//
// This is a security boundary. The model proposes; this module disposes.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { validatePlan, buildPath, summarise, taxMatches, MAX_LIMIT } =
  require('../v2/netlify/functions/lib/query-plan.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };
const ok = p => validatePlan(p).ok;
const err = p => (validatePlan(p).error || '');

console.log('1. Tables outside the allowlist are refused');
for (const t of ['patient_profiles', 'provider_profiles', 'provider_insurance',
                 'patient_documents', 'audit_log', 'demand_log', 'users',
                 'auth.users', 'leie_exclusions', 'provider_locations', '']) {
  check(`refuses ${t || '(empty)'}`, !ok({ table: t, select: ['zip'] }));
}
check('the refusal names what IS allowed',
  /clinics/.test(err({ table: 'patient_profiles', select: ['x'] })));
check('and says patient/account data is deliberately unreachable',
  /deliberately unreachable/i.test(err({ table: 'patient_profiles', select: ['x'] })));

console.log('\n2. Columns outside the allowlist are refused');
check('refuses an unknown column', !ok({ table: 'clinics', select: ['email'] }));
check('refuses select *', !ok({ table: 'clinics', select: ['*'] }));
check('refuses an empty select', !ok({ table: 'clinics', select: [] }));
check('refuses filtering on an unknown column',
  !ok({ table: 'clinics', select: ['zip'], filters: [{ column: 'email', op: 'eq', value: 'a' }] }));
check('refuses grouping by an unknown column',
  !ok({ table: 'clinics', select: ['zip'], aggregate: 'count_by', group_by: 'email' }));
check('allows a legitimate column', ok({ table: 'clinics', select: ['zip', 'primary_taxonomy'] }));

console.log('\n3. Operators are allowlisted');
check('refuses an invented operator',
  !ok({ table: 'clinics', select: ['zip'], filters: [{ column: 'state', op: 'sql', value: 'x' }] }));
check('refuses a missing value',
  !ok({ table: 'clinics', select: ['zip'], filters: [{ column: 'state', op: 'eq' }] }));
check('allows eq', ok({ table: 'clinics', select: ['zip'], filters: [{ column: 'state', op: 'eq', value: 'TN' }] }));
check('allows in', ok({ table: 'clinics', select: ['zip'], filters: [{ column: 'zip', op: 'in', value: ['38017', '38018'] }] }));

console.log('\n4. npi_activity is aggregates-only');
check('refuses row mode', !ok({ table: 'npi_activity', select: ['npi'], aggregate: 'none' }));
check('refuses the default (none)', !ok({ table: 'npi_activity', select: ['npi'] }));
check('allows count', ok({ table: 'npi_activity', select: ['npi'], aggregate: 'count' }));
check('summarise never leaks rows even if asked',
  !('rows' in summarise({ table: 'npi_activity', select: ['npi'], aggregate: 'none', filters: [], limit: 10 },
    [{ npi: '1', last_medicare_activity_year: 2024 }])));

console.log('\n5. count_by requires a group');
check('refuses count_by with no group_by', !ok({ table: 'clinics', select: ['zip'], aggregate: 'count_by' }));
{
  const v = validatePlan({ table: 'clinics', select: ['npi'], aggregate: 'count_by', group_by: 'zip' });
  check('group column is added to select if missing', v.ok && v.plan.select.includes('zip'));
}

console.log('\n6. Limits are clamped');
{
  const v = validatePlan({ table: 'clinics', select: ['zip'], limit: 999999 });
  check(`clamped to ${MAX_LIMIT}`, v.plan.limit === MAX_LIMIT, String(v.plan.limit));
  check('defaults when absent', validatePlan({ table: 'clinics', select: ['zip'] }).plan.limit > 0);
  check('negative falls back to the default', validatePlan({ table: 'clinics', select: ['zip'], limit: -5 }).plan.limit > 0);
}

console.log('\n7. Malformed input');
for (const bad of [null, undefined, 'string', 42, []]) {
  check(`refuses ${JSON.stringify(bad)}`, !ok(bad));
}

console.log('\n8. Taxonomy matching keeps the word-boundary rule');
check('bare term matches the long form', taxMatches('Family Medicine Physician', 'Family Medicine'));
// The leading space is what stops this; there is deliberately NO trailing one.
check('Urology does NOT match Neurology', !taxMatches('Neurology Physician', 'Urology'));
// And because there is no trailing space, a prefix at a word boundary DOES
// match -- "Dentist" finding "Dentistry" is the intended behaviour, which is
// precisely why a trailing space must never be added.
check('Dentist matches General Practice Dentistry (prefix at a word boundary)',
  taxMatches('General Practice Dentistry', 'Dentist'));
check('but not mid-word', !taxMatches('Pedodontist Practice', 'dontist'));
check('ampersand normalised', taxMatches('Vision & Eye Care', 'Vision and Eye Care'));
check('taxonomy on a table without primary_taxonomy is refused',
  !ok({ table: 'hpsa_designations', select: ['state'], taxonomy: 'Family Medicine' }));

console.log('\n9. Path building');
{
  const v = validatePlan({
    table: 'clinics', select: ['zip', 'primary_taxonomy'],
    filters: [{ column: 'state', op: 'eq', value: 'TN' }], limit: 50
  });
  const path = buildPath(v.plan);
  check('names the table', path.startsWith('clinics?'), path);
  check('encodes the select', /select=zip%2Cprimary_taxonomy/.test(path), path);
  check('applies the filter', /state=eq\.TN/.test(path), path);
  check('applies the limit', /limit=50/.test(path), path);
  check('no raw SQL anywhere', !/select\s|;|--|\bunion\b/i.test(path.replace('select=', '')), path);
}

console.log('\n9b. Taxonomy is prefiltered in the DATABASE, not only in JS');
{
  // Regression: without a pushed-down prefilter the limit applied first, so a
  // TN primary-care question filtered an arbitrary 2000-row slice of ~100k
  // clinics and returned zero for a question that has a real answer.
  const v = validatePlan({ table: 'clinics', select: ['zip'], aggregate: 'count_by', group_by: 'zip', taxonomy: 'Primary Care' });
  const path = buildPath(v.plan);
  check('an ilike prefilter is pushed down', /primary_taxonomy=ilike/.test(path), path);
  // encodeURIComponent leaves * alone, which is what PostgREST wants for ilike.
  check('only the FIRST word, so long forms still match', /ilike\.\*Primary\*/i.test(path), path);
  check('the second word is NOT in the prefilter', !/Care/.test(path.split('ilike')[1] || ''), path);
  check('the exact matcher still governs the answer',
    taxMatches('Primary Care Clinic/Center', 'Primary Care') && !taxMatches('Internal Medicine', 'Primary Care'));
  // The prefilter must never be narrower than the rule, or true matches vanish.
  const stored = ['Primary Care Clinic/Center', 'Primary Care Physician', 'Primary Care'];
  check('every true match survives the prefilter',
    stored.every(s => s.toLowerCase().includes('primary') && taxMatches(s, 'Primary Care')));
  check('a one/two-letter term is not pushed down',
    !/ilike/.test(buildPath(validatePlan({ table: 'clinics', select: ['zip'], taxonomy: 'ER' }).plan)));

  // Regression: a plan grouping by zip selects only zip, so summarise() read
  // undefined off every row and filtered a real 31,688-row TN result to zero.
  const grouped = validatePlan({ table: 'clinics', select: ['zip'], aggregate: 'count_by', group_by: 'zip', taxonomy: 'Family Medicine' });
  check('the matched column is force-selected', grouped.plan.select.includes('primary_taxonomy'), JSON.stringify(grouped.plan.select));
  check('and reaches the query path', /primary_taxonomy/.test(buildPath(grouped.plan)));
  check('summarise now counts real rows',
    summarise(grouped.plan, [
      { zip: '37027', primary_taxonomy: 'Family Medicine' },
      { zip: '37027', primary_taxonomy: 'Family Medicine Physician' },
      { zip: '38201', primary_taxonomy: 'Dentistry' }
    ]).matched === 2);
  check('not double-added when already present',
    validatePlan({ table: 'clinics', select: ['zip', 'primary_taxonomy'], taxonomy: 'Family Medicine' })
      .plan.select.filter(c => c === 'primary_taxonomy').length === 1);
}

console.log('\n10. Summarising');
{
  const rows = [
    { zip: '38017', primary_taxonomy: 'Family Medicine' },
    { zip: '38017', primary_taxonomy: 'Family Medicine Physician' },
    { zip: '38018', primary_taxonomy: 'Cardiology' }
  ];
  const plan = validatePlan({ table: 'clinics', select: ['zip', 'primary_taxonomy'], aggregate: 'count_by', group_by: 'zip' }).plan;
  const s = summarise(plan, rows);
  check('groups and counts', s.groups.find(g => g.zip === '38017').count === 2, JSON.stringify(s.groups));
  check('sorted by count desc', s.groups[0].count >= s.groups[1].count);

  const taxPlan = validatePlan({ table: 'clinics', select: ['zip', 'primary_taxonomy'], aggregate: 'count', taxonomy: 'Family Medicine' }).plan;
  check('taxonomy filter applied in summarise', summarise(taxPlan, rows).matched === 2, JSON.stringify(summarise(taxPlan, rows)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
