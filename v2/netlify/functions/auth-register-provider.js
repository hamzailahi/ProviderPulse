// auth-register-provider.js
// Provider self-registration: NPI lookup against NPPES + name match, then Supabase signup.
// Env vars required (Netlify site settings): SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// The NPI checks (Luhn, OIG screening) live in lib/npi-verify.js, shared with
// provider-npis.js, which adds further NPIs to an existing account.
const { norm, validNpi, isExcluded, exclusionNameHits, npiClaimed, audit } = require('./lib/npi-verify.js');

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

  // Deactivated NPIs stay in the registry forever, so "exists in NPPES" is not the
  // same as "currently valid". Without this a retired or revoked NPI verifies fine.
  if (String(basic.status || 'A').toUpperCase() === 'D') {
    await audit(env, { action: 'provider_register_deactivated_npi', target: npi, ip, detail: { email } });
    return {
      statusCode: 403,
      headers: CORS,
      body: JSON.stringify({ error: 'This NPI is listed as deactivated in the NPPES registry and cannot be registered.' })
    };
  }
  const entityType = record.enumeration_type === 'NPI-2' ? 2 : 1;
  const registryLast = entityType === 2 ? basic.authorized_official_last_name : basic.last_name;
  const registryFirst = entityType === 2 ? basic.authorized_official_first_name : basic.first_name;
  const nameMatch = norm(registryLast) === norm(lastName) &&
    (!firstName || norm(registryFirst) === norm(firstName));

  if (!nameMatch) {
    await audit(env, { action: 'provider_register_name_mismatch', target: npi, ip, detail: { email } });
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Name does not match the NPPES record for this NPI. For organizations, use the authorized official name.' }) };
  }

  // 3) Reject providers excluded from federal healthcare programs
  if (await isExcluded(env, npi)) {
    await audit(env, { action: 'provider_register_oig_excluded', target: npi, ip, detail: { email } });
    return {
      statusCode: 403,
      headers: CORS,
      body: JSON.stringify({ error: 'This NPI appears on the OIG exclusion list and cannot be registered. Contact support if you believe this is an error.' })
    };
  }

  // 3b) Name-based screening. Suggestive only, so it gates publication, not the
  // account: the listing stays hidden from patients until a human clears it.
  const regAddrForScreen = (record.addresses || []).find(a => a.address_purpose === 'LOCATION') || (record.addresses || [])[0] || {};
  const nameHits = await exclusionNameHits(env, {
    entityType,
    lastName: registryLast,
    firstName: registryFirst,
    orgName: basic.organization_name,
    state: userState || regAddrForScreen.state
  });
  const reviewStatus = nameHits > 0 ? 'pending' : 'clear';
  const reviewReason = nameHits > 0
    ? `OIG name match: ${nameHits} exclusion record(s) share this name and state`
    : null;

  // 4) Reject if NPI already claimed, as an account's own NPI or one added to
  // an account (migration 044). An unknown answer stops here rather than
  // risking two owners.
  let claimed;
  try { claimed = await npiClaimed(env, npi); }
  catch { return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Could not check this NPI just now. Try again in a minute.' }) }; }
  if (claimed) {
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

  const profileRow = {
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
  };

  const postProfile = row => fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles`, {
    method: 'POST', headers: svcHeaders, body: JSON.stringify(row)
  });

  // The review columns are optional: if the ALTER TABLE has not been run yet, retry
  // without them so registration keeps working instead of failing after signup.
  let profileRes = await postProfile({ ...profileRow, review_status: reviewStatus, review_reason: reviewReason });
  if (!profileRes.ok && reviewStatus === 'clear') {
    profileRes = await postProfile(profileRow);
  } else if (!profileRes.ok) {
    // A flagged provider must never be published just because the column is missing
    await audit(env, { action: 'provider_register_review_column_missing', target: npi, ip, detail: { hits: nameHits } });
  }
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

  await audit(env, {
    actor: userId, actor_role: 'provider', action: 'provider_registered', target: npi, ip,
    detail: { review_status: reviewStatus, name_exclusion_hits: nameHits }
  });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      npi_verified: true,
      review_pending: reviewStatus === 'pending',
      message: reviewStatus === 'pending'
        ? 'Registered. Check your email to confirm your account. Your public listing is held for a short verification review before patients can see it.'
        : 'Registered. Check your email to confirm your account before signing in.'
    })
  };
};
