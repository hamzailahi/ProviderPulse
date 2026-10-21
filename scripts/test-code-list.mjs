// Tests for v2/assets/code-list.js, the Procedures tab's pasted code list:
// what counts as a list (and what stays a word search), and the by-code, by-
// clinician and by-ZIP summaries built from Medicare and Medicaid rows.
//
// node scripts/test-code-list.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CodeList = require('../v2/assets/code-list.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

console.log('1. What counts as a code list');
let p = CodeList.parse('43235, 43239, 45385');
check('comma-separated codes are a list', p.isList && p.codes.join() === '43235,43239,45385');
p = CodeList.parse('43235\n43236\r\n43239\n\n45385\n');
check('a column pasted from a spreadsheet (one per line) is a list', p.isList && p.codes.length === 4);
p = CodeList.parse('43235 43239 43235 43239');
check('duplicates are dropped, order kept', p.isList && p.codes.join() === '43235,43239');
p = CodeList.parse('00731, 00811, c9777, 0001U; G0121');
check('anesthesia, lowercase HCPCS, PLA and G codes all count', p.isList && p.codes.join() === '00731,00811,C9777,0001U,G0121', p.codes.join());
check('a single code stays a normal search', !CodeList.parse('45385').isList);
check('a code plus a word stays a word search', !CodeList.parse('45385 colonoscopy').isList);
check('words stay a word search', !CodeList.parse('upper gi endoscopy').isList);
check('a five-letter word is not a code', !CodeList.parse('colon biops').isList);
check('an empty box is not a list', !CodeList.parse('').isList && !CodeList.parse(null).isList);
p = CodeList.parse('"43235", "43239",');
check('quotes and a trailing comma are tolerated', p.isList && p.codes.join() === '43235,43239');
const many = Array.from({ length: 130 }, (_, i) => String(10000 + i)).join(',');
p = CodeList.parse(many);
check('more than 100 codes: the first 100 are used and the rest counted', p.isList && p.codes.length === 100 && p.ignored === 30);

console.log('\n2. Summaries');
const MED = [
  { npi: '1', provider_name: 'Smith', first_name: 'Ann', credentials: 'MD', entity_code: 'I', city: 'FORT WORTH', zip: '76104', specialty: 'Gastroenterology', hcpcs_cd: '45385', hcpcs_desc: 'Colonoscopy with polyp removal', place_of_service: 'F', tot_benes: 100, tot_srvcs: 110, avg_mdcr_alowd_amt: 250, avg_mdcr_pymt_amt: 200 },
  { npi: '1', provider_name: 'Smith', first_name: 'Ann', credentials: 'MD', entity_code: 'I', city: 'FORT WORTH', zip: '76104', specialty: 'Gastroenterology', hcpcs_cd: '45385', hcpcs_desc: 'Colonoscopy with polyp removal', place_of_service: 'O', tot_benes: 20, tot_srvcs: 20, avg_mdcr_alowd_amt: 400, avg_mdcr_pymt_amt: 320 },
  { npi: '1', provider_name: 'Smith', first_name: 'Ann', credentials: 'MD', entity_code: 'I', city: 'FORT WORTH', zip: '76104', specialty: 'Gastroenterology', hcpcs_cd: '43239', hcpcs_desc: 'EGD with biopsy', place_of_service: 'F', tot_benes: 50, tot_srvcs: 50, avg_mdcr_alowd_amt: 150, avg_mdcr_pymt_amt: 120 },
  { npi: '2', provider_name: 'Lone Star Endoscopy Center', first_name: null, credentials: null, entity_code: 'O', city: 'SOUTHLAKE', zip: '76092', specialty: 'Ambulatory Surgical Center', hcpcs_cd: '45385', hcpcs_desc: 'Colonoscopy with polyp removal', place_of_service: 'F', tot_benes: 300, tot_srvcs: 300, avg_mdcr_alowd_amt: 600, avg_mdcr_pymt_amt: 480 }
];
const MCD = [
  { zip: '76104', specialty: 'Physician/Gastroenterology', code: '43239', claims: 40, paid: 4000, providers: 2 },
  { zip: '76110', specialty: 'Physician/Gastroenterology', code: '43239', claims: 10, paid: 1000, providers: 1 }
];
const s = CodeList.summarize(['45385', '43239', '45388'], MED, MCD, { 43239: 'Biopsy of esophagus, stomach, and/or upper small bowel' });
const c85 = s.codes.find(c => c.code === '45385'), c39 = s.codes.find(c => c.code === '43239'), c88 = s.codes.find(c => c.code === '45388');
check('codes are ranked by Medicare services', s.codes.map(c => c.code).join() === '45385,43239,45388');
check('billers are distinct NPIs per code', c85.billers === 2 && c39.billers === 1);
check('services and patients add up per code', c85.services === 430 && c85.patients === 420);
check('office and facility are split by place of service', c85.office === 20 && c85.facility === 410);
check('individual and organization billing are split', c85.individual === 130 && c85.organization === 300);
check('averages are weighted by services', Math.abs(c85.avgPaid - (110 * 200 + 20 * 320 + 300 * 480) / 430) < 1e-9 && Math.abs(c85.avgAllowed - (110 * 250 + 20 * 400 + 300 * 600) / 430) < 1e-9);
check('estimated Medicare paid is services x average paid', c85.paid === 110 * 200 + 20 * 320 + 300 * 480);
check('Medicaid sums per code, with paid per claim line', c39.mcdClaims === 50 && c39.mcdPaid === 5000 && c39.mcdPerClaim === 100 && c39.inMedicaid && !c85.inMedicaid);
check('the description lookup wins, else the Medicare description', c39.description.startsWith('Biopsy of esophagus') && c85.description === 'Colonoscopy with polyp removal');
check('a code with no rows in either source is listed as missing, with empty averages', s.missing.join() === '45388' && c88.avgPaid === null && c88.services === 0);
const smith = s.clinicians.find(c => c.npi === '1'), asc = s.clinicians.find(c => c.npi === '2');
check('clinicians rank by estimated Medicare paid', s.clinicians[0].npi === '2');
check('a clinician is named first then last, an organization by its name', smith.name === 'Ann Smith' && asc.name === 'Lone Star Endoscopy Center' && asc.organization);
check('a clinician sums across codes and places, with the top code by services', smith.codes === 2 && smith.services === 180 && smith.topCode === '45385' && smith.paid === 110 * 200 + 20 * 320 + 50 * 120);
const z04 = s.zips.find(z => z.zip === '76104'), z10 = s.zips.find(z => z.zip === '76110');
check('ZIPs combine Medicare and Medicaid', z04.billers === 1 && z04.services === 180 && z04.mcdClaims === 40 && z10.services === 0 && z10.mcdClaims === 10);
check('totals: distinct billers across codes, services, paid', s.totals.billers === 2 && s.totals.services === 480 && s.totals.mcdClaims === 50 && s.totals.mcdPaid === 5000);
check('rows for codes not in the list are ignored', CodeList.summarize(['43239'], MED, []).codes.length === 1 && CodeList.summarize(['43239'], MED, []).totals.services === 50);
check('codes match whatever the case in the rows', CodeList.summarize(['C9777'], [Object.assign({}, MED[0], { hcpcs_cd: 'c9777' })], []).codes[0].services === 110);
check('nothing loaded still summarizes, every code missing', CodeList.summarize(['45385', '43239'], [], []).missing.length === 2);

console.log('\n3. CSV');
const csv = CodeList.toCsv([{ a: 'x, "y"', b: 1.23456, c: 7 }], [['A', 'a'], ['B', 'b'], ['C', 'c']]);
check('values with commas and quotes are quoted, decimals rounded to cents', csv === 'A,B,C\n"x, ""y""",1.23,7', JSON.stringify(csv));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
