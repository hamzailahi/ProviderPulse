// Pure helpers for the SAHIE import (scripts/import-sahie.mjs).
//
// SAHIE (Small Area Health Insurance Estimates) is the Census Bureau's
// model-based estimate of health insurance coverage by county. It blends the
// ACS with administrative records, so for small counties it is steadier than
// the ACS alone. The default slice (all incomes, all races, both sexes) covers
// people UNDER 65, because nearly everyone 65+ has Medicare; it is therefore an
// under-65 uninsured rate and must be labelled that way wherever it is shown.

export const SAHIE_VARS = ['NAME', 'NIPR_PT', 'NUI_PT', 'PCTUI_PT', 'PCTUI_MOE'];

// Census suppression sentinels and blanks are unknown, never 0.
export function val(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// data: the Census API's array-of-arrays reply. Returns rows keyed by 5-digit FIPS.
export function toRows(data, year) {
  if (!Array.isArray(data) || data.length < 2) return [];
  const head = data[0].map(String);
  const at = name => head.indexOf(name);
  for (const k of SAHIE_VARS.concat(['state', 'county'])) if (at(k) === -1) throw new Error(`SAHIE reply is missing column ${k}`);
  const out = [];
  for (const r of data.slice(1)) {
    const st = String(r[at('state')] || '').padStart(2, '0'), co = String(r[at('county')] || '').padStart(3, '0');
    if (!/^\d{2}$/.test(st) || !/^\d{3}$/.test(co) || co === '000') continue;
    const pct = val(r[at('PCTUI_PT')]);
    out.push({
      fips: st + co,
      county: String(r[at('NAME')] || '').trim() || null,
      year: Number(year),
      under65: val(r[at('NIPR_PT')]),
      uninsured: val(r[at('NUI_PT')]),
      uninsured_pct: pct !== null && pct <= 100 ? pct : null,
      uninsured_pct_moe: val(r[at('PCTUI_MOE')]),
      refreshed_at: new Date().toISOString()
    });
  }
  return out;
}
