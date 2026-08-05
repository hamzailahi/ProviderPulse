/* ============================================================================
   health-demand.js -- CDC PLACES measures -> per-taxonomy need.

   The missing half of the opportunity score. clinics tells us how much SUPPLY
   sits in a ZIP; nothing told us how much NEED sat there, so the verdict was
   blind to specialty -- a ZIP full of dentists and a ZIP full of psychiatrists
   scored identically. This module is the mapping that fixes that.

   Pure and dependency-free, for the same reason lib/accuracy-signals.js is:
   every number here has to survive a provider asking "why does it say my area
   is underserved?", and that answer cannot be "the model decided".

   Dual-exported for window.HealthDemand and require(), like taxonomy-groups.js,
   because market-score.js computes with it and the dashboard explains it.

   ---------------------------------------------------------------------------
   WHAT THE INPUT IS. READ THIS BEFORE ADDING A MEASURE.

   PLACES values are MODEL-BASED SMALL-AREA ESTIMATES, not survey responses
   collected in each ZIP. BRFSS cannot sample a ZIP; CDC fits a national model
   on BRFSS respondents and poststratifies it onto each ZCTA using that ZCTA's
   census demographics. So:

     - the estimate is a function of demographics, and cannot see a local
       cluster the demographics do not predict;
     - it is correlated with everything else we derive from the census,
       including market-score's insured-rate component;
     - every consumer must word it as MODELLED PREVALENCE. Not "patient
       demand", not "what residents reported". CLAUDE.md's rule that the
       provider pitch never claims patient demand still stands -- disease
       burden is a different and defensible claim, but only when worded as one.
   ============================================================================ */
(function (global) {
  'use strict';

  // --------------------------------------------------------------------------
  // COVERAGE: 50 STATES + DC ONLY. PUERTO RICO IS ABSENT.
  //
  // Verified against the live dataset 2026-08-04: 32,520 distinct ZCTAs, and
  // ZERO of them begin with "00". BRFSS runs in PR, but the PLACES ZCTA release
  // does not publish it, so every 006xx-009xx ZIP has no rows here at all.
  //
  // That matters more than it looks: PR ZIPs are a substantial slice of the
  // clinics table -- they are where the long-form taxonomy vocabulary in
  // CLAUDE.md came from. So a meaningful share of the map can never have a need
  // score.
  //
  // The required behaviour is `available: false` with the reason, exactly like
  // market-score already refuses to score a ZIP with no population. A neutral
  // midpoint would quietly rate every Puerto Rican ZIP as average need, which
  // is a fabricated finding about a real place.
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // MEASURES DELIBERATELY EXCLUDED, and why. Excluding is a decision; leaving
  // it undocumented is how the next person "fixes" it back in.
  //
  // ACCESS2 (lack of health insurance) -- market-score already scores payer mix
  //   from the census insured rate. PLACES estimates the same quantity from the
  //   same demographics. Including both would let one demographic fact vote
  //   twice under two names, which is the specific failure mode this data's
  //   correlation makes easy.
  //
  // Prevention measures (CHECKUP, CHOLSCREEN, COLON_SCREEN, DENTAL, MAMMOUSE,
  //   BPMED) -- these are UTILISATION, not burden. A high value is GOOD: people
  //   are getting screened. Using them raw would score a well-served ZIP as
  //   needy. They are genuinely informative INVERTED (low screening = unmet
  //   need), and two are wired that way below -- but only where the inversion
  //   is unambiguous. Do not add more without deciding the direction first.
  //
  // SOCLNEED (loneliness, food/housing insecurity, transport, food stamps,
  //   utilities) -- these are access FRICTION, not clinical need for a
  //   specialty. LONELINESS and EMOTIONSPT genuinely bear on behavioural health
  //   and are included there at low weight; the material-hardship four are not,
  //   because "this ZIP is poor" is already carried by the payer component and
  //   would otherwise be a second demographic vote.
  //
  // GHLTH / PHLTH (general and physical distress) -- non-specific by design.
  //   They tell you someone feels unwell, not who should see them.
  //
  // MOBILITY / SELFCARE / INDEPLIVE / COGNITION -- these point at home health,
  //   rehab and long-term care, which land in the `facility` group. Facilities
  //   are not scored for opportunity (see NEED_BY_GROUP), so mapping them would
  //   compute a number nothing reads.
  // --------------------------------------------------------------------------

  // measureid -> [[groupKey, weight], ...]
  //
  // A measure MAY count toward more than one group, on purpose: a diabetic
  // patient consumes primary care AND endocrinology. Partitioning conditions
  // one-to-one would understate both.
  //
  // Weights are relative WITHIN a group and are normalised at compute time, so
  // only their ratios matter. They encode roughly "how much of this group's
  // caseload does this condition drive" -- hand-set, arguable, and printed in
  // the output so they can be argued with rather than reverse-engineered.
  //
  // `invert: true` means a HIGH value indicates LOW need (see the prevention
  // note above); the computation uses (100 - value).
  var MEASURE_MAP = {
    // --- chronic disease: the bulk of primary care ---------------------------
    HIGHCHOL:   [['primary', 0.8], ['specialty', 0.4]],
    BPHIGH:     [['primary', 1.0], ['specialty', 0.5]],
    DIABETES:   [['primary', 1.0], ['specialty', 0.8]],
    OBESITY:    [['primary', 0.7], ['specialty', 0.3], ['surgical', 0.4]],
    ARTHRITIS:  [['primary', 0.5], ['specialty', 0.7], ['surgical', 0.8]],

    // --- organ-system disease: specialist-led --------------------------------
    CHD:        [['specialty', 1.0], ['surgical', 0.8], ['primary', 0.3]],
    STROKE:     [['specialty', 0.9], ['primary', 0.3]],
    COPD:       [['specialty', 0.8], ['primary', 0.4]],
    CASTHMA:    [['specialty', 0.6], ['primary', 0.6]],
    CANCER:     [['specialty', 1.0], ['surgical', 1.0]],

    // --- behavioural ---------------------------------------------------------
    DEPRESSION: [['behavioral', 1.0], ['primary', 0.3]],
    MHLTH:      [['behavioral', 0.9]],
    BINGE:      [['behavioral', 0.5]],
    CSMOKING:   [['behavioral', 0.4], ['primary', 0.3]],
    // Social isolation is a documented driver of behavioural-health need, but
    // it is a risk factor rather than a diagnosis -- low weight, not zero.
    LONELINESS: [['behavioral', 0.3]],
    EMOTIONSPT: [['behavioral', 0.3]],

    // --- dental & vision -----------------------------------------------------
    TEETHLOST:  [['dental', 1.0]],
    VISION:     [['dental', 0.8]],
    // The one inversion kept: a low dental-visit rate IS unmet dental need, and
    // the direction is not ambiguous the way "annual checkup" is across
    // multiple specialties.
    DENTAL:     [['dental', 0.9, { invert: true }]],

    // --- other ---------------------------------------------------------------
    HEARING:    [['specialty', 0.3]],
    LPA:        [['primary', 0.2], ['surgical', 0.2]]
  };

  // Which groups get a need score at all.
  //
  // `facility` is excluded: labs, DME and transport are not a specialty anyone
  // evaluates a market for, and taxonomy-groups.js puts every non-clinical
  // entity there.
  //
  // `surgical` IS scored, but its measures are all indirect (arthritis and
  // obesity predict joint replacement and bariatrics; cancer and CHD predict
  // oncologic and cardiac surgery). That is a weaker inferential chain than the
  // others and callers are told so via `confidence` below, rather than the
  // weakness being hidden inside an equally confident-looking number.
  var NEED_BY_GROUP = {
    primary:    { confidence: 'high' },
    specialty:  { confidence: 'high' },
    behavioral: { confidence: 'high' },
    dental:     { confidence: 'high' },
    surgical:   { confidence: 'indirect' }
  };

  /**
   * Compute a need index per taxonomy group from one ZIP's PLACES rows.
   *
   * rows: [{ measureid, value, pop_18plus, data_year }] -- straight from
   * cdc_places, one row per measure.
   *
   * Returns { [groupKey]: { index, adults, contributions[], coverage, ... } }
   *
   * `index` is a WEIGHTED MEAN PREVALENCE in percentage points, not a headcount
   * and not a probability. It is deliberately NOT a sum: prevalences of
   * co-occurring conditions do not add (the same hypertensive diabetic would be
   * counted twice), so a sum would exceed 100 and mean nothing. The weighted
   * mean answers "how elevated is this group's caseload driver mix here",
   * which is the comparative question the score actually asks.
   */
  function needByGroup(rows) {
    var adults = null, years = {};
    var acc = {};   // group -> { weighted, weight, parts[] }

    (rows || []).forEach(function (r) {
      var id = String(r && r.measureid || '');
      var spec = MEASURE_MAP[id];
      if (!spec) return;

      var value = Number(r.value);
      if (!isFinite(value)) return;

      // CDC ships the denominator the prevalence was estimated against. Use it
      // rather than deriving an adult population from demographics_raw age
      // buckets -- a headcount computed against a different denominator is
      // internally inconsistent with the rate that produced it.
      var pop = Number(r.pop_18plus);
      if (isFinite(pop) && pop > 0 && adults === null) adults = pop;

      spec.forEach(function (entry) {
        var group = entry[0], weight = entry[1], opts = entry[2] || null;
        if (!NEED_BY_GROUP[group]) return;

        var v = opts && opts.invert ? (100 - value) : value;
        if (!acc[group]) acc[group] = { weighted: 0, weight: 0, parts: [] };
        acc[group].weighted += v * weight;
        acc[group].weight += weight;
        acc[group].parts.push({
          measureid: id,
          value: value,
          used: v,
          inverted: !!(opts && opts.invert),
          weight: weight,
          year: r.data_year == null ? null : Number(r.data_year)
        });
        if (r.data_year != null) years[r.data_year] = true;
      });
    });

    var out = {};
    Object.keys(NEED_BY_GROUP).forEach(function (group) {
      var a = acc[group];
      if (!a || !a.weight) {
        // Unknown, not zero. Same rule as accuracy-signals: a missing input is
        // disclosed, never silently treated as "no need here".
        out[group] = {
          index: null, adults: adults, available: false,
          reason: 'no PLACES measures for this group in this ZIP',
          confidence: NEED_BY_GROUP[group].confidence,
          contributions: []
        };
        return;
      }

      // How much of the group's intended weight actually arrived. CDC suppresses
      // some ZCTA/measure pairs, so a ZIP can be scored off two measures out of
      // six -- the consumer needs to know that before quoting the number.
      var intended = 0;
      Object.keys(MEASURE_MAP).forEach(function (id) {
        MEASURE_MAP[id].forEach(function (e) { if (e[0] === group) intended += e[1]; });
      });

      out[group] = {
        index: a.weighted / a.weight,
        adults: adults,
        available: true,
        coverage: intended ? a.weight / intended : null,
        confidence: NEED_BY_GROUP[group].confidence,
        // Sorted by contribution so a UI can say "driven mostly by diabetes and
        // hypertension" without recomputing anything.
        contributions: a.parts.sort(function (x, y) {
          return (y.used * y.weight) - (x.used * x.weight);
        }),
        data_years: Object.keys(years).map(Number).sort()
      };
    });

    return out;
  }

  // --------------------------------------------------------------------------
  // NATIONAL BENCHMARK
  //
  // Derived, not guessed: needByGroup() was run over every ZCTA in the PLACES
  // ZCTA release (32,520 ZIPs, 623,136 rows, fetched 2026-08-04) and these are
  // the resulting percentiles of each group's need index. Regenerate them
  // whenever MEASURE_MAP changes -- the weights and the benchmark are one
  // artefact, and scoring a new weighting against an old benchmark would shift
  // every ZIP's percentile for no real-world reason.
  //
  // `n` differs by group on purpose: DENTAL and TEETHLOST are 2022 measures and
  // CDC published them for ~2,500 more ZCTAs than the 2023 measures.
  //
  // WHY PERCENTILES AND NOT A RATIO TO THE MEDIAN. The groups have very
  // different spreads, and a linear "% above median" would silently make the
  // narrow ones look stable and the wide ones look volatile:
  //
  //   group        p05     p50     p95    (p95-p05)/p50
  //   dental      12.20   19.55   33.18       1.07   <- discriminates most
  //   surgical    12.56   18.52   22.94       0.56
  //   specialty   10.94   15.32   19.43       0.55
  //   primary     17.74   23.59   29.40       0.49
  //   behavioral  16.18   20.01   24.05       0.39   <- discriminates least
  //
  // Dental need varies 2.7x more across ZIPs than behavioural need does. That
  // is a real property of the data (modelled depression prevalence is close to
  // flat nationally; dental access tracks income hard), not noise. Ranking each
  // group within its own distribution is what makes "90th percentile for
  // behavioural health" mean the same thing as "90th percentile for dental".
  //
  // The corollary, which any consumer should surface: a high behavioural
  // percentile rests on a narrow absolute spread, so the SUPPLY side carries
  // most of the signal for that group. Do not present the two as equally
  // discriminating.
  // --------------------------------------------------------------------------
  var NATIONAL_NEED = {
    primary:    { p05: 17.74, p25: 21.33, p50: 23.59, p75: 25.77, p95: 29.40, n: 29983 },
    specialty:  { p05: 10.94, p25: 13.59, p50: 15.32, p75: 16.91, p95: 19.43, n: 29983 },
    behavioral: { p05: 16.18, p25: 18.49, p50: 20.01, p75: 21.49, p95: 24.05, n: 29983 },
    dental:     { p05: 12.20, p25: 16.21, p50: 19.55, p75: 24.03, p95: 33.18, n: 32517 },
    surgical:   { p05: 12.56, p25: 16.31, p50: 18.52, p75: 20.27, p95: 22.94, n: 29983 }
  };

  /**
   * Where this ZIP's need index falls in the national distribution, 0-100.
   *
   * Piecewise-linear through the five stored percentiles, flat outside p05/p95
   * -- the tails are long and interpolating into them would invent precision
   * the five anchors cannot support. Returns null for an unknown group or a
   * missing index, never a neutral 50: "unknown is never clean" applies here
   * exactly as it does in lib/accuracy-signals.js.
   */
  function needPercentile(group, index) {
    var b = NATIONAL_NEED[group];
    if (!b || index == null || !isFinite(index)) return null;
    var pts = [[b.p05, 5], [b.p25, 25], [b.p50, 50], [b.p75, 75], [b.p95, 95]];
    if (index <= pts[0][0]) return 5;
    if (index >= pts[4][0]) return 95;
    for (var i = 1; i < pts.length; i++) {
      if (index <= pts[i][0]) {
        var lo = pts[i - 1], hi = pts[i];
        var span = hi[0] - lo[0];
        if (span <= 0) return hi[1];
        return lo[1] + ((index - lo[0]) / span) * (hi[1] - lo[1]);
      }
    }
    return 95;
  }

  // --------------------------------------------------------------------------
  // NATIONAL SUPPLY RATE, population-weighted.
  //
  // Derived from a full scan of all 1,901,815 rows in `clinics`, classified
  // with taxonomy-groups.js, over the 25,230 ZIPs that also have a PLACES adult
  // denominator -- 254,677,790 adults. Listings per 1,000 adults:
  //
  //   specialty  1.5112  (384,859)      dental   0.7871  (200,457)
  //   behavioral 1.1640  (296,440)      primary  0.6388  (162,684)
  //   surgical   0.3258  ( 82,964)
  //
  // WHY A SINGLE RATE AND NOT PERCENTILES, WHICH IS WHAT NEED USES.
  // The per-ZIP density distribution is unusable as a benchmark: it is
  // zero-inflated (p25 = 0.000 in every group, surgical's median is 0), because
  // most ZIPs are small. Pooling a catchment fixes the zeros -- but then a
  // catchment's density compared against a per-ZIP distribution compares two
  // different units, and pooling narrows the spread so every catchment would
  // drift to the middle percentiles regardless of how well served it is.
  //
  // A population-weighted rate has neither problem. ZIP size cannot skew it,
  // and it applies unchanged to a catchment of any size. Same shape as the
  // existing NATIONAL_PER_1K = 5.8 constant in market-score.js, but derived
  // rather than assumed, and per group.
  //
  // These count LISTINGS, and `clinics` is entirely NPI-2 organisations -- so
  // this is organisations per 1,000 adults, not doctors per 1,000 adults. The
  // benchmark and the thing it scores come from the same table, so the
  // comparison is like-for-like; quoting either as a physician count is not.
  // --------------------------------------------------------------------------
  var NATIONAL_RATE = {
    primary:    0.6388,
    specialty:  1.5112,
    surgical:   0.3258,
    dental:     0.7871,
    behavioral: 1.1640
  };

  /**
   * Supply sub-score, 0-100, where HIGHER means thinner supply and therefore
   * more opportunity. Mirrors the shape of market-score's existing supply term:
   * at the national rate it returns 50, at twice the rate 0, at zero supply 100.
   *
   * Returns null when the group is unknown or the inputs are missing -- and,
   * deliberately, when `clinicians` is 0 with no catchment expansion left. A
   * bare 100 would read as "maximum opportunity" when the honest reading is
   * that nobody practises here and residents travel; the caller is expected to
   * surface that as `unserved` rather than as a score. See needByGroup's
   * "unknown is never clean" note -- this is the same rule.
   */
  function supplyScore(group, clinicians, adults) {
    var rate = NATIONAL_RATE[group];
    if (!rate || !isFinite(clinicians) || !isFinite(adults) || adults <= 0) return null;
    var per1k = (clinicians / adults) * 1000;
    var s = 100 - (per1k / rate) * 50;
    return Math.max(0, Math.min(100, s));
  }

  /**
   * Condition-weighted adults per clinician, for one group.
   *
   * NOT an unduplicated patient count, and must never be labelled one -- the
   * index it is built from is a weighted mean of overlapping prevalences, so
   * one person with three of this group's conditions is represented more than
   * once. It is a comparative caseload figure: meaningful against the same
   * figure in another ZIP, meaningless as an absolute.
   *
   * Returns null when supply is zero. "Infinite opportunity" is the wrong
   * reading of a ZIP with no local supply -- it usually means residents already
   * drive somewhere else, and the caller should say "no local supply" rather
   * than print a number.
   */
  function caseloadPer(need, clinicians) {
    if (!need || !need.available || need.index == null) return null;
    if (!isFinite(need.adults) || !need.adults) return null;
    if (!isFinite(clinicians) || clinicians <= 0) return null;
    return (need.adults * (need.index / 100)) / clinicians;
  }

  /** The measure ids this module reads -- for building the cdc_places query. */
  function measureIds() { return Object.keys(MEASURE_MAP); }

  var API = {
    MEASURE_MAP: MEASURE_MAP,
    NEED_BY_GROUP: NEED_BY_GROUP,
    NATIONAL_NEED: NATIONAL_NEED,
    NATIONAL_RATE: NATIONAL_RATE,
    measureIds: measureIds,
    needByGroup: needByGroup,
    needPercentile: needPercentile,
    supplyScore: supplyScore,
    caseloadPer: caseloadPer
  };

  if (global) global.HealthDemand = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
