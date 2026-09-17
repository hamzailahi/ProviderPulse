// lib/geocode.js
// Shared US address geocoder for provider-locations.js, patient-match.js, and
// audit-run.js — previously duplicated byte-for-byte in all three. Google's
// Geocoding API goes first (rooftop-level accuracy for most US addresses,
// well ahead of Nominatim/Photon's interpolated results); Nominatim is kept
// as the one free fallback if Google is unconfigured or fails, so nothing
// regresses if GOOGLE_GEOCODING_KEY is ever missing or rate-limited. Photon
// is deliberately NOT a third tier here — these three functions' timeout
// budgets were built around a ~10s worst-case geocode step (two 5s-capped
// tiers), and patient-match.js in particular has no headroom to spare (see
// its own cautionary-tale comment in netlify.toml about NPPES+geocode+
// Anthropic already stacking close to the 26s kill). Google replaces one
// tier, it does not add a third.

const TIMEOUT_MS = 5000;
const USER_AGENT = 'ProviderPulse/1.0 (healthcare provider directory)';

async function geocodeGoogle(query) {
  const key = process.env.GOOGLE_GEOCODING_KEY;
  if (!key) { console.log('[geocode] GOOGLE_GEOCODING_KEY not set, skipping to Nominatim'); return null; }
  try {
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:US&key=${key}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    const d = await r.json();
    const loc = d && d.status === 'OK' && d.results && d.results[0] &&
      d.results[0].geometry && d.results[0].geometry.location;
    if (loc) return { lat: loc.lat, lng: loc.lng };
    // TEMP diagnostic — remove once Google's status is confirmed healthy in
    // production. d.status is Google's own error code (REQUEST_DENIED,
    // ZERO_RESULTS, OVER_QUERY_LIMIT, INVALID_REQUEST, ...); error_message
    // often names the exact misconfiguration (e.g. API not enabled for key).
    console.log('[geocode] google non-OK status:', d && d.status, d && d.error_message);
  } catch (e) {
    console.log('[geocode] google threw:', e && e.message);
  }
  return null;
}

async function geocodeNominatim(query) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    const data = await r.json();
    if (Array.isArray(data) && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* give up */ }
  return null;
}

// query: a full US address string ("123 Main St, City, ST 12345"). Returns
// {lat, lng} or null — never throws, matching how every call site already
// treats a failed geocode as "unknown," not an error.
async function geocode(query) {
  if (!query || !query.trim()) return null;
  const hit = await geocodeGoogle(query);
  if (hit) { console.log('[geocode] google hit:', query); return hit; }
  const fallback = await geocodeNominatim(query);
  console.log(fallback ? '[geocode] nominatim hit:' : '[geocode] no hit at all:', query);
  return fallback;
}

module.exports = { geocode };
