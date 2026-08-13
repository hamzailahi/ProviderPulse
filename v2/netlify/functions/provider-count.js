// provider-count.js
// Public, unauthenticated. Returns the total distinct providers on the map,
// for the "X providers mapped" trust line on auth.html.
//
// Sums clinics (NPI-2 orgs) + provider_individuals (NPI-1 physicians) --
// NOT clinic_secondary_locations, which are additional addresses for NPIs
// already counted in one of those two tables, not distinct providers.
//
// Uses PostgREST's exact count (Prefer: count=exact, HEAD so no rows are
// transferred) against the Content-Range response header. Both tables are
// public-read (see CLAUDE.md), so the anon key is enough -- no service role
// needed for a plain count of already-public data.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

async function exactCount(baseUrl, anonKey, table) {
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=npi&limit=1`, {
    method: 'HEAD',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'count=exact'
    },
    signal: AbortSignal.timeout(6000)
  });
  if (!res.ok) return null;
  const range = res.headers.get('content-range') || '';
  const total = range.split('/')[1];
  const n = Number(total);
  return Number.isFinite(n) ? n : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };
  }

  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ available: false }) };
  }

  try {
    const [clinics, individuals] = await Promise.all([
      exactCount(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, 'clinics'),
      exactCount(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, 'provider_individuals')
    ]);

    if (clinics === null && individuals === null) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ available: false }) };
    }

    const count = (clinics || 0) + (individuals || 0);
    return {
      statusCode: 200,
      // Changes slowly (state-by-state bulk loads, hourly ZIP backfill) --
      // an hour of staleness on a trust-line stat is a fine trade for not
      // hitting Postgres on every login-page view.
      headers: { ...CORS, 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({ available: true, count, clinics: clinics || 0, individuals: individuals || 0 })
    };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ available: false }) };
  }
};
