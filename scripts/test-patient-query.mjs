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
const resolveQuery = new Function('SPECIALTIES', code + ';return resolveQuery;')(SPECIALTIES);
const label = q => { const r = resolveQuery(q); return r ? r.label : null; };

const CASES = [
  // the user's question (2026-10-09): unchanged by the move to codes
  ['primary care doctor', 'Primary care / family doctor'], ['primary care', 'Primary care / family doctor'],
  ['family doctor', 'Primary care / family doctor'], ['check up', 'Primary care / family doctor'],
  ['nurse practitioner', 'Primary care / family doctor'],
  // whole words: "hearing" contains "ear" and used to land on ENT
  ['hearing', 'Hearing & audiology'], ['hearing aid', 'Hearing & audiology'], ['audiologist', 'Hearing & audiology'],
  ['ear infection', 'Ear, nose & throat'], ['sore throat', 'Ear, nose & throat'],
  // generic words never resolve to a new category by prefix
  ['physician', null], ['doctor', null], ['hospital', null], ['other', null], ['general', null],
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
  ['derm', 'Skin / dermatology'], ['cardio', 'Heart / cardiology'], ['dentist', 'Dental'], ['x-ray', 'Imaging & lab'],
  ['ob-gyn', "Women's health / OB-GYN"], ['anxiety', 'Mental health & counseling'], ['back pain', 'Pain management'],
  ['podiatrist', 'Foot & ankle / podiatry'], ['in-home care', 'Home health & in-home care']
];
for (const [q, want] of CASES) ok(label(q) === want, `"${q}" -> ${want} (got ${label(q)})`);

// Every specialty finds listings by code, and every label is approved.
const approved = JSON.parse(readFileSync('supabase/reference/patient-specialties-list.json', 'utf8')).map(s => s.label);
ok(SPECIALTIES.length === approved.length && SPECIALTIES.every(s => approved.includes(s[0])), 'specialties.js labels equal the approved list');
for (const [l] of SPECIALTIES) ok(TaxonomyMap.codesFor(l).length > 0, `${l} has codes`);
ok(TaxonomyMap.codesFor('No such specialty').length === 0, 'an unknown label has no codes (never "all")');
ok(!TaxonomyMap.codesFor('Other health services').includes('390200000X'), 'Student is in no specialty');
ok(TaxonomyMap.codesFor('Primary care / family doctor').includes('363LF0000X'), 'Family NP under Primary care');
ok(TaxonomyMap.codesFor('Behavior therapy (ABA)').includes('106S00000X'), 'Behavior Technician under ABA');
// The market side keeps its 33 pre-code labels until its benchmarks are rebuilt.
ok(SPECIALTIES.MARKET.length === 33 && SPECIALTIES.MARKET.some(s => s[0] === 'Speech & hearing'), 'market list frozen at 33 labels');
ok(SPECIALTIES.MARKET_LABEL_ALIASES['Speech & language therapy'] === 'Speech & hearing', 'renamed label aliased for the market side');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
