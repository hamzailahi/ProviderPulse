// Tests for the insurance-plan proposal logic (scripts/lib/payers.mjs). Fixture
// rows use the column names recorded live in
// supabase/reference/payer-sources/discovery.md. No network.
// Run: node scripts/test-payers.mjs
import { realName, EXCLUDE, cleanName, stateCode, coveredLivesCode, marketLives, mlrInsurers, medicaidPlans, rollUp, parseBrandMap, parseCsv } from './lib/payers.mjs';

let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };
const throws = (fn, re, n) => { try { fn(); ok(false, n + ' (no throw)'); } catch (e) { ok(re.test(e.message), n + ' -> ' + e.message); } };

// names and states
ok(cleanName('Molina Healthcare of New Mexico Inc') === 'Molina Healthcare of New Mexico', 'drops a trailing Inc');
ok(cleanName('UnitedHealthcare Insurance Company') === 'UnitedHealthcare Insurance', 'drops Company');
ok(cleanName('Acme Health Plans, L.L.C.') === 'Acme Health Plans', 'drops L.L.C. and the comma');
ok(cleanName('Blue Cross Blue Shield of North Dakota') === 'Blue Cross Blue Shield of North Dakota', 'leaves a brand alone');
ok(stateCode('TX') === 'TX' && stateCode('New Mexico') === 'NM' && stateCode('Grand Total') === null, 'state codes and names; Grand Total is no state');
ok(parseCsv('a,"b, c","d ""e"""\n1,2,3\n').length === 2 && parseCsv('a,"b, c","d ""e"""\n')[0][2] === 'd "e"', 'CSV quoting');

// covered lives row, by its official label
const lookupRows = [
  { lookup_cat_code: 'PART1', lookup_code: 'NUMBER_OF_COVERED_LIVES', lookup_name: 'Number of covered lives' },
  { lookup_cat_code: 'PART1', lookup_code: 'MEMBER_MONTHS', lookup_name: 'Member months' }
];
ok(coveredLivesCode(lookupRows).join() === 'NUMBER_OF_COVERED_LIVES', 'covered lives found by label');
throws(() => coveredLivesCode([lookupRows[1]]), /covered lives/, 'no covered-lives row stops the build');
ok(marketLives({ cmm_individual_yearly: '1200.000', cmm_individual_total: '9' }, 'individual') === 1200, 'year-end figure preferred');
ok(marketLives({ cmm_small_group_yearly: '', cmm_small_group_total: '50' }, 'small_group') === 50, 'falls back to the total');
ok(marketLives({}, 'large_group') === 0, 'missing market is zero lives');

// MLR filings
const headers = [
  { mr_submission_template_id: '1', business_state: 'ND', company_name: 'Blue Cross Blue Shield of North Dakota', dba_marketing_name: 'Blue Cross Blue Shield of North Dakota', group_affiliation: '' },
  { mr_submission_template_id: '2', business_state: 'Grand Total', company_name: 'Blue Cross Blue Shield of North Dakota', dba_marketing_name: 'Blue Cross Blue Shield of North Dakota', group_affiliation: '' },
  { mr_submission_template_id: '3', business_state: 'TX', company_name: 'UnitedHealthcare Insurance Company', dba_marketing_name: '', group_affiliation: 'UnitedHealth Group' },
  { mr_submission_template_id: '4', business_state: 'TX', company_name: 'UnitedHealthcare of Texas, Inc.', dba_marketing_name: '', group_affiliation: 'UnitedHealth Group' },
  { mr_submission_template_id: '5', business_state: 'TX', company_name: 'Tiny Mutual', dba_marketing_name: 'Tiny Mutual', group_affiliation: '' },
  { mr_submission_template_id: '6', business_state: 'FL', company_name: 'Celtic Insurance Company', dba_marketing_name: 'Ambetter', group_affiliation: 'Centene' }
];
const L = (id, ind, sg, lg) => ({ mr_submission_template_id: id, row_lookup_code: 'NUMBER_OF_COVERED_LIVES', cmm_individual_yearly: ind, cmm_small_group_yearly: sg, cmm_large_group_yearly: lg });
const lives = [L('1', '40000', '60000', '200000'), L('2', '40000', '60000', '200000'), L('3', '0', '30000', '900000'), L('4', '0', '0', '50000'),
  L('5', '300', '200', ''), L('6', '500000', '', ''), { mr_submission_template_id: '1', row_lookup_code: 'MEMBER_MONTHS', cmm_individual_yearly: '99999999' }];
const brandMap = parseBrandMap('match_type,match,brand,note\ngroup,UnitedHealth Group,UnitedHealthcare,reviewed\n');
const mlr = mlrInsurers(headers, lives, ['NUMBER_OF_COVERED_LIVES'], brandMap);
ok(mlr.length === 5, 'Grand Total rows and other row codes are skipped');
const nd = mlr.find(x => x.state === 'ND');
ok(nd.members === 300000 && nd.brand === 'Blue Cross Blue Shield of North Dakota' && nd.brand_basis === 'marketing name (DBA)', 'state filing: lives summed across markets, DBA as brand');
ok(mlr.filter(x => x.state === 'TX' && x.brand === 'UnitedHealthcare').length === 2, 'reviewed map turns legal entities into one brand by group');
ok(mlr.find(x => x.state === 'FL').category === 'marketplace' && nd.category === 'commercial', 'individual-only filings are marked marketplace');

// Medicaid
const mrows = [
  { State: 'Texas', 'Program Name': 'STAR (Comprehensive MCO)', 'Plan Name': 'Aetna', 'Total Enrollment': '72966', Year: '2024', 'Parent Organization': 'CVS Health' },
  { State: 'Texas', 'Program Name': 'STAR (Comprehensive MCO)', 'Plan Name': 'Aetna', 'Total Enrollment': '70000', Year: '2016', 'Parent Organization': '' },
  { State: 'Texas', 'Program Name': 'Dental (Dental only (PAHP))', 'Plan Name': 'DentaQuest', 'Total Enrollment': '900000', Year: '2024', 'Parent Organization': '' },
  { State: 'New Mexico', 'Program Name': 'Centennial Care (Comprehensive MCO + MLTSS)', 'Plan Name': 'Molina Healthcare of New Mexico Inc', 'Total Enrollment': '225105', Year: '2024', 'Parent Organization': 'Molina' },
  { State: 'Texas', 'Program Name': 'STAR Kids (Comprehensive MCO)', 'Plan Name': 'Aetna', 'Total Enrollment': '5000', Year: '2024', 'Parent Organization': 'CVS Health' },
  { State: 'Texas', 'Program Name': 'STAR (Comprehensive MCO)', 'Plan Name': 'Small Plan', 'Total Enrollment': '400', Year: '2024', 'Parent Organization': '' }
];
const mcd = medicaidPlans(mrows, new Map());
ok(mcd.every(x => x.year === 2024) && !mcd.some(x => x.legal_name === 'DentaQuest'), 'newest year only; dental-only programs left out');
ok(mcd.find(x => x.state === 'NM').brand === 'Molina Healthcare of New Mexico' && mcd.every(x => x.category === 'medicaid'), 'plan name cleaned; filed under Medicaid');

// roll-up and cutoff
const { kept, dropped } = rollUp(mlr.concat(mcd), 1000);
const aetnaTx = kept.find(x => x.state === 'TX' && x.brand === 'Aetna' && x.categories.includes('medicaid'));
ok(aetnaTx && aetnaTx.members === 77966, 'one row per state and brand; members summed across programs');
ok(kept.find(x => x.state === 'TX' && x.brand === 'UnitedHealthcare').members === 980000, 'two legal entities of one brand become one row');
ok(dropped.some(x => x.brand === 'Tiny Mutual') && dropped.some(x => x.brand === 'Small Plan') && !kept.some(x => x.brand === 'Tiny Mutual'), 'under 1,000 members left out');

// the brand map is exact and strict
throws(() => parseBrandMap('match_type,match,brand\nregex,Unit.*,X\n'), /unknown match_type/, 'no pattern matching');
throws(() => parseBrandMap('match_type,match,brand\ngroup,A,\n'), /no brand/, 'a mapping needs a brand');
throws(() => parseBrandMap('match_type,match,brand\ngroup,A,B\ngroup,a,C\n'), /twice/, 'duplicate mapping refused');

// fixes from the first real run (2026-10-11)
ok(realName('N/A') === '' && realName('none') === '' && realName('Florida Blue') === 'Florida Blue', '"N/A" marketing names count as no name');
const m2 = medicaidPlans([{ State: 'Florida', 'Program Name': 'SMMC (Comprehensive MCO + MLTSS)', 'Plan Name': 'Sunshine State Health Plan', 'Total Enrollment': '1,234,567', Year: '2024', 'Parent Organization': 'Centene' }], new Map());
ok(m2[0].members === 1234567, 'enrollment with thousands separators is read');
const bm2 = parseBrandMap('match_type,match,brand\ncompany_state,"Health Care Service Corporation, a Mutual Legal Reserve|TX",Blue Cross and Blue Shield of Texas\ncompany,ACN Group of California,-\ngroup,Cigna Hlth Grp,Cigna\n');
const h2 = [
  { mr_submission_template_id: '7', business_state: 'TX', company_name: 'Health Care Service Corporation, a Mutual Legal Reserve Company', dba_marketing_name: 'Blue Cross Blue Shield of Illinois, Montana, New Mexico, Oklahoma, Texas', group_affiliation: 'HCSC GRP' },
  { mr_submission_template_id: '8', business_state: 'CA', company_name: 'ACN Group of California, Inc.', dba_marketing_name: '', group_affiliation: 'UNITEDHEALTH GRP' },
  { mr_submission_template_id: '9', business_state: 'TN', company_name: 'Cigna HealthCare of Tennessee, Inc.', dba_marketing_name: 'N/A', group_affiliation: 'Cigna Hlth Grp' }
];
const r2 = mlrInsurers(h2, [L('7', '1,000', '', ''), L('8', '5000', '', ''), L('9', '', '3000', '')], ['NUMBER_OF_COVERED_LIVES'], bm2);
ok(r2[0].brand === 'Blue Cross and Blue Shield of Texas' && r2[0].members === 1000, 'one company branded per state; separators in MLR numbers read');
ok(r2[1].brand === EXCLUDE, 'a "-" brand marks an entry to leave out');
ok(r2[2].brand === 'Cigna', 'an N/A marketing name falls through to the group map');
const ru = rollUp(r2, 1000);
ok(ru.excluded.length === 1 && !ru.kept.some(x => x.brand === EXCLUDE), 'excluded entries never reach the list');
throws(() => parseBrandMap('match_type,match,brand\ncompany_state,Acme,X\n'), /\|ST/, 'company_state needs a state');

ok(cleanName('UnitedHealthcare Insurance Company, dba UnitedHealthcare Community Plan') === 'UnitedHealthcare Community Plan', '"dba" names the brand');
ok(cleanName('El Paso Health Plans, Inc., dba El Paso Health') === 'El Paso Health', 'dba after a suffix');
ok(cleanName('Wellpoint of Iowa, Inc. (formerly Amerigroup of Iowa, Inc.)') === 'Wellpoint of Iowa', '"(formerly ...)" dropped');
const both = rollUp([{ state: 'AZ', brand: 'UnitedHealthcare', members: 5000, category: 'medicaid', source: 'medicaid', legal_name: 'a', group: '', brand_basis: 'x' },
  { state: 'AZ', brand: 'UnitedHealthcare', members: 9000, category: 'commercial', source: 'mlr', legal_name: 'b', group: '', brand_basis: 'x' }], 1000).kept;
ok(both.length === 1 && both[0].members === 14000 && both[0].category === 'commercial' && both[0].categories.join() === 'commercial,medicaid', 'one entry per state and brand across markets');

const ca = medicaidPlans([
  { State: 'California', 'Program Name': 'Two-Plan Model (Comprehensive MCO)', 'Plan Name': 'Inland Empire Health Plan/Riverside', 'Geographic Region': 'Riverside', 'Total Enrollment': '700,000', Year: '2024' },
  { State: 'California', 'Program Name': 'Two-Plan Model (Comprehensive MCO)', 'Plan Name': 'Inland Empire Health Plan/San Bernardino', 'Geographic Region': 'San Bernardino', 'Total Enrollment': '650,000', Year: '2024' },
  { State: 'California', 'Program Name': 'X (Comprehensive MCO)', 'Plan Name': 'Partnership HealthPlan of CA/Southwest', 'Geographic Region': 'Humboldt, Lake', 'Total Enrollment': '1000', Year: '2024' }
], new Map());
ok(ca[0].brand === 'Inland Empire Health Plan' && ca[1].brand === 'Inland Empire Health Plan', 'a "/County" label matching the row\'s region is dropped');
ok(ca[2].brand === 'Partnership HealthPlan of CA/Southwest', 'a slash that is not the row\'s region is left for review');
ok(rollUp(ca, 1000).kept.find(x => x.brand === 'Inland Empire Health Plan').members === 1350000, 'county rows merge into one plan');

const hn = medicaidPlans([{ State: 'California', 'Program Name': 'GMC (Comprehensive MCO)', 'Plan Name': 'Health Net Community Solutions/Sacramento', 'Geographic Region': 'Sacramento', 'Total Enrollment': '5000', Year: '2024' }],
  parseBrandMap('match_type,match,brand\nplan,Health Net Community Solutions,Health Net\nplan,OptumRx,-\n'));
ok(hn[0].brand === 'Health Net', 'the reviewed map matches a plan name after its county label is dropped');
ok(medicaidPlans([{ State: 'Tennessee', 'Program Name': 'TennCare (Comprehensive MCO)', 'Plan Name': 'OptumRx', 'Total Enrollment': '9000', Year: '2024' }],
  parseBrandMap('match_type,match,brand\nplan,OptumRx,-\n'))[0].brand === '-', 'a plan the review removed is marked for exclusion');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
