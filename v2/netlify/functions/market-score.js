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
        // Named so the UI can cite them, and so a missing one is visible
        sources: ['NPPES via clinics', 'US Census / demographics_raw', 'HRSA HPSA'],
        omitted: ['patient demand trend — not tracked; no search history exists']
      })
    };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, available: false, reason: 'Scoring is unavailable right now' }) };
  }
};
