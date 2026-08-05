// market-score.js
// The "verdict" behind the dashboard's opportunity score: is this ZIP a good
// place to open or expand, benchmarked against its own state.
//
// ── Everything here is computed from data we actually hold ──────────────────
// The design brief also called for a patient-demand trend ("searches up +34%
// YoY"). We do not log searches and have no historical data, so that component
// is deliberately ABSENT rather than estimated. Do not add it until a real
// searches table exists and has accrued history — a fabricated demand figure
// shown to a provider deciding where to invest is indefensible.
//
// Score = 40% under-supply + 30% payer mix + 30% designated shortage.
// Each sub-score is 0-100 and the weights are declared in WEIGHTS below so the
// formula can be audited rather than reverse-engineered.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const WEIGHTS = { supply: 0.40, payer: 0.30, shortage: 0.30 };

// Shared with the map so "provider" means the same thing in both places.
const TaxonomyGroups = require('../../assets/taxonomy-groups.js');
// CDC PLACES -> per-taxonomy need, and the national supply rate. See that file
// for what the prevalence figures are and, more importantly, what they are not.
const HealthDemand = require('../../assets/health-demand.js');

// ---------------------------------------------------------------------------
// THE CATCHMENT, AND WHY THE PER-GROUP SCORE IS NOT A ZIP-LEVEL SCORE
//
// A single ZIP cannot carry a per-taxonomy supply verdict. Across the 23,430
// ZIPs in both clinics and PLACES, the share with ZERO listings in a group runs
// surgical 64.2%, dental 41.9%, primary 38.0%, behavioral 34.7%, specialty
// 27.6%. Most ZIPs are small; one practice already puts a ZIP above the 38th
// percentile for primary care.
//
// A ZIP with no dentist is not infinitely underserved -- its residents drive to
// the next ZIP. So the per-group verdict is computed over a CATCHMENT: the ZIP
// plus its nearest neighbours by ZCTA centroid.
//
// This means the per-group answer describes an AREA, not the ZIP. "The 25-mile
// area around 38017" and "38017" are different claims and will sometimes
// disagree. The response labels every group block with the catchment it used so
// a UI cannot present one as the other.
//
// CATCHMENT_MAX_MILES is a judgment call, not a derived figure -- a defensible
// commute for routine care, with no drive-time data behind it. ZCTA centroids
// also only approximate adjacency: a large rural ZCTA's centre can sit far from
// where its people actually live. Both are reasons to treat the radius as a
// tunable, and to refuse rather than stretch it: past the ceiling a group with
// no listings reports `unserved`, because widening until a number appears would
// quietly make rural areas look served.
// ---------------------------------------------------------------------------
const CATCHMENT_MAX_MILES = 25;
const CATCHMENT_MAX_NEIGHBORS = 10;
// One dense catchment can hold far more listings than one dense ZIP, and every
// row costs budget. Hitting this is reported, never silently absorbed.
const CATCHMENT_MAX_CLINIC_ROWS = 12000;

// DENTAL is published for all 32,520 ZCTAs; the 2023 measures cover 29,983. Any
// measure carries the same centroid and denominator, so pick the widest one or
// ~2,500 ZIPs lose their catchment for no reason.
const GEO_MEASURE = 'DENTAL';

const PER_GROUP_WEIGHTS = { need: 0.35, supply: 0.35, payer: 0.15, shortage: 0.15 };

// Great-circle distance in miles. Haversine rather than the equirectangular
// approximation patient.js uses: at a 25-mile radius the flat-earth error is
// small, but it grows with latitude and Alaska is in this dataset.
const milesBetween = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

// HPSA carries a discipline, so three of the five groups get a shortage signal
// matched to what they actually practise instead of the state primary-care
// median. The other two fall back, and say so.
const HPSA_DISCIPLINE = {
  primary: /primary/i,
  dental: /dental/i,
  behavioral: /mental/i
};

// hpsa_designations stores FULL state names ("Tennessee") while clinics and
// demographics_raw use two-letter codes. Querying it with "TN" silently returns
// nothing, which quietly neutralised the shortage component of every score.
const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',
  LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',
  OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',PR:'Puerto Rico',RI:'Rhode Island',
  SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
};

const median = (xs) => {
  const a = xs.filter(n => typeof n === 'number' && isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };

  const env = process.env;
  const zip = String((event.queryStringParameters || {}).zip || '').trim();
  if (!/^\d{5}$/.test(zip)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'A 5-digit zip is required' }) };

  const anon = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
  const get = (path, ms) => fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: anon, signal: AbortSignal.timeout(ms || 6000) })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => []);

  // ---------------------------------------------------------------------------
  // PostgREST CAPS EVERY RESPONSE AT 1000 ROWS, WHATEVER `limit` SAYS.
  //
  // This function used to ask for limit=5000 on clinics, limit=1000 on the
  // state's demographics and limit=200 on HPSA, and treat each reply as
  // complete. It never was, and a truncated reply is byte-for-byte
  // indistinguishable from a complete one -- no error, no warning, just a
  // shorter array. Measured on live data:
  //
  //   clinics in ZIP 77036          1,626 rows -> 1,000 seen (supply 38% low,
  //                                 so the ZIP scored as more underserved)
  //   demographics_raw for TX       1,746 rows -> 1,000 seen
  //   hpsa_designations for CA      4,031 rows ->   200 seen (5%)
  //
  // The medians were the worse half of it: none of those queries carried an
  // ORDER BY, so the subset was arbitrary AND unstable between calls. The state
  // insured rate and the HPSA score are 60% of the total weight, and both were
  // being computed from a non-deterministic sample.
  //
  // pagedGet walks with keyset pagination on an ordered key rather than OFFSET:
  // deep offsets make Postgres walk and discard every preceding row, which is
  // what made the one-off benchmark scan time out with a 500.
  //
  // `cap` bounds the walk so a pathological ZIP cannot spend the whole 26s
  // budget. Hitting it is reported as `truncated`, never swallowed -- the whole
  // point of this change is that a partial answer says so.
  // ---------------------------------------------------------------------------
  const pagedGet = async (path, key, { cap = 6000, ms = 8000 } = {}) => {
    const rows = [];
    let cursor = null;
    while (rows.length < cap) {
      const seek = cursor === null ? '' : `&${key}=gt.${encodeURIComponent(cursor)}`;
      const batch = await get(`${path}${seek}&order=${key}&limit=1000`, ms);
      if (!batch.length) return { rows, truncated: false };
      rows.push(...batch);
      if (batch.length < 1000) return { rows, truncated: false };
      const next = batch[batch.length - 1][key];
      // Without a strictly increasing cursor the next request repeats this page
      // forever. Stop rather than loop.
      if (next == null || next === cursor) return { rows, truncated: true };
      cursor = next;
    }
    return { rows, truncated: true };
  };

  try {
    // 1. This ZIP's demographics
    const demRows = await get(`demographics_raw?zip=eq.${zip}&select=zip,state,%22Total%20Population%22,%22Insured%20Population%22&limit=1`);
    const dem = demRows[0];
    if (!dem) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, available: false, reason: 'No demographic data for this ZIP' }) };
    }
    const state = dem.state;
    const pop = Number(dem['Total Population']) || 0;
    const insured = Number(dem['Insured Population']) || 0;
    const insuredRate = pop ? insured / pop : null;

    // 2,069 of 27,927 ZIPs have a demographics row but a NULL population — PO-box
    // and non-residential ZIPs, mostly. Every component of the score is per-capita
    // or population-derived, so without it the sub-scores all fall back to their
    // neutral 50 and the endpoint used to answer "54 · BALANCED MARKET" with an
    // empty finding. A confident verdict backed by nothing is worse than no
    // verdict, so refuse to score instead.
    if (!pop) {
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          zip, state, available: false,
          reason: 'No population data for this ZIP, so it cannot be scored'
        })
      };
    }

    // 2. Providers here, and the state's ZIP-level demographics for the benchmark
    const stripped = String(parseInt(zip, 10));
    const [clinicPage, stateDemPage] = await Promise.all([
      pagedGet(`clinics?or=(zip.eq.${zip},zip.eq.${stripped})&select=npi,primary_taxonomy`, 'npi'),
      pagedGet(`demographics_raw?state=eq.${encodeURIComponent(state)}&select=zip,%22Total%20Population%22,%22Insured%20Population%22`, 'zip')
    ]);
    const clinicRows = clinicPage.rows;
    const stateDem = stateDemPage.rows;
    // Count ALL listings. A clinic, hospital or surgical center is somewhere
    // care is delivered and doctors practise out of, so it is real capacity —
    // excluding it understates the market. The clinician/facility split is
    // still reported below for anyone who wants to break the number down.
    const listings = clinicRows.length;
    const clinicians = clinicRows.filter(r => TaxonomyGroups.isClinician(r.primary_taxonomy)).length;
    const providers = listings;
    const per1k = pop ? (listings / pop) * 1000 : null;

    // 3. State medians. Only ZIPs with a real population count toward density,
    //    or empty rural ZIPs would drag the benchmark to zero.
    const rates = [], densities = [];
    for (const r of stateDem) {
      const p = Number(r['Total Population']) || 0;
      const i = Number(r['Insured Population']) || 0;
      if (p > 0) rates.push(i / p);
    }
    const stateRate = median(rates);

    // Density benchmark needs provider counts per ZIP, which is too many queries
    // to do live. Use the national reference instead and say so in the payload.
    // Like-for-like with an all-listings count: 1.9M listings / ~330M people.
    const NATIONAL_PER_1K = 5.8;
    const benchDensity = NATIONAL_PER_1K;

    // 4. Designated shortage: HPSA is county-level, so match on state and take
    //    the strongest primary-care designation available.
    const stateName = STATE_NAMES[String(state || '').toUpperCase()] || state;
    // Was limit=200 against a table holding 4,031 rows for California and 2,460
    // for Texas, with no ORDER BY -- so the median driving 30% of the score came
    // from an arbitrary 5% of the state. Paged on `id` because hpsa_score is not
    // unique and a non-unique cursor skips rows.
    const hpsaPage = await pagedGet(
      `hpsa_designations?state=eq.${encodeURIComponent(stateName)}&select=id,hpsa_score,hpsa_type,discipline,county`,
      'id', { cap: 8000 });
    const hpsaRows = hpsaPage.rows;
    const primary = hpsaRows.filter(h => /primary/i.test(h.discipline || ''));
    const hpsaScore = median((primary.length ? primary : hpsaRows).map(h => Number(h.hpsa_score)).filter(n => isFinite(n)));

    // ---- sub-scores, each 0-100 ------------------------------------------
    // Under-supply: fewer providers per capita than the benchmark scores higher.
    const supply = per1k === null ? 50
      : clamp(100 - (per1k / benchDensity) * 50, 0, 100);
    // Payer mix: a higher insured rate than the state median scores higher.
    const payer = (insuredRate === null || stateRate === null) ? 50
      : clamp(50 + (insuredRate - stateRate) * 400, 0, 100);
    // Shortage: HPSA runs roughly 0-25; higher means more underserved.
    const shortage = hpsaScore === null ? 50 : clamp((hpsaScore / 25) * 100, 0, 100);

    const score = Math.round(supply * WEIGHTS.supply + payer * WEIGHTS.payer + shortage * WEIGHTS.shortage);

    const label = score >= 70 ? 'UNDERSERVED MARKET'
      : score >= 50 ? 'BALANCED MARKET'
      : 'WELL SERVED';

    // Plain-language finding, built only from figures we just computed
    const parts = [];
    if (per1k !== null && providers) {
      // One framing only. Quoting both "1 per N residents" and "x thinner than
      // average" in the same line reads as a contradiction, because a small N
      // sounds dense while the ratio says sparse.
      const ratio = per1k / benchDensity;
      const rel = ratio < 0.9 ? `${(1 / ratio).toFixed(1)}× fewer than the national average`
        : ratio > 1.1 ? `${ratio.toFixed(1)}× more than the national average`
        : 'in line with the national average';
      parts.push(`${per1k.toFixed(1)} providers per 1,000 residents — ${rel}`);
    }
    if (insuredRate !== null && stateRate !== null) {
      const d = (insuredRate - stateRate) * 100;
      parts.push(`insured rate ${d >= 0 ? '+' : ''}${d.toFixed(1)} pts vs the ${state} median`);
    }

    // =======================================================================
    // PER-TAXONOMY VERDICT, over a catchment rather than this ZIP alone
    // =======================================================================
    // Everything above stays exactly as it was: register-provider.html and the
    // dashboard read `score`, `label`, `finding`, `components` and `metrics`,
    // and this block only ADDS `groups`. A consumer that ignores it is
    // unaffected.
    let groups = null, catchment = null;

    try {
      const home = await get(
        `cdc_places?zip=eq.${zip}&measureid=eq.${GEO_MEASURE}&select=zip,lat,lon,pop_18plus&limit=1`, 5000);
      const origin = home[0];

      if (!origin || origin.lat === null || origin.lon === null) {
        // Puerto Rico is the expected case: PLACES publishes 32,520 ZCTAs and
        // not one begins with "00", while PR ZIPs are a real share of clinics.
        // Refusing is the point -- a neutral midpoint would rate every Puerto
        // Rican ZIP as average need, which is a fabricated finding.
        groups = { available: false, reason: 'CDC PLACES publishes no data for this ZIP (Puerto Rico and some territories are not covered)' };
      } else {
        const oLat = Number(origin.lat), oLon = Number(origin.lon);
        // Bounding box first so Postgres can use the lat/lon index, then an
        // exact haversine filter -- a box is a square and a radius is a circle.
        const dLat = CATCHMENT_MAX_MILES / 69;
        const dLon = CATCHMENT_MAX_MILES / Math.max(1, 69 * Math.cos(oLat * Math.PI / 180));
        const boxPage = await pagedGet(
          `cdc_places?measureid=eq.${GEO_MEASURE}` +
          `&lat=gte.${(oLat - dLat).toFixed(4)}&lat=lte.${(oLat + dLat).toFixed(4)}` +
          `&lon=gte.${(oLon - dLon).toFixed(4)}&lon=lte.${(oLon + dLon).toFixed(4)}` +
          `&select=zip,lat,lon,pop_18plus`, 'zip', { cap: 4000, ms: 7000 });

        const near = boxPage.rows
          .map(r => ({
            zip: r.zip,
            pop: Number(r.pop_18plus) || 0,
            miles: milesBetween(oLat, oLon, Number(r.lat), Number(r.lon))
          }))
          .filter(r => r.zip !== zip && r.miles <= CATCHMENT_MAX_MILES)
          .sort((a, b) => a.miles - b.miles)
          .slice(0, CATCHMENT_MAX_NEIGHBORS);

        const members = [{ zip, pop: Number(origin.pop_18plus) || 0, miles: 0 }, ...near];
        const memberZips = members.map(m => m.zip);
        const catchmentAdults = members.reduce((s, m) => s + m.pop, 0);

        // clinics.zip is not consistently padded, which is why the single-ZIP
        // query above already asks for both forms. Same problem across a list.
        const zipVariants = [...new Set(memberZips.flatMap(z => [z, String(parseInt(z, 10))]))];

        const [clinicPage, placesPage] = await Promise.all([
          pagedGet(`clinics?zip=in.(${zipVariants.join(',')})&select=npi,primary_taxonomy`,
            'npi', { cap: CATCHMENT_MAX_CLINIC_ROWS, ms: 8000 }),
          pagedGet(`cdc_places?zip=in.(${memberZips.join(',')})` +
            `&measureid=in.(${HealthDemand.measureIds().join(',')})` +
            `&select=zip,measureid,value,pop_18plus,data_year`, 'zip', { cap: 4000, ms: 7000 })
        ]);

        // Supply: count listings per group across the catchment.
        const counts = {};
        for (const r of clinicPage.rows) {
          const g = TaxonomyGroups.keyFor(r.primary_taxonomy);
          counts[g] = (counts[g] || 0) + 1;
        }

        // Need: compute per ZIP, then population-weight. Averaging the raw
        // prevalences across ZIPs would let a 400-person ZIP count as much as a
        // 40,000-person one.
        const rowsByZip = {};
        for (const r of placesPage.rows) (rowsByZip[r.zip] = rowsByZip[r.zip] || []).push(r);
        const needByZip = {};
        for (const z of Object.keys(rowsByZip)) needByZip[z] = HealthDemand.needByGroup(rowsByZip[z]);

        groups = {};
        for (const key of Object.keys(HealthDemand.NEED_BY_GROUP)) {
          let wsum = 0, w = 0, coverage = null;
          for (const m of members) {
            const n = needByZip[m.zip] && needByZip[m.zip][key];
            if (!n || !n.available || n.index == null || !m.pop) continue;
            wsum += n.index * m.pop; w += m.pop;
            if (coverage === null || (n.coverage != null && n.coverage < coverage)) coverage = n.coverage;
          }
          const needIndex = w ? wsum / w : null;
          const needPct = HealthDemand.needPercentile(key, needIndex);
          const clinicians = counts[key] || 0;

          // Discipline-matched shortage where HPSA has one, else the ZIP-level
          // fallback -- and the response says which was used.
          const rx = HPSA_DISCIPLINE[key];
          let shortageScore = shortage, shortageBasis = 'state primary-care median (no discipline match)';
          if (rx) {
            const matched = hpsaRows.filter(h => rx.test(h.discipline || ''));
            const med = median(matched.map(h => Number(h.hpsa_score)).filter(n => isFinite(n)));
            if (med !== null) {
              shortageScore = clamp((med / 25) * 100, 0, 100);
              shortageBasis = `state HPSA median for ${matched.length} ${key} designations`;
            }
          }

          if (clinicians === 0) {
            // Not "maximum opportunity". Nobody practises within the catchment,
            // so residents already travel further than this radius -- which is a
            // finding, not a score. Refusing here is the same rule that makes
            // the ZIP-level branch refuse a ZIP with no population.
            groups[key] = {
              available: false, verdict: 'unserved',
              reason: `no ${key} listings within ${CATCHMENT_MAX_MILES} miles`,
              need_index: needIndex, need_percentile: needPct,
              clinicians: 0, confidence: HealthDemand.NEED_BY_GROUP[key].confidence
            };
            continue;
          }

          const supplyPct = HealthDemand.supplyScore(key, clinicians, catchmentAdults);
          const parts2 = [];
          let total = 0, wt = 0;
          const add = (v, weight, name) => {
            if (v === null || v === undefined) return;
            total += v * weight; wt += weight; parts2.push(name);
          };
          add(needPct, PER_GROUP_WEIGHTS.need, 'need');
          add(supplyPct, PER_GROUP_WEIGHTS.supply, 'supply');
          add(payer, PER_GROUP_WEIGHTS.payer, 'payer');
          add(shortageScore, PER_GROUP_WEIGHTS.shortage, 'shortage');

          const gScore = wt ? Math.round(total / wt) : null;
          groups[key] = {
            available: true,
            score: gScore,
            label: gScore === null ? null
              : gScore >= 70 ? 'UNDERSERVED' : gScore >= 50 ? 'BALANCED' : 'WELL SERVED',
            need_index: needIndex,
            need_percentile: needPct === null ? null : Math.round(needPct),
            need_coverage: coverage,
            clinicians,
            per_1k_adults: catchmentAdults ? (clinicians / catchmentAdults) * 1000 : null,
            national_per_1k_adults: HealthDemand.NATIONAL_RATE[key],
            supply_score: supplyPct === null ? null : Math.round(supplyPct),
            shortage_score: Math.round(shortageScore),
            shortage_basis: shortageBasis,
            // A comparative caseload figure, NOT an unduplicated patient count:
            // the need index behind it is a weighted mean of overlapping
            // prevalences, so a comorbid adult is represented more than once.
            caseload_index: HealthDemand.caseloadPer(
              { available: true, index: needIndex, adults: catchmentAdults }, clinicians),
            confidence: HealthDemand.NEED_BY_GROUP[key].confidence,
            components_used: parts2
          };
        }

        catchment = {
          zips: memberZips,
          zip_count: memberZips.length,
          adults_18plus: catchmentAdults,
          radius_miles: CATCHMENT_MAX_MILES,
          max_neighbors: CATCHMENT_MAX_NEIGHBORS,
          furthest_miles: members.length > 1 ? Number(members[members.length - 1].miles.toFixed(1)) : 0,
          clinic_rows: clinicPage.rows.length,
          truncated: clinicPage.truncated || placesPage.truncated || boxPage.truncated,
          basis: 'ZCTA centroid distance; approximates adjacency, not drive time',
          weights: PER_GROUP_WEIGHTS
        };
      }
    } catch (e) {
      // The ZIP-level verdict is the product; the per-group breakdown is an
      // addition. A failure here must not take the whole response down.
      groups = { available: false, reason: 'Per-specialty breakdown is unavailable right now' };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, max-age=900' },
      body: JSON.stringify({
        zip, state, available: true, score, label,
        finding: parts.join(' · '),
        components: {
          supply: Math.round(supply),
          payer: Math.round(payer),
          shortage: Math.round(shortage),
          weights: WEIGHTS
        },
        metrics: {
          population: pop,
          insured_population: insured,
          insured_rate: insuredRate,
          state_insured_rate: stateRate,
          providers: listings,
          clinicians: clinicians,
          total_listings: listings,
          facilities: listings - clinicians,
          providers_per_1k: per1k,
          benchmark_per_1k: benchDensity,
          hpsa_score: hpsaScore
        },
        // Per-specialty verdict. NOTE: these describe the CATCHMENT named in
        // `catchment`, not this ZIP. Do not render a group score under a
        // ZIP-only heading.
        groups,
        catchment,
        // Named so the UI can cite them, and so a missing one is visible
        sources: [
          'NPPES via clinics', 'US Census / demographics_raw', 'HRSA HPSA',
          'CDC PLACES (modelled small-area prevalence, not survey responses)'
        ],
        omitted: ['patient demand trend — not tracked; no search history exists']
      })
    };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, available: false, reason: 'Scoring is unavailable right now' }) };
  }
};
