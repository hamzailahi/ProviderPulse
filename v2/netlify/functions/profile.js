// profile.js
// Authenticated profile endpoint for providers and patients.
// GET  -> own profile (providers also get their insurance list)
// PUT  -> update whitelisted fields; providers may replace their insurance list
// All reads/writes use the caller's JWT against PostgREST, so RLS is the enforcement layer.
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Content-Type': 'application/json'
};

const PROVIDER_FIELDS = ['phone', 'address_line', 'city', 'state', 'zip', 'accepting_new_patients', 'telehealth', 'bio', 'org_name',
  // availability (migration 005) — a provider controls their own hours
  'office_hours', 'appointment_minutes', 'booking_mode', 'booking_url', 'hours_note'];
const PATIENT_FIELDS = ['first_name', 'last_name', 'date_of_birth', 'zip', 'insurance_payer', 'conditions', 'concern_description'];

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
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
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  // Identify caller
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  const role = (user.user_metadata && user.user_metadata.role) || '';
  if (role !== 'provider' && role !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'No role on account' }) };
  }

  const table = role === 'provider' ? 'provider_profiles' : 'patient_profiles';
  const userHeaders = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'GET') {
    const profRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${user.id}&select=*`, { headers: userHeaders });
    const rows = await profRes.json();
    const profile = Array.isArray(rows) ? rows[0] || null : null;

    let insurance = [];
    if (role === 'provider') {
      const insRes = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_insurance?provider_id=eq.${user.id}&select=payer_name,plan_type`, { headers: userHeaders });
      insurance = await insRes.json();
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ role, profile, insurance }) };
  }

  if (event.httpMethod === 'PUT') {
    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const updates = pick(body, role === 'provider' ? PROVIDER_FIELDS : PATIENT_FIELDS);
    if (Object.keys(updates).length) {
      // Ensure a row exists. Accounts created outside the registration flow
      // (e.g. manually in the Supabase dashboard) have no profile row, and a
      // PATCH against a missing row silently succeeds while saving nothing.
      const existsRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${user.id}&select=id`, { headers: userHeaders });
      const existsRows = await existsRes.json().catch(() => []);
      if (!Array.isArray(existsRows) || existsRows.length === 0) {
        // Insert via service role: RLS intentionally grants no self-insert policy
        const seed = role === 'provider'
          ? { id: user.id, npi: (user.user_metadata || {}).npi || null }
          : { id: user.id };
        const seedRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(seed)
        });
        if (!seedRes.ok) {
          const detail = await seedRes.text().catch(() => '');
          return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Could not create profile: ' + detail.slice(0, 200) }) };
        }
        await audit(env, { actor: user.id, actor_role: role, action: 'profile_row_created', ip });
      }

      const upRes = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { ...userHeaders, Prefer: 'return=representation' },
        body: JSON.stringify(updates)
      });
      if (!upRes.ok) {
        const detail = await upRes.text().catch(() => '');
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Update failed: ' + detail.slice(0, 200) }) };
      }
      // Confirm the update actually touched a row rather than silently matching none
      const changed = await upRes.json().catch(() => []);
      if (!Array.isArray(changed) || changed.length === 0) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No profile row was updated' }) };
      }
    }

    // Replace insurance list if provided (provider only). RLS restricts to own rows.
    if (role === 'provider' && Array.isArray(body.insurances)) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/provider_insurance?provider_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: userHeaders
      });
      const rows = body.insurances
        .slice(0, 50)
        .map(p => String(p).trim().slice(0, 120))
        .filter(Boolean)
        .map(payer_name => ({ provider_id: user.id, payer_name }));
      if (rows.length) {
        await fetch(`${env.SUPABASE_URL}/rest/v1/provider_insurance`, {
          method: 'POST',
          headers: { ...userHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify(rows)
        });
      }
    }

    // SOC2 audit: log the field names changed, never the values (PHI)
    await audit(env, {
      actor: user.id,
      actor_role: role,
      action: 'profile_updated',
      detail: { fields: Object.keys(updates), insurance_replaced: role === 'provider' && Array.isArray(body.insurances) },
      ip
    });

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET or PUT only' }) };
};
