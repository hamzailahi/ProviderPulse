// Enhanced two-step floating catchment area (E2SFCA) access, the user's
// choice (2026-11-17) from the scarcity literature they supplied:
//   Luo, W. & Qi, Y. (2009). An enhanced two-step floating catchment area
//     (E2SFCA) method for measuring spatial accessibility to primary care
//     physicians. Health & Place 15(4), 1100-1107.
//   Dai, D. (2010). Black residential segregation, disparities in spatial
//     access to health care facilities, and late-stage breast cancer
//     diagnosis in metropolitan Detroit. Health & Place 16(5), 1038-1052
//     (the Gaussian weight used here).
//   Wang, F. (2012). Measurement, optimization, and impact of health care
//     accessibility: a methodological review. Annals of the AAG 102(5).
//
// Step 1, per supply location j: R_j = S_j / sum_k P_k G(d_kj)
// Step 2, per population location i: A_i = sum_j R_j G(d_ij)
// G(d) = (exp(-0.5 (d/d0)^2) - exp(-0.5)) / (1 - exp(-0.5)) for d <= d0, else 0
// (1 at d = 0, 0 at the catchment edge d0, a smooth decline between).
//
// Supply and demand are both placed at ZIP (ZCTA) centres: supply is the
// specialty's listings grouped by their ZIP, demand is the ZIP's adults.
// d is drive time in minutes. A_i is clinicians per adult; x1000 gives the
// same "per 1,000 adults" unit as the current model's crude ratio, so the
// same access mapping (100 - per1k / national * 50) applies.

// Catchment edge d0 in drive minutes, per scored specialty. Reviewable
// assumptions, not data: everyday and frequent care is sought close to home,
// specialist and rare care farther (Luo & Qi used 30 minutes for primary
// care; the literature's specialist and oncology catchments run 60 to 120).
export const DEFAULT_MINUTES = 60;
export const CATCHMENT_MINUTES = {
  'Primary care / family doctor': 30,
  'Pediatrics (children)': 30,
  'Dental': 30,
  'Pharmacy': 30,
  'Urgent care & emergency': 30,
  'Mental health & counseling': 30,
  'Chiropractic': 30,
  'Physical & occupational therapy': 30,
  'Eye care': 30,
  'Home health & in-home care': 30,
  'Behavior therapy (ABA)': 30,
  'Speech & language therapy': 30,
  'Care coordination & community health': 30,
  'Nutrition & dietitian': 30,
  'Acupuncture, massage & naturopathy': 30,
  'Kidney / nephrology': 60,          // dialysis is frequent, but nephrologists are few
  'Cancer care / oncology': 90,
  'Genetics & genetic counseling': 90,
  'Infectious disease': 90,
  'Plastic & reconstructive surgery': 90
};
export const catchmentFor = label => CATCHMENT_MINUTES[label] || DEFAULT_MINUTES;

export function gaussian(d, d0) {
  if (typeof d !== 'number' || !Number.isFinite(d) || d < 0 || !(d0 > 0) || d > d0) return 0;
  const e = Math.exp(-0.5);
  return (Math.exp(-0.5 * (d / d0) ** 2) - e) / (1 - e);
}

/**
 * zips: [{zip, adults}] (demand points, also the only supply points)
 * supply: Map zip -> count of the specialty's listings there
 * minutes(a, b): drive minutes from ZIP a to ZIP b, or null when unroutable
 *   (or unknown; never treated as near)
 * d0: catchment edge in minutes
 * Returns Map zip -> access (listings per adult; null when the ZIP has no
 * routable neighbours at all, which is unknown, not zero).
 */
export function e2sfca(zips, supply, minutes, d0) {
  const ratio = new Map();
  for (const j of zips) {
    const s = supply.get(j.zip) || 0;
    if (!s) continue;
    let demand = 0;
    for (const k of zips) {
      const t = minutes(k.zip, j.zip);
      if (t == null) continue;
      demand += (k.adults || 0) * gaussian(t, d0);
    }
    ratio.set(j.zip, demand > 0 ? s / demand : null);
  }
  const out = new Map();
  for (const i of zips) {
    let a = 0, reachable = false;
    for (const [jz, r] of ratio) {
      const t = minutes(i.zip, jz);
      if (t == null) continue;
      reachable = true;
      if (r != null) a += r * gaussian(t, d0);
    }
    // Reaching no supply ZIP at all (no road link to any) is unknown.
    out.set(i.zip, reachable || !ratio.size ? a : null);
  }
  return out;
}

// The current model's access, approximated for comparison: listings per adult
// in every ZIP whose centre is within 10 straight-line miles (at least the 10
// nearest out to 25 miles, at most 60 ZIPs). Same units as e2sfca().
export function crudeRatio(zips, supply, miles) {
  const out = new Map();
  for (const i of zips) {
    const near = zips.map(k => ({ k, m: miles(i.zip, k.zip) })).filter(x => x.m != null).sort((a, b) => a.m - b.m);
    let pick = near.filter(x => x.m <= 10);
    if (pick.length < 10) pick = near.filter(x => x.m <= 25).slice(0, 10);
    pick = pick.slice(0, 60);
    let s = 0, p = 0;
    for (const x of pick) { s += supply.get(x.k.zip) || 0; p += x.k.adults || 0; }
    out.set(i.zip, p > 0 ? s / p : null);
  }
  return out;
}

// The current model's mapping from a per-1,000 rate to the 0-100 access factor.
export function accessFactor(per1k, nationalPer1k) {
  if (per1k == null || !(nationalPer1k > 0)) return null;
  if (per1k === 0) return 100;
  return Math.max(0, Math.min(100, Math.round(100 - (per1k / nationalPer1k) * 50)));
}

export function milesBetween(a, b) {
  const R = 3958.8, r = Math.PI / 180;
  const x = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// Spearman rank correlation, for the report.
export function spearman(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const rank = v => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]); const r = new Array(n);
    for (let i = 0; i < n;) { let j = i; while (j + 1 < n && o[j + 1][0] === o[i][0]) j++; const m = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[o[k][1]] = m; i = j + 1; } return r; };
  const a = rank(xs), b = rank(ys), ma = (n + 1) / 2;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - ma); da += (a[i] - ma) ** 2; db += (b[i] - ma) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : null;
}
