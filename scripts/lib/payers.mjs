// Pure logic for the insurance-plan proposal (scripts/build-payer-proposal.mjs).
// Column names are the ones recorded live by scripts/payer-sources-discover.mjs
// in supabase/reference/payer-sources/discovery.md (2026-10-11). No network.

export const STATE_CODES = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
  delaware: 'DE', 'district of columbia': 'DC', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL',
  indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT',
  nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'puerto rico': 'PR', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX',
  utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY'
};
const CODES = new Set(Object.values(STATE_CODES));
export const stateCode = s => {
  const t = String(s || '').trim();
  if (CODES.has(t.toUpperCase())) return t.toUpperCase();
  return STATE_CODES[t.toLowerCase()] || null;
};

export function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
export function objects(text) {
  const rows = parseCsv(text);
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
}

// A name a patient would recognise: drop corporate suffixes only. Never guess
// a brand from words in the name; the reviewed brand map does that.
const SUFFIX = /[,\s]+(inc\.?|incorporated|l\.?l\.?c\.?|corp\.?|corporation|co\.?|company|ltd\.?|limited|l\.?p\.?)$/i;
// Two mechanical rules, not guesses: "X dba Y" means the brand IS Y, and a
// "(formerly ...)" note is history, not the name.
export function cleanName(s) {
  let t = String(s || '').replace(/\s+/g, ' ').trim();
  const dba = t.match(/,?\s+d\/?b\/?a\.?\s+(.+)$/i);
  if (dba) t = dba[1].trim();
  t = t.replace(/\s*\(formerly[^)]*\)\s*/i, ' ').trim();
  for (let i = 0; i < 3; i++) t = t.replace(SUFFIX, '').trim();
  return t.replace(/[,\s]+$/, '');
}

// A filed marketing name that says nothing ("N/A") is no name.
export const realName = s => (/^(n\/?a|none|null|-)?$/i.test(String(s || '').trim()) ? '' : String(s).trim());

// Reviewed brand map: exact matches only, on the cleaned name the review sheet
// shows. match_type: company | company_state ("Company|ST", for one company
// branded differently per state) | dba | group | plan | parent. A brand of "-"
// leaves the entry out of the list (not a medical plan a patient names).
export const EXCLUDE = '-';
const key = (type, value) => type + '\u0000' + (type === 'group' || type === 'parent' ? String(value).trim() : cleanName(value)).toLowerCase();
export function parseBrandMap(text) {
  const map = new Map();
  for (const r of objects(text)) {
    const type = (r.match_type || '').trim(), match = (r.match || '').trim(), brand = (r.brand || '').trim();
    if (!type || !match) continue;
    if (!['group', 'company', 'company_state', 'dba', 'plan', 'parent'].includes(type)) throw new Error(`brand map: unknown match_type "${type}"`);
    if (!brand) throw new Error(`brand map: ${type} "${match}" has no brand`);
    if (type === 'company_state' && !/\|[A-Z]{2}$/.test(match)) throw new Error(`brand map: company_state "${match}" must end in |ST`);
    const k = key(type, match);
    if (map.has(k)) throw new Error(`brand map: ${type} "${match}" listed twice`);
    map.set(k, brand);
  }
  return map;
}
const lookup = (map, type, value) => (value ? map.get(key(type, value)) : undefined);
const lookupCompanyState = (map, company, st) => (company ? map.get('company_state\u0000' + (cleanName(company) + '|' + st).toLowerCase()) : undefined);

// ---------------------------------------------------------------- MLR ------
// Pick the Part 1/2 row that counts covered lives, by its official label.
export function coveredLivesCode(rowLookup) {
  const hits = rowLookup.filter(r => /covered lives/i.test(r.lookup_name || '') && /PART[12]/.test(r.lookup_cat_code || ''));
  if (!hits.length) throw new Error('MLR: no row lookup labelled "covered lives"');
  return hits.map(r => r.lookup_code);
}
// One market's value: the year-end figure, else the total.
// Numbers may carry thousands separators ("72,966") or be blank.
const num = v => { if (v === '' || v == null) return null; const n = Number(String(v).replace(/[,\s]/g, '')); return isFinite(n) ? n : null; };
export function marketLives(row, market) {
  for (const col of [`cmm_${market}_yearly`, `cmm_${market}_total`]) { const n = num(row[col]); if (n !== null) return n; }
  return 0;
}

// headers: MR_Submission_Template_Header rows; lives: Part1_2 rows for the covered-lives code(s).
export function mlrInsurers(headers, lives, livesCodes, brandMap) {
  const byId = new Map(headers.map(h => [String(h.mr_submission_template_id), h]));
  const out = [];
  for (const r of lives) {
    if (!livesCodes.includes(r.row_lookup_code)) continue;
    const h = byId.get(String(r.mr_submission_template_id));
    if (!h) continue;
    const st = stateCode(h.business_state);
    if (!st) continue;                                   // "Grand Total" and unknown rows
    const m = { individual: marketLives(r, 'individual'), small_group: marketLives(r, 'small_group'), large_group: marketLives(r, 'large_group') };
    const members = Math.round(m.individual + m.small_group + m.large_group);
    const legal = cleanName(h.company_name), dba = cleanName(realName(h.dba_marketing_name));
    const mapped = lookupCompanyState(brandMap, h.company_name, st) || lookup(brandMap, 'company', h.company_name) ||
      (dba && lookup(brandMap, 'dba', dba)) || lookup(brandMap, 'group', h.group_affiliation);
    out.push({
      source: 'mlr', state: st, legal_name: legal, dba, group: (h.group_affiliation || '').trim(),
      members, markets: m, brand: mapped || dba || legal, brand_basis: mapped ? 'reviewed map' : dba ? 'marketing name (DBA)' : 'legal name',
      category: m.individual > 0 && m.small_group + m.large_group === 0 ? 'marketplace' : 'commercial'
    });
  }
  return out;
}

// --------------------------------------------------------------- Medicaid --
// Comprehensive managed care only: what a patient names as "my insurance".
// Dental, behavioral-only, transport and long-term-care-only programs are not.
export const isComprehensive = program => /comprehensive mco/i.test(program || '');

export function medicaidPlans(rows, brandMap) {
  const years = rows.map(r => Number(r.Year)).filter(isFinite);
  const year = Math.max(...years);
  const out = [];
  for (const r of rows) {
    if (Number(r.Year) !== year || !isComprehensive(r['Program Name'])) continue;
    const st = stateCode(r.State);
    if (!st) continue;
    const members = Math.round(num(r['Total Enrollment']) || 0);
    // California files one row per plan per county ("Inland Empire Health
    // Plan/Riverside"). The part after "/" is dropped only when it is that
    // row's own Geographic Region, so it is a county label, not a name.
    let rawPlan = String(r['Plan Name'] || '');
    const slash = rawPlan.lastIndexOf('/');
    if (slash > 0) {
      const tail = rawPlan.slice(slash + 1).trim().toLowerCase(), region = String(r['Geographic Region'] || '').toLowerCase();
      if (tail && region.includes(tail)) rawPlan = rawPlan.slice(0, slash);
    }
    const plan = cleanName(rawPlan), parent = (r['Parent Organization'] || '').trim();
    const mapped = lookup(brandMap, 'plan', r['Plan Name']) || lookup(brandMap, 'parent', parent);
    out.push({
      source: 'medicaid', state: st, legal_name: plan, dba: '', group: parent, program: (r['Program Name'] || '').trim(),
      members, markets: null, brand: mapped || plan, brand_basis: mapped ? 'reviewed map' : 'plan name', category: 'medicaid', year
    });
  }
  return out;
}

// One row per (state, brand): members summed, every source name kept. A brand
// sold in several markets in one state (UnitedHealthcare commercial and
// Medicaid) is ONE pick-list entry, because the table is unique on (name,
// state) and acceptance is matched by name; its categories are all kept and
// the primary one is commercial, then marketplace, then medicaid.
// Entries the reviewed map excludes ("-") come back separately.
export function rollUp(items, minMembers) {
  const by = new Map(), excluded = [];
  for (const it of items) {
    if (it.brand === EXCLUDE) { excluded.push(it); continue; }
    const k = [it.state, it.brand.toLowerCase()].join('\u0000');
    const cur = by.get(k) || { state: it.state, brand: it.brand, members: 0, categories: new Set(), sources: new Set(), names: new Set(), groups: new Set(), bases: new Set() };
    cur.members += it.members; cur.categories.add(it.category);
    cur.sources.add(it.source); cur.names.add(it.legal_name); if (it.group) cur.groups.add(it.group); cur.bases.add(it.brand_basis);
    by.set(k, cur);
  }
  const ORDER = ['commercial', 'marketplace', 'medicaid'];
  const all = [...by.values()].map(x => ({ ...x, category: ORDER.find(c => x.categories.has(c)), categories: ORDER.filter(c => x.categories.has(c)),
    sources: [...x.sources], names: [...x.names], groups: [...x.groups], bases: [...x.bases] }));
  return { kept: all.filter(x => x.members >= minMembers), dropped: all.filter(x => x.members < minMembers), excluded };
}
