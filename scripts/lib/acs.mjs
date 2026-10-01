// Pure helpers for the ACS import (scripts/import-census-acs.mjs): which Census
// variables to ask for, what each must be called (checked against the Census
// metadata before anything is stored), and how one ZCTA's raw numbers become a
// census_acs_zcta row. No network and no database in here, so it is testable.
//
// Source: American Community Survey 5-year estimates by ZIP Code Tabulation
// Area (ZCTA), the same geography as demographics_raw.
//   B19001  household income, 16 bands. The Census top-codes it at $200,000 or
//           more; ZIP-level data is not published finer than that.
//   B19013  median household income
//   B17001  poverty status (universe, below poverty)
//   B01001  sex by age, 23 bands per sex, folded here into 18 five-year bands
//   B03002  race by Hispanic origin
//   B15003  educational attainment, population 25 and over

export const INCOME_LABELS = ['Under $10k', '$10-15k', '$15-20k', '$20-25k', '$25-30k', '$30-35k', '$35-40k', '$40-45k',
  '$45-50k', '$50-60k', '$60-75k', '$75-100k', '$100-125k', '$125-150k', '$150-200k', '$200k+'];

export const AGE_LABELS = ['Under 5', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85+'];

// B01001 male variables run _003.._025; female are the same plus 24.
const AGE_GROUPS = [[3], [4], [5], [6, 7], [8, 9, 10], [11], [12], [13], [14], [15], [16], [17], [18, 19], [20, 21], [22], [23], [24], [25]];

const pad = n => String(n).padStart(3, '0');
const ids = (table, from, to) => Array.from({ length: to - from + 1 }, (_, i) => `${table}_${pad(from + i)}E`);

export const VARIABLES = [].concat(
  ids('B19001', 1, 17), ['B19013_001E'], ids('B17001', 1, 2), ids('B01001', 1, 49),
  ['B03002_001E'], ids('B03002', 3, 9), ['B03002_012E'], ids('B15003', 1, 25));

// A fragment each variable's Census label must contain. If the Census renumbers
// a table, the import stops here instead of storing the wrong column.
export const EXPECTED_LABELS = {
  B19001_001E: 'Total', B19001_002E: 'Less than $10,000', B19001_011E: '$50,000 to $59,999', B19001_013E: '$75,000 to $99,999',
  B19001_016E: '$150,000 to $199,999', B19001_017E: '$200,000 or more',
  B19013_001E: 'Median household income', B17001_002E: 'Income in the past 12 months below poverty level',
  B01001_003E: 'Male:!!Under 5 years', B01001_025E: 'Male:!!85 years and over', B01001_027E: 'Female:!!Under 5 years', B01001_049E: 'Female:!!85 years and over',
  B03002_003E: 'White alone', B03002_004E: 'Black or African American alone', B03002_006E: 'Asian alone', B03002_012E: 'Hispanic or Latino',
  B15003_001E: 'Total', B15003_017E: 'Regular high school diploma', B15003_022E: 'Bachelor', B15003_025E: 'Doctorate degree'
};

// Census suppression sentinels are large negative numbers (-666666666 and kin).
// A suppressed value is unknown, never zero.
export function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const sum = arr => (arr.some(x => x === null) ? null : arr.reduce((s, x) => s + x, 0));

// `r` maps variable id -> raw value (string or number) for one ZCTA.
export function toRow(zip, r, year, state, picks) {
  const n = k => num(r[k]);
  const income = Array.from({ length: 16 }, (_, i) => n(`B19001_${pad(i + 2)}E`));
  const male = AGE_GROUPS.map(g => sum(g.map(i => n(`B01001_${pad(i)}E`))));
  const female = AGE_GROUPS.map(g => sum(g.map(i => n(`B01001_${pad(i + 24)}E`))));
  const edu = k => n(`B15003_${pad(k)}E`);
  const eduSum = (a, b) => sum(Array.from({ length: b - a + 1 }, (_, i) => edu(a + i)));
  return {
    zip: String(zip).padStart(5, '0'),
    state: state || null,
    acs_year: year,
    pop_total: n('B01001_001E'),
    households: n('B19001_001E'),
    median_hh_income: n('B19013_001E'),
    poverty_universe: n('B17001_001E'),
    poverty_below: n('B17001_002E'),
    income_bands: income,
    age_male: male,
    age_female: female,
    race: {
      total: n('B03002_001E'), white: n('B03002_003E'), black: n('B03002_004E'), aian: n('B03002_005E'), asian: n('B03002_006E'),
      nhpi: n('B03002_007E'), other: n('B03002_008E'), two_plus: n('B03002_009E'), hispanic: n('B03002_012E')
    },
    education: {
      universe: edu(1), less_than_hs: eduSum(2, 16), high_school: sum([edu(17), edu(18)]), some_college: sum([edu(19), edu(20)]),
      associate: edu(21), bachelor: edu(22), graduate: sum([edu(23), edu(24), edu(25)])
    },
    ...insuranceFields(r, picks),
    refreshed_at: new Date().toISOString()
  };
}

// Internal consistency of one row: bands that must add up to their totals.
// Returns a list of problems (empty when it is sound).
export function rowProblems(row) {
  const out = [];
  const total = (a) => (a.some(x => x === null) ? null : a.reduce((s, x) => s + x, 0));
  const inc = total(row.income_bands);
  if (inc !== null && row.households !== null && inc !== row.households) out.push(`income bands ${inc} != households ${row.households}`);
  const age = total(row.age_male.concat(row.age_female));
  if (age !== null && row.pop_total !== null && age !== row.pop_total) out.push(`age bands ${age} != population ${row.pop_total}`);
  return out;
}

// ---- Health insurance coverage -------------------------------------------------
// B27001 (health insurance by sex and age) gives the uninsured; B27006 and B27007
// give people with Medicare and with Medicaid/means-tested public coverage. Each
// table is split by sex and age, so the totals are sums of the matching cells. The
// cell numbers are found from the Census's own labels at run time (pickInsuranceVars)
// rather than hard-coded, because they could not be checked against the live
// metadata when this was written. Universe: the civilian noninstitutionalized
// population. Medicare and Medicaid overlap (dual eligibles), so they must never be
// added together.
export const INSURANCE_GROUPS = ['B27001', 'B27006', 'B27007'];
const INS_RULES = {
  uninsured: { group: 'B27001', match: /!!No health insurance coverage$/ },
  medicare: { group: 'B27006', match: /!!With Medicare coverage$/ },
  medicaid: { group: 'B27007', match: /!!With Medicaid\/means-tested public coverage$/ }
};
export const INSURANCE_UNIVERSE = 'B27001_001E';

// labels: { variableId: 'Estimate!!Total:!!Male:!!Under 6 years:!!With Medicare coverage', ... }
// Returns { uninsured: [ids], medicare: [ids], medicaid: [ids] } or null if any is empty.
export function pickInsuranceVars(labels) {
  const out = {};
  for (const [k, rule] of Object.entries(INS_RULES)) {
    out[k] = Object.keys(labels).filter(id => id.startsWith(rule.group + '_') && id.endsWith('E') && rule.match.test(labels[id])).sort();
    if (!out[k].length) return null;
  }
  return out;
}
export function insuranceVarIds(picks) {
  return picks ? [INSURANCE_UNIVERSE].concat(picks.uninsured, picks.medicare, picks.medicaid) : [];
}
function insuranceFields(r, picks) {
  const none = { ins_universe: null, ins_uninsured: null, ins_medicare: null, ins_medicaid: null };
  if (!picks) return none;
  const total = ids => sum(ids.map(k => num(r[k])));
  const f = { ins_universe: num(r[INSURANCE_UNIVERSE]), ins_uninsured: total(picks.uninsured), ins_medicare: total(picks.medicare), ins_medicaid: total(picks.medicaid) };
  // A count above the people it is a count of means the wrong cells were picked.
  if (f.ins_universe !== null && [f.ins_uninsured, f.ins_medicare, f.ins_medicaid].some(v => v !== null && v > f.ins_universe)) return none;
  return f;
}
