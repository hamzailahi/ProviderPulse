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

// footprint: the provider's codes beside the area's, doctor vs facility fee.
{
  const mine = [
    { hcpcs_cd: '45380', hcpcs_desc: 'Biopsy of large bowel', tot_benes: 100, tot_srvcs: 120, avg_mdcr_pymt_amt: 100, entity_code: 'I' },
    { hcpcs_cd: '45380', tot_benes: 30, tot_srvcs: 40, avg_mdcr_pymt_amt: 140, entity_code: 'I' },
    { hcpcs_cd: '99213', tot_benes: 50, tot_srvcs: 60, avg_mdcr_pymt_amt: 70, entity_code: 'I' },
    { hcpcs_cd: '45385', tot_benes: 10, tot_srvcs: 10, avg_mdcr_pymt_amt: 120, entity_code: 'I' }
  ];
  const area = [
    { npi: '1111111111', hcpcs_cd: '45380', tot_srvcs: 160, avg_mdcr_pymt_amt: 110, entity_code: 'I' },   // the provider
    { npi: '2222222222', hcpcs_cd: '45380', tot_srvcs: 240, avg_mdcr_pymt_amt: 100, entity_code: 'I' },
    { npi: '3333333333', hcpcs_cd: '45380', tot_srvcs: 400, avg_mdcr_pymt_amt: 300, entity_code: 'O' },
    { npi: '2222222222', hcpcs_cd: '99213', tot_srvcs: 1000, avg_mdcr_pymt_amt: 75, entity_code: 'I' },
    { npi: '4444444444', hcpcs_cd: '11111', tot_srvcs: 5, avg_mdcr_pymt_amt: 1, entity_code: 'I' }
  ];
  const f = PF.footprint(mine, area, '1111111111', 2);
  ok(f.length === 2 && f[0].code === '45380' && f[1].code === '99213', 'top codes by the provider\'s services');
  ok(f[0].services === 160 && f[0].patients === 100, 'services add across places of service; patients the largest row');
  ok(Math.abs(f[0].avg_paid - 110) < 1e-9, 'average paid is weighted by services');
  ok(f[0].area_billers === 2 && f[0].area_services === 800, 'others billing it in the area, the provider excluded from the count');
  ok(Math.abs(f[0].share - 0.2) < 1e-9, 'share of the area\'s services');
  ok(Math.abs(f[0].doctor_fee - 104) < 1e-9 && f[0].facility_fee === 300, 'doctor fee (entity I) and facility fee (entity O) apart');
  ok(f[1].facility_fee === null && f[1].area_billers === 1, 'no facility rows: no facility fee, not zero');
  const g = PF.footprint(mine, [], '1111111111');
  ok(g[0].share === 1 && g[0].area_billers === 0 && g[0].doctor_fee === null, 'an area lookup with nothing never reads as over 100%');
  ok(PF.footprint([], area, '1').length === 0, 'no own rows, no footprint');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
