// Tests for what a patient's typed words resolve to (resolveQuery in
// v2/assets/patient.js) and for the code-keyed specialty lookup behind the
// search. No network. Run: node scripts/test-patient-query.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SPECIALTIES = require('../v2/assets/specialties.js');
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

// patient.js is a browser file; lift the matching code out of it unchanged.
const src = readFileSync('v2/assets/patient.js', 'utf8');
const code = src.slice(src.indexOf('var CONDITION_HINTS'), src.indexOf('function newSearch'));
const ProcedureFinder = require('../v2/assets/procedure-finder.js');
const lifted = new Function('SPECIALTIES', 'ProcedureFinder', code + ';return { resolveQuery, relatedFor, CONDITION_PATHS, DOOR_NAMES };')(SPECIALTIES, ProcedureFinder);
const resolveQuery = lifted.resolveQuery;
const label = q => { const r = resolveQuery(q); return r ? r.label : null; };
const doorOf = q => { const r = resolveQuery(q); return r ? r.door || null : null; };

const CASES = [
  // the user's question (2026-10-09): unchanged by the move to codes
  ['primary care doctor', 'Primary care / family doctor'], ['primary care', 'Primary care / family doctor'],
  ['family doctor', 'Primary care / family doctor'], ['check up', 'Primary care / family doctor'],
  ['nurse practitioner', 'Primary care / family doctor'],
  // whole words: "hearing" contains "ear" and used to land on ENT
  ['hearing', 'Hearing & audiology'], ['hearing aid', 'Hearing & audiology'], ['audiologist', 'Hearing & audiology'],
  ['ear infection', 'Ear, nose & throat'], ['sore throat', 'Ear, nose & throat'],
  // generic words never resolve to a new category by prefix
  ['physician', null], ['doctor', null], ['other', null], ['general', null],
  // the registry term matches from its start only: "Surgery" must not take "knee surgery"
  ['knee surgery', 'Orthopedics & sports injury'], ['surgeon', 'General surgery'],
  ['plastic surgery', 'Plastic & reconstructive surgery'], ['heart surgery', 'Heart / cardiology'],
  // the new categories are reachable in plain words
  ['autism', 'Behavior therapy (ABA)'], ['aba', 'Behavior therapy (ABA)'], ['nurse', 'Nursing (RN, LPN)'],
  ['registered nurse', 'Nursing (RN, LPN)'], ['nursing home', 'Nursing & assisted living'], ['pa', 'Physician assistant'],
  ['physician assistant', 'Physician assistant'], ['case manager', 'Care coordination & community health'],
  ['hospice', 'Hospice & palliative care'], ['genetic testing', 'Genetics & genetic counseling'],
  ['infection', 'Infectious disease'], ['speech therapy', 'Speech & language therapy'], ['pharmacist', 'Pharmacy'],
  // existing behaviour kept
  ['derm', 'Skin / dermatology'], ['cardio', 'Heart / cardiology'], ['dentist', 'Dental'],
  ['ob-gyn', "Women's health / OB-GYN"], ['anxiety', 'Mental health & counseling'], ['back pain', 'Pain management'],
  ['podiatrist', 'Foot & ankle / podiatry'], ['in-home care', 'Home health & in-home care'],
  // care types ("doors", 2026-10-25): what a patient needs goes to places, not
  // to every clinician who could be filed there
  ['pharmacy', 'Pharmacies'], ['pharmacies', 'Pharmacies'], ['drug store', 'Pharmacies'], ['prescription refill', 'Pharmacies'],
  ['urgent care', 'Urgent care'], ['urgent', 'Urgent care'], ['walk-in clinic', 'Urgent care'],
  ['emergency room', 'Emergency rooms & hospitals'], ['er', 'Emergency rooms & hospitals'], ['hospital', 'Emergency rooms & hospitals'],
  ['x-ray', 'Labs & imaging'], ['blood test', 'Labs & imaging'], ['mri', 'Labs & imaging'],
  // procedures (2026-10-25) come first: who billed Medicare for it
  ['mammogram', 'Mammogram'], ['colonoscopy', 'Colonoscopy'], ['cataract surgery', 'Cataract surgery'],
  ['opioid treatment', 'Mental health & addiction'], ['alcohol', 'Mental health & addiction'],
  ['ambulance', 'Rides & transport'], ['ride to my appointment', 'Rides & transport'],
  ['wheelchair', 'Medical equipment & supplies'], ['cpap', 'Medical equipment & supplies'],
  ['surgery center', 'Surgery & procedure centers'], ['endoscopy center', 'Surgery & procedure centers'],
  ['therapy & rehab', 'Therapy & rehab'], ['dental', 'Dental'],
  // low cost: primary care with the low-cost filter on
  ['free clinic', 'Primary care / family doctor'], ['sliding scale clinic', 'Primary care / family doctor'], ['I have no insurance', 'Primary care / family doctor'],
  // these stay specialties
  ['pharmacist', 'Pharmacy'], ['laser hair removal', null], ['her heart', 'Heart / cardiology'], ['braces', null]
];
for (const [q, want] of CASES) ok(label(q) === want, `"${q}" -> ${want} (got ${label(q)})`);

// A door hit says so (the search reads codesForCare); a specialty hit does not.
ok(doorOf('pharmacy') === 'Pharmacies' && doorOf('pharmacist') === null, 'door hits carry the door');
ok(resolveQuery('colonoscopy').procedure && resolveQuery('colonoscopy').procedure.codes.includes('45380'), 'a procedure hit carries its codes');
ok(resolveQuery('low cost clinic').lowcost === true && !resolveQuery('primary care').lowcost, 'low-cost words turn the filter on, nothing else does');
for (const d of TaxonomyMap.careTypes) ok(d === 'Doctors & clinics' || label(d) === d, `door "${d}" resolves to itself`);
for (const d of TaxonomyMap.careTypes) ok(TaxonomyMap.codesForCare(d).length > 0, `door "${d}" has codes`);
// The door names in patient.js are the generated list, in order.
const doorNames = new Function(src.slice(src.indexOf('var DOOR_NAMES'), src.indexOf('function doorHit')) + ';return DOOR_NAMES;')();
ok(JSON.stringify(doorNames) === JSON.stringify(TaxonomyMap.careTypes), 'patient.js door names match taxonomy-map.js');

// Related care for a condition (2026-10-25): every entry names a real
// specialty, door or procedure, and the strip never repeats the search itself.
for (const [, cond, items] of lifted.CONDITION_PATHS) {
  for (const [kind, name] of items) {
    const real = kind === 's' ? SPECIALTIES.some(x => x[0] === name) : kind === 'd' ? lifted.DOOR_NAMES.includes(name)
      : kind === 'p' ? ProcedureFinder.PROCEDURES.some(x => x.label === name) : false;
    ok(real, `${cond}: ${kind} "${name}" exists`);
  }
}
{
  const r = lifted.relatedFor('diabetes', 'Diabetes & hormones');
  ok(r && r.condition === 'diabetes' && r.items.some(i => i[1] === 'Nutrition & dietitian') && r.items.some(i => i[1] === 'Pharmacies'), 'diabetes offers a dietitian and pharmacies');
  ok(!lifted.relatedFor('knee pain', 'Physical & occupational therapy').items.some(i => i[1] === 'Physical & occupational therapy'), 'the search itself is not offered again');
  ok(lifted.relatedFor('dentist', 'Dental') === null && lifted.relatedFor('', '') === null, 'no condition, no strip');
  ok(lifted.relatedFor('opioid treatment', 'Mental health & addiction').condition === 'recovery', 'opioid treatment gets recovery care');
}

// Every specialty finds listings by code, and every label is approved.
const approved = JSON.parse(readFileSync('supabase/reference/patient-specialties-list.json', 'utf8')).map(s => s.label);
ok(SPECIALTIES.length === approved.length && SPECIALTIES.every(s => approved.includes(s[0])), 'specialties.js labels equal the approved list');
for (const [l] of SPECIALTIES) ok(TaxonomyMap.codesFor(l).length > 0, `${l} has codes`);
ok(TaxonomyMap.codesFor('No such specialty').length === 0, 'an unknown label has no codes (never "all")');
ok(!TaxonomyMap.codesFor('Other health services').includes('390200000X'), 'Student is in no specialty');
ok(TaxonomyMap.codesFor('Primary care / family doctor').includes('363LF0000X'), 'Family NP under Primary care');
ok(TaxonomyMap.codesFor('Behavior therapy (ABA)').includes('106S00000X'), 'Behavior Technician under ABA');
// The market model scores every specialty except the two nobody opens a practice in.
ok(SPECIALTIES.SCORED.length === SPECIALTIES.length - 4 && SPECIALTIES.NOT_SCORED.every(l => SPECIALTIES.some(s => s[0] === l)), 'scored list is all but the four not-scored labels');
ok(!SPECIALTIES.some(s => s[0] === 'Speech & hearing'), 'the old Speech & hearing label is gone everywhere');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
