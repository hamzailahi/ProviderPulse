// listing-self-check.js
// Provider-only (2026-10-25). A provider runs the Directory Accuracy engine on
// their own listing from the portal: the same reads and scoring as audit-run
// (loadContext / auditOne, lib/accuracy-signals.js) for their one NPI and the
// address on their listing, with nothing written. It answers "why would a
// directory flag me?" with the signals and what to do about each.
//
// The NPI is the caller's own, read from provider_profiles by their user id
// under the service role; the client never names one, so nobody can check
// someone else's listing. Staff accounts with no listing get 404.
//
// GET -> {npi, address_checked, confidence, verdict, signals[], fixes[]}
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const { getUser, isProvider } = require('./lib/auth.js');
const { loadContext, auditOne } = require('./audit-run.js');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};
const reply = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

// About 15s of work under the 20s ceiling in netlify.toml: NPPES plus at most
// two geocodes, and the scoring itself is instant.
const WORK_MS = 15000;

// What a provider can do about a signal, in their words. Signals not listed
// here are things they cannot change (an exclusion check, CMS's files).
const FIXES = {
  claimed_listing: {
    claimed_other_address: 'None of your saved locations matches this address. Add it under Locations, or correct the address in My listing.',
    self_reported_match: 'Your address is self-reported. Adding the address your NPI is registered at (NPPES) as a location makes it verified.'
  },
  address_agreement: {
    diverges: 'Your listing\'s address is far from the address in the federal NPPES registry. If you moved, update NPPES (nppes.cms.hhs.gov), then your listing.'
  },
  directory_address: {
    not_found: 'Your address could not be found on a map. Check the street, number and ZIP in My listing.'
  },
  nppes_status: {
    deactivated: 'NPPES lists this NPI as deactivated. Contact NPPES; a deactivated NPI cannot be listed as current.'
  },
  medicare_activity: {
    stale: 'Medicare has no recent claims under this NPI. If you see Medicare patients under another NPI, that is fine; directories read old claims as a sign a listing may be out of date.'
  },
  patient_reports: {
    closed_or_moved: 'Patients reported that this practice closed or moved. If that is wrong, make sure your address, hours and phone are current.',
    details_wrong: 'Patients reported a wrong phone or detail. Check your phone number and specialty in My listing.'
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'GET only' });
  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Not configured' });

  const user = await getUser(env, event);
  if (!user) return reply(401, { error: 'Sign in again' });
  if (!(await isProvider(env, user))) return reply(403, { error: 'Providers only' });

  let profile = null;
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?id=eq.${encodeURIComponent(user.id)}&select=npi,address_line,city,state,zip&limit=1`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(5000)
    });
    const rows = r.ok ? await r.json() : null;
    profile = Array.isArray(rows) ? rows[0] || null : null;
    if (!Array.isArray(rows)) return reply(503, { error: 'Your listing did not load. Try again.' });
  } catch { return reply(503, { error: 'Your listing did not load. Try again.' }); }
  if (!profile || !/^\d{10}$/.test(String(profile.npi || ''))) return reply(404, { error: 'No NPI on this account' });

  const npi = String(profile.npi);
  const address = [profile.address_line, profile.city, profile.state, profile.zip].filter(Boolean).join(', ') || null;
  try {
    const ctx = await loadContext(env, [npi]);
    const f = await auditOne(npi, ctx, address, Date.now() + WORK_MS);
    const fixes = [];
    for (const s of f.signals) {
      const fix = FIXES[s.name] && FIXES[s.name][s.value];
      if (fix && s.direction === 'negative') fixes.push({ signal: s.name, text: fix });
    }
    // Old or missing Medicare claims show up as the medicare_activity signal's value.
    const act = f.signals.find(s => s.name === 'medicare_activity');
    if (act && act.direction === 'negative' && !fixes.some(x => x.signal === 'medicare_activity')) fixes.push({ signal: 'medicare_activity', text: FIXES.medicare_activity.stale });
    return reply(200, {
      npi, address_checked: f.address_checked, confidence: f.confidence, verdict: f.verdict,
      signals: f.signals.map(s => ({ name: s.name, value: s.value, direction: s.direction, detail: s.detail })),
      fixes
    });
  } catch (e) {
    console.error('[listing-self-check] failed: ' + (e.name || 'error'));
    return reply(503, { error: 'The check did not finish. Try again in a minute.' });
  }
};
