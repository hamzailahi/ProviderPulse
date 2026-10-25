// Tests for the patient app's procedure finder (v2/assets/procedure-finder.js):
// every code is a real CMS code, plain words find the procedure they mean, and
// the per-clinician summary counts services without double-counting people.
// No network. Run: node scripts/test-procedure-finder.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PF = require('../v2/assets/procedure-finder.js');

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) pass++; else { fail++; console.log('FAIL', name); } };

// Every code exists in CMS's descriptions (procedure_codes, dumped to the CSV).
const known = new Set(readFileSync('supabase/reference/procedure-codes.csv', 'utf8').split('\n').slice(1)
  .map(l => l.split(',')[0].replace(/"/g, '').trim().toUpperCase()).filter(Boolean));
for (const p of PF.PROCEDURES) {
  ok(p.codes.length > 0 && p.words.length > 0, `${p.label} has words and codes`);
  for (const c of p.codes) ok(known.has(c), `${p.label}: ${c} is a CMS code`);
}
const SPECIALTIES = require('../v2/assets/specialties.js');
for (const p of PF.PROCEDURES) ok(SPECIALTIES.some(s => s[0] === p.specialty), `${p.label}: "${p.specialty}" is a patient specialty`);
const labels = PF.PROCEDURES.map(p => p.label);
ok(new Set(labels).size === labels.length, 'labels are unique');

const m = q => (PF.match(q) || {}).label || null;
const CASES = [
  ['colonoscopy', 'Colonoscopy'], ['I need a colonoscopy', 'Colonoscopy'], ['Colonoscopies near me', 'Colonoscopy'],
  ['egd', 'Upper endoscopy (EGD)'], ['cataract surgery', 'Cataract surgery'], ['cataracts', 'Cataract surgery'],
  ['knee replacement', 'Knee replacement'], ['hip replacement surgeon', 'Hip replacement'], ['torn meniscus', 'Knee arthroscopy'],
  ['mammogram', 'Mammogram'], ['bone density scan', 'Bone density scan'], ['dexa', 'Bone density scan'],
  ['echocardiogram', 'Echocardiogram'], ['nuclear stress test', 'Heart stress test'], ['heart stent', 'Heart catheterization and stents'],
  ['sleep study', 'Sleep study'], ['allergy testing', 'Allergy testing'], ['mohs', 'Mohs surgery'],
  ['cortisone shot', 'Joint injection'], ['epidural', 'Spine injection'], ['carpal tunnel', 'Carpal tunnel surgery'],
  ['annual wellness visit', 'Medicare annual wellness visit'], ['eye exam', 'Eye exam'], ['ear wax', 'Earwax removal'],
  // not procedures: specialties and doors keep these
  ['knee pain', null], ['dentist', null], ['pharmacy', null], ['x-ray', null], ['eye doctor', null],
  ['heart', null], ['skin', null], ['echoing', null], ['stents?', 'Heart catheterization and stents']
];
for (const [q, want] of CASES) ok(m(q) === want, `"${q}" -> ${want} (got ${m(q)})`);

// summarize: services add up per NPI, patients are the largest single code
// (never a sum), the name comes from CMS's own row, most services first.
const rows = [
  { npi: '1111111111', entity_code: 'I', first_name: 'Ann', provider_name: 'Lee', credentials: 'MD', specialty: 'Gastroenterology', hcpcs_cd: '45380', tot_benes: 120, tot_srvcs: 150, city: 'FORT WORTH', zip: '76104' },
  { npi: '1111111111', entity_code: 'I', first_name: 'Ann', provider_name: 'Lee', hcpcs_cd: '45385', tot_benes: 90, tot_srvcs: 100, zip: '76104' },
  { npi: '2222222222', entity_code: 'O', provider_name: 'North Endoscopy Center', specialty: 'Ambulatory Surgical Center', hcpcs_cd: '45380', tot_benes: 300, tot_srvcs: 310, zip: '76117' },
  { npi: '3333333333', entity_code: 'I', first_name: 'Bo', provider_name: 'Kim', hcpcs_cd: 'g0121', tot_benes: '20', tot_srvcs: '20', zip: '76117' },
  { npi: null, hcpcs_cd: '45380', tot_srvcs: 999 }
];
const s = PF.summarize(rows);
ok(s.length === 3, 'one entry per NPI, rows without an NPI dropped');
ok(s[0].npi === '2222222222' && s[0].org === true && s[0].name === 'North Endoscopy Center', 'the busiest first; an organization keeps its name');
ok(s[1].services === 250 && s[1].patients === 120, 'services add, patients are the largest single code (not 210)');
ok(s[1].name === 'Ann Lee' && s[1].credentials === 'MD' && s[1].specialty === 'Gastroenterology', 'a clinician is first name plus last');
ok(s[1].codes['45380'] === 150 && s[1].codes['45385'] === 100, 'services by code');
ok(s[2].services === 20 && s[2].codes.G0121 === 20, 'string numbers count; codes upper-cased');
ok(PF.summarize([]).length === 0 && PF.summarize(null).length === 0, 'nothing in, nothing out');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
