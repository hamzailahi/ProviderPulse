// listing-report.js
// Public. "Report a wrong listing" from the patient app (2026-10-25): one tap
// records that a listing is closed, moved, has the wrong phone or specialty,
// or is not taking patients. Rows go to listing_reports (migration 041) under
// the service role; the Directory Accuracy audit counts the last year's
// reports per NPI as a weak signal (lib/accuracy-signals.js).
//
// What is stored is the NPI, the issue from ISSUES and the time. Nothing else:
// no free text, no user, no IP. The caller's address is used only in memory,
// to stop one person filing the same report over and over from a warm
// instance; it is never written or logged.
//
// POST {npi, issue} -> {ok: true} | 400 | 429 | 503 (table missing or database down)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const ISSUES = ['closed', 'moved', 'wrong_phone', 'wrong_specialty', 'not_accepting', 'other'];
const REPEAT_MS = 10 * 60 * 1000;   // the same NPI from the same caller
const PER_HOUR = 20;                 // reports from one caller per warm instance

const recent = new Map();            // caller|npi -> time; caller -> [times]
function throttled(caller, npi, now) {
  for (const [k, t] of recent) if (!Array.isArray(t) && now - t > REPEAT_MS) recent.delete(k);
  const key = caller + '|' + npi;
  if (recent.has(key)) return true;
  const times = (recent.get(caller) || []).filter(t => now - t < 3600000);
  if (times.length >= PER_HOUR) return true;
  times.push(now);
  recent.set(caller, times);
  recent.set(key, now);
  return false;
}

const reply = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid JSON' }); }
  const npi = String(body.npi || '').trim();
  const issue = String(body.issue || '').trim();
  if (!/^\d{10}$/.test(npi)) return reply(400, { error: 'npi must be 10 digits' });
  if (!ISSUES.includes(issue)) return reply(400, { error: 'issue must be one of ' + ISSUES.join(', ') });

  const env = process.env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, { error: 'Reporting is not available right now' });

  const h = event.headers || {};
  const caller = String(h['x-nf-client-connection-ip'] || h['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (throttled(caller, npi, Date.now())) return reply(429, { error: 'Thanks, we already have your report for this listing.' });

  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/listing_reports`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal'
      },
      body: JSON.stringify({ npi, issue, source: 'patient_app' }),
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) {
      console.error('[listing-report] insert failed: HTTP ' + res.status);
      return reply(503, { error: 'Reporting is not available right now' });
    }
    return reply(200, { ok: true });
  } catch (e) {
    console.error('[listing-report] insert failed: ' + (e.name || 'error'));
    return reply(503, { error: 'Reporting is not available right now' });
  }
};

exports.ISSUES = ISSUES;
