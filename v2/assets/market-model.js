/* ============================================================================
   market-model.js — the explainable market-opportunity model.

   Scores every patient-facing specialty (assets/specialties.js, 33 of them)
   in one catchment and classifies each into an ARCHETYPE with a strategy, a
   score, the reasons behind it, and a confidence level.

   Pure and dependency-free, like accuracy-signals.js:
   market-score.js gathers the inputs, this file only computes, and
   scripts/test-market-model.mjs tests it without a network. Every number it
   emits has to survive "why does it say that about my area?", so each factor
   carries the evidence and the benchmark it was measured against.

   ---------------------------------------------------------------------------
   THE FIVE FACTORS (0-100, higher = more opportunity for a new provider)

     need        CDC PLACES modelled prevalence of the conditions that drive
                 THIS specialty's caseload, plus age mix, as a national
                 percentile (per-measure benchmarks), or, only when a caller
                 passes group fallbacks, a group percentile.
     access      Clinicians of this specialty per 1,000 adults in the
                 catchment vs the national rate. 50 = national rate,
                 100 = none, 0 = twice the national rate.
     pay         Insured rate (70%) and household income (30%), as percentiles
                 among ZIPs in the same state. Income is, when ACS detail is
                 loaded, median household income (50%), share of households at
                 $100k+ (25%) and low poverty (25%); otherwise the share at $75k+.
     shortage    Federal HPSA score for the matching discipline in the ZIP's
                 own county (via the HUD crosswalk), else the state median,
                 flagged.
     competition Distance from the ZIP centre to the nearest clinician of this
                 specialty. Next door = low, 10+ miles = high.

   A factor that cannot be computed is left out and the remaining weights
   renormalised. It is never filled with a neutral 50: unknown is not
   average, and confidence drops instead (the rule accuracy-signals.js
   already follows).

   ARCHETYPES are rules over the factors, not a clustering algorithm, so the
   label always has a sentence-length reason. See classify().
   ============================================================================ */
(function (global) {
  'use strict';

  var VERSION = '2026-11-20.2';

  // The HRSA shortage factor (HPSA score, 0.10) was retired 2026-11-19, the
  // user's choice: HPSA is itself a population-to-provider ratio, the method
  // the drive-time access factor replaces, so scoring with it was circular.
  // Its weight was shared out in proportion; the HPSA figure is still
  // reported (evidence.hpsa_reference) as an independent comparison.
  //
  // Competition left the score 2026-11-19 (the user's choice after the
  // back-test, supabase/reference/backtest-entry.md): distance from the
  // nearest competitor ran -0.18 to -0.74 against where clinicians actually
  // set up in 2021 to 2025, because new clinicians join groups and hospitals
  // where others already practise. It is still computed and returned as a
  // fact (factors.competition, evidence.competition), never weighted.
  //
  // Two scores sit beside the headline (scores.patient_need = mean of need
  // and access, tested against county ER use; scores.viability = pay, the
  // only part that ran positive against entry).
  var WEIGHTS = { need: 0.333, access: 0.333, pay: 0.334 };

  // How much the access factor counts, per specialty (2026-11-20, the user's
  // go-ahead: learned weights from the back-test, supabase/reference/
  // backtest-entry.md section 1). Access alone was correlated with county
  // preventable hospital stays (County Health Rankings) across about 2,900
  // counties: 0.15 or more keeps full weight (1), 0.05 to 0.15 half (0.5),
  // under 0.05 none (0). Patients travel for most specialists, so a
  // 10-mile supply count says little there. A specialty not in the table
  // (no outcome test: pediatrics, OB-GYN, dermatology ...) keeps 1. Access
  // is still computed and shown, and still drives the archetype. Since 2026-11-24 the back-test
  // tests the stored drive-time access, and this table follows that run.
  var ACCESS_SHARE = {
    'Mental health & counseling': 1, 'Dental': 1, 'Eye care': 0.5, 'Chiropractic': 1,
    'Physical & occupational therapy': 1, 'Nutrition & dietitian': 1,
    'Acupuncture, massage & naturopathy': 1, 'Hearing & audiology': 0.5,
    'Orthopedics & sports injury': 0.5, 'Diabetes & hormones': 0.5,
    'Foot & ankle / podiatry': 0.5, 'General surgery': 0.5,
    'Primary care / family doctor': 0, 'Heart / cardiology': 0, 'Allergy & immunology': 0,
    'Lung, breathing & sleep': 0, 'Digestive / gastroenterology': 0, 'Kidney / nephrology': 0,
    'Cancer care / oncology': 0, 'Arthritis / rheumatology': 0, 'Brain & nerves / neurology': 0,
    'Ear, nose & throat': 0, 'Urology': 0, 'Pain management': 0, 'Speech & language therapy': 0,
    'Urgent care & emergency': 0, 'Imaging & lab': 0, 'Pharmacy': 0,
    'Home health & in-home care': 0, 'Nursing & assisted living': 0,
    'Medical equipment & supplies': 0, 'Care coordination & community health': 0.5,
    'Hospice & palliative care': 0
  };
  // Specialties whose combined score did not track preventable stays
  // (correlation under 0.10): a caveat and a confidence penalty.
  var UNVALIDATED = {
    'Allergy & immunology': 1, 'Cancer care / oncology': 1,
    'Ear, nose & throat': 1, 'Urgent care & emergency': 1, 'Imaging & lab': 1
  };
  // Back-test evidence per specialty (2026-11-25, the user's go-ahead to show
  // it in Insights): [counties, score rho, HPSA rho, verdict] against county
  // preventable hospital stays, copied from supabase/reference/backtest-entry.md
  // section 4a. Verdict from the paired bootstrap of score minus HPSA: 1 the
  // 95% interval is above zero, -1 below, 0 it spans zero. A specialty with
  // no row had no outcome test. Update with the report when it is rerun.
  var EVIDENCE = {
    'Primary care / family doctor': [2874, 0.28, 0.17, 1],
    'Mental health & counseling': [2874, 0.31, 0.06, 1],
    'Dental': [2978, 0.43, 0.13, 1],
    'Eye care': [2874, 0.31, 0.17, 1],
    'Chiropractic': [2874, 0.34, 0.17, 1],
    'Physical & occupational therapy': [2874, 0.27, 0.17, 1],
    'Orthopedics & sports injury': [2874, 0.23, 0.17, 1],
    'Heart / cardiology': [2874, 0.16, 0.17, 0],
    'Allergy & immunology': [2874, 0.07, 0.17, -1],
    'Lung, breathing & sleep': [2978, 0.21, 0.17, 0],
    'Digestive / gastroenterology': [2978, 0.20, 0.17, 0],
    'Kidney / nephrology': [2874, 0.14, 0.17, 0],
    'Diabetes & hormones': [2874, 0.30, 0.17, 1],
    'Cancer care / oncology': [2874, -0.04, 0.17, -1],
    'Arthritis / rheumatology': [2874, 0.11, 0.17, -1],
    'Brain & nerves / neurology': [2874, 0.22, 0.17, 1],
    'Ear, nose & throat': [2874, 0.05, 0.17, -1],
    'Urology': [2874, 0.22, 0.17, 1],
    'Foot & ankle / podiatry': [2874, 0.26, 0.17, 1],
    'Pain management': [2874, 0.12, 0.17, 0],
    'Speech & language therapy': [2874, 0.19, 0.17, 0],
    'Nutrition & dietitian': [2874, 0.33, 0.17, 1],
    'Acupuncture, massage & naturopathy': [2874, 0.37, 0.17, 1],
    'Urgent care & emergency': [2874, -0.18, 0.17, -1],
    'Imaging & lab': [2874, -0.05, 0.17, -1],
    'Pharmacy': [2874, 0.29, 0.17, 1],
    'Home health & in-home care': [2874, 0.17, 0.17, 0],
    'Nursing & assisted living': [2874, 0.24, 0.17, 1],
    'Medical equipment & supplies': [2874, 0.17, 0.17, 0],
    'Hearing & audiology': [2874, 0.12, 0.17, 0],
    'Care coordination & community health': [2874, 0.23, 0.17, 1],
    'General surgery': [2874, 0.14, 0.17, 0],
    'Hospice & palliative care': [2874, 0.10, 0.17, -1]
  };
  function evidenceText(label) {
    var e = EVIDENCE[label];
    if (!e) return 'No hospital-outcome back-test exists for this specialty yet.';
    var n = e[0].toLocaleString('en-US'), sc = e[1].toFixed(2), hp = e[2].toFixed(2);
    if (e[3] > 0) return 'Back-test: this score tracks preventable hospital stays better than the federal shortage designation (rank correlation ' + sc + ' vs ' + hp + ', ' + n + ' counties).';
    if (e[3] < 0) return 'Back-test: the federal shortage designation tracks preventable hospital stays better here (' + hp + ' vs ' + sc + ' for this score, ' + n + ' counties). Read this score with care.';
    return 'Back-test: this score and the federal shortage designation track preventable hospital stays about equally (' + sc + ' vs ' + hp + ', ' + n + ' counties).';
  }
  // Payer yield (2026-11-20, the user's go-ahead after the back-test: it beat
  // the insured rate against clinician entry in all 40 specialties). What an
  // average resident's coverage pays a practice relative to Medicare: Census
  // coverage counts weighted by published payment levels (commercial 1.43,
  // MedPAC / KFF; Medicaid 0.72, Urban Institute fee index; Medicare 1.0;
  // uninsured 0), averaged over coverage counts because types overlap, times
  // the insured share. Null when any count is missing.
  var YIELD = { commercial: 1.43, medicare: 1.0, medicaid: 0.72 };
  function payerYield(a) {
    if (!a || a.insured == null || a.medicare == null || a.medicaid == null || a.employer == null) return null;
    var c = (a.employer || 0) + (a.direct || 0) + (a.tricare || 0), n = c + a.medicare + a.medicaid;
    if (!(n > 0)) return null;
    return a.insured * (c * YIELD.commercial + a.medicare * YIELD.medicare + a.medicaid * YIELD.medicaid) / n;
  }
  // Payer yield by the specialty's patients' ages (2026-11-24, a dry run in the
  // back-test before any live use). covAge is census_acs_zcta.signals.cov_age:
  // three bands with people and coverage counts. Each band counts in
  // proportion to its people, tilted by the specialty's age measures in
  // PROFILES (over65 to 65+, under18 to under 19): weight 1 + 4 x the measure's
  // weight, or that band alone when the weight is 1 (pediatrics, ABA, nursing
  // homes, hospice). A band with a missing count makes the whole figure unknown.
  var AGE_DEMO = { over65: 'a65', under18: 'u19', age19to44: 'a19_64' };
  function ageTilt(label) {
    var t = { u19: 1, a19_64: 1, a65: 1 }, d = (PROFILES[label] && PROFILES[label].d) || [];
    d.forEach(function (p) { var b = AGE_DEMO[p[0]]; if (!b) return; if (p[1] >= 1) { t = { u19: 0, a19_64: 0, a65: 0 }; t[b] = 1; } else t[b] = 1 + 4 * p[1]; });
    return t;
  }
  function payerYieldAge(covAge, label) {
    if (!covAge) return null;
    var t = ageTilt(label), agg = { pop: 0, uninsured: 0, employer: 0, direct: 0, tricare: 0, medicare: 0, medicaid: 0 };
    for (var b in t) {
      if (!t[b]) continue;
      var c = covAge[b]; if (!c || c.pop == null || c.uninsured == null) return null;
      for (var k in agg) { if (c[k] == null && (k === 'pop' || k === 'uninsured')) return null; agg[k] += t[b] * (c[k] || 0); }
    }
    if (!(agg.pop > 0)) return null;
    return payerYield({ insured: 1 - agg.uninsured / agg.pop, employer: agg.employer, direct: agg.direct, tricare: agg.tricare, medicare: agg.medicare, medicaid: agg.medicaid });
  }
  function payerMix(a) {
    if (!a || a.medicare == null || a.medicaid == null || a.employer == null) return null;
    var c = (a.employer || 0) + (a.direct || 0) + (a.tricare || 0), n = c + a.medicare + a.medicaid;
    if (!(n > 0)) return null;
    var r = function (v) { return Math.round(v / n * 100); };
    return { commercial_pct: r(c), medicare_pct: r(a.medicare), medicaid_pct: r(a.medicaid), uninsured_pct: Math.round((1 - a.insured) * 100) };
  }

  // Learned need and pay weights (2026-11-23, step 9, the user's go-ahead):
  // the same rule as ACCESS_SHARE (rho 0.15+ full, 0.05 to 0.15 half, under
  // 0.05 none). NEED_SHARE from need alone against county preventable
  // hospital stays (back-test section 1), PAY_SHARE from payer yield against
  // clinician entry 2021 to 2025 (section 2). Missing from a table keeps 1.
  // Rerun the back-test after the full rerun and update all three tables.
  var NEED_SHARE = {
    'Allergy & immunology': 0.5, 'Ear, nose & throat': 0.5,
    'Cancer care / oncology': 0, 'Urgent care & emergency': 0, 'Imaging & lab': 0, 'Hearing & audiology': 0
  };
  var PAY_SHARE = {
    'Primary care / family doctor': 0.5, 'Eye care': 0.5, 'Heart / cardiology': 0.5, 'Allergy & immunology': 0.5,
    'Lung, breathing & sleep': 0.5, 'Digestive / gastroenterology': 0.5, 'Kidney / nephrology': 0.5,
    'Diabetes & hormones': 0.5, 'Cancer care / oncology': 0.5, 'Ear, nose & throat': 0.5, 'Urology': 0.5,
    'Foot & ankle / podiatry': 0.5, 'Pain management': 0.5, 'Plastic & reconstructive surgery': 0.5,
    'Urgent care & emergency': 0.5, 'Imaging & lab': 0.5, 'Pharmacy': 0.5, 'Nursing & assisted living': 0.5,
    'Medical equipment & supplies': 0.5, 'Care coordination & community health': 0.5,
    'Infectious disease': 0.5, 'Genetics & genetic counseling': 0.5, 'Hospice & palliative care': 0.5,
    'Arthritis / rheumatology': 0, 'Home health & in-home care': 0
  };
  function share(t, label) { return t.hasOwnProperty(label) ? t[label] : 1; }
  function weightsFor(label) {
    var a = share(ACCESS_SHARE, label), n = share(NEED_SHARE, label), p = share(PAY_SHARE, label);
    var w = { need: WEIGHTS.need * n, access: WEIGHTS.access * a, pay: WEIGHTS.pay * p }, t = w.need + w.access + w.pay;
    // Nothing validated at all: fall back to the plain weights rather than divide by zero.
    if (!(t > 0)) { w = { need: WEIGHTS.need, access: WEIGHTS.access, pay: WEIGHTS.pay }; t = w.need + w.access + w.pay; }
    return { need: w.need / t, access: w.access / t, pay: w.pay / t, access_share: a, need_share: n, pay_share: p };
  }

  // Per-specialty need drivers. m: [PLACES measureid, weight, invert?],
  // d: [census proxy, weight]. Weights are relative within a specialty.
  // `invert` marks prevention measures where LOW uptake signals unmet need.
  // A specialty with no defensible clinical driver gets only demographic
  // proxies (or none), and its confidence says so.
  var PROFILES = {
    'Primary care / family doctor': { m: [['BPHIGH', 1], ['DIABETES', 1], ['HIGHCHOL', .8], ['OBESITY', .6], ['CHECKUP', .6, 1], ['CSMOKING', .3]], d: [['over65', .3]] },
    'Pediatrics (children)': { m: [], d: [['under18', 1]] },
    "Women's health / OB-GYN": { m: [], d: [['age19to44', 1]] },
    'Mental health & counseling': { m: [['DEPRESSION', 1], ['MHLTH', .9], ['BINGE', .4], ['LONELINESS', .3], ['EMOTIONSPT', .3]], d: [] },
    'Dental': { m: [['TEETHLOST', 1], ['DENTAL', .9, 1]], d: [] },
    'Eye care': { m: [['VISION', 1], ['DIABETES', .4]], d: [['over65', .5]] },
    'Chiropractic': { m: [['ARTHRITIS', .6], ['OBESITY', .3], ['LPA', .3]], d: [] },
    'Physical & occupational therapy': { m: [['ARTHRITIS', .8], ['MOBILITY', .6], ['OBESITY', .3]], d: [['over65', .4]] },
    'Orthopedics & sports injury': { m: [['ARTHRITIS', 1], ['OBESITY', .5], ['MOBILITY', .4]], d: [] },
    'Heart / cardiology': { m: [['CHD', 1], ['BPHIGH', .8], ['HIGHCHOL', .6], ['STROKE', .4]], d: [['over65', .4]] },
    'Skin / dermatology': { m: [], d: [['over65', .5]] },
    'Allergy & immunology': { m: [['CASTHMA', 1]], d: [] },
    'Lung, breathing & sleep': { m: [['COPD', 1], ['CASTHMA', .7], ['CSMOKING', .5], ['SLEEP', .5]], d: [] },
    'Digestive / gastroenterology': { m: [['OBESITY', .5], ['COLON_SCREEN', .6, 1]], d: [['over65', .4]] },
    'Kidney / nephrology': { m: [['KIDNEY', 1], ['DIABETES', .8], ['BPHIGH', .6]], d: [] },
    'Diabetes & hormones': { m: [['DIABETES', 1], ['OBESITY', .7]], d: [] },
    'Cancer care / oncology': { m: [['CANCER', 1], ['CSMOKING', .3]], d: [['over65', .5]] },
    'Arthritis / rheumatology': { m: [['ARTHRITIS', 1]], d: [] },
    'Brain & nerves / neurology': { m: [['STROKE', 1], ['COGNITION', .6]], d: [['over65', .4]] },
    'Ear, nose & throat': { m: [['HEARING', 1], ['CASTHMA', .3]], d: [] },
    'Urology': { m: [['KIDNEY', .3], ['DIABETES', .3]], d: [['over65', .8]] },
    'Foot & ankle / podiatry': { m: [['DIABETES', 1], ['OBESITY', .5], ['ARTHRITIS', .4]], d: [['over65', .3]] },
    'Pain management': { m: [['ARTHRITIS', 1], ['PHLTH', .4], ['MOBILITY', .4]], d: [] },
    'Plastic & reconstructive surgery': { m: [], d: [] },
    // Renamed 2026-10-09: hearing moved to its own category, which keeps the
    // old hearing-loss profile. Speech therapy follows stroke and children.
    'Speech & language therapy': { m: [['STROKE', .6], ['COGNITION', .3]], d: [['under18', .6]] },
    'Nutrition & dietitian': { m: [['OBESITY', 1], ['DIABETES', .8], ['HIGHCHOL', .4]], d: [] },
    'Acupuncture, massage & naturopathy': { m: [['ARTHRITIS', .5], ['MHLTH', .3]], d: [] },
    'Urgent care & emergency': { m: [['CHECKUP', .5, 1]], d: [] },
    'Imaging & lab': { m: [['CANCER', .5], ['CHD', .3]], d: [['over65', .5]] },
    'Pharmacy': { m: [['DIABETES', .5], ['BPHIGH', .5]], d: [] },
    'Home health & in-home care': { m: [['MOBILITY', 1], ['SELFCARE', .8], ['INDEPLIVE', .6]], d: [['over65', .7]] },
    'Nursing & assisted living': { m: [['INDEPLIVE', .8], ['COGNITION', .6]], d: [['over65', 1]] },
    'Medical equipment & supplies': { m: [['MOBILITY', .6], ['DIABETES', .4]], d: [['over65', .5]] },
    // Added with the NUCC code table (2026-10-09), reviewed with the user
    // 2026-10-11. Same rule as above: none where nothing defensible exists
    // (infection and genetics), so the score rests on supply and payers and
    // says so. Speech gained cognition (swallowing and speech therapy in
    // dementia), hospice gained cognition (dementia is now its leading
    // diagnosis), and care coordination moved from frailty to social need:
    // case managers and community health workers mostly serve low-income,
    // chronically ill patients.
    'Hearing & audiology': { m: [['HEARING', 1]], d: [['over65', .5]] },
    'Behavior therapy (ABA)': { m: [], d: [['under18', 1]] },
    'Care coordination & community health': { m: [['ACCESS2', .6], ['FOODINSECU', .5], ['LACKTRPT', .4], ['DIABETES', .4]], d: [] },
    'General surgery': { m: [['OBESITY', .4], ['CANCER', .3]], d: [['over65', .5]] },
    'Infectious disease': { m: [], d: [] },
    'Genetics & genetic counseling': { m: [], d: [] },
    'Hospice & palliative care': { m: [['CANCER', .6], ['COGNITION', .6], ['COPD', .4], ['CHD', .4]], d: [['over65', 1]] }
  };

  // Which federal shortage designation (HPSA discipline) applies. HRSA designates
  // three: primary care, dental and mental health; everything else is judged
  // against primary care, as before.
  var SHORTAGE_DISCIPLINE = {
    'Mental health & counseling': 'mental',
    'Behavior therapy (ABA)': 'mental',
    'Dental': 'dental'
  };

  var DEMO_LABEL = { over65: 'residents 65+', under18: 'children under 18', age19to44: 'adults 19-44 (census proxy)' };

  var ARCHETYPES = {
    unserved:        { name: 'Unserved', strategy: 'Nobody practises this within the catchment. Residents travel or go without; validate demand, then be first.' },
    prime:           { name: 'Prime expansion', strategy: 'High need, thin supply, patients who can pay. Open or add capacity here first.' },
    safety_net:      { name: 'Safety-net opportunity', strategy: 'High need and thin supply, but a weaker payer mix. Viable with Medicaid, FQHC or shortage-area programs.' },
    latent:          { name: 'Latent demand', strategy: 'Supply is thin but modelled need is average. Test demand (telehealth, a part-time clinic) before committing.' },
    crowded_premium: { name: 'Crowded premium market', strategy: 'Well supplied and well insured. Win on access, availability and experience, not on being present.' },
    saturated:       { name: 'Saturated', strategy: 'Plenty of providers and a weaker payer mix. Look for a gap in a neighbouring specialty or area.' },
    balanced:        { name: 'Balanced', strategy: 'Supply roughly matches need. Growth comes from standing out: insurance accepted, hours, availability.' },
    insufficient:    { name: 'Not enough data', strategy: 'Too little data to classify this area reliably. Treat any score as indicative only.' }
  };

  function clamp(x) { return Math.max(0, Math.min(100, x)); }

  // Piecewise-linear percentile through stored anchors {p05,p25,p50,p75,p95}.
  function pct(anchors, v) {
    if (!anchors || v == null || !isFinite(v)) return null;
    var pts = [[anchors.p05, 5], [anchors.p25, 25], [anchors.p50, 50], [anchors.p75, 75], [anchors.p95, 95]];
    if (pts.some(function (p) { return p[0] == null; })) return null;
    if (v <= pts[0][0]) return 5;
    if (v >= pts[4][0]) return 95;
    for (var i = 1; i < pts.length; i++) {
      if (v <= pts[i][0]) {
        var lo = pts[i - 1], hi = pts[i], span = hi[0] - lo[0];
        return span > 0 ? lo[1] + ((v - lo[0]) / span) * (hi[1] - lo[1]) : hi[1];
      }
    }
    return 95;
  }

  // Share of values strictly below v (0-100): the percentile of v in a sample.
  function rankIn(sample, v) {
    if (!sample || !sample.length || v == null || !isFinite(v)) return null;
    var below = 0, eq = 0;
    for (var i = 0; i < sample.length; i++) { if (sample[i] < v) below++; else if (sample[i] === v) eq++; }
    return ((below + eq / 2) / sample.length) * 100;
  }

  function measureIds() {
    var s = {};
    Object.keys(PROFILES).forEach(function (k) { PROFILES[k].m.forEach(function (m) { s[m[0]] = true; }); });
    return Object.keys(s);
  }

  /* --------------------------------------------------------------------------
     score(input) -> { specialties: [...], headline, weights, version }

     input = {
       specialties: SPECIALTIES rows [label, mapTerms, nppesTerm],
       groupOf(label) -> group key, OPTIONAL: only for the group-level need and
         access fallbacks below (groupNeedPct / groupAccess). market-score no
         longer passes any of the three (the six groups were retired
         2026-10-11); a specialty without a benchmark or measure is then left
         unknown and says so.
       rows: catchment listings [{ taxonomy_code, primary_taxonomy, latitude, longitude }],
       codesFor(label) -> NUCC codes in that specialty (TaxonomyMap.codesFor);
         when given, a listing belongs to a specialty by its code. Without it
         (older callers, tests) taxMatches(stored, terms) matches by name.
       taxMatches(stored, terms) -> bool,
       center: { lat, lng },
       adults: catchment adults 18+,
       milesBetween(aLat, aLng, bLat, bLng),
       places: { measureid: catchment population-weighted prevalence },
       groupNeedPct: { groupKey: national percentile 0-100 } (fallback),
       groupAccess: { groupKey: access score 0-100 } (fallback),
       demo: { over65, under18, age19to44 } as percentiles within the state,
       pay: { insuredPct, incomePct } percentiles within the state,
       shortage: { primary|dental|mental: { score, basis:'county'|'state'|'none' } },
       benchmarks: { measures: { ID: anchors }, specialties: { label: { rate_per_1k } } } | null,
       catchmentTruncated: bool, radiusMiles
     }
     ------------------------------------------------------------------------ */
  function score(input) {
    var out = [];
    var bm = input.benchmarks || {};
    var bmMeasures = bm.measures || {}, bmSpecs = bm.specialties || {};

    // Pre-bucket listings per specialty once.
    var bySpec = {};
    input.specialties.forEach(function (s) { bySpec[s[0]] = []; });
    if (input.codesFor) {
      // By NUCC code: one lookup per listing. A code may sit in several
      // specialties (the reviewed table says so explicitly); a listing with no
      // code belongs to none.
      var specsOf = {};
      input.specialties.forEach(function (s) {
        input.codesFor(s[0]).forEach(function (c) { (specsOf[c] = specsOf[c] || []).push(s[0]); });
      });
      (input.rows || []).forEach(function (r) {
        (specsOf[r.taxonomy_code] || []).forEach(function (label) { bySpec[label].push(r); });
      });
    } else {
      (input.rows || []).forEach(function (r) {
        input.specialties.forEach(function (s) {
          if (input.taxMatches(r.primary_taxonomy, s[1].split(','))) bySpec[s[0]].push(r);
        });
      });
    }

    input.specialties.forEach(function (s) {
      var label = s[0], prof = PROFILES[label] || { m: [], d: [] };
      var group = input.groupOf ? input.groupOf(label) : null;
      var f = {}, ev = {}, caveats = [];

      /* ---- need ---- */
      var parts = [], wsum = 0, acc = 0, basis = null;
      prof.m.forEach(function (m) {
        var raw = input.places ? input.places[m[0]] : null;
        if (raw == null || !isFinite(raw)) return;
        var p = pct(bmMeasures[m[0]], raw);
        if (p == null) return;
        if (m[2]) p = 100 - p;
        acc += p * m[1]; wsum += m[1];
        // An inverted measure is labelled by what is missing ("missed colon
        // screening"), so its value is the share missing, with the uptake
        // beside it. Until 2026-10-22 the raw uptake went out under the
        // "missed" label, and a report said 58.8% had missed colon screening
        // when 58.8% were screened.
        parts.push(m[2]
          ? { measure: m[0], label: MEASURE_NAME[m[0]] || m[0], value: Math.round((100 - raw) * 10) / 10, uptake: Math.round(raw * 10) / 10, percentile: Math.round(p), inverted: true }
          : { measure: m[0], label: MEASURE_NAME[m[0]] || m[0], value: Math.round(raw * 10) / 10, percentile: Math.round(p), inverted: false });
        basis = 'specialty';
      });
      if (!parts.length && prof.m.length && input.groupNeedPct && input.groupNeedPct[group] != null) {
        acc += input.groupNeedPct[group] * 1; wsum += 1; basis = 'group';
        parts.push({ measure: 'group:' + group, label: 'group health-need index', percentile: Math.round(input.groupNeedPct[group]) });
        caveats.push('Need is benchmarked at the specialty-group level until national per-measure benchmarks are built.');
      }
      prof.d.forEach(function (d) {
        var p = input.demo ? input.demo[d[0]] : null;
        if (p == null || !isFinite(p)) return;
        acc += p * d[1]; wsum += d[1];
        parts.push({ demo: d[0], label: DEMO_LABEL[d[0]], percentile: Math.round(p) });
        basis = basis || 'demographic';
      });
      var learned = input.learnedNeed ? input.learnedNeed[label] : null;
      if (learned && learned.percentile != null) {
        // A trained model (assets/demand-model.js) that predicted held-out
        // states well replaces the hand-weighted blend above for this specialty.
        f.need = clamp(learned.percentile);
        ev.need = { basis: 'learned', percentile: learned.percentile, per_1k: learned.per_1k, r2_cv: learned.r2_cv,
          drivers: learned.drivers, parts: (learned.drivers || []).map(function (d) { return { label: d.label, direction: d.direction }; }) };
        caveats.push('Need is learned from Medicare fee-for-service use (held-out R\u00b2 ' + learned.r2_cv + '), so it does not see Medicare Advantage, commercial or Medicaid patients.');
      } else if (wsum) { f.need = clamp(acc / wsum); ev.need = { basis: basis, parts: parts }; }
      else caveats.push('No defensible health-need measure exists for this specialty; scored on supply and payers only.');

      /* ---- access ---- */
      var listings = bySpec[label] || [];
      // A row may be a listing or a ZIP total (listing_counts_zip, migration
      // 053) carrying n listings and their weighted sum w.
      var clin = 0;
      listings.forEach(function (r) { clin += (typeof r.n === 'number' && r.n > 0) ? r.n : 1; });
      // Weighted supply (step 1 of the scoring upgrade, 2026-11-19): a
      // clinician with several sites carries w = 0.6 at the main address;
      // listings without a weight count 1.
      var fte = 0;
      listings.forEach(function (r) { fte += (typeof r.w === 'number' && r.w > 0) ? r.w : ((typeof r.n === 'number' && r.n > 0) ? r.n : 1); });
      var per1k = input.adults ? (fte / input.adults) * 1000 : null;
      var rate = bmSpecs[label] && bmSpecs[label].rate_per_1k;
      if (clin === 0 && input.adults > 0) {
        // Nobody within the radius is the thinnest supply there is, with or
        // without a national rate to compare against.
        f.access = 100;
        ev.access = { basis: rate ? 'specialty' : 'none_found', per_1k: 0, national_per_1k: rate ? round2(rate) : null, clinicians: 0 };
      } else if (rate && input.accessE2sfca && input.accessE2sfca[label] && input.adults > 0) {
        // Drive-time access (E2SFCA, migration 049; Tennessee first, the
        // user's choice 2026-11-18). A what-if's extra listings are added at
        // the crude rate, since the stored figure cannot be re-routed here.
        var e2 = input.accessE2sfca[label];
        var extra = listings.filter(function (r) { return r.npi === 'scenario'; }).length;
        var p2 = Number(e2.per_1k) + (extra / input.adults) * 1000;
        f.access = p2 === 0 ? 100 : clamp(100 - (p2 / rate) * 50);
        ev.access = { basis: 'e2sfca', per_1k: round2(p2), national_per_1k: round2(rate), clinicians: clin,
          catchment_minutes: e2.catchment_minutes, crude_per_1k: per1k == null ? null : round2(per1k) };
      } else if (per1k != null && rate) {
        f.access = clamp(100 - (per1k / rate) * 50);
        ev.access = { basis: 'specialty', per_1k: round2(per1k), national_per_1k: round2(rate), clinicians: clin, weighted_clinicians: round2(fte) };
      } else if (input.groupAccess && input.groupAccess[group] != null) {
        f.access = clamp(input.groupAccess[group]);
        ev.access = { basis: 'group', per_1k: per1k == null ? null : round2(per1k), clinicians: clin };
        caveats.push('Supply is compared at the specialty-group level until national per-specialty rates are built.');
      }

      /* ---- pay ---- */
      var pay = input.pay || {};
      var payBase = pay.yieldPct != null ? pay.yieldPct : pay.insuredPct;
      if (payBase != null) {
        f.pay = clamp(pay.incomePct != null ? payBase * 0.7 + pay.incomePct * 0.3 : payBase);
        ev.pay = { insured_pct: Math.round(pay.insuredPct), income_pct: pay.incomePct == null ? null : Math.round(pay.incomePct),
          income_basis: pay.incomePct == null ? null : (pay.incomeBasis || 'census75'), income_detail: pay.incomeDetail || null,
          basis: pay.yieldPct != null ? 'payer_yield' : 'insured', yield_pct: pay.yieldPct == null ? null : Math.round(pay.yieldPct), payer_mix: pay.payerMix || null };
        if (pay.insuredPct == null) ev.pay.insured_pct = null;
      }

      /* ---- shortage ---- */
      var disc = SHORTAGE_DISCIPLINE[label] || 'primary';
      var sh = input.shortage && input.shortage[disc];
      if (sh && sh.score != null) {
        // Reference only, never scored (see WEIGHTS).
        ev.hpsa_reference = { discipline: disc, hpsa: Math.round(sh.score * 10) / 10, basis: sh.basis };
      }

      /* ---- competition ---- */
      var nearest = null;
      if (input.center && listings.length) {
        listings.forEach(function (r) {
          if (r.latitude == null || r.longitude == null) return;
          var d = input.milesBetween(input.center.lat, input.center.lng, +r.latitude, +r.longitude);
          if (nearest == null || d < nearest) nearest = d;
        });
      }
      if (nearest != null) {
        f.competition = clamp(nearest <= 1 ? 30 : nearest >= 10 ? 90 : 30 + (nearest - 1) * (60 / 9));
        ev.competition = { nearest_miles: Math.round(nearest * 10) / 10 };
      } else if (clin === 0) {
        f.competition = 95;
        ev.competition = { nearest_miles: null, note: 'none within ' + (input.radiusMiles || 25) + ' miles' };
      }

      /* ---- combine ---- */
      var W = weightsFor(label);
      var tw = 0, total = 0;
      Object.keys(WEIGHTS).forEach(function (k) { if (f[k] != null && W[k] > 0) { total += f[k] * W[k]; tw += W[k]; } });
      var sc = tw ? Math.round(total / tw) : null;

      /* ---- confidence ---- */
      var conf = tw;                                    // share of model weight backed by data
      if (ev.need && ev.need.basis !== 'specialty' && ev.need.basis !== 'learned') conf -= 0.15;
      if (ev.access && ev.access.basis === 'group') conf -= 0.15;
      if (input.catchmentTruncated) { conf -= 0.1; caveats.push('This area has more listings than one request returns, so supply counts are a floor.'); }
      if (UNVALIDATED[label]) { conf -= 0.15; caveats.push(evidenceText(label)); }
      if (input.adults != null && input.adults < 5000) { conf -= 0.15; caveats.push('Fewer than 5,000 adults in the catchment: small numbers swing the result.'); }
      var confidence = conf >= 0.8 ? 'high' : conf >= 0.55 ? 'medium' : 'low';

      var arche = classify(f, clin, confidence);
            var scores = {
        patient_need: (function () {
          var nw = f.need != null ? W.need_share : 0, aw = f.access != null ? W.access_share : 0;
          // Neither validated (oncology, imaging, urgent care): a plain mean, never null for data we hold.
          if (!(nw + aw)) { nw = f.need != null ? 1 : 0; aw = f.access != null ? 1 : 0; }
          return nw + aw ? Math.round(((f.need || 0) * nw + (f.access || 0) * aw) / (nw + aw)) : null;
        })(),
        viability: f.pay != null ? Math.round(f.pay) : null
      };
      out.push({
        specialty: label, group: group, score: sc, scores: scores, weights: { need: r3(W.need), access: r3(W.access), pay: r3(W.pay) }, archetype: arche, archetype_name: ARCHETYPES[arche].name,
        strategy: ARCHETYPES[arche].strategy, confidence: confidence, factors: roundAll(f), evidence: ev,
        reasons: reasons(f, ev, label, W), caveats: dedupe(caveats), clinicians: clin
      });
    });

    return { version: VERSION, weights: WEIGHTS, specialties: out };
  }

  // 1st, 2nd, 3rd, 11th, 91st ...
  function ord(v) {
    var n = Math.round(v), t = n % 100, u = n % 10;
    return n + (t >= 11 && t <= 13 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th');
  }

  // Rules, in order. Thresholds are the midpoint (50) +- 10: "clearly above
  // or below the national middle", nothing finer, because the inputs cannot
  // support finer distinctions honestly.
  function classify(f, clinicians, confidence) {
    var have = Object.keys(f).filter(function (k) { return f[k] != null; }).length;
    if (confidence === 'low' && have < 3) return 'insufficient';
    if (clinicians === 0) return 'unserved';
    var need = f.need, acc = f.access, pay = f.pay;
    if (acc != null && acc >= 60 && need != null && need >= 60) return pay != null && pay < 50 ? 'safety_net' : 'prime';
    // Unknown need is not low need (Puerto Rico has no PLACES measures).
    if (acc != null && acc >= 60 && need != null && need < 55) return 'latent';
    if (acc != null && acc < 40) return pay != null && pay >= 60 ? 'crowded_premium' : 'saturated';
    return 'balanced';
  }

  // The three factors that moved the score furthest from the middle, in words.
  function r3(v) { return Math.round(v * 1000) / 1000; }
  function reasons(f, ev, label, W) {
    var list = []; W = W || WEIGHTS;
    Object.keys(WEIGHTS).forEach(function (k) {
      if (f[k] == null || !W[k]) return;
      list.push({ k: k, pull: (f[k] - 50) * W[k] });
    });
    list.sort(function (a, b) { return Math.abs(b.pull) - Math.abs(a.pull); });
    return list.slice(0, 3).map(function (x) {
      return { factor: x.k, direction: x.pull >= 0 ? 'up' : 'down', text: explain(x.k, f[x.k], ev[x.k] || {}, label) };
    });
  }

  function explain(k, v, e, label) {
    var hi = v >= 60, lo = v < 40;
    if (k === 'need' && e.basis === 'learned') {
      var why = (e.drivers || []).slice(0, 2).map(function (d) { return d.label; }).join(' and ');
      return (hi ? 'Higher' : lo ? 'Lower' : 'Average') + ' expected demand than most US counties (' + ord(v) + ' pct), learned from Medicare use' + (why ? ', driven by ' + why : '') + '.';
    }
    if (k === 'need') {
      var top = (e.parts || []).slice().sort(function (a, b) { return b.percentile - a.percentile; })[0];
      var what = top ? (top.measure && top.measure.indexOf('group:') !== 0 ? MEASURE_NAME[top.measure] || top.measure : top.label || 'health measures') : 'health measures';
      return (hi ? 'Higher' : lo ? 'Lower' : 'Average') + ' modelled need than most of the US (' + ord(v) + ' pct), led by ' + what + '.';
    }
    if (k === 'access' && e.basis === 'e2sfca') {
      return e.per_1k + ' ' + label.toLowerCase() + ' clinicians per 1,000 adults within about ' + e.catchment_minutes + ' minutes\' drive (shared with every community that drives there) vs ' + e.national_per_1k + ' nationally.';
    }
    if (k === 'access') {
      if (!e.clinicians) return 'No ' + label.toLowerCase() + ' clinicians in the catchment.';
      return e.national_per_1k
        ? e.per_1k + ' ' + label.toLowerCase() + ' clinicians per 1,000 adults vs ' + e.national_per_1k + ' nationally.'
        : (hi ? 'Thinner' : lo ? 'Denser' : 'Typical') + ' supply than the national rate for this specialty group (' + e.clinicians + ' listings).';
    }
    if (k === 'pay') return 'Payer mix ranks at the ' + ord(v) + ' percentile of ZIPs in the state (insured rate ' + ord(e.insured_pct) +
      (e.income_pct != null ? (e.income_basis === 'acs' ? ', household income ' : ', $75k+ households ') + ord(e.income_pct) : '') + ').';
    if (k === 'shortage') return e.hpsa > 0
      ? 'Federal ' + e.discipline + '-care shortage score ' + e.hpsa + ' of ~25 ' + (e.basis === 'county' ? 'in this county' : 'statewide median') + '.'
      : 'No federal ' + e.discipline + '-care shortage designation ' + (e.basis === 'county' ? 'in this county' : 'found') + '.';
    if (k === 'competition') return e.nearest_miles == null ? 'No competitor within the catchment.' : 'Nearest competitor is ' + e.nearest_miles + ' miles away.';
    return '';
  }

  var MEASURE_NAME = {
    BPHIGH: 'high blood pressure', DIABETES: 'diabetes', HIGHCHOL: 'high cholesterol', OBESITY: 'obesity', CHECKUP: 'missed checkups',
    CSMOKING: 'smoking', DEPRESSION: 'depression', MHLTH: 'frequent mental distress', BINGE: 'binge drinking', LONELINESS: 'loneliness',
    EMOTIONSPT: 'lack of emotional support', TEETHLOST: 'tooth loss', DENTAL: 'missed dental visits', VISION: 'vision disability',
    ARTHRITIS: 'arthritis', LPA: 'physical inactivity', MOBILITY: 'mobility disability', CHD: 'coronary heart disease', STROKE: 'stroke',
    CASTHMA: 'asthma', COPD: 'COPD', SLEEP: 'short sleep', COLON_SCREEN: 'missed colon screening', KIDNEY: 'kidney disease',
    CANCER: 'cancer', COGNITION: 'cognitive disability', HEARING: 'hearing disability', PHLTH: 'frequent physical distress',
    SELFCARE: 'self-care disability', INDEPLIVE: 'independent-living disability',
    ACCESS2: 'no health insurance (18-64)', FOODINSECU: 'food insecurity', LACKTRPT: 'lack of reliable transportation'
  };

  function round2(x) { return Math.round(x * 100) / 100; }
  function roundAll(f) { var o = {}; Object.keys(f).forEach(function (k) { o[k] = f[k] == null ? null : Math.round(f[k]); }); return o; }
  function dedupe(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  // ---- Places patients go: facility access by care type (2026-10-25) ------
  // The specialty model above scores clinicians. This counts the places a
  // patient walks into (pharmacies, urgent cares, hospitals, labs, home
  // health agencies, ...) in the same catchment, by care type ("door") from
  // the reviewed code table, organizations only, against the national rate
  // per 10,000 adults (market_benchmarks kind 'care_type'). It is a supply
  // reading, not an opportunity score: no need or payer factor, and a type
  // with no national rate is reported without a verdict, never as average.
  var FACILITY_TYPES = ['Pharmacies', 'Urgent care', 'Emergency rooms & hospitals', 'Labs & imaging',
    'Mental health & addiction', 'Dental', 'Therapy & rehab', 'Home & senior care', 'Medical equipment & supplies',
    'Rides & transport', 'Surgery & procedure centers', 'Community & support services', 'Low-cost clinics'];
  function facilityVerdict(ratio, sites) {
    if (!sites) return 'none';
    if (ratio == null) return null;
    if (ratio < 0.5) return 'thin';
    if (ratio < 0.8) return 'below';
    if (ratio <= 1.5) return 'typical';
    return 'above';
  }
  // Each type's organization codes, from the reviewed table (taxonomy-map.js,
  // passed in so this file stays free of it). Low-cost clinics are the
  // safety-net codes; every other type is its door. Clinicians are left out:
  // a pharmacist is not a pharmacy.
  function facilityCodes(T) {
    var out = {};
    FACILITY_TYPES.forEach(function (t) {
      var codes = t === 'Low-cost clinics' ? T.safetyNetCodes() : T.codesForCare(t);
      out[t] = codes.filter(function (c) { var e = T.get(c); return e && !e.individual; });
    });
    return out;
  }
  // input: rows (catchment listings with taxonomy_code, latitude, longitude),
  // codesByType {type: [codes]} (organization codes only), rates {type:
  // rate_per_10k}, adults, center {lat, lng}, milesBetween, truncated.
  function facilities(input) {
    var i = input || {}, rows = i.rows || [], adults = Number(i.adults) || 0;
    var types = Object.keys(i.codesByType || {});
    var byCode = {};
    types.forEach(function (t) { (i.codesByType[t] || []).forEach(function (c) { (byCode[c] = byCode[c] || []).push(t); }); });
    var acc = {};
    types.forEach(function (t) { acc[t] = { seen: {}, sites: 0, nearest: null }; });
    rows.forEach(function (r) {
      var ts = byCode[r && r.taxonomy_code];
      if (!ts || !r.npi) return;
      ts.forEach(function (t) {
        var a = acc[t], key = String(r.npi) + '|' + (r.latitude || '') + '|' + (r.longitude || '');
        if (a.seen[key]) return;
        a.seen[key] = true; a.sites += (typeof r.sites === 'number' && r.sites > 0) ? r.sites : 1;
        // Presence, not truthiness: a coordinate can be 0.
        if (i.center && i.milesBetween && r.latitude != null && r.latitude !== '' && r.longitude != null && r.longitude !== '') {
          var d = i.milesBetween(i.center.lat, i.center.lng, +r.latitude, +r.longitude);
          if (a.nearest === null || d < a.nearest) a.nearest = d;
        }
      });
    });
    return types.map(function (t) {
      var a = acc[t], rate = i.rates && i.rates[t] != null ? Number(i.rates[t]) : null;
      var per10k = adults > 0 ? a.sites / adults * 10000 : null;
      var ratio = rate && per10k != null ? per10k / rate : null;
      return {
        type: t, sites: a.sites,
        per_10k_adults: per10k == null ? null : round2(per10k),
        national_per_10k: rate == null ? null : round2(rate),
        ratio: ratio == null ? null : round2(ratio),
        // A capped catchment load makes every count a floor: "above" could be
        // true, "thin" might not be, so a truncated load gives no verdict.
        verdict: i.truncated ? null : facilityVerdict(ratio, a.sites),
        nearest_miles: a.nearest == null ? null : Math.round(a.nearest * 10) / 10,
        floor: !!i.truncated
      };
    });
  }

  var API = {
    VERSION: VERSION, WEIGHTS: WEIGHTS, YIELD: YIELD, payerYield: payerYield, payerYieldAge: payerYieldAge, ageTilt: ageTilt, payerMix: payerMix, ACCESS_SHARE: ACCESS_SHARE, NEED_SHARE: NEED_SHARE, PAY_SHARE: PAY_SHARE, UNVALIDATED: UNVALIDATED, EVIDENCE: EVIDENCE, evidenceText: evidenceText, weightsFor: weightsFor, PROFILES: PROFILES, ARCHETYPES: ARCHETYPES, SHORTAGE_DISCIPLINE: SHORTAGE_DISCIPLINE,
    score: score, classify: classify, pct: pct, rankIn: rankIn, measureIds: measureIds, MEASURE_NAME: MEASURE_NAME,
    FACILITY_TYPES: FACILITY_TYPES, facilities: facilities, facilityCodes: facilityCodes
  };
  if (global) global.MarketModel = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
