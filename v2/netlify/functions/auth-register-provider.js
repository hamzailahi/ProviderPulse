// auth-register-provider.js
// Provider self-registration: NPI lookup against NPPES + name match, then Supabase signup.
// Env vars required (Netlify site settings): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const norm = s => (s || '').trim().toLowerCase().replace(/[^a-z]/g, '');

// NPI Luhn check (with 80840 prefix constant of 24)
function validNpi(npi) {
  if (!/^\d{10}$/.test(npi)) return false;
  let sum = 24;
  const digits = npi.slice(0, 9).split('').reverse();
  for (let i = 0; i < 9; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === parseInt(npi[9], 10);
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
  } catch (e) { /* audit failure must not block the request */ }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const npi = String(body.npi || '').trim();
  const firstName = String(body.first_name || '').trim();
  const lastName = String(body.last_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const insurances = Array.isArray(body.insurances) ? body.insurances.slice(0, 50) : [];
  const userAddr = String(body.address_line || '').trim().slice(0, 200);
  const userCity = String(body.city || '').trim().slice(0, 100);
  const userState = String(body.state || '').trim().toUpperCase().slice(0, 2);
  const userZip = String(body.zip || '').trim().slice(0, 5);
  if (userZip && !/^\d{5}$/.test(userZip)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'ZIP must be 5 digits' }) };

  if (!validNpi(npi)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid NPI number' }) };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid email' }) };
  if (password.length < 12) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Password must be at least 12 characters' }) };
  if (!lastName) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Last name (or authorized official last name) is required' }) };

  // 1) NPPES lookup
  let record;
  try {
    const r = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    record = data.results && data.results[0];
  } catch {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'NPI registry lookup failed, try again shortly' }) };
  }
  if (!record) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'NPI not found in the NPPES registry' }) };

  // 2) Name match: NPI-1 -> provider name; NPI-2 -> authorized official
  const basic = record.basic || {};
  const entityType = record.enumeration_type === 'NPI-2' ? 2 : 1;
  const registryLast = entityType === 2 ? basic.authorized_official_last_name : basic.last_name;
  const registryFirst = entityType === 2 ? basic.authorized_official_first_name : basic.first_name;
  const nameMatch = norm(registryLast) === norm(lastName) &&
    (!firstName || norm(registryFirst) === norm(firstName));

  if (!nameMatch) {
    await audit(env, { action: 'provider_register_name_mismatch', target: npi, ip, detail: { email } });
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Name does not match the NPPES record for this NPI. For organizations, use the authorized official name.' }) };
  }

  // 3) Reject if NPI already claimed
  const claimed = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=eq.${npi}&select=id`, {
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
  }).then(r => r.json());
  if (Array.isArray(claimed) && claimed.length) {
    return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'This NPI has already been claimed. Contact support if you believe this is an error.' }) };
  }

  // 4) Supabase signup (sends confirmation email automatically)
  const signup = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { role: 'provider', npi } })
  });
  const signupData = await signup.json();
  if (!signup.ok || !signupData.id && !(signupData.user && signupData.user.id)) {
    const msg = signupData.msg || signupData.error_description || signupData.message || 'Signup failed';
    return { statusCode: signup.status === 422 ? 409 : 400, headers: CORS, body: JSON.stringify({ error: msg }) };
  }
  const userId = signupData.id || signupData.user.id;

  // 5) Create profile row (service role) seeded from NPPES
  const addr = (record.addresses || []).find(a => a.address_purpose === 'LOCATION') || (record.addresses || [])[0] || {};
  const tax = (record.taxonomies || []).find(t => t.primary) || (record.taxonomies || [])[0] || {};
  const svcHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };

  const profileRes = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles`, {
    method: 'POST',
    headers: svcHeaders,
    body: JSON.stringify({
      id: userId,
      npi,
      npi_verified: true,
      entity_type: entityType,
      first_name: registryFirst || firstName || null,
      last_name: registryLast,
      org_name: entityType === 2 ? (basic.organization_name || null) : null,
      phone: addr.telephone_number || null,
      address_line: userAddr || addr.address_1 || null,
      city: userCity || addr.city || null,
      state: userState || (addr.state || '').slice(0, 2) || null,
      zip: userZip || (addr.postal_code || '').slice(0, 5) || null,
      taxonomy_code: tax.code || null,
      taxonomy_desc: tax.desc || null
    })
  });
  if (!profileRes.ok) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Account created but profile setup failed. Contact support.' }) };
  }

  // 6) Insurance rows
  if (insurances.length) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/provider_insurance`, {
      method: 'POST',
      headers: svcHeaders,
      body: JSON.stringify(insurances
        .map(p => String(p).trim().slice(0, 120))
        .filter(Boolean)
        .map(payer_name => ({ provider_id: userId, payer_name })))
    });
  }

  await audit(env, { actor: userId, actor_role: 'provider', action: 'provider_registered', target: npi, ip });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ ok: true, npi_verified: true, message: 'Registered. Check your email to confirm your account before signing in.' })
  };
};
