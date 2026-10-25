// npi-activity.js
// Public, unauthenticated. Medicare activity per NPI for the patient detail
// sheet (2026-10-25): the last year the NPI billed traditional Medicare, how
// many services that year, and whether it is enrolled in Medicare (PECOS
// Order & Referring). All of it comes from CMS's public files, loaded monthly
// into npi_activity by import-medicare-activity.mjs.
//
// npi_activity has RLS on and no policies (migration 008), so it is read here
// under the service role and ACTIVITY_COLUMNS is the security boundary:
// every column it names is published. The table is upserted, never
// refreshed, so a missing NPI means unknown, not inactive; it is left out of
// the answer, never returned as "no activity".
//
// GET ?npis=1234567890,... (at most 50). Fails soft with
// {activity: {}, degraded: true}.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const ACTIVITY_COLUMNS = 'npi,last_medicare_activity_year,medicare_services_count,pecos_enrolled,refreshed_at';
const MAX_NPIS = 50;

function reply(status, body, cache) {
  const headers = cache ? { ...CORS, 'Cache-Control': 'public, max-age=3600' } : CORS;
  return { statusCode: status, headers, body: JSON.stringify(body) };
}

// Presence before coercion: Number(null) is 0, which would read as "billed
// Medicare in year 0" (see the accuracy engine's Number(null) bug).
function intOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return reply(405, { error: 'GET only' });

  const raw = String((event.queryStringParameters || {}).npis || '');
  const npis = [...new Set(raw.split(',').map(s => s.trim()).filter(Boolean))];
  if (!npis.length) return reply(400, { error: 'npis is required' });
  if (npis.length > MAX_NPIS) return reply(400, { error: `At most ${MAX_NPIS} NPIs` });
  if (!npis.every(n => /^\d{10}$/.test(n))) return reply(400, { error: 'Each NPI is 10 digits' });

  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(200, { activity: {}, degraded: true });

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/npi_activity?npi=in.(${npis.join(',')})&select=${ACTIVITY_COLUMNS}`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    const rows = res.ok ? await res.json() : null;
    if (!Array.isArray(rows)) return reply(200, { activity: {}, degraded: true });
    const activity = {};
    for (const r of rows) {
      if (!r || !npis.includes(String(r.npi))) continue;
      activity[String(r.npi)] = {
        last_medicare_year: intOrNull(r.last_medicare_activity_year),
        medicare_services: intOrNull(r.medicare_services_count),
        pecos_enrolled: r.pecos_enrolled === true ? true : r.pecos_enrolled === false ? false : null,
        as_of: r.refreshed_at ? String(r.refreshed_at).slice(0, 10) : null
      };
    }
    return reply(200, { activity }, true);
  } catch (e) {
    return reply(200, { activity: {}, degraded: true });
  }
};

exports.ACTIVITY_COLUMNS = ACTIVITY_COLUMNS;
