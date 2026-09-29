// lib/auth.js
// Resolves the Supabase user behind a request's bearer token.
//
// Used by the dashboard's AI endpoints (market-assistant, report-generate).
// Both spend ANTHROPIC_API_KEY, so an unchecked caller could use them as a free
// proxy to it. The market dashboard is a provider tool, so both endpoints
// require getUser() AND isProvider().
//
// Neither function reads user_metadata.role: it is writable by the account
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

// Staff (the company's own accounts) get provider-level access to the market
// tools so the dashboard can be demoed to prospective clients without an NPI.
// STAFF_EMAILS is a comma-separated allowlist set in Netlify. The email comes
// from Supabase's verified auth record, not from anything the user can edit.
function isStaff(env, user) {
  const list = String(env.STAFF_EMAILS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const email = String((user && user.email) || '').toLowerCase();
  return !!email && list.includes(email);
}

// True when this user owns a provider listing. Checked against
// provider_profiles under the service role, never against user_metadata.role:
// a provider row only comes from the NPPES-verified registration path, so it is
// the one role signal an account holder cannot forge.
async function isProvider(env, user) {
  if (isStaff(env, user)) return true;
  if (!user || !user.id || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,
      {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

module.exports = { getUser, isProvider, isStaff };
