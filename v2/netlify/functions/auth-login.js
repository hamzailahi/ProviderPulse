// auth-login.js
// Email + password sign-in proxied through the server so no Supabase keys live in the frontend.
// Returns the Supabase access token + refresh token for use with profile.js.
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

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

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Email and password required' }) };

  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (!res.ok) {
    // Generic message: do not reveal whether the email exists
    const unconfirmed = (data.error_description || data.msg || '').toLowerCase().includes('confirm');
    return {
      statusCode: 401,
      headers: CORS,
      body: JSON.stringify({ error: unconfirmed ? 'Please confirm your email first' : 'Invalid email or password' })
    };
  }

  const role = (data.user && data.user.user_metadata && data.user.user_metadata.role) || '';
  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      role,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in
    })
  };
};
