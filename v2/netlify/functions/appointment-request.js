// appointment-request.js
// Patient-initiated "request an appointment" flow against a claimed provider.
// GET    -> the caller's own appointments (as patient or as provider)
// POST   -> a patient requests one
// PATCH  -> either party moves its status
//
// POST takes the provider's NPI (what the patient app has) and resolves the
// account id server-side. GET names the other party on each row.
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

// Ids are spliced into PostgREST filters, one of them under the service role,
// so anything that is not a plain UUID is rejected before it reaches a URL.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    let url = `${env.SUPABASE_URL}/rest/v1/appointment_requests?${side}=eq.${user.id}&select=*&order=created_at.desc&limit=200`;
    if (status) url += `&status=eq.${encodeURIComponent(status)}`;
    const res = await fetch(url, { headers: userHeaders });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const list = Array.isArray(rows) ? rows : [];

    // Name the other party. Neither side's JWT can read the other's profile
    // (both are self-only RLS), so this runs under the service role -- scoped
    // to ids taken from rows RLS already returned to THIS caller, and to the
    // few fields an appointment list needs. A patient sees the practice's
    // public listing name and phone; a provider sees the name of a patient who
    // chose to send them a request. Nothing else crosses over.
    const svc = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
    const otherIds = [...new Set(list.map(r => role === 'provider' ? r.patient_id : r.provider_id).filter(id => UUID_RE.test(String(id))))];
    const names = {};
    if (otherIds.length) {
      const inList = `(${otherIds.map(i => `"${i}"`).join(',')})`;
      const q = role === 'provider'
        ? `patient_profiles?id=in.${inList}&select=id,first_name,last_name`
        : `provider_profiles?id=in.${inList}&select=id,npi,org_name,first_name,last_name,phone,city,state`;
      const nr = await fetch(`${env.SUPABASE_URL}/rest/v1/${q}`, { headers: svc, signal: AbortSignal.timeout(5000) }).catch(() => null);
      const nrows = nr && nr.ok ? await nr.json().catch(() => []) : [];
      for (const n of (Array.isArray(nrows) ? nrows : [])) names[n.id] = n;
    }
    const appointments = list.map(r => {
      const o = names[role === 'provider' ? r.patient_id : r.provider_id] || {};
      const out = { id: r.id, status: r.status, requested_time: r.requested_time, reason: r.reason, created_at: r.created_at, updated_at: r.updated_at };
      if (role === 'provider') {
        out.patient_name = [o.first_name, o.last_name].filter(Boolean).join(' ') || 'Patient';
      } else {
        out.provider_name = o.org_name || [o.first_name, o.last_name].filter(Boolean).join(' ') || 'Provider';
        out.provider_npi = o.npi || null;
        out.provider_phone = o.phone || null;
        out.provider_city = [o.city, o.state].filter(Boolean).join(', ') || null;
      }
      return out;
    });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointments }) };
  }

  if (event.httpMethod === 'POST') {
    if (role !== 'patient') return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Only patients request appointments' }) };

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    // Booking is by NPI: providers-public deliberately never publishes the
    // provider's account id, so the patient app only knows the NPI. It is
    // resolved to the account here, under the service role (a patient's JWT
    // cannot read provider_profiles), and only for a listing that passed
    // exclusion screening -- the same review_status='clear' rule that decides
    // what patients are shown at all. provider_id is still accepted for
    // callers that already hold it, under the same rule.
    const npi = String(body.npi || '').trim();
    const rawId = String(body.provider_id || '').trim();
    let filter;
    if (/^\d{10}$/.test(npi)) filter = `npi=eq.${npi}`;
    else if (UUID_RE.test(rawId)) filter = `id=eq.${rawId}`;
    else return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'npi required' }) };

    const svc = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
    let provRes = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&review_status=eq.clear&select=id`, { headers: svc });
    // Only a 400 (review column not added yet) falls back to the unfiltered lookup.
    if (provRes.status === 400) {
      provRes = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=id`, { headers: svc });
    }
    const provRows = provRes.ok ? await provRes.json().catch(() => []) : [];
    if (!Array.isArray(provRows) || provRows.length === 0) {
      return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'This provider is not taking requests through ProviderPulse yet. Please call them.' }) };
    }
    const providerId = provRows[0].id;
    if (providerId === user.id) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'You cannot request an appointment with yourself' }) };
    }

    // requested_time is a timestamptz column: reject anything Postgres would
    // not parse, and anything in the past, with a message the patient can act on.
    let requestedTime = null;
    if (body.requested_time) {
      const t = new Date(String(body.requested_time));
      if (isNaN(t.getTime())) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'That date and time is not valid' }) };
      if (t.getTime() < Date.now() - 5 * 60000) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Pick a time in the future' }) };
      requestedTime = t.toISOString();
    }

    const row = {
      patient_id: user.id,
      provider_id: providerId,
      requested_time: requestedTime,
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

    // Never hand the provider's auth account id back to the patient: the rest
    // of the patient surface only ever sees NPIs (see providers-public.js).
    const c = created[0] || null;
    const appointment = c && { id: c.id, status: c.status, requested_time: c.requested_time, reason: c.reason, created_at: c.created_at };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointment }) };
  }

  if (event.httpMethod === 'PATCH') {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const id = String(body.id || '').trim();
    const nextStatus = String(body.status || '').trim();
    if (!UUID_RE.test(id) || !nextStatus) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id and status required' }) };

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

    const u = updated[0] || null;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ appointment: u && { id: u.id, status: u.status, requested_time: u.requested_time, reason: u.reason, updated_at: u.updated_at } }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET, POST or PATCH only' }) };
};
