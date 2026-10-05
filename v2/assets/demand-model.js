/* demand-model.js: the learned demand model, shared by the trainer
   (scripts/train-demand-model.mjs, which fits it in GitHub Actions) and
   market-score.js (which applies it to a catchment). Pure, no network.
   Dual-exported: window.DemandModel in the browser, module.exports under Node.

   WHAT IT LEARNS
   For each specialty, how many Medicare patients its clinicians see per 1,000
   traditional (fee-for-service) Medicare enrollees in a county, from the
   county's population: age, income, poverty, insurance, education, and the CDC
   PLACES health measures that drive that specialty. The label is real
   behaviour: the CMS "Physician & Other Practitioners - by Provider" file
   (Tot_Benes per clinician), summed by county.

   WHAT IT DOES NOT LEARN
   Supply. Clinician counts are deliberately not an input: the access factor
   already measures supply, and putting it here too would count it twice. Rows
   with no clinicians of a specialty are left out of training, because zero
   patients there means nobody local to see, not no need.

   LIMITS (said on screen wherever the result is shown)
   Medicare fee-for-service only: Medicare Advantage patients are not in the
   claims file, and children and most of OB-GYN and dental are not Medicare
   business at all, so those specialties are never trained. A model is only
   used when it predicts held-out states with R^2 >= MIN_R2.
*/
(function (root) {
  'use strict';

  // Census-derived inputs, all rates so that a county (training) and a 25-mile
  // catchment (scoring) are measured the same way.
  var BASE = [
    ['share_65plus', 'older population'],
    ['share_under18', 'share of children'],
    ['log_median_income', 'household income'],
    ['poverty_rate', 'poverty'],
    ['uninsured_rate', 'uninsured rate'],
    ['medicaid_rate', 'Medicaid coverage'],
    ['bachelor_rate', 'college education']
  ];

  // Specialties a Medicare label cannot describe.
  var NOT_MEDICARE = ['Pediatrics (children)', "Women's health / OB-GYN", 'Dental'];

  var MIN_R2 = 0.15, MIN_ROWS = 150;

  /* area = {
       pop, age65, under18, households, median_income (household-weighted),
       pov_universe, pov_below, ins_universe, ins_uninsured, ins_medicaid,
       edu_universe, edu_bachelor_plus,
       places: { MEASURE: population-weighted prevalence }
     }
     Returns { name: value } with null for anything that cannot be computed. */
  function features(area, measures) {
    var a = area || {}, out = {};
    var r = function (n, d) { return d > 0 && n != null && isFinite(n) ? n / d : null; };
    out.share_65plus = r(a.age65, a.pop);
    out.share_under18 = r(a.under18, a.pop);
    out.log_median_income = a.median_income > 0 ? Math.log(a.median_income) : null;
    out.poverty_rate = r(a.pov_below, a.pov_universe);
    out.uninsured_rate = r(a.ins_uninsured, a.ins_universe);
    out.medicaid_rate = r(a.ins_medicaid, a.ins_universe);
    out.bachelor_rate = r(a.edu_bachelor_plus, a.edu_universe);
    (measures || []).forEach(function (m) {
      var v = a.places ? a.places[m] : null;
      out['m_' + m] = v != null && isFinite(v) ? Number(v) : null;
    });
    return out;
  }

  function featureNames(measures) {
    return BASE.map(function (b) { return b[0]; }).concat((measures || []).map(function (m) { return 'm_' + m; }));
  }

  /* ---------------- ridge regression, standardized inputs ---------------- */
  function solve(A, b) {                                  // Gaussian elimination, partial pivoting
    var n = b.length, M = A.map(function (row, i) { return row.slice().concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var t = M[c]; M[c] = M[p]; M[p] = t;
      if (Math.abs(M[c][c]) < 1e-12) return null;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === c) continue;
        var f = M[r2][c] / M[c][c];
        for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k];
      }
    }
    return M.map(function (row, i) { return row[n] / row[i]; });
  }

  function stats(X) {
    var d = X[0].length, n = X.length, mean = new Array(d).fill(0), sd = new Array(d).fill(0);
    X.forEach(function (x) { for (var j = 0; j < d; j++) mean[j] += x[j] / n; });
    X.forEach(function (x) { for (var j = 0; j < d; j++) sd[j] += Math.pow(x[j] - mean[j], 2) / n; });
    return { mean: mean, sd: sd.map(function (v) { return Math.sqrt(v) || 1; }) };
  }

  // Fits y ~ intercept + sum coef_j * z_j, z standardized, L2 penalty lambda.
  function fitRidge(X, y, lambda) {
    var s = stats(X), d = X[0].length, n = X.length;
    var Z = X.map(function (x) { return x.map(function (v, j) { return (v - s.mean[j]) / s.sd[j]; }); });
    var ym = y.reduce(function (a, v) { return a + v; }, 0) / n;
    var A = [], b = new Array(d).fill(0);
    for (var i = 0; i < d; i++) { A.push(new Array(d).fill(0)); A[i][i] = lambda; }
    Z.forEach(function (z, r) {
      for (var i2 = 0; i2 < d; i2++) {
        b[i2] += z[i2] * (y[r] - ym);
        for (var j = 0; j < d; j++) A[i2][j] += z[i2] * z[j];
      }
    });
    var coef = solve(A, b);
    if (!coef) return null;
    return { intercept: ym, coef: coef, mean: s.mean, sd: s.sd, lambda: lambda };
  }

  function predictRaw(m, x) {
    var v = m.intercept;
    for (var j = 0; j < m.coef.length; j++) {
      if (x[j] == null || !isFinite(x[j])) return null;   // unknown is never average
      v += m.coef[j] * (x[j] - m.mean[j]) / m.sd[j];
    }
    return v;
  }

  function r2(y, p) {
    var m = y.reduce(function (a, v) { return a + v; }, 0) / y.length, ss = 0, se = 0;
    for (var i = 0; i < y.length; i++) { ss += Math.pow(y[i] - m, 2); se += Math.pow(y[i] - p[i], 2); }
    return ss > 0 ? 1 - se / ss : null;
  }

  // Cross-validation grouped by state: every fold predicts states it never saw,
  // which is the honest test for scoring a market in a new place.
  function groupedCv(X, y, groups, lambda, folds) {
    folds = folds || 5;
    var keys = Array.from(new Set(groups)).sort();
    var foldOf = {}; keys.forEach(function (k, i) { foldOf[k] = i % folds; });
    var pred = new Array(y.length).fill(null);
    for (var f = 0; f < folds; f++) {
      var tr = [], te = [];
      for (var i = 0; i < y.length; i++) (foldOf[groups[i]] === f ? te : tr).push(i);
      if (!tr.length || !te.length) continue;
      var m = fitRidge(tr.map(function (i) { return X[i]; }), tr.map(function (i) { return y[i]; }), lambda);
      if (!m) return null;
      te.forEach(function (i) { pred[i] = predictRaw(m, X[i]); });
    }
    var idx = pred.map(function (v, i) { return v == null ? -1 : i; }).filter(function (i) { return i >= 0; });
    return r2(idx.map(function (i) { return y[i]; }), idx.map(function (i) { return pred[i]; }));
  }

  function quantile(sorted, q) {
    var i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }

  /* rows: [{ group: state, x: {name: value}, y: patients per 1,000 enrollees }]
     Returns the stored model, or { usable:false, reason } when it should not be
     used. y is modelled as log1p so a few huge counties do not dominate. */
  function train(label, rows, measures) {
    var names = featureNames(measures);
    var clean = (rows || []).filter(function (r) {
      return r.y != null && isFinite(r.y) && r.y >= 0 && names.every(function (n) { return r.x[n] != null && isFinite(r.x[n]); });
    });
    if (NOT_MEDICARE.indexOf(label) !== -1) return { specialty: label, usable: false, reason: 'not a Medicare specialty', n: clean.length };
    if (clean.length < MIN_ROWS) return { specialty: label, usable: false, reason: 'too few counties (' + clean.length + ')', n: clean.length };
    var X = clean.map(function (r) { return names.map(function (n) { return r.x[n]; }); });
    var y = clean.map(function (r) { return Math.log1p(r.y); });
    var g = clean.map(function (r) { return r.group; });
    var best = null;
    [0.3, 3, 30].forEach(function (lam) {
      var s = groupedCv(X, y, g, lam);
      if (s != null && (!best || s > best.r2)) best = { lambda: lam, r2: s };
    });
    if (!best) return { specialty: label, usable: false, reason: 'could not fit', n: clean.length };
    var m = fitRidge(X, y, best.lambda);
    var preds = X.map(function (x) { return predictRaw(m, x); }).sort(function (a, b) { return a - b; });
    var ys = clean.map(function (r) { return r.y; }).sort(function (a, b) { return a - b; });
    var round = function (v, k) { var p = Math.pow(10, k); return Math.round(v * p) / p; };
    var model = {
      specialty: label, usable: best.r2 >= MIN_R2, reason: best.r2 >= MIN_R2 ? null : 'held-out R^2 ' + round(best.r2, 3) + ' below ' + MIN_R2,
      n: clean.length, r2_cv: round(best.r2, 4), lambda: best.lambda, features: names,
      intercept: round(m.intercept, 6), coef: m.coef.map(function (v) { return round(v, 6); }),
      mean: m.mean.map(function (v) { return round(v, 6); }), sd: m.sd.map(function (v) { return round(v, 6); }),
      // Percentile anchors of the fitted values, so a catchment reads as "Nth
      // percentile of US counties"; and the observed median for context.
      anchors: { p05: round(quantile(preds, 0.05), 5), p25: round(quantile(preds, 0.25), 5), p50: round(quantile(preds, 0.5), 5), p75: round(quantile(preds, 0.75), 5), p95: round(quantile(preds, 0.95), 5) },
      observed_median_per_1k: round(quantile(ys, 0.5), 1)
    };
    return model;
  }

  function pctFrom(anchors, v) {
    var pts = [[anchors.p05, 5], [anchors.p25, 25], [anchors.p50, 50], [anchors.p75, 75], [anchors.p95, 95]];
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

  /* Accumulate one census_acs_zcta row into an area, weighted by w (the share of
     the ZIP's residents inside the area: a HUD crosswalk ratio for a county, 1
     for a catchment ZIP). Both training and scoring build areas this way. */
  function addAcs(area, row, w) {
    if (!row) return area;
    w = w == null ? 1 : w;
    var N = function (v) { return v == null || !isFinite(Number(v)) ? null : Number(v); };
    var add = function (k, v) { if (v != null) area[k] = (area[k] || 0) + v * w; };
    var male = row.age_male || [], female = row.age_female || [];
    var band = function (i) { var a = N(male[i]), b = N(female[i]); return a == null || b == null ? null : a + b; };
    var sumBands = function (from, to) { var t = 0; for (var i = from; i <= to; i++) { var v = band(i); if (v == null) return null; t += v; } return t; };
    add('pop', N(row.pop_total));
    add('age65', sumBands(13, 17));
    // Bands are five-year: under 18 is the first three bands plus 3/5 of 15-19.
    var u15 = sumBands(0, 2), b1519 = band(3);
    add('under18', u15 == null || b1519 == null ? null : u15 + 0.6 * b1519);
    var hh = N(row.households), med = N(row.median_hh_income);
    if (hh != null && med != null) { add('households', hh); add('income_x_hh', med * hh); }
    add('pov_universe', N(row.poverty_universe)); add('pov_below', N(row.poverty_below));
    add('ins_universe', N(row.ins_universe)); add('ins_uninsured', N(row.ins_uninsured)); add('ins_medicaid', N(row.ins_medicaid));
    var e = row.education || {};
    add('edu_universe', N(e.universe));
    var bp = N(e.bachelor), gr = N(e.graduate);
    add('edu_bachelor_plus', bp == null || gr == null ? null : bp + gr);
    area.median_income = area.households ? area.income_x_hh / area.households : null;
    return area;
  }

  /* Accumulate PLACES prevalence, weighted by adults x w. */
  function addPlaces(area, measure, value, adults, w) {
    var v = Number(value), a = Number(adults) * (w == null ? 1 : w);
    if (!isFinite(v) || !(a > 0)) return area;
    area._pw = area._pw || {}; area._pv = area._pv || {}; area.places = area.places || {};
    area._pw[measure] = (area._pw[measure] || 0) + a;
    area._pv[measure] = (area._pv[measure] || 0) + v * a;
    area.places[measure] = area._pv[measure] / area._pw[measure];
    return area;
  }

  var LABELS = {};
  BASE.forEach(function (b) { LABELS[b[0]] = b[1]; });

  /* Apply a stored model to one area's features. Returns null when the model is
     not usable or any input is unknown; otherwise the predicted patients per
     1,000 enrollees, its percentile among US counties, and the three inputs
     that moved it most (direction relative to an average county). */
  function apply(model, feats, measureName) {
    if (!model || !model.usable) return null;
    var x = model.features.map(function (n) { return feats ? feats[n] : null; });
    var raw = predictRaw(model, x);
    if (raw == null) return null;
    var pull = model.features.map(function (n, j) {
      return { name: n, z: model.coef[j] * (x[j] - model.mean[j]) / model.sd[j] };
    }).sort(function (a, b) { return Math.abs(b.z) - Math.abs(a.z); }).slice(0, 3).map(function (p) {
      var label = LABELS[p.name] || (p.name.indexOf('m_') === 0 ? (measureName ? measureName(p.name.slice(2)) : p.name.slice(2)) : p.name);
      return { feature: p.name, label: label, direction: p.z >= 0 ? 'up' : 'down' };
    });
    return {
      per_1k: Math.round(Math.expm1(raw) * 10) / 10,
      percentile: Math.round(pctFrom(model.anchors, raw)),
      r2_cv: model.r2_cv, n: model.n, drivers: pull
    };
  }

  var API = { addAcs: addAcs, addPlaces: addPlaces, features: features, featureNames: featureNames, fitRidge: fitRidge, predictRaw: predictRaw, groupedCv: groupedCv,
    train: train, apply: apply, r2: r2, NOT_MEDICARE: NOT_MEDICARE, MIN_R2: MIN_R2, MIN_ROWS: MIN_ROWS, BASE: BASE };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.DemandModel = API;
})(typeof window !== 'undefined' ? window : this);
