// Market concentration (step 7 of the research plan, 2026-11-20).
// HHI = sum of squared percentage shares (0 to 10,000). DOJ/FTC 2023 bands:
// under 1,000 unconcentrated, 1,000 to 1,800 moderately, over 1,800 highly.
export function hhi(counts) {
  let n = 0; for (const v of counts.values()) n += v;
  if (!n) return null;
  let h = 0; for (const v of counts.values()) h += (100 * v / n) ** 2;
  return Math.round(h);
}
export function band(h) { return h == null ? 'n/a' : h < 1000 ? 'unconcentrated' : h <= 1800 ? 'moderate' : 'high'; }
// The value seen most often (ties: smallest, so runs repeat); null for none.
export function mode(list) {
  const c = new Map(); for (const x of list) if (x) c.set(x, (c.get(x) || 0) + 1);
  let best = null, bn = 0;
  for (const [k, v] of [...c].sort()) if (v > bn) { best = k; bn = v; }
  return best;
}
// A clinician's firm: the system of their hospitals when any is in one,
// else their Medicare group, else themselves (a solo practice is its own firm).
export function firmOf(c, sysOfCcn) {
  const sys = mode((c.ccns || []).map(x => sysOfCcn.get(x)));
  return { group: c.group ? 'G' + c.group : 'N' + c.npi, system: sys ? 'S' + sys : (c.group ? 'G' + c.group : 'N' + c.npi) };
}
export function top(counts, k = 3) {
  let n = 0; for (const v of counts.values()) n += v;
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, k).map(([id, v]) => ({ id, share: n ? v / n : 0 }));
}
