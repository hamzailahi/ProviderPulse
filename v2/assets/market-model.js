/* ============================================================================
   market-model.js — the explainable market-opportunity model.

   Scores every patient-facing specialty (assets/specialties.js, 33 of them)
   in one catchment and classifies each into an ARCHETYPE with a strategy, a
   score, the reasons behind it, and a confidence level.

   Pure and dependency-free, like health-demand.js and accuracy-signals.js:
   market-score.js gathers the inputs, this file only computes, and
   scripts/test-market-model.mjs tests it without a network. Every number it
   emits has to survive "why does it say that about my area?", so each factor
   carries the evidence and the benchmark it was measured against.

   ---------------------------------------------------------------------------
   THE FIVE FACTORS (0-100, higher = more opportunity for a new provider)

     need        CDC PLACES modelled prevalence of the conditions that drive
                 THIS specialty's caseload, plus age mix, as a national
                 percentile (per-measure benchmarks) or, until those are
                 built, the specialty's group percentile from health-demand.
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
   average, and confidence drops instead (the rule health-demand.js and
   accuracy-signals.js already follow).

   ARCHETYPES are rules over the factors, not a clustering algorithm, so the
   label always has a sentence-length reason. See classify().
   ============================================================================ */
(function (global) {
  'use strict';

  var VERSION = '2026-09-29.1';

  var WEIGHTS = { need: 0.30, access: 0.30, pay: 0.20, shortage: 0.10, competition: 0.10 };

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
    'Speech & hearing': { m: [['HEARING', 1]], d: [['over65', .5]] },
    'Nutrition & dietitian': { m: [['OBESITY', 1], ['DIABETES', .8], ['HIGHCHOL', .4]], d: [] },
    'Acupuncture, massage & naturopathy': { m: [['ARTHRITIS', .5], ['MHLTH', .3]], d: [] },
    'Urgent care & emergency': { m: [['CHECKUP', .5, 1]], d: [] },
    'Imaging & lab': { m: [['CANCER', .5], ['CHD', .3]], d: [['over65', .5]] },
    'Pharmacy': { m: [['DIABETES', .5], ['BPHIGH', .5]], d: [] },
    'Home health & in-home care': { m: [['MOBILITY', 1], ['SELFCARE', .8], ['INDEPLIVE', .6]], d: [['over65', .7]] },
    'Nursing & assisted living': { m: [['INDEPLIVE', .8], ['COGNITION', .6]], d: [['over65', 1]] },
    'Medical equipment & supplies': { m: [['MOBILITY', .6], ['DIABETES', .4]], d: [['over65', .5]] }
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
       groupOf(label) -> taxonomy group key,
       rows: catchment listings [{ primary_taxonomy, latitude, longitude }],
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
    (input.rows || []).forEach(function (r) {
      input.specialties.forEach(function (s) {
        if (input.taxMatches(r.primary_taxonomy, s[1].split(','))) bySpec[s[0]].push(r);
      });
    });

    input.specialties.forEach(function (s) {
      var label = s[0], prof = PROFILES[label] || { m: [], d: [] };
      var group = input.groupOf(label);
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
        parts.push({ measure: m[0], label: MEASURE_NAME[m[0]] || m[0], value: Math.round(raw * 10) / 10, percentile: Math.round(p), inverted: !!m[2] });
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
      if (wsum) { f.need = clamp(acc / wsum); ev.need = { basis: basis, parts: parts }; }
      else caveats.push('No defensible health-need measure exists for this specialty; scored on supply and payers only.');

      /* ---- access ---- */
      var listings = bySpec[label] || [];
      var clin = listings.length;
      var per1k = input.adults ? (clin / input.adults) * 1000 : null;
      var rate = bmSpecs[label] && bmSpecs[label].rate_per_1k;
      if (clin === 0 && input.adults > 0) {
        // Nobody within the radius is the thinnest supply there is, with or
        // without a national rate to compare against.
        f.access = 100;
        ev.access = { basis: rate ? 'specialty' : 'none_found', per_1k: 0, national_per_1k: rate ? round2(rate) : null, clinicians: 0 };
      } else if (per1k != null && rate) {
        f.access = clamp(100 - (per1k / rate) * 50);
        ev.access = { basis: 'specialty', per_1k: round2(per1k), national_per_1k: round2(rate), clinicians: clin };
      } else if (input.groupAccess && input.groupAccess[group] != null) {
        f.access = clamp(input.groupAccess[group]);
        ev.access = { basis: 'group', per_1k: per1k == null ? null : round2(per1k), clinicians: clin };
        caveats.push('Supply is compared at the specialty-group level until national per-specialty rates are built.');
      }

      /* ---- pay ---- */
      var pay = input.pay || {};
      if (pay.insuredPct != null) {
        f.pay = clamp(pay.incomePct != null ? pay.insuredPct * 0.7 + pay.incomePct * 0.3 : pay.insuredPct);
        ev.pay = { insured_pct: Math.round(pay.insuredPct), income_pct: pay.incomePct == null ? null : Math.round(pay.incomePct),
          income_basis: pay.incomePct == null ? null : (pay.incomeBasis || 'census75'), income_detail: pay.incomeDetail || null };
      }

      /* ---- shortage ---- */
      var disc = group === 'behavioral' ? 'mental' : group === 'dental' ? 'dental' : 'primary';
      var sh = input.shortage && input.shortage[disc];
      if (sh && sh.score != null) {
        f.shortage = clamp((sh.score / 25) * 100);
        ev.shortage = { discipline: disc, hpsa: Math.round(sh.score * 10) / 10, basis: sh.basis };
        if (sh.basis === 'state') caveats.push('Shortage uses the state median: this ZIP\'s county could not be matched to federal HPSA records.');
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
      var tw = 0, total = 0;
      Object.keys(WEIGHTS).forEach(function (k) { if (f[k] != null) { total += f[k] * WEIGHTS[k]; tw += WEIGHTS[k]; } });
      var sc = tw ? Math.round(total / tw) : null;

      /* ---- confidence ---- */
      var conf = tw;                                    // share of model weight backed by data
      if (ev.need && ev.need.basis !== 'specialty') conf -= 0.15;
      if (ev.access && ev.access.basis === 'group') conf -= 0.15;
      if (input.catchmentTruncated) { conf -= 0.1; caveats.push('This area has more listings than one request returns, so supply counts are a floor.'); }
      if (input.adults != null && input.adults < 5000) { conf -= 0.15; caveats.push('Fewer than 5,000 adults in the catchment: small numbers swing the result.'); }
      var confidence = conf >= 0.8 ? 'high' : conf >= 0.55 ? 'medium' : 'low';

      var arche = classify(f, clin, confidence);
      out.push({
        specialty: label, group: group, score: sc, archetype: arche, archetype_name: ARCHETYPES[arche].name,
        strategy: ARCHETYPES[arche].strategy, confidence: confidence, factors: roundAll(f), evidence: ev,
        reasons: reasons(f, ev, label), caveats: dedupe(caveats), clinicians: clin
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
    if (acc != null && acc >= 60 && (need == null || need < 55)) return 'latent';
    if (acc != null && acc < 40) return pay != null && pay >= 60 ? 'crowded_premium' : 'saturated';
    return 'balanced';
  }

  // The three factors that moved the score furthest from the middle, in words.
  function reasons(f, ev, label) {
    var list = [];
    Object.keys(WEIGHTS).forEach(function (k) {
      if (f[k] == null) return;
      list.push({ k: k, pull: (f[k] - 50) * WEIGHTS[k] });
    });
    list.sort(function (a, b) { return Math.abs(b.pull) - Math.abs(a.pull); });
    return list.slice(0, 3).map(function (x) {
      return { factor: x.k, direction: x.pull >= 0 ? 'up' : 'down', text: explain(x.k, f[x.k], ev[x.k] || {}, label) };
    });
  }

  function explain(k, v, e, label) {
    var hi = v >= 60, lo = v < 40;
    if (k === 'need') {
      var top = (e.parts || []).slice().sort(function (a, b) { return b.percentile - a.percentile; })[0];
      var what = top ? (top.measure && top.measure.indexOf('group:') !== 0 ? MEASURE_NAME[top.measure] || top.measure : top.label || 'health measures') : 'health measures';
      return (hi ? 'Higher' : lo ? 'Lower' : 'Average') + ' modelled need than most of the US (' + ord(v) + ' pct), led by ' + what + '.';
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
    SELFCARE: 'self-care disability', INDEPLIVE: 'independent-living disability'
  };

  function round2(x) { return Math.round(x * 100) / 100; }
  function roundAll(f) { var o = {}; Object.keys(f).forEach(function (k) { o[k] = f[k] == null ? null : Math.round(f[k]); }); return o; }
  function dedupe(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }

  var API = {
    VERSION: VERSION, WEIGHTS: WEIGHTS, PROFILES: PROFILES, ARCHETYPES: ARCHETYPES,
    score: score, classify: classify, pct: pct, rankIn: rankIn, measureIds: measureIds
  };
  if (global) global.MarketModel = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
