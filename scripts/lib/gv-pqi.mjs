// Avoidable admission rates (CMS Prevention Quality Indicators) from the
// Medicare Geographic Variation file, county rows (2026-11-19). The columns of
// cms_county_utilization were made for this file (three age bands per
// condition) but never filled. Columns are found by name: PQI<nn>_<words>_AGE_<band>.
export const CONDITIONS = [
  ['chf', /CHF|HRT_FAIL/], ['diabetes', /DBTS|DIAB/], ['copd', /COPD/],
  ['htn', /HYPRTNSN|HTN|HYPERTEN/], ['pneumonia', /PNA|PNEU/], ['uti', /UTI|URIN/],
  ['amputation', /AMPUT|AMPTN|LWRXTRMTY/]
];
export const BANDS = [['lt65', /LT_?65|_U65|UNDER_?65/], ['65_74', /65_74/], ['75plus', /GE_?75|75_?PLUS|OVER_?74|_75\b/]];
export const COLUMNS = CONDITIONS.flatMap(([c]) => BANDS.map(([b]) => `${c}_admits_${b}`));

/** Map header names to table columns; returns {map: {column: index}, missing, unused}. */
export function mapHeader(header) {
  const map = {}, unused = [];
  header.forEach((h, i) => {
    const H = String(h).toUpperCase();
    if (!/^PQI/.test(H)) return;
    const c = CONDITIONS.find(([, re]) => re.test(H)), b = BANDS.find(([, re]) => re.test(H));
    if (!c || !b) { unused.push(h); return; }
    const col = `${c[0]}_admits_${b[0]}`;
    if (col in map) { unused.push(h); return; }
    map[col] = i;
  });
  return { map, missing: COLUMNS.filter(c => !(c in map)), unused };
}

export const num = v => { const s = String(v ?? '').trim().replace(/,/g, ''); if (!s || s === '*' || /^na$/i.test(s)) return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
