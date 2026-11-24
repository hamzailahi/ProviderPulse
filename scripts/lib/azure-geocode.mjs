// Azure Maps geocoding (2026-11-24, the user's choice for pins the Census
// cannot confirm; Microsoft's terms let geocodes be stored while the Azure
// account is active). Accurate or nothing: only a high-confidence, rooftop
// or parcel point for the same house number in the listing's own ZIP counts.
// Geocoding API 2025-01-01: GET /geocode, one address per request, each one
// billed as a Search transaction ($4.50 per 1,000 after 5,000 free a month).
import { streetOnly } from './geocode-batch.mjs';

export const AZURE_URL = 'https://atlas.microsoft.com/geocode';

export function azureQuery(it, key) {
  return new URLSearchParams({ 'api-version': '2025-01-01', addressLine: streetOnly(it.address),
    locality: it.city || '', adminDistrict: it.state || '', postalCode: it.zip || '', countryRegion: 'US', top: '1',
    'subscription-key': key });
}

const house = s => (String(s || '').trim().match(/^(\d+[A-Z]?)\b/i) || [])[1]?.toUpperCase() || null;

// One answer -> {lat, lng, how} when it is the building, else null with a reason.
export function azureAccepts(data, it) {
  const f = data && Array.isArray(data.features) ? data.features[0] : null;
  if (!f) return { ok: false, why: 'no_result' };
  const p = f.properties || {};
  const codes = p.matchCodes || [];
  if (p.type !== 'Address') return { ok: false, why: 'not_an_address' };
  if (p.confidence !== 'High' || !codes.includes('Good') || codes.includes('Ambiguous') || codes.includes('UpHierarchy')) return { ok: false, why: 'low_confidence' };
  const a = p.address || {};
  const zip = String(a.postalCode || '').slice(0, 5);
  const gp = (p.geocodePoints || []).find(g => ['Rooftop', 'Parcel'].includes(g.calculationMethod));
  if (!gp) return { ok: false, why: 'not_rooftop', zip };
  const [lng, lat] = (gp.geometry && gp.geometry.coordinates) || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { ok: false, why: 'no_point' };
  const h = house(a.addressLine), want = house(streetOnly(it.address));
  if (!h || !want || h !== want) return { ok: false, why: 'other_house_number', zip, lat, lng };
  if (zip !== it.zip) return { ok: false, why: 'other_zip', zip, lat, lng, building: true };
  return { ok: true, lat, lng, how: 'azure_' + gp.calculationMethod.toLowerCase() };
}

// items [{id, address, city, state, zip}] -> {coords, misses, failed, stats}.
// max caps how many requests are sent (the user's spending limit).
export async function azureAll(items, opt = {}) {
  const f = opt.fetch || fetch, key = opt.key, url = opt.url || AZURE_URL, log = opt.log || (() => {});
  const max = Number.isFinite(opt.max) ? opt.max : items.length;
  const coords = new Map(), misses = new Map(), failed = new Set();
  const stats = { asked: 0, placed: 0, failed: 0, not_sent: Math.max(0, items.length - max) };
  const todo = items.slice(0, max);
  let i = 0;
  const work = async () => {
    while (i < todo.length) {
      const it = todo[i++];
      let data = null;
      for (let attempt = 0; attempt < 4 && !data; attempt++) {
        try {
          const res = await f(`${url}?${azureQuery(it, key)}`, { signal: AbortSignal.timeout(15000) });
          if (res.status === 429 || res.status >= 500) throw Object.assign(new Error('HTTP ' + res.status), { retry: true });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          data = await res.json();
        } catch (e) {
          if (!e.retry && !/timeout|abort|fetch failed/i.test(String(e.message))) { log(`  Azure: ${e.message}`); break; }
          await new Promise(r => setTimeout(r, (opt.waitMs ?? 2000) * 2 ** attempt));
        }
      }
      stats.asked++;
      if (!data) { failed.add(it.id); stats.failed++; continue; }
      const r = azureAccepts(data, it);
      if (r.ok) { coords.set(it.id, r); stats.placed++; }
      else { misses.set(it.id, r); stats['miss_' + r.why] = (stats['miss_' + r.why] || 0) + 1; }
    }
  };
  await Promise.all(Array.from({ length: opt.concurrency || 8 }, work));
  return { coords, misses, failed, stats };
}
