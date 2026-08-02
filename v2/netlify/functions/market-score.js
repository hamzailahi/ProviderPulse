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

    // 2. Providers here, and the state's ZIP-level demographics for the benchmark
    const stripped = String(parseInt(zip, 10));
    const [clinicRows, stateDem] = await Promise.all([
      get(`clinics?or=(zip.eq.${zip},zip.eq.${stripped})&select=npi&limit=5000`, 8000),
      get(`demographics_raw?state=eq.${encodeURIComponent(state)}&select=zip,%22Total%20Population%22,%22Insured%20Population%22&limit=1000`, 8000)
    ]);
    const providers = clinicRows.length;
    const per1k = pop ? (providers / pop) * 1000 : null;

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
    const NATIONAL_PER_1K = 5.8;   // 1.9M listed provider records / ~330M people
    const benchDensity = NATIONAL_PER_1K;

    // 4. Designated shortage: HPSA is county-level, so match on state and take
    //    the strongest primary-care designation available.
    const stateName = STATE_NAMES[String(state || '').toUpperCase()] || state;
    const hpsaRows = await get(
      `hpsa_designations?state=eq.${encodeURIComponent(stateName)}&select=hpsa_score,hpsa_type,discipline,county&limit=200`, 6000);
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
          providers: providers,
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
