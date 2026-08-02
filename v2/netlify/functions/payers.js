// payers.js
// Insurance plans available in a given state: the national carriers plus that
// state's own plans. Public and unauthenticated on purpose — the provider signup
// form needs this list before an account exists.
//
// Both sides of the marketplace read from here. patient-match compares the
// patient's stored payer against a provider's list by exact string, so if the
// two forms ever draw from different vocabularies the insurance match silently
// fails and every provider reads as "not confirmed".
//
// GET /payers?state=TN   -> plans for Tennessee
// GET /payers?zip=38017  -> resolves the state from the clinics table first
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Used when the table is missing or unreachable, so neither signup form is ever
// left with an empty insurance dropdown.
const FALLBACK = [
  'Medicare', 'Medicaid', 'TRICARE', 'UnitedHealthcare', 'Aetna', 'Cigna',
  'Humana', 'Blue Cross Blue Shield', 'Molina Healthcare', 'Ambetter',
  'Uninsured / self-pay', 'Other'
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };

  const env = process.env;
  const q = event.queryStringParameters || {};
  let state = String(q.state || '').trim().toUpperCase().slice(0, 2);
  const zip = String(q.zip || '').trim();

  const anon = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };

  // Resolve ZIP -> state from the clinics table rather than shipping a ZIP
  // database. Every ZIP we can serve providers for is already in there.
  if (!state && /^\d{5}$/.test(zip)) {
    try {
      const stripped = String(parseInt(zip, 10));
      const r = await fetch(
        `${env.SUPABASE_URL}/rest/v1/clinics?or=(zip.eq.${zip},zip.eq.${stripped})&select=state&limit=1`,
        { headers: anon, signal: AbortSignal.timeout(5000) }
      );
      if (r.ok) {
        const rows = await r.json();
        if (Array.isArray(rows) && rows[0] && rows[0].state) {
          state = String(rows[0].state).trim().toUpperCase().slice(0, 2);
        }
      }
    } catch { /* fall through to national-only */ }
  }

  try {
    // `state=is.null` gets the national carriers; the OR adds this state's plans.
    const filter = state
      ? `or=(state.is.null,state.eq.${encodeURIComponent(state)})`
      : 'state=is.null';
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/insurance_payers?${filter}&active=eq.true&select=name,state,category,sort_order&order=sort_order.asc,name.asc`,
      { headers: anon, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error('payers unavailable');
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) throw new Error('payers empty');

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({
        state: state || null,
        payers: rows.map(r => ({
          name: r.name,
          category: r.category,
          // true when this plan is specific to the resolved state, so the UI can
          // group "Plans in Tennessee" separately from the national carriers
          local: !!r.state
        }))
      })
    };
  } catch (e) {
    // Degraded rather than broken: the form still works, just without the
    // state-specific plans. `degraded` lets the client tell the difference.
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        state: state || null,
        degraded: true,
        payers: FALLBACK.map(n => ({ name: n, category: 'commercial', local: false }))
      })
    };
  }
};
