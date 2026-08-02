// auth-logout.js
// Revokes the session server-side. Without this, "sign out" only cleared browser
// storage and the JWT stayed valid until it expired — so anyone who had captured
// it could keep using it after the patient thought they had signed out. That is a
// real problem on a shared or public computer, which this audience uses.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  // No token means nothing to revoke. Report success so the client always
  // completes its own sign-out — never leave a user seemingly unable to log out.
  if (!token) return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };

  try {
    await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {
    // Same reasoning: a failed revoke must not block the client from clearing
    // its own storage. Worst case the token lives out its normal expiry.
  }

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
};
