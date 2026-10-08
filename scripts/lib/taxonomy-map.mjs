// The NUCC taxonomy map: one entry per official NUCC code, built from the
// published CSV (supabase/reference/nucc_taxonomy.csv) and nothing else.
//
// Why: taxonomy-groups.js used to sort listings into six homegrown groups with
// ordered keyword rules and a default bucket, which put Behavior Technicians,
// pharmacists and nurses under "Specialty Medicine". Classification now comes
// from the code's own NUCC Grouping, read from the file, so a new NUCC release
// flows through without code changes. There is deliberately no default: a code
// missing from the map is an error, never a guess.
//
// Pure functions, no I/O, so scripts/test-taxonomy-map.mjs can cover them.

/** Small synchronous RFC-4180 parser for files that fit in memory. */
export function parseCsv(text) {
  const rows = [];
  let row = [], f = '', q = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f.length || row.length) { row.push(f.replace(/\r$/, '')); rows.push(row); }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

function headerIndex(header, wanted, label) {
  const norm = header.map(h => h.trim().toLowerCase());
  const out = {};
  for (const [key, names] of Object.entries(wanted)) {
    const i = norm.findIndex(h => names.some(n => n instanceof RegExp ? n.test(h) : h === n));
    if (i < 0) throw new Error(`${label}: no column for "${key}". Header was: ${header.join(' | ')}`);
    out[key] = i;
  }
  return out;
}

const CODE_RE = /^[0-9A-Z]{9}X$/;

/** NUCC CSV text -> [{code, grouping, classification, specialization, display_name, section}]. */
export function parseNucc(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('NUCC: file is empty');
  const ix = headerIndex(rows[0], {
    code: ['code'], grouping: ['grouping'], classification: ['classification'],
    specialization: ['specialization'], display_name: ['display name'], section: ['section'],
  }, 'NUCC');
  const out = [];
  const seen = new Set();
  for (const r of rows.slice(1)) {
    const code = (r[ix.code] || '').trim();
    if (!code) continue;
    if (!CODE_RE.test(code)) throw new Error(`NUCC: malformed code "${code}"`);
    if (seen.has(code)) throw new Error(`NUCC: duplicate code ${code}`);
    seen.add(code);
    const get = k => (r[ix[k]] || '').trim();
    const section = get('section');
    if (section !== 'Individual' && section !== 'Non-Individual') {
      throw new Error(`NUCC: code ${code} has section "${section}", expected Individual or Non-Individual`);
    }
    if (!get('grouping')) throw new Error(`NUCC: code ${code} has no grouping`);
    out.push({
      code, grouping: get('grouping'), classification: get('classification'),
      specialization: get('specialization'), display_name: get('display_name'), section,
    });
  }
  if (out.length < 500) throw new Error(`NUCC: only ${out.length} codes; expected about 880`);
  return out;
}

/**
 * CMS Medicare Provider and Supplier Taxonomy Crosswalk -> Map(code -> {codes, names}).
 * One taxonomy can map to several Medicare specialties; all are kept, in file order.
 */
export function parseCmsCrosswalk(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CMS crosswalk: file is empty');
  const ix = headerIndex(rows[0], {
    spec_code: [/specialty code/],
    spec_name: [/provider\/supplier type description/, /supplier type description/, /specialty description/],
    taxonomy: [/^provider taxonomy code$/, /taxonomy code/],
  }, 'CMS crosswalk');
  const map = new Map();
  for (const r of rows.slice(1)) {
    const code = (r[ix.taxonomy] || '').trim().toUpperCase();
    if (!CODE_RE.test(code)) continue;
    const sc = (r[ix.spec_code] || '').trim();
    const sn = (r[ix.spec_name] || '').trim();
    if (!sc && !sn) continue;
    const e = map.get(code) || { codes: [], names: [] };
    if (sc && !e.codes.includes(sc)) e.codes.push(sc);
    if (sn && !e.names.includes(sn)) e.names.push(sn);
    map.set(code, e);
  }
  return map;
}

/**
 * Reviewed per-code decisions: supabase/reference/taxonomy-overrides.csv with
 * columns nucc_code, show_on_map (true/false/blank), patient_specialties
 * ("A; B", blank = none yet), note. Unknown codes are an error, so a typo can't
 * silently do nothing.
 */
export function parseOverrides(text, knownCodes) {
  const rows = parseCsv(text);
  const ix = headerIndex(rows[0], {
    code: ['nucc_code'], show: ['show_on_map'], specialties: ['patient_specialties'],
  }, 'taxonomy overrides');
  const map = new Map();
  for (const r of rows.slice(1)) {
    const code = (r[ix.code] || '').trim();
    if (!code) continue;
    if (!knownCodes.has(code)) throw new Error(`taxonomy overrides: ${code} is not a NUCC code in this release`);
    if (map.has(code)) throw new Error(`taxonomy overrides: ${code} is listed twice`);
    const show = (r[ix.show] || '').trim().toLowerCase();
    if (show && show !== 'true' && show !== 'false') throw new Error(`taxonomy overrides: ${code} show_on_map must be true or false, got "${show}"`);
    const specs = (r[ix.specialties] || '').split(';').map(s => s.trim()).filter(Boolean);
    map.set(code, { show: show ? show === 'true' : null, specialties: specs });
  }
  return map;
}

/** Everything is visible unless an override says otherwise. */
export function buildMap(nucc, cms, overrides) {
  return nucc.map(n => {
    const c = cms && cms.get(n.code);
    const o = overrides && overrides.get(n.code);
    return {
      nucc_code: n.code,
      grouping: n.grouping,
      classification: n.classification,
      specialization: n.specialization,
      display_name: n.display_name,
      section: n.section,
      cms_specialty_code: c ? c.codes.join('; ') : '',
      cms_specialty_name: c ? c.names.join('; ') : '',
      patient_specialties: o ? o.specialties : [],
      show_on_map: o && o.show !== null ? o.show : true,
    };
  });
}

/** Groupings in file order, each with its section. A grouping used in both sections appears once per section. */
export function groupingsOf(nucc) {
  const out = [];
  const seen = new Set();
  for (const n of nucc) {
    const k = n.section + '\u0000' + n.grouping;
    if (!seen.has(k)) { seen.add(k); out.push({ grouping: n.grouping, section: n.section }); }
  }
  return out;
}

function csvCell(v) {
  const s = Array.isArray(v) ? v.join('; ') : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export const MAP_COLUMNS = ['nucc_code', 'grouping', 'classification', 'specialization', 'display_name',
  'section', 'cms_specialty_code', 'cms_specialty_name', 'patient_specialties', 'show_on_map'];

/** The CSV loaded into the taxonomy_map table. */
export function renderMapCsv(entries) {
  const lines = [MAP_COLUMNS.join(',')];
  for (const e of entries) lines.push(MAP_COLUMNS.map(k => csvCell(e[k])).join(','));
  return lines.join('\n') + '\n';
}

/**
 * The browser/Node module v2/assets/taxonomy-map.js. Compact: codes index into
 * a groupings array. It is generated; edit the CSVs and rebuild, never by hand.
 */
export function renderMapJs(entries, version) {
  const groupings = [];
  const gIndex = new Map();
  for (const e of entries) {
    const k = e.section + '\u0000' + e.grouping;
    if (!gIndex.has(k)) { gIndex.set(k, groupings.length); groupings.push([e.grouping, e.section === 'Individual' ? 1 : 0]); }
  }
  const codes = {};
  for (const e of entries) {
    codes[e.nucc_code] = [gIndex.get(e.section + '\u0000' + e.grouping), e.classification, e.specialization,
      e.display_name, e.show_on_map ? 1 : 0, e.patient_specialties];
  }
  const data = JSON.stringify({ version, groupings, codes });
  return `/* GENERATED by scripts/build-taxonomy-map.mjs from ${version}. Do not edit by hand:
   change supabase/reference/*.csv and run \`node scripts/build-taxonomy-map.mjs\`.

   NUCC code -> official Grouping / Classification / Specialization, map
   visibility and patient specialties. There is no default: an unknown code
   logs an error and returns null, and groupingOf() throws. Dual-exported:
   window.TaxonomyMap in the browser, module.exports under Node. */
(function (global) {
  'use strict';
  var DATA = ${data};
  var reported = {};
  function report(code) {
    if (reported[code]) return;
    reported[code] = true;
    if (typeof console !== 'undefined') console.error('[taxonomy-map] unknown NUCC code: ' + code + ' (not in ' + DATA.version + ')');
  }
  function get(code) {
    var c = DATA.codes[code];
    if (!c) { report(code); return null; }
    var g = DATA.groupings[c[0]];
    return { code: code, grouping: g[0], individual: g[1] === 1, classification: c[1],
      specialization: c[2], displayName: c[3], showOnMap: c[4] === 1, patientSpecialties: c[5] };
  }
  var API = {
    version: DATA.version,
    groupings: DATA.groupings.map(function (g) { return { grouping: g[0], individual: g[1] === 1 }; }),
    has: function (code) { return Object.prototype.hasOwnProperty.call(DATA.codes, code); },
    get: get,
    groupingOf: function (code) {
      var e = get(code);
      if (!e) throw new Error('Unknown NUCC taxonomy code: ' + code);
      return e.grouping;
    },
    codes: function () { return Object.keys(DATA.codes); }
  };
  if (global) global.TaxonomyMap = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
`;
}

/**
 * Pick one NPI's taxonomy from its NPPES slots (Healthcare Provider Taxonomy
 * Code_1..15 and Primary Taxonomy Switch_1..15). The slot flagged Y wins; with
 * no flag, the first listed code is used and reported as 'nppes_first' so it
 * can be logged. Returns null when the NPI lists no taxonomy at all.
 */
export function pickNppesTaxonomy(codes, switches) {
  let first = null;
  for (let i = 0; i < codes.length; i++) {
    const c = String(codes[i] || '').trim().toUpperCase();
    if (!c) continue;
    if (String(switches[i] || '').trim().toUpperCase() === 'Y') return { code: c, source: 'nppes_primary' };
    if (first === null) first = c;
  }
  return first ? { code: first, source: 'nppes_first' } : null;
}

/** Exact, case-insensitive display-name lookup. Names shared by two codes are ambiguous and resolve to nothing. */
export function displayNameIndex(nucc) {
  const m = new Map();
  for (const n of nucc) {
    const k = n.display_name.trim().toLowerCase();
    if (!k) continue;
    m.set(k, m.has(k) ? null : n.code);
  }
  return m;
}

/**
 * The fallback for an NPI NPPES does not have (deactivated, or missing from the
 * file): an exact display-name match only. Never fuzzy, never keywords.
 * Returns {code, source} or {code: null, reason}.
 */
export function resolveByName(name, index) {
  const k = String(name || '').trim().toLowerCase();
  if (!k) return { code: null, reason: 'not in NPPES; no stored taxonomy name' };
  if (!index.has(k)) return { code: null, reason: 'not in NPPES; stored name is not a NUCC display name' };
  const code = index.get(k);
  if (!code) return { code: null, reason: 'not in NPPES; stored name matches more than one NUCC code' };
  return { code, source: 'display_name' };
}
