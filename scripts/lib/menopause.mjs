// Menopause care demand (2026-11-22, the user's ask). No NUCC code marks
// menopause care, so supply is the codes that do it as a core part of the
// work (CORE: gynecology and women's health), with a BROAD reading that adds
// the generalists who also treat it. Demand is women aged 45 to 59.
export const CORE = ['207V00000X', '207VG0400X', '207VE0102X', '363LX0001X', '363LW0102X', '364SW0102X'];
export const BROAD = ['207Q00000X', '207R00000X', '363LF0000X', '363LA2200X'];
// census_acs_zcta.age_female bands: index 9 = 45-49, 10 = 50-54, 11 = 55-59.
export const BANDS = [9, 10, 11];
export const womenInAge = bands => {
  if (!Array.isArray(bands)) return null;
  let t = 0;
  for (const i of BANDS) { const v = bands[i]; if (v == null || !Number.isFinite(+v)) return null; t += +v; }
  return t;
};
export const miles = (a, b) => {
  const R = 3958.8, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
// Women aged 45 to 59 within `radius` miles per clinician within the same
// radius; null when the area has no women counted, Infinity when no clinician.
export function perClinician(zip, zips, women, supply, radius = 10) {
  const c = zips.get(zip); if (!c) return null;
  let w = 0, s = 0, known = false;
  for (const [z, p] of zips) {
    if (miles(c, p) > radius) continue;
    const v = women.get(z); if (v != null) { w += v; known = true; }
    s += supply.get(z) || 0;
  }
  if (!known || w <= 0) return null;
  return { women: w, clinicians: s, ratio: s ? w / s : Infinity };
}
