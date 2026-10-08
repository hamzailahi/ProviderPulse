// Tests for the NUCC taxonomy map (scripts/lib/taxonomy-map.mjs) and the
// generated v2/assets/taxonomy-map.js. No network: reads the committed
// reference files. Run: node scripts/test-taxonomy-map.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseCsv, parseNucc, parseCmsCrosswalk, parseOverrides, buildMap, groupingsOf, renderMapCsv,
  renderMapJs, pickNppesTaxonomy, displayNameIndex, resolveByName } from './lib/taxonomy-map.mjs';

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };
const throws = (fn, re, name) => { try { fn(); ok(false, name + ' (did not throw)'); } catch (e) { ok(re.test(e.message), name + ' -> ' + e.message); } };

const nuccText = readFileSync('supabase/reference/nucc_taxonomy.csv', 'utf8');
const nucc = parseNucc(nuccText);
const byCode = new Map(nucc.map(n => [n.code, n]));

// --- the NUCC file itself ---------------------------------------------------
ok(nucc.length >= 850 && nucc.length <= 950, `about 880 codes (${nucc.length})`);
const names = new Set(nucc.map(n => n.grouping));
ok(names.size === 29, `29 grouping names in v26.1 (${names.size})`);
ok(groupingsOf(nucc).length === 30, 'Other Service Providers appears in both sections, so 30 pairs');
// Groupings come from the file verbatim; the spec's list must match it exactly.
for (const g of ['Allopathic & Osteopathic Physicians', 'Behavioral Health & Social Service Providers',
  'Physician Assistants & Advanced Practice Nursing Providers', 'Student, Health Care', 'Managed Care Organizations',
  'Respiratory, Developmental, Rehabilitative and Restorative Service Providers', 'Transportation Services']) {
  ok(names.has(g), `grouping present: ${g}`);
}

// --- spec spot checks (acceptance 6), by code --------------------------------
ok(byCode.get('106S00000X').grouping === 'Behavioral Health & Social Service Providers', 'Behavior Technician grouping');
ok(byCode.get('225100000X').grouping === 'Respiratory, Developmental, Rehabilitative and Restorative Service Providers', 'Physical Therapist grouping');
ok(byCode.get('183500000X').grouping === 'Pharmacy Service Providers', 'Pharmacist grouping');
ok(byCode.get('363LF0000X').grouping === 'Physician Assistants & Advanced Practice Nursing Providers', 'Family NP grouping');
ok(byCode.get('390200000X').grouping === 'Student, Health Care', 'Student grouping');

// --- parser strictness -----------------------------------------------------
ok(parseCsv('a,"b,c","d ""q"""\r\n1,2,3\n').length === 2 && parseCsv('a,"b,c"\n')[0][1] === 'b,c', 'CSV quotes and CRLF');
throws(() => parseNucc('Code,Grouping\n207Q00000X,x\n'), /no column/, 'missing columns named');
const hdr = nuccText.split('\n')[0];
throws(() => parseNucc(hdr + '\n' + 'BAD,x,y,,d,n,Name,Individual\n'.repeat(1)), /malformed code/, 'malformed code rejected');

// --- overrides ---------------------------------------------------------------
const known = new Set(nucc.map(n => n.code));
const ovText = readFileSync('supabase/reference/taxonomy-overrides.csv', 'utf8');
const ov = parseOverrides(ovText, known);
ok(ov.get('390200000X') && ov.get('390200000X').show === false, 'Student hidden by the overrides file');
throws(() => parseOverrides('nucc_code,show_on_map,patient_specialties\n000000000X,false,\n', known), /not a NUCC code/, 'unknown override code');
throws(() => parseOverrides('nucc_code,show_on_map,patient_specialties\n390200000X,maybe,\n', known), /true or false/, 'bad boolean');
throws(() => parseOverrides('nucc_code,show_on_map,patient_specialties\n390200000X,false,\n390200000X,true,\n', known), /twice/, 'duplicate override');
const ov2 = parseOverrides('nucc_code,show_on_map,patient_specialties\n363LP0808X,,Mental health & counseling; Primary care\n', known);
ok(JSON.stringify(ov2.get('363LP0808X').specialties) === '["Mental health & counseling","Primary care"]', 'specialties split on ;');

// --- CMS crosswalk -----------------------------------------------------------
const cms = parseCmsCrosswalk('MEDICARE SPECIALTY CODE,MEDICARE PROVIDER/SUPPLIER TYPE DESCRIPTION,PROVIDER TAXONOMY CODE,PROVIDER TAXONOMY DESCRIPTION\n' +
  '08,Physician/Family Practice,207Q00000X,Family Medicine\n08,Physician/Family Practice,207QA0000X,Adolescent\n50,Nurse Practitioner,363LF0000X,Family\n' +
  'B4,Rehab Agency,363LF0000X,Family\n');
ok(cms.get('363LF0000X').codes.join('|') === '50|B4', 'crosswalk keeps every Medicare specialty for a code');
throws(() => parseCmsCrosswalk('a,b,c\n1,2,3\n'), /no column/, 'crosswalk header change is loud');

// --- the built map -----------------------------------------------------------
const entries = buildMap(nucc, cms, ov);
ok(entries.length === nucc.length, 'one entry per NUCC code');
ok(entries.every(e => e.grouping === byCode.get(e.nucc_code).grouping), 'grouping copied unchanged');
ok(entries.filter(e => !e.show_on_map).map(e => e.nucc_code).join() === '390200000X', 'only Student is hidden');
ok(entries.find(e => e.nucc_code === '207Q00000X').cms_specialty_name === 'Physician/Family Practice', 'CMS name attached');
const csv = parseCsv(renderMapCsv(entries));
ok(csv.length === entries.length + 1 && csv[0][0] === 'nucc_code', 'map CSV has a row per code');

// --- generated browser module: no default -------------------------------------
const require = createRequire(import.meta.url);
const T = require('../v2/assets/taxonomy-map.js');
ok(T.codes().length === nucc.length, 'generated module has every code');
ok(T.get('106S00000X').grouping === 'Behavioral Health & Social Service Providers' && T.get('106S00000X').individual, 'module lookup');
ok(T.get('390200000X').showOnMap === false, 'module: Student hidden');
const origErr = console.error; let logged = '';
console.error = m => { logged += m; };
const missing = T.get('000000000X');
console.error = origErr;
ok(missing === null && /unknown NUCC code: 000000000X/.test(logged), 'unknown code returns null and logs an error');
throws(() => T.groupingOf('000000000X'), /Unknown NUCC taxonomy code/, 'groupingOf throws on unknown');
// Deleting a code from the data must surface, not reassign (acceptance 3).
const fewer = renderMapJs(buildMap(nucc.filter(n => n.code !== '106S00000X'), null, ov), 'test');
const m = { exports: {} };
new Function('module', 'window', fewer)(m, undefined);
console.error = () => {};
ok(m.exports.get('106S00000X') === null, 'a code removed from the map is not silently reassigned');
console.error = origErr;
ok(!/specialty['"]?\s*[:,]\s*['"]?default|return 'specialty'/i.test(readFileSync('v2/assets/taxonomy-map.js', 'utf8')), 'no default bucket in the generated module');

// --- choosing an NPI's code ----------------------------------------------------
ok(JSON.stringify(pickNppesTaxonomy(['103K00000X', '106S00000X'], ['N', 'Y'])) === '{"code":"106S00000X","source":"nppes_primary"}', 'primary flag wins over order');
ok(JSON.stringify(pickNppesTaxonomy(['', '261QM1300X', '261Q00000X'], ['', 'N', 'N'])) === '{"code":"261QM1300X","source":"nppes_first"}', 'no flag: first listed, reported');
ok(pickNppesTaxonomy(['', ''], ['', '']) === null, 'no taxonomy at all -> null');
ok(pickNppesTaxonomy(['363lf0000x'], ['y']).code === '363LF0000X', 'case normalized');

const idx = displayNameIndex(nucc);
ok(resolveByName('Internal Medicine Physician', idx).code === '207R00000X', 'exact display name resolves');
ok(resolveByName('  internal medicine physician ', idx).code === '207R00000X', 'case and outer spaces ignored');
ok(resolveByName('Internal Medicine Physicians', idx).code === null, 'no fuzzy matching');
ok(/more than one/.test(resolveByName('Pharmacist', idx).reason), 'ambiguous display name is an exception');
ok(/not a NUCC display name/.test(resolveByName('Facility / Clinic', idx).reason), 'legacy label is an exception');
ok(/no stored taxonomy/.test(resolveByName('', idx).reason), 'blank name is an exception');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
