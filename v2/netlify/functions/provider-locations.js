// provider-locations.js
// A registered provider's practice locations (migration 006).
//   GET    -> own locations
//   POST   -> add one          (geocoded on save)
//   PUT    -> update one by id (re-geocoded if the address changed)
//   DELETE -> remove one by id
//
// Reads and writes go through PostgREST with the CALLER'S JWT, so RLS is the
// enforcement layer exactly as in profile.js. The service role is never used
// here: there is no row-creation-for-someone-else case, so it is not needed.
//
// `verified` is deliberately NOT writable. Only the address tied to the
// registered NPI is federally verified; letting a provider set that flag on a
// self-reported site would make the map's teal ring meaningless.
//
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Writable by the owner. `verified`, `provider_id`, `geocoded`, `latitude` and
// `longitude` are all absent on purpose — the first two are trust claims and
// the last three are derived from the address by the geocoder below.
const FIELDS = [
  'npi', 'label', 'address_line', 'city', 'state', 'zip', 'phone',
  'accepting_new_patients', 'telehealth', 'office_hours', 'hours_note', 'is_primary'
];

const MAX_LOCATIONS = 25;

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

// Same two-provider chain patient-match.js uses: Nominatim first, Photon as the
// fallback. Kept to a 5s budget each so a slow geocoder cannot push this
// function toward the 26s kill.
async function geocode(parts) {
  const query = [parts.address_line, parts.city, parts.state, parts.zip].filter(Boolean).join(', ');
  if (!query.trim()) return null;
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'ProviderPulse/1.0 (healthcare provider directory)' }, signal: AbortSignal.timeout(5000) }
    );
    const data = await r.json();
    if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* try photon */ }
  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await r.json();
    const c = data && data.features && data.features[0] && data.features[0].geometry && data.features[0].geometry.coordinates;
    if (c) return { lat: c[1], lng: c[0] };
  } catch { /* give up */ }
  return null;
}

// Attach coordinates when we can. A failed geocode is recorded as
// geocoded:false rather than blocking the save — the address is still worth
// showing as text, and the UI tells them the pin could not be placed.
async function withCoords(row) {
  if (!row.address_line) return row;
  const hit = await geocode(row);
  row.latitude = hit ? hit.lat : null;
  row.longitude = hit ? hit.lng : null;
  row.geocoded = !!hit;
  return row;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const env = process.env;
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  const role = (user.user_metadata && user.user_metadata.role) || '';
  if (role !== 'provider') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Provider accounts only' }) };
  }

  const H = {
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  const BASE = `${env.SUPABASE_URL}/rest/v1/provider_locations`;

  // Migration 006 may not have been applied yet. Say so plainly instead of
  // surfacing a raw PostgREST error about a missing relation.
  const missingTable = (res, text) =>
    res.status === 404 || /relation .*provider_locations.* does not exist/i.test(text || '');

  try {
    if (event.httpMethod === 'GET') {
      const r = await fetch(`${BASE}?provider_id=eq.${user.id}&select=*&order=is_primary.desc,created_at.asc`, { headers: H });
      const text = await r.text();
      if (!r.ok) {
        if (missingTable(r, text)) {
          return { statusCode: 200, headers: CORS, body: JSON.stringify({ locations: [], unavailable: true }) };
        }
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: text.slice(0, 200) }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ locations: JSON.parse(text || '[]') }) };
    }

    let body = {};
    if (event.httpMethod !== 'DELETE' || event.body) {
      try { body = JSON.parse(event.body || '{}'); }
      catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
    }

    if (event.httpMethod === 'POST') {
      const countRes = await fetch(`${BASE}?provider_id=eq.${user.id}&select=id`, { headers: H });
      const existing = countRes.ok ? await countRes.json().catch(() => []) : [];
      if (Array.isArray(existing) && existing.length >= MAX_LOCATIONS) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `A provider may list at most ${MAX_LOCATIONS} locations` }) };
      }

      const row = pick(body, FIELDS);
      if (!row.address_line) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'A street address is required' }) };
      row.provider_id = user.id;
      // Self-reported until an NPPES match says otherwise. Never from input.
      row.verified = false;
      // The first location a provider adds becomes primary; after that they choose.
      if (!Array.isArray(existing) || existing.length === 0) row.is_primary = true;
      await withCoords(row);

      const r = await fetch(BASE, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(row) });
      const text = await r.text();
      if (!r.ok) {
        if (missingTable(r, text)) {
          return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Locations are not enabled yet. Run migration 006.' }) };
        }
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: text.slice(0, 200) }) };
      }
      const saved = (JSON.parse(text || '[]') || [])[0] || null;
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, location: saved, geocoded: !!(saved && saved.geocoded) }) };
    }

    if (event.httpMethod === 'PUT') {
      const id = String(body.id || '');
      if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id is required' }) };
      const row = pick(body, FIELDS);
      if (!Object.keys(row).length) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Nothing to update' }) };

      // Only pay for a geocode when something about the address moved.
      if (['address_line', 'city', 'state', 'zip'].some(k => k in row)) {
        const curRes = await fetch(`${BASE}?id=eq.${encodeURIComponent(id)}&provider_id=eq.${user.id}&select=address_line,city,state,zip`, { headers: H });
        const cur = curRes.ok ? ((await curRes.json().catch(() => []))[0] || {}) : {};
        // Geocode the MERGED address (a PUT may change only the ZIP), then copy
        // the result onto `row`, which is what actually gets PATCHed. Geocoding
        // the merged object alone threw the coordinates away and left every
        // save reporting "address not found".
        const geo = await withCoords(Object.assign({}, cur, row));
        row.latitude = geo.latitude;
        row.longitude = geo.longitude;
        row.geocoded = geo.geocoded;
      }
      row.updated_at = new Date().toISOString();

      // provider_id in the filter as well as RLS: defence in depth, and it
      // makes the intent obvious to anyone reading the query.
      const r = await fetch(`${BASE}?id=eq.${encodeURIComponent(id)}&provider_id=eq.${user.id}`, {
        method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(row)
      });
      const text = await r.text();
      if (!r.ok) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: text.slice(0, 200) }) };
      const rows = JSON.parse(text || '[]');
      if (!Array.isArray(rows) || !rows.length) {
        return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No such location' }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, location: rows[0] }) };
    }

    if (event.httpMethod === 'DELETE') {
      const id = String((event.queryStringParameters || {}).id || body.id || '');
      if (!id) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'id is required' }) };
      const r = await fetch(`${BASE}?id=eq.${encodeURIComponent(id)}&provider_id=eq.${user.id}`, { method: 'DELETE', headers: H });
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: text.slice(0, 200) }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET, POST, PUT or DELETE' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not reach the database' }) };
  }
};
