// lib/auth.js
// Resolves the Supabase user behind a request's bearer token.
//
// Used by the dashboard's market assistant (market-assistant.js), which spends
// ANTHROPIC_API_KEY, so an unchecked caller could use it as a free proxy to
// it. The market dashboard is a provider tool, so it requires getUser() AND
// isProvider().
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
function inList(value, user) {
  const list = String(value || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const email = String((user && user.email) || '').toLowerCase();
  return !!email && list.includes(email);
}
// The operator's own account (2026-10-25, the user's choice: its own email
// and password). ADMIN_EMAILS is a separate Netlify allowlist; an admin is
// also staff, so every staff check lets it in. What it adds is the "View as"
// switch between the patient app, the portal, the dashboard and the review
// queue; the switch only moves between pages, and each page's server checks
// still decide what the account may do.
function isAdmin(env, user) {
  return inList(env.ADMIN_EMAILS, user);
}
// Viewer accounts (2026-11-10, the user's choice): marketing and partner
// logins, one per person, listed in VIEWER_EMAILS and created by the operator
// in Supabase (never a sign-up path). A viewer counts as staff, so it opens
// the market dashboard and its Ask AI, and gets the same "View as" switch and
// read-only portal demo as the admin, but never the review queue (isAdmin is
// not true for it). An account with no listing cannot write anything: the
// listing endpoints need a provider_profiles row of its own.
function isViewer(env, user) {
  return inList(env.VIEWER_EMAILS, user);
}
function isStaff(env, user) {
  return inList(env.STAFF_EMAILS, user) || isAdmin(env, user) || isViewer(env, user);
}

// True when this user owns a provider listing. Checked against
// provider_profiles under the service role, never against user_metadata.role:
// a provider row only comes from the NPPES-verified registration path, so it is
// the one role signal an account holder cannot forge.
async function isProvider(env, user) {
  if (isStaff(env, user)) return true;
  return hasProviderProfile(env, user);
}

// Whether the account owns a row in `table` (its own id). true / false, or
// null when the lookup itself failed, so a caller can say "try again" rather
// than "not allowed". Service role, never user_metadata.
async function ownsRow(env, table, user) {
  if (!user || !user.id || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,
      {
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return null;
  }
}

// The account owns a provider_profiles row (staff, admin and viewer accounts
// do not count). For endpoints that write a provider's own records, where a
// staff or viewer session must not write anything (provider-locations).
async function hasProviderProfile(env, user) {
  return (await ownsRow(env, 'provider_profiles', user)) === true;
}

// The account's role as the database says it (2026-11-25; until then the
// appointment, briefing, navigator and document endpoints read the
// user-writable user_metadata.role). 'provider' when it owns a
// provider_profiles row (only the NPPES-verified registration makes one),
// else 'patient' when it owns a patient_profiles row (only patient sign-up
// makes one), else ''. null when a lookup failed: callers answer 503, never
// treat it as either role.
async function accountRole(env, user) {
  const provider = await ownsRow(env, 'provider_profiles', user);
  if (provider === null) return null;
  if (provider) return 'provider';
  const patient = await ownsRow(env, 'patient_profiles', user);
  if (patient === null) return null;
  return patient ? 'patient' : '';
}

module.exports = { getUser, isProvider, hasProviderProfile, accountRole, isStaff, isAdmin, isViewer };
