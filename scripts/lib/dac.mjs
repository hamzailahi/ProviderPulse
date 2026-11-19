// CMS Doctors and Clinicians file helpers (step 1 of the scoring upgrade).
export const MAX_SITES = 5;

export function splitCsv(line) {
  const cells = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { cells.push(cur); cur = ''; } else cur += ch;
  }
  cells.push(cur); return cells;
}

// Fold one file row into the per-NPI record.
export function addRow(map, col, r) {
  const g = (n) => { const i = col[n]; return i == null ? '' : String(r[i] || '').trim(); };
  const npi = g('npi');
  if (!/^\d{10}$/.test(npi)) return false;
  let rec = map.get(npi);
  if (!rec) map.set(npi, rec = { pac: g('ind_pac_id') || null, grad: null, tele: false, addrs: new Set(), orgs: new Set(), spec: g('pri_spec') || null });
  const y = Number(g('grd_yr'));
  if (Number.isInteger(y) && y >= 1930 && y <= new Date().getUTCFullYear()) rec.grad = rec.grad == null ? y : Math.min(rec.grad, y);
  if (g('telehlth').toUpperCase() === 'Y') rec.tele = true;
  const a = g('adrs_id') || (g('adr_ln_1').toUpperCase() + '|' + g('zip code').slice(0, 5));
  if (a && a !== '|' && rec.addrs.size < 50) rec.addrs.add(a);
  const o = g('org_pac_id'); if (o && rec.orgs.size < 50) rec.orgs.add(o);
  return true;
}

// Supply weight at the clinician's main (NPPES) address. The user's rule,
// 2026-11-19, revised the same day after the research brief (Badinski et al.
// 2023: a physician's main region carries over 80% of their Medicare work):
// one site counts 1; with more sites (the larger of the CMS file's count and
// NPPES's primary + secondary), the main site keeps MAIN_SHARE and the rest is
// spread over the extra sites, which market supply does not count.
export const MAIN_SHARE = 0.6;
export function siteWeight(dacSites, nppesSites) {
  const s = Math.min(MAX_SITES, Math.max(1, dacSites || 0, nppesSites || 0));
  return s > 1 ? MAIN_SHARE : 1;
}
