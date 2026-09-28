// lib/auth.js
// Resolves the Supabase user behind a request's bearer token.
//
// Used by the dashboard's AI endpoints (ai-query, report-generate), which were
// unauthenticated: ai-query forwards a client-supplied system prompt and
// messages to the model, so anyone could use it as a free proxy to the
// ANTHROPIC_API_KEY. Any signed-in account is enough here -- the dashboard's
// own gate accepts both roles -- the point is that an anonymous caller is not.
//
// Deliberately does NOT read a role: user_metadata is writable by the account
// holder, so a role taken from it is not a trust boundary.

'use strict';

// Returns the user object, or null for a missing/invalid/expired token.
async function getUser(env, event) {
  const headers = event.headers || {};
  const token = String(headers.authorization || headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

module.exports = { getUser };
