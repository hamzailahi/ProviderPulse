// auth-refresh.js
// Exchanges a refresh token for a fresh access token, so a session does not die
// mid-conversation. Proxied through the server for the same reason auth-login is:
// no Supabase keys reach the browser.
//
// Rotation matters here. Supabase returns a NEW refresh token on every exchange
// and invalidates the old one, so the client must store what comes back — reusing
// a spent token fails, and looks to a user like being randomly signed out.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const refreshToken = String(body.refresh_token || '').trim();
  if (!refreshToken) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'refresh_token required' }) };

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.access_token) {
    // Expired, already used, or revoked. 401 tells the client to show the sign-in
    // sheet rather than retry — retrying a spent token can never succeed.
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Session expired. Please sign in again.' }) };
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      role: (data.user && data.user.user_metadata && data.user.user_metadata.role) || '',
      access_token: data.access_token,
      refresh_token: data.refresh_token,   // rotated — the client must replace what it stored
      expires_in: data.expires_in
    })
  };
};
