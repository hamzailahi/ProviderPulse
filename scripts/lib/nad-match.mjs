// Matching unplaced listings to USDOT National Address Database (NAD) points
// (2026-11-04, the user's choice: a free, storable source of real address
// points for the ~148,000 listings the Census geocoder could not place).
//
// The rule is the placement job's (scripts/lib/geocode-batch.mjs): the same
// ZIP, the same house number, and a street that is the same or differs only
// by one of the reviewed one-word differences (censusNearExact). Several NAD
// points for one address (units, duplicate sources) count as one place when
// they lie within MAX_SPREAD_M of each other; farther apart, it is a tie and
// the listing stays unplaced. Nothing is guessed.
import { censusNearExact, streetOnly } from './geocode-batch.mjs';

// USDOT flags these as not public domain (whole states) or partly so
// (June 2025 map): skipped, or reported apart until their sources are checked.
export const NOT_PUBLIC = new Set(['HI', 'MI', 'NH', 'OR']);
export const PARTLY_PUBLIC = new Set(['CO', 'IL', 'KS', 'MD', 'MN', 'ND', 'SC', 'SD']);
export const MAX_SPREAD_M = 100;

// Whether an apply may write this match: placed, and in a state USDOT marks
// wholly public domain. Partly public states wait until their counties are
// checked; territories and military mail codes have no NAD rows anyway.
//
// In a partly public state (2026-11-06, the county check) a match may be
// written only when its NAD county is on the reviewed list of public
// counties (supabase/reference/nad-public-counties.csv, built from USDOT's
// NAD County Participation Status by scripts/build-nad-counties.mjs): every
// piece of the county "Data in the NAD", none "Data not in public domain".
// A missing or unknown county is never public.
export function applicable(status, state, county, publicCounties) {
  const s = String(state || '').toUpperCase();
  if (status !== 'placed' || !/^[A-Z]{2}$/.test(s) || NOT_PUBLIC.has(s)) return false;
  if (!PARTLY_PUBLIC.has(s)) return true;
  const k = countyKey(county);
  return !!(k && publicCounties && publicCounties.has(s + '|' + k));
}

// One spelling for a county name from NAD or from USDOT's status layer:
// capitals, "County"/"Parish" dropped, Saint as ST, punctuation out.
export function countyKey(name) {
  let n = String(name || '').toUpperCase().replace(/[.'’]/g, '').replace(/[^A-Z0-9 ]+/g, ' ');
  n = n.replace(/\b(COUNTY|PARISH|BOROUGH)\b/g, ' ').replace(/\bSAINT\b/g, 'ST').replace(/\s+/g, ' ').trim();
  return n || null;
}

// The house number a listing's street line starts with, without leading
// zeros; null when it does not start with one (a PO box, a building name).
export function houseOf(address) {
  const m = /^\s*0*(\d+)/.exec(streetOnly(address));
  return m ? (m[1] === '' ? '0' : m[1]) : null;
}

// A NAD row's street line: the full house number, then the street parts.
export function nadLine(c) {
  const num = [c.num_pre, c.num, c.num_suf].map(v => String(v || '').trim()).filter(Boolean).join('');
  const street = [c.pre_mod, c.pre_dir, c.pre_type, c.pre_sep, c.name, c.post_type, c.post_dir, c.post_mod]
    .map(v => String(v || '').trim()).filter(Boolean).join(' ');
  return num && street ? `${num} ${street}` : null;
}

export function metres(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lng - a.lng) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// row: {address, state, zip}; cands: NAD rows with the same ZIP and house
// number. Returns {status, lat, lng, placement, points}.
//   placed        one place (the middle of the matching points)
//   tie           matching points more than MAX_SPREAD_M apart
//   no_street     points at this number and ZIP, but on another street
//   no_candidates nothing at this number in this ZIP
export function matchOne(row, cands) {
  if (!cands || !cands.length) return { status: 'no_candidates' };
  const state = String(row.state || '').toUpperCase();
  const hits = cands.filter(c => {
    const line = nadLine(c);
    const lat = Number(c.lat), lng = Number(c.lng);
    return line && Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && censusNearExact(row.address, line, state);
  }).map(c => ({ lat: Number(c.lat), lng: Number(c.lng), placement: c.placement || '', county: c.county || '' }));
  if (!hits.length) return { status: 'no_street' };
  const mid = { lat: hits.reduce((a, h) => a + h.lat, 0) / hits.length, lng: hits.reduce((a, h) => a + h.lng, 0) / hits.length };
  if (hits.some(h => metres(h, mid) > MAX_SPREAD_M)) return { status: 'tie', points: hits.length };
  const placements = [...new Set(hits.map(h => h.placement).filter(Boolean))];
  // Points that disagree on their county give no county (never public).
  const counties = [...new Set(hits.map(h => countyKey(h.county)).filter(Boolean))];
  return { status: 'placed', lat: mid.lat, lng: mid.lng, placement: placements.join('; ') || 'unknown', points: hits.length, county: counties.length === 1 ? counties[0] : null };
}
