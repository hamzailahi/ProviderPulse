// Tests for the insurance-plan proposal logic (scripts/lib/payers.mjs). Fixture
// rows use the column names recorded live in
// supabase/reference/payer-sources/discovery.md. No network.
// Run: node scripts/test-payers.mjs
import { cleanName, stateCode, coveredLivesCode, marketLives, mlrInsurers, medicaidPlans, rollUp, parseBrandMap, parseCsv } from './lib/payers.mjs';

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
const aetnaTx = kept.find(x => x.state === 'TX' && x.brand === 'Aetna' && x.category === 'medicaid');
ok(aetnaTx && aetnaTx.members === 77966, 'one row per state, brand and category; members summed across programs');
ok(kept.find(x => x.state === 'TX' && x.brand === 'UnitedHealthcare').members === 980000, 'two legal entities of one brand become one row');
ok(dropped.some(x => x.brand === 'Tiny Mutual') && dropped.some(x => x.brand === 'Small Plan') && !kept.some(x => x.brand === 'Tiny Mutual'), 'under 1,000 members left out');

// the brand map is exact and strict
throws(() => parseBrandMap('match_type,match,brand\nregex,Unit.*,X\n'), /unknown match_type/, 'no pattern matching');
throws(() => parseBrandMap('match_type,match,brand\ngroup,A,\n'), /no brand/, 'a mapping needs a brand');
throws(() => parseBrandMap('match_type,match,brand\ngroup,A,B\ngroup,a,C\n'), /twice/, 'duplicate mapping refused');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
