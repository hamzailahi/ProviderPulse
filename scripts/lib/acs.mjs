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
export function toRow(zip, r, year, state, picks, sig, prior) {
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
    signals: signalFields(r, sig),
    // Population five years earlier, for growth. ACS releases before 2021 use
    // 2010 ZCTAs, so a few ZIPs changed shape; consumers ignore extreme swings.
    pop_prior: prior && prior.value != null ? prior.value : null,
    pop_prior_year: prior && prior.value != null ? prior.year : null,
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
// Each figure lives in a detailed "B" table, or only in a collapsed "C" table in
// some releases (the 2024 5-year ZCTA release returned 404 for B27006). The
// importer tries the names in order and uses the first that exists.
export const INSURANCE_TABLES = {
  uninsured: ['B27001', 'C27001'],
  medicare: ['B27006', 'C27006'],
  medicaid: ['B27007', 'C27007']
};
const INS_MATCH = {
  uninsured: /!!No health insurance coverage$/,
  medicare: /!!With Medicare coverage$/,
  medicaid: /!!With Medicaid\/means-tested public coverage$/
};

// labels: { variableId: 'Estimate!!Total:!!Male:!!Under 6 years:!!With Medicare coverage', ... }
// found:  { uninsured: 'B27001', medicare: 'C27006', ... } the table each figure was read from.
// Returns { universe, uninsured: [ids], medicare: [ids], medicaid: [ids] }; a figure
// with no matching cells gets an empty list (stored as unknown). null if none matched.
export function pickInsuranceVars(labels, found) {
  const out = { universe: null };
  let any = false;
  for (const k of Object.keys(INS_MATCH)) {
    const groups = found ? (found[k] ? [found[k]] : []) : INSURANCE_TABLES[k];
    out[k] = Object.keys(labels).filter(id => groups.some(g => id.startsWith(g + '_')) && id.endsWith('E') && INS_MATCH[k].test(labels[id])).sort();
    if (out[k].length) any = true;
  }
  if (!any) return null;
  // The universe (civilian noninstitutionalized population) is the _001 total of
  // whichever table the uninsured, else Medicare, else Medicaid came from.
  const base = ['uninsured', 'medicare', 'medicaid'].find(k => out[k].length);
  out.universe = out[base][0].split('_')[0] + '_001E';
  return out;
}
export function insuranceVarIds(picks) {
  return picks ? [picks.universe].concat(picks.uninsured, picks.medicare, picks.medicaid) : [];
}
function insuranceFields(r, picks) {
  const none = { ins_universe: null, ins_uninsured: null, ins_medicare: null, ins_medicaid: null };
  if (!picks) return none;
  const total = ids => (ids.length ? sum(ids.map(k => num(r[k]))) : null);
  const f = { ins_universe: num(r[picks.universe]), ins_uninsured: total(picks.uninsured), ins_medicare: total(picks.medicare), ins_medicaid: total(picks.medicaid) };
  // A count above the people it is a count of means the wrong cells were picked.
  for (const k of ['ins_uninsured', 'ins_medicare', 'ins_medicaid']) if (f.ins_universe !== null && f[k] !== null && f[k] > f.ins_universe) f[k] = null;
  return f;
}

// ---- Market signals --------------------------------------------------------------
// More ACS counts per ZCTA, each found by label at run time (same reason as the
// insurance cells: the detailed B table is missing for some figures at ZCTA level,
// and the collapsed C table may be all there is). A figure whose cells are not
// found is left unknown, never 0.
//   disability     people with a disability (civilian noninstitutionalized)
//   employer       people with employer-based health insurance
//   direct         people with direct-purchase (individual) health insurance
//   tricare        people with TRICARE / military coverage
//   va             people with VA health care
//   seniors_alone  people 65+ living alone (universe: people 65+ in households)
// Coverage types overlap (people can hold several), so they are never added.
export const SIGNAL_RULES = {
  disability: { tables: ['B18101', 'C18101'], match: /!!With a disability$/ },
  employer: { tables: ['B27004', 'C27004'], match: /!!With employer-based health insurance$/ },
  direct: { tables: ['B27005', 'C27005'], match: /!!With direct-purchase health insurance$/ },
  tricare: { tables: ['B27008', 'C27008'], match: /!!With TRICARE\/military health coverage$/ },
  va: { tables: ['B27009', 'C27009'], match: /!!With VA Health Care$/i },
  seniors_alone: { tables: ['B09021'], match: /65 years and over:!!Lives alone$/, universe: /!!65 years and over:$/ }
};

// labels: { id: label } for every table fetched; found: { key: table actually used }.
// Returns { key: { cells: [ids], universe: id } } for the keys that matched, or null.
export function pickSignalVars(labels, found) {
  const out = {};
  for (const [k, rule] of Object.entries(SIGNAL_RULES)) {
    const g = found && found[k];
    if (!g) continue;
    const ids = Object.keys(labels).filter(id => id.startsWith(g + '_') && id.endsWith('E'));
    const cells = ids.filter(id => rule.match.test(labels[id])).sort();
    if (!cells.length) continue;
    const universe = rule.universe ? ids.filter(id => rule.universe.test(labels[id])).sort() : [g + '_001E'];
    if (!universe.length) continue;
    out[k] = { cells, universe };
  }
  return Object.keys(out).length ? out : null;
}
export function signalVarIds(sig) {
  if (!sig) return [];
  return [...new Set(Object.values(sig).flatMap(s => s.cells.concat(s.universe)))];
}
// { key: { n, of } } with nulls for unknown; a count above its universe is dropped.
export function signalFields(r, sig) {
  const out = {};
  for (const k of Object.keys(SIGNAL_RULES)) {
    const s = sig && sig[k];
    if (!s) { out[k] = { n: null, of: null }; continue; }
    const n = sum(s.cells.map(id => num(r[id]))), of = sum(s.universe.map(id => num(r[id])));
    out[k] = n !== null && of !== null && n > of ? { n: null, of } : { n, of };
  }
  return out;
}
