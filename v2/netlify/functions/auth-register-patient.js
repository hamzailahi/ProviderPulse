// auth-register-patient.js
// Patient self-registration. Stores PHI (dob, conditions) in patient_profiles.
// DO NOT enable in production until a Supabase BAA is in place (Team plan or above).
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Optional kill switch: set PATIENT_SIGNUP_ENABLED=false to disable this endpoint.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  if (env.PATIENT_SIGNUP_ENABLED === 'false') {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Patient registration is temporarily unavailable' }) };
  }
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const firstName = String(body.first_name || '').trim().slice(0, 80);
  const lastName = String(body.last_name || '').trim().slice(0, 80);
  const dob = String(body.date_of_birth || '').trim();
  const zip = String(body.zip || '').trim().slice(0, 5);
  const insurancePayer = String(body.insurance_payer || '').trim().slice(0, 120);
  const conditions = (Array.isArray(body.conditions) ? body.conditions : [])
    .slice(0, 30).map(c => String(c).trim().slice(0, 120)).filter(Boolean);
  const concernDescription = String(body.concern_description || '').trim().slice(0, 1000);

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid email' }) };
  if (password.length < 12) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Password must be at least 12 characters' }) };
  if (!firstName || !lastName) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'First and last name are required' }) };
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Date of birth must be YYYY-MM-DD' }) };
  if (zip && !/^\d{5}$/.test(zip)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'ZIP must be 5 digits' }) };

  // 1) Supabase signup (confirmation email sent automatically)
  const signup = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { role: 'patient' } })
  });
  const signupData = await signup.json();
  if (!signup.ok || !signupData.id && !(signupData.user && signupData.user.id)) {
    const msg = signupData.msg || signupData.error_description || signupData.message || 'Signup failed';
    return { statusCode: signup.status === 422 ? 409 : 400, headers: CORS, body: JSON.stringify({ error: msg }) };
  }
  const userId = signupData.id || signupData.user.id;

  // 2) Profile row via service role
  const profileRes = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_profiles`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob || null,
      zip: zip || null,
      insurance_payer: insurancePayer || null,
      conditions,
      concern_description: concernDescription || null
    })
  });
  if (!profileRes.ok) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Account created but profile setup failed. Contact support.' }) };
  }

  // Audit: never log PHI details, only the event
  await audit(env, { actor: userId, actor_role: 'patient', action: 'patient_registered', ip });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ ok: true, message: 'Registered. Check your email to confirm your account before signing in.' })
  };
};
