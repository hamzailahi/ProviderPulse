// admin-review.js
// The OIG exclusion review queue: providers flagged because their name and state
// match an entry on the LEIE, which is suggestive but not proof (last+first+state
// collides for 1,120 real combinations, so blocking would lock out legitimate
// providers). A flagged listing is hidden from patients until a human decides.
//
// Auth is ADMIN_PASSWORD, matching the convention the v1 admin functions already
// use. This is a shared secret, not a user account — keep the endpoint off the
// public nav and rotate the password if it is ever pasted anywhere.
//
// GET  ?password=...            -> the pending queue, with matching LEIE records
// POST {password, npi, action}  -> action: 'clear' | 'block'
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Length-independent comparison so a wrong guess cannot be timed
function safeEqual(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= a.charCodeAt(i % (a.length || 1)) ^ b.charCodeAt(i % (b.length || 1));
  }
  return diff === 0;
}

async function audit(env, row) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row)
    });
  } catch (e) { /* never block on audit */ }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const env = process.env;
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
  if (!env.ADMIN_PASSWORD) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Admin review is not configured' }) };
  }

  const q = event.queryStringParameters || {};
  let body = {};
  if (event.httpMethod === 'POST') {
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  }
  const supplied = event.httpMethod === 'POST' ? body.password : q.password;
  if (!safeEqual(supplied, env.ADMIN_PASSWORD)) {
    await audit(env, { action: 'admin_review_bad_password', ip });
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Not authorised' }) };
  }

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  // ------------------------------------------------------------------ GET ---
  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?review_status=eq.pending` +
      `&select=npi,first_name,last_name,org_name,entity_type,city,state,zip,review_reason,npi_verified`,
      { headers: svc }
    );
    if (!res.ok) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ pending: [], unavailable: true }) };
    }
    const rows = await res.json();
    const pending = Array.isArray(rows) ? rows : [];

    // Attach the actual LEIE records that triggered each flag. Without them a
    // reviewer is being asked to make a decision with no evidence in front of
    // them, which is how rubber-stamping starts.
    for (const p of pending) {
      p.matches = [];
      try {
        const isOrg = p.entity_type === 2;
        const filter = isOrg
          ? `business_name=eq.${encodeURIComponent(String(p.org_name || '').toUpperCase())}`
          : `last_name=eq.${encodeURIComponent(String(p.last_name || '').toUpperCase())}` +
            `&first_name=eq.${encodeURIComponent(String(p.first_name || '').toUpperCase())}`;
        const m = await fetch(
          `${env.SUPABASE_URL}/rest/v1/leie_exclusions?${filter}&state=eq.${encodeURIComponent(p.state || '')}` +
          `&select=npi,last_name,first_name,business_name,general,specialty,city,state,excl_type,excl_date&limit=10`,
          { headers: svc, signal: AbortSignal.timeout(5000) }
        );
        if (m.ok) p.matches = await m.json();
      } catch { /* evidence is best-effort; the flag still shows */ }
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ pending }) };
  }

  // ----------------------------------------------------------------- POST ---
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET or POST only' }) };
  }

  const npi = String(body.npi || '').trim();
  const action = String(body.action || '').trim();
  if (!/^\d{10}$/.test(npi)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Valid NPI required' }) };
  if (action !== 'clear' && action !== 'block') {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "action must be 'clear' or 'block'" }) };
  }

  const patch = action === 'clear'
    ? { review_status: 'clear', review_reason: null }
    // 'blocked' is not 'pending', so providers-public and patient-match keep
    // hiding it — but it is distinguishable from never-reviewed in the data.
    : { review_status: 'blocked', review_reason: String(body.note || 'Confirmed OIG exclusion').slice(0, 300) };

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=eq.${npi}`, {
    method: 'PATCH', headers: { ...svc, Prefer: 'return=representation' }, body: JSON.stringify(patch)
  });
  if (!res.ok) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Update failed' }) };
  const changed = await res.json().catch(() => []);
  if (!Array.isArray(changed) || !changed.length) {
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No provider with that NPI' }) };
  }

  await audit(env, { actor_role: 'admin', action: 'provider_review_' + action, target: npi, ip });
  return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, npi, action }) };
};
