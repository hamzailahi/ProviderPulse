// appointment-request.js
// Patient-initiated "request an appointment" flow against a claimed provider.
// GET    -> the caller's own appointments (as patient or as provider)
// POST   -> a patient requests one
// PATCH  -> either party moves its status
//
// All reads/writes go through PostgREST under the CALLER'S JWT, so RLS
// (migration 018) is the real enforcement layer, exactly like profile.js and
// provider-locations.js. The one exception is the provider_id existence
// check on POST, which needs the service role because a patient's JWT has no
// read access to another user's provider_profiles row (RLS there is
// self-only) -- see the comment at that call site.
//
// Status transitions are whitelisted per role in code, not in SQL: RLS only
// says WHO may touch a row, not WHICH field they may set it to. A patient
// may only cancel; a provider may only confirm, decline, or mark complete.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Content-Type': 'application/json'
};

const PATIENT_TRANSITIONS = { requested: ['cancelled'], confirmed: ['cancelled'] };
const PROVIDER_TRANSITIONS = { requested: ['confirmed', 'declined'], confirmed: ['completed', 'declined'] };

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
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  const role = (user.user_metadata && user.user_metadata.role) || '';
  if (role !== 'provider' && role !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No role on account' }) };
  }

  const userHeaders = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'GET') {
    const side = role === 'provider' ? 'provider_id' : 'patient_id';
    const status = (event.queryStringParameters || {}).status;
    let url = `${env.SUPABASE_URL}/rest/v1/appointment_requests?${side}=eq.${user.id}&select=*&order=created_at.desc`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;
    const res = await fetch(url, { headers: userHeaders });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointments: rows }) };
  }

  if (event.httpMethod === 'POST') {
    if (role !== 'patient') return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Only patients request appointments' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const providerId = String(body.provider_id || '').trim();
    if (!providerId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'provider_id required' }) };

    // A patient's JWT cannot read provider_profiles (self-only RLS), so this
    // existence check has to run under the service role. It only confirms
    // the id names a real, claimed provider -- it returns nothing back to
    // the caller beyond a yes/no.
    const svc = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
    const provRes = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?id=eq.${providerId}&select=id`, { headers: svc });
    const provRows = provRes.ok ? await provRes.json().catch(() => []) : [];
    if (!Array.isArray(provRows) || provRows.length === 0) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No such provider' }) };
    }

    const row = {
      patient_id: user.id,
      provider_id: providerId,
      requested_time: body.requested_time ? String(body.requested_time).slice(0, 64) : null,
      reason: body.reason ? String(body.reason).trim().slice(0, 300) : null
    };

    const insRes = await fetch(`${env.SUPABASE_URL}/rest/v1/appointment_requests`, {
      method: 'POST',
      headers: { ...userHeaders, Prefer: 'return=representation' },
      body: JSON.stringify(row)
    });
    if (!insRes.ok) {
      const detail = await insRes.text().catch(() => '');
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Could not create request: ' + detail.slice(0, 200) }) };
    }
    const created = await insRes.json();

    // Field names and the fact a request happened -- never the reason text, which is PHI-adjacent.
    await audit(env, { actor: user.id, actor_role: 'patient', action: 'appointment_requested', target: providerId, ip });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointment: created[0] || null }) };
  }

  if (event.httpMethod === 'PATCH') {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const id = String(body.id || '').trim();
    const nextStatus = String(body.status || '').trim();
    if (!id || !nextStatus) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id and status required' }) };

    const getRes = await fetch(`${env.SUPABASE_URL}/rest/v1/appointment_requests?id=eq.${id}&select=*`, { headers: userHeaders });
    const rows = getRes.ok ? await getRes.json().catch(() => []) : [];
    const current = Array.isArray(rows) && rows[0];
    // RLS already hid this row if the caller isn't a party to it, so an empty
    // result here covers both "no such appointment" and "not yours."
    if (!current) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No such appointment' }) };

    const allowed = role === 'patient' ? PATIENT_TRANSITIONS : PROVIDER_TRANSITIONS;
    const from = current.status;
    if (!allowed[from] || !allowed[from].includes(nextStatus)) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Cannot move from ${from} to ${nextStatus}` }) };
    }

    const upRes = await fetch(`${env.SUPABASE_URL}/rest/v1/appointment_requests?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...userHeaders, Prefer: 'return=representation' },
      body: JSON.stringify({ status: nextStatus, updated_at: new Date().toISOString() })
    });
    if (!upRes.ok) {
      const detail = await upRes.text().catch(() => '');
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Update failed: ' + detail.slice(0, 200) }) };
    }
    const updated = await upRes.json();

    await audit(env, { actor: user.id, actor_role: role, action: 'appointment_status_changed', target: id, detail: { from, to: nextStatus }, ip });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointment: updated[0] || null }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET, POST or PATCH only' }) };
};
