'use strict';
// lib/providers-near.js: the market assistant's find_providers tool
// (rewritten 2026-10-22).
//
// The first version loaded every listing in the ZIPs around a ZIP, stopped
// after 4,000 rows per table, and only then kept the specialty's codes. Around
// Fort Worth the cut fell before most individual clinicians, so a GI report
// named 9 organizations and no gastroenterologist; at 25 miles the request
// timed out and the timeout read as "none found". This asks the database for
// the specialty's NUCC codes only, inside a location box (the indexed query
// patient search uses), pages it in a stable order, and reports a failed or
// capped page as incomplete, never as an empty answer (see CLAUDE.md, "A
// failed query is not an empty answer").
//
// Area: a radius around the ZIP, or the ZIPs on the user's map (opts.zips,
// from use_map_area). Public NPPES registry data only.

const TaxonomyMap = require('../../../assets/taxonomy-map.js');

const GEO_MEASURE = 'DENTAL';           // the PLACES rows that carry ZCTA centroids
const MAX_PAGES = 10;                   // 1,000-row pages per table
const LIST = 25;                        // nearest organizations and individuals listed
const BUDGET_MS = 14000;
const SELECT = 'npi,name,city,zip,primary_taxonomy,taxonomy_code,latitude,longitude';

const milesBetween = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
const isZip = z => typeof z === 'string' && /^\d{5}$/.test(z);

async function findProviders(input, opts) {
  const o = opts || {};
  const doFetch = o.fetch || fetch, env = o.env || process.env;
  const started = Date.now();
  const zip = input && input.zip;
  if (!isZip(zip)) return { error: 'zip must be 5 digits' };
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { error: 'Database is not configured' };
  const label = (input && input.specialty) || 'Primary care / family doctor';
  const codes = TaxonomyMap.codesFor(label);
  if (!codes.length) return { error: 'No taxonomy codes for ' + label };
  const mapZips = Array.isArray(o.zips) ? [...new Set(o.zips.filter(isZip))] : null;
  const useMap = !!(mapZips && mapZips.length);
  const radius = Math.max(1, Math.min(25, Number(input && input.radius_miles) || 10));

  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: 'application/json' };
  let failed = 0, outOfTime = false;
  const get = async (path, ms) => {
    if (Date.now() - started > BUDGET_MS) { outOfTime = true; return null; }
    try {
      const r = await doFetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(ms || 7000) });
      if (!r.ok) { failed++; return null; }
      const b = await r.json();
      if (!Array.isArray(b)) { failed++; return null; }
      return b;
    } catch (e) { failed++; return null; }
  };

  // ---- where: the ZIP's centre, and a box around the radius or the map
  const home = await get(`cdc_places?zip=eq.${zip}&measureid=eq.${GEO_MEASURE}&select=zip,lat,lon&limit=1`, 5000);
  if (!home) return { zip, error: 'The location lookup did not answer. Try again.' };
  if (!home[0] || home[0].lat == null) return { zip, error: 'No location data for this ZIP' };
  const lat = +home[0].lat, lon = +home[0].lon;
  let box, inArea;
  if (useMap) {
    const pts = [[lat, lon]];
    for (let i = 0; i < mapZips.length; i += 100) {
      const c = await get(`cdc_places?measureid=eq.${GEO_MEASURE}&zip=in.(${mapZips.slice(i, i + 100).join(',')})&select=zip,lat,lon&limit=1000`, 6000);
      (c || []).forEach(r => { if (r.lat != null) pts.push([+r.lat, +r.lon]); });
    }
    const pad = 4 / 69;                                  // ZIPs reach past their centres
    box = [Math.min(...pts.map(p => p[0])) - pad, Math.max(...pts.map(p => p[0])) + pad,
      Math.min(...pts.map(p => p[1])) - pad * 1.2, Math.max(...pts.map(p => p[1])) + pad * 1.2];
    const set = new Set(mapZips.concat([zip]));
    inArea = r => set.has(String(r.zip || '').split('-')[0].trim().padStart(5, '0'));
  } else {
    const dLat = radius / 69, dLon = radius / Math.max(1, 69 * Math.cos(lat * Math.PI / 180));
    box = [lat - dLat, lat + dLat, lon - dLon, lon + dLon];
    inArea = (r, mi) => mi <= radius;
  }

  // ---- the specialty's listings in the box, both tables, stable order
  const where = `latitude=gte.${box[0].toFixed(4)}&latitude=lte.${box[1].toFixed(4)}&longitude=gte.${box[2].toFixed(4)}&longitude=lte.${box[3].toFixed(4)}` +
    `&taxonomy_code=in.(${codes.map(encodeURIComponent).join(',')})`;
  const pageAll = async table => {
    const rows = [];
    for (let p = 0; p < MAX_PAGES; p++) {
      const path = `${table}?${where}&select=${SELECT}&order=latitude,longitude,npi&limit=1000&offset=${p * 1000}`;
      // One retry: a wide map box can hit the 3s statement timeout once and
      // answer the next time (2026-10-22: a 78-ZIP report lost every
      // organization to one failed request and read as "no practices").
      let b = await get(path, 8000);
      if (!b) { b = await get(path, 8000); if (b) failed--; }   // a recovered page is not a failure
      if (!b) return { rows, ok: false };
      rows.push(...b);
      if (b.length < 1000) return { rows, ok: true };
    }
    return { rows, ok: true, capped: true };
  };
  const [orgs, people] = await Promise.all([pageAll('clinics'), pageAll('provider_individuals')]);
  if (!orgs.rows.length && !people.rows.length && (!orgs.ok || !people.ok)) {
    return { zip, specialty: label, error: 'The provider directory did not answer in time. Try again, or a smaller area.' };
  }

  const hits = [], codeSet = new Set(codes);
  for (const [t, type] of [[orgs, 'organization'], [people, 'individual']]) {
    for (const r of t.rows) {
      if (r.latitude == null || !codeSet.has(r.taxonomy_code)) continue;   // the query filters too
      const mi = milesBetween(lat, lon, +r.latitude, +r.longitude);
      if (!inArea(r, mi)) continue;
      const m = TaxonomyMap.get(r.taxonomy_code);
      hits.push({ name: r.name, type, taxonomy: (m && m.displayName) || r.primary_taxonomy, city: r.city, zip: r.zip, miles: Math.round(mi * 10) / 10 });
    }
  }
  hits.sort((a, b) => a.miles - b.miles);
  const byZip = {};
  hits.forEach(h => { byZip[h.zip] = (byZip[h.zip] || 0) + 1; });
  const capped = !!(orgs.capped || people.capped);
  const orgN = hits.filter(h => h.type === 'organization').length, indN = hits.filter(h => h.type === 'individual').length;
  // A table whose lookup failed is unknown, never zero.
  const unknownWhen = (t, n) => (t.ok ? n : n || null);
  const incomplete = failed > 0 || outOfTime || capped;
  return {
    zip, specialty: label,
    area: useMap ? { map_zips: mapZips.length } : { radius_miles: radius },
    total: hits.length,
    organizations: unknownWhen(orgs, orgN),
    individuals: unknownWhen(people, indN),
    lookups: { organizations: orgs.ok ? (orgs.capped ? 'capped' : 'complete') : 'failed', individuals: people.ok ? (people.capped ? 'capped' : 'complete') : 'failed' },
    nearest_organizations: hits.filter(h => h.type === 'organization').slice(0, LIST),
    nearest_individuals: hits.filter(h => h.type === 'individual').slice(0, LIST),
    by_zip: Object.keys(byZip).map(z => ({ zip: z, listings: byZip[z] })).sort((a, b) => b.listings - a.listings).slice(0, 20),
    count_is_floor: incomplete,
    incomplete,
    incomplete_reason: incomplete ? [!orgs.ok ? 'the organization lookup (practices, surgery centers) failed, so their count is unknown, not zero' : null,
      !people.ok ? 'the individual clinician lookup failed, so their count is unknown, not zero' : null,
      failed && orgs.ok && people.ok ? failed + ' request(s) failed or timed out' : null, capped ? 'more listings than one lookup holds' : null,
      outOfTime ? 'the time budget ran out' : null].filter(Boolean).join('; ') + '. Counts are floors; do not call the area empty.' : null,
    source: 'NPPES registry listings with coordinates, matched by their own NUCC taxonomy code. Individuals are listed where they register, often a group\'s address; organizations include practices, surgery centers and hospitals carrying the specialty\'s codes.',
    ms: Date.now() - started
  };
}

module.exports = { findProviders };
