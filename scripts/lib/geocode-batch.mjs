// Accurate geocoding for the NPPES refresh (the user's choice, 2026-10-25:
// "proper accurate geocoding", so no ZIP-centre fallback).
//
//   1. Census batch geocoder (free, the same first tier the national load
//      used): only an Exact match in the same ZIP counts.
//   2. Google Geocoding, when GOOGLE_GEOCODING_KEY is set, for everything the
//      Census did not match exactly: only a ROOFTOP or RANGE_INTERPOLATED
//      street-level result in the same ZIP counts.
//   3. Otherwise the address stays unplaced (no coordinates, never drawn).
//
// A geocoder that fails (HTTP error, timeout) is not "no match": those rows
// are counted as service failures, and the caller stops the run when there
// are too many, so a later run retries them instead of storing them unplaced.
import { parseCsv } from './taxonomy-map.mjs';

export const CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/addressbatch';
export const GOOGLE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
export const CENSUS_BATCH = 1000;

const csvField = s => {
  const v = String(s ?? '').replace(/[\r\n]+/g, ' ');
  return /[",]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};
export function censusCsv(items) {
  return items.map(it => [it.id, it.address, it.city, it.state, it.zip].map(csvField).join(',')).join('\n') + '\n';
}

// The Census answer: id, input, Match|No_Match|Tie, Exact|Non_Exact,
// matched address ("..., CITY, ST, 12345"), "lon,lat", TIGER id, side.
export function parseCensus(text) {
  const out = new Map();
  for (const r of parseCsv(text)) {
    const id = String(r[0] || '').trim();
    if (!id) continue;
    const match = String(r[2] || '').trim();
    if (match !== 'Match') { out.set(id, { match }); continue; }
    const [lon, lat] = String(r[5] || '').split(',').map(Number);
    const zip = (/(\d{5})\s*$/.exec(String(r[4] || '')) || [])[1] || null;
    out.set(id, { match, exact: String(r[3] || '').trim() === 'Exact', lat, lng: lon, zip, matched: String(r[4] || '') });
  }
  return out;
}
export const censusAccepts = (hit, zip) =>
  !!hit && hit.match === 'Match' && hit.exact && hit.zip === zip && Number.isFinite(hit.lat) && Number.isFinite(hit.lng);

// One Google answer -> coordinates, or null when it is not street-accurate in
// the same ZIP.
export function googleAccepts(data, zip) {
  if (!data || data.status !== 'OK' || !Array.isArray(data.results) || !data.results.length) return null;
  const r = data.results[0];
  if (r.partial_match) return null;
  const g = r.geometry || {};
  if (!['ROOFTOP', 'RANGE_INTERPOLATED'].includes(g.location_type)) return null;
  const pc = (r.address_components || []).find(c => (c.types || []).includes('postal_code'));
  if (!pc || pc.short_name !== zip) return null;
  const { lat, lng } = g.location || {};
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// items: [{id, address, city, state, zip}]. Returns { coords: Map id ->
// {lat, lng, how}, failed: Set of ids an outage left unanswered, stats }. opt.fetch is injectable for tests.
export async function geocodeAll(items, opt = {}) {
  const f = opt.fetch || fetch;
  const googleKey = opt.googleKey || null;
  // Overridable for tests (scripts/test-nppes-refresh.mjs runs a local server).
  const censusUrl = opt.censusUrl || process.env.CENSUS_GEOCODER_URL || CENSUS_URL;
  const googleUrl = opt.googleUrl || process.env.GOOGLE_GEOCODER_URL || GOOGLE_URL;
  const log = opt.log || (() => {});
  const coords = new Map();
  const failed = new Set();   // ids a geocoder outage left unanswered
  const stats = { asked: items.length, census_exact: 0, google: 0, unplaced: 0, census_service_failed: 0,
    google_service_failed: 0, google_not_configured: 0,
    // Why the Census did not count: none, fuzzy, another ZIP, several equal.
    census_no_match: 0, census_non_exact: 0, census_other_zip: 0, census_tie: 0 };
  const examples = [];
  const left = [];

  // 1. Census, in batches, a few at a time.
  const batches = [];
  for (let i = 0; i < items.length; i += CENSUS_BATCH) batches.push(items.slice(i, i + CENSUS_BATCH));
  let bi = 0;
  const census = async () => {
    while (bi < batches.length) {
      const batch = batches[bi++];
      let hits = null;
      for (let attempt = 0; attempt < 2 && !hits; attempt++) {
        try {
          const form = new FormData();
          form.append('benchmark', 'Public_AR_Current');
          form.append('addressFile', new Blob([censusCsv(batch)], { type: 'text/csv' }), 'addresses.csv');
          const res = await f(censusUrl, { method: 'POST', body: form, signal: AbortSignal.timeout(opt.censusTimeoutMs || 300000) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          hits = parseCensus(await res.text());
        } catch (e) { if (attempt) log(`  Census batch failed twice (${e.message || e}); those ${batch.length} go to the next tier`); }
      }
      for (const it of batch) {
        const hit = hits && hits.get(String(it.id));
        if (censusAccepts(hit, it.zip)) { coords.set(it.id, { lat: hit.lat, lng: hit.lng, how: 'census_exact' }); stats.census_exact++; }
        else {
          if (hit) {
            const why = hit.match === 'Tie' ? 'tie' : hit.match !== 'Match' ? 'no_match' : !hit.exact ? 'non_exact' : 'other_zip';
            stats['census_' + why]++;
            if (examples.length < 12 && why !== 'no_match') examples.push({ why, input: `${it.address}, ${it.city}, ${it.state} ${it.zip}`, matched: hit.matched || '' });
          }
          left.push({ it, censusDown: !hits });
        }
      }
    }
  };
  await Promise.all(Array.from({ length: opt.censusConcurrency || 3 }, census));

  // 2. Google for the rest.
  let gi = 0;
  const google = async () => {
    while (gi < left.length) {
      const { it, censusDown } = left[gi++];
      if (!googleKey) {
        if (censusDown) { stats.census_service_failed++; failed.add(it.id); } else { stats.google_not_configured++; stats.unplaced++; }
        continue;
      }
      const q = new URLSearchParams({ address: `${it.address}, ${it.city || ''}, ${it.state || ''} ${it.zip}`, components: `country:US|postal_code:${it.zip}`, key: googleKey });
      let data = null;
      for (let attempt = 0; attempt < 2 && !data; attempt++) {
        try {
          const res = await f(`${googleUrl}?${q}`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const d = await res.json();
          if (['OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'UNKNOWN_ERROR'].includes(d.status)) throw new Error(d.status);
          data = d;
        } catch (e) { if (attempt && gi < 3) log(`  Google failed (${e.message || e})`); }
      }
      if (!data) { stats.google_service_failed++; failed.add(it.id); continue; }
      const hit = googleAccepts(data, it.zip);
      if (hit) { coords.set(it.id, { ...hit, how: 'google' }); stats.google++; }
      else stats.unplaced++;
    }
  };
  await Promise.all(Array.from({ length: opt.googleConcurrency || 8 }, google));
  stats.service_failed = stats.census_service_failed + stats.google_service_failed;
  return { coords, failed, stats, examples };
}
