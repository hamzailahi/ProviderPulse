// providers-public.js
// Public, read-only lookup of REGISTERED providers by NPI, used to enrich the map
// and the care navigator with details only the provider can supply: whether they
// are accepting new patients, offer telehealth, and which payers they take.
//
// provider_profiles is RLS self-only, so this runs under the service role. That
// makes the allowlist below the security boundary: every field returned here is
// published to anyone, and NOTHING that identifies the account (id, email) or is
// patient data may be added to it. Providers opt into this by registering.
//
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Safe to publish. `id` is deliberately absent: it is the auth user id.
// address_line is the PRACTICE street address. It is already public in the
// federal NPPES registry, and without it the map could show a claimed listing's
// city but not where it actually is. Still business data, never PHI.
const PUBLIC_COLUMNS = 'npi,npi_verified,accepting_new_patients,telehealth,bio,org_name,first_name,last_name,address_line,city,state,zip,phone,taxonomy_desc,office_hours,hours_note,booking_mode,booking_url';
// Availability columns arrive with migration 005. Until it runs, selecting them
// 400s and would take the whole endpoint down with it — including the verified
// badge, which already works. Fall back to the columns that definitely exist.
const BASE_COLUMNS = 'npi,npi_verified,accepting_new_patients,telehealth,bio,org_name,first_name,last_name,city,state,zip,phone,taxonomy_desc';
// Locations arrive with migration 006; absent until it runs.
const LOCATION_COLUMNS = 'provider_id,npi,label,address_line,city,state,zip,latitude,longitude,verified,is_primary,phone,accepting_new_patients,telehealth,office_hours,hours_note';

const MAX_NPIS = 80;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const env = process.env;
  let raw = '';
  if (event.httpMethod === 'GET') {
    raw = (event.queryStringParameters || {}).npis || '';
  } else if (event.httpMethod === 'POST') {
    try { raw = String((JSON.parse(event.body || '{}')).npis || ''); }
    catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  } else {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET or POST only' }) };
  }

  // Registered providers are far rarer than clinics on the map, so the map asks for
  // all of them once and joins locally rather than batching NPI lists per search.
  const wantAll = event.httpMethod === 'GET' && (event.queryStringParameters || {}).all === '1';

  const npis = [...new Set(String(raw).split(',').map(s => s.trim()).filter(s => /^\d{10}$/.test(s)))].slice(0, MAX_NPIS);
  if (!npis.length && !wantAll) return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {} }) };

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
  };
  const filter = wantAll ? 'npi=not.is.null&limit=500' : `npi=in.(${npis.join(',')})`;
  const inList = `(${npis.join(',')})`;

  // Listings flagged by exclusion screening stay unpublished until reviewed. If the
  // review column does not exist yet the query 400s, so fall back to the unfiltered
  // form — before that migration there is nothing flagged to hide.
  const REVIEW_FILTER = 'review_status=not.eq.pending';

  try {
    let profRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&${REVIEW_FILTER}&select=${PUBLIC_COLUMNS}`,
      { headers: svc, signal: AbortSignal.timeout(6000) }
    );
    if (!profRes.ok) {
      profRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${PUBLIC_COLUMNS}`,
        { headers: svc, signal: AbortSignal.timeout(6000) }
      );
    }
    // Neither worked: retry without the availability columns, in case migration
    // 005 has not been applied yet.
    if (!profRes.ok) {
      profRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_profiles?${filter}&select=${BASE_COLUMNS}`,
        { headers: svc, signal: AbortSignal.timeout(6000) }
      );
    }
    if (!profRes.ok) throw new Error('profile lookup failed');
    const rows = await profRes.json();
    if (!Array.isArray(rows) || !rows.length) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {} }) };
    }

    // Insurance is keyed by provider id, which we must not expose, so resolve it
    // through a second query and fold the payer names into the NPI-keyed result.
    const idRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/provider_profiles?${wantAll ? 'npi=not.is.null&limit=500' : `npi=in.${inList}`}&select=id,npi`,
      { headers: svc, signal: AbortSignal.timeout(6000) }
    );
    const idRows = idRes.ok ? await idRes.json() : [];
    const npiById = {};
    for (const r of (Array.isArray(idRows) ? idRows : [])) npiById[r.id] = r.npi;

    const payersByNpi = {};
    const ids = Object.keys(npiById);
    if (ids.length) {
      const insRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/provider_insurance?provider_id=in.(${ids.map(i => `"${i}"`).join(',')})&select=provider_id,payer_name`,
        { headers: svc, signal: AbortSignal.timeout(6000) }
      );
      if (insRes.ok) {
        for (const row of (await insRes.json()) || []) {
          const npi = npiById[row.provider_id];
          if (!npi || !row.payer_name) continue;
          (payersByNpi[npi] = payersByNpi[npi] || []).push(row.payer_name);
        }
      }
    }

    // Practice locations (migration 006). A provider can list more than one
    // site, and only the one tied to the registered NPI is NPPES-verified --
    // `verified` per location is what lets the map ring them differently.
    // Missing table means the migration has not run: publish none rather than
    // failing the whole overlay, which still carries the verified badge.
    const locsByNpi = {};
    if (ids.length) {
      try {
        const locRes = await fetch(
          `${env.SUPABASE_URL}/rest/v1/provider_locations?provider_id=in.(${ids.map(i => `"${i}"`).join(',')})&select=${LOCATION_COLUMNS}`,
          { headers: svc, signal: AbortSignal.timeout(6000) }
        );
        if (locRes.ok) {
          for (const row of (await locRes.json()) || []) {
            const npi = npiById[row.provider_id];
            if (!npi) continue;
            const { provider_id, ...pub } = row;   // never publish the auth user id
            (locsByNpi[npi] = locsByNpi[npi] || []).push(pub);
          }
        }
      } catch (e) { /* locations are additive; the overlay stands without them */ }
    }

    const providers = {};
    for (const r of rows) {
      providers[r.npi] = {
        npi: r.npi,
        registered: true,
        verified: !!r.npi_verified,
        accepting_new_patients: r.accepting_new_patients,
        telehealth: r.telehealth,
        org_name: r.org_name || null,
        name: r.org_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || null,
        city: r.city || null,
        state: r.state || null,
        zip: r.zip || null,
        phone: r.phone || null,
        specialty: r.taxonomy_desc || null,
        address_line: r.address_line || null,
        bio: r.bio || null,
        locations: locsByNpi[r.npi] || [],
        office_hours: r.office_hours || null,
        hours_note: r.hours_note || null,
        booking_mode: r.booking_mode || 'phone',
        booking_url: r.booking_url || null,
        payers: payersByNpi[r.npi] || []
      };
    }

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, max-age=120' },
      body: JSON.stringify({ providers })
    };
  } catch (e) {
    // The map must still render if this enrichment is unavailable
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ providers: {}, degraded: true }) };
  }
};
