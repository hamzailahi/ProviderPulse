'use strict';
// lib/area-profile.js: the market assistant's get_area_profile tool (2026-10-20).
//
// One call that reads every ZIP on the user's map: Census ACS demographics
// (people, households, income, poverty, age, insurance, education), the CDC
// PLACES health survey measures from the Health tab, and Medicare and Medicaid
// procedure totals from the Procedures tab. It returns area totals plus one
// line per ZIP, so an answer or a report can say which neighbor stands out.
//
// "The area" is what is on the map (the user's choice): the browser sends the
// loaded ZIPs in the <dashboard> block and this reads the newest one from the
// conversation, so continuation steps see it too. When the map holds fewer
// than MIN_ZIPS (a single-ZIP search), the nearest ZIPs by centre are added
// until there are MIN_ZIPS, and the result says which were added. Public,
// aggregate tables only, through the publishable key. A failed request is
// reported as incomplete, never read as zero.

const { getProcedures } = require('./procedures.js');

const GEO_MEASURE = 'DENTAL';
const MIN_ZIPS = 8;          // the ZIP plus at least 7 around it
const MAX_ZIPS = 40;
const KEY_MEASURES = ['DIABETES', 'OBESITY', 'BPHIGH', 'DEPRESSION', 'CHD', 'COPD'];
const BUDGET_MS = 13000;     // stop starting requests after this

const isZip = z => typeof z === 'string' && /^\d{5}$/.test(z);
const milesBetween = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};
const N = v => Number(v) || 0;
const r1 = v => (v == null || !isFinite(v) ? null : Math.round(v * 10) / 10);
const pct = (a, b) => (b > 0 ? r1(a / b * 100) : null);

// The newest <dashboard> block's area_zips line, written by contextBlock().
function mapZips(messages) {
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== 'user' || !Array.isArray(m.content)) continue;
    for (const b of m.content) {
      if (!b || b.type !== 'text' || typeof b.text !== 'string' || !b.text.startsWith('<dashboard>')) continue;
      const line = b.text.split('\n').find(l => l.startsWith('area_zips:'));
      if (!line) return [];
      return [...new Set((line.slice(10).match(/\b\d{5}\b/g) || []))];
    }
  }
  return [];
}

async function getAreaProfile(input, opts) {
  const o = opts || {};
  const doFetch = o.fetch || fetch, env = o.env || process.env;
  const started = Date.now();
  const zip = input && input.zip;
  if (!isZip(zip)) return { error: 'zip must be 5 digits' };
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return { error: 'Database is not configured' };
  const useMap = input.area !== 'nearest';

  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: 'application/json' };
  let failed = 0, outOfTime = false;
  const get = async (path, ms) => {
    if (Date.now() - started > BUDGET_MS) { outOfTime = true; return null; }
    try {
      const r = await doFetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(ms || 7000) });
      if (!r.ok) { failed++; return null; }
      const b = await r.json();
      if (!Array.isArray(b)) { failed++; return null; }
      return b;
    } catch (e) { failed++; return null; }
  };
  const pagedAll = async (path, maxPages) => {
    const out = [];
    for (let p = 0; p < (maxPages || 5); p++) {
      const rows = await get(`${path}&limit=1000&offset=${p * 1000}`);
      if (!rows) return { rows: out, ok: false };
      out.push(...rows);
      if (rows.length < 1000) return { rows: out, ok: true };
    }
    return { rows: out, ok: true, capped: true };
  };

  // ---- which ZIPs
  let onMap = useMap ? mapZips(o.messages) : [];
  const notes = [];
  // A ZIP that is not on the map (a report about somewhere else) gets its
  // own neighbors, not the map's.
  if (onMap.length && !onMap.includes(zip)) { notes.push(`${zip} is not on the map, so its nearest ZIPs were used instead.`); onMap = []; }
  const home = await get(`cdc_places?zip=eq.${zip}&measureid=eq.${GEO_MEASURE}&select=zip,lat,lon&limit=1`, 5000);
  const centre = home && home[0] && home[0].lat != null ? { lat: +home[0].lat, lon: +home[0].lon } : null;
  let zips = [...new Set([zip].concat(onMap))];
  let dist = {};
  if (centre) {
    // Distances for ordering and the per-ZIP lines; top up to MIN_ZIPS from
    // the nearest ZCTAs when the map holds fewer.
    const listed = zips.length > 1 ? await get(`cdc_places?measureid=eq.${GEO_MEASURE}&zip=in.(${zips.slice(0, 300).join(',')})&select=zip,lat,lon&limit=1000`, 6000) : [];
    (listed || []).forEach(r => { dist[r.zip] = milesBetween(centre.lat, centre.lon, +r.lat, +r.lon); });
    dist[zip] = 0;
    if (zips.length < MIN_ZIPS) {
      for (const radius of [5, 10, 20, 40]) {
        const dLat = radius / 69, dLon = radius / Math.max(1, 69 * Math.cos(centre.lat * Math.PI / 180));
        const box = await get(`cdc_places?measureid=eq.${GEO_MEASURE}&lat=gte.${(centre.lat - dLat).toFixed(4)}&lat=lte.${(centre.lat + dLat).toFixed(4)}` +
          `&lon=gte.${(centre.lon - dLon).toFixed(4)}&lon=lte.${(centre.lon + dLon).toFixed(4)}&select=zip,lat,lon&limit=1000`, 6000);
        const near = (box || []).map(r => ({ zip: r.zip, mi: milesBetween(centre.lat, centre.lon, +r.lat, +r.lon) })).sort((a, b) => a.mi - b.mi);
        if (near.length >= MIN_ZIPS || radius === 40) {
          const added = [];
          for (const n of near) { if (zips.length >= MIN_ZIPS) break; if (!zips.includes(n.zip)) { zips.push(n.zip); dist[n.zip] = n.mi; added.push(n.zip); } }
          if (added.length) notes.push(`${useMap ? 'The map held ' + (onMap.length || 1) + ' ZIP' + ((onMap.length || 1) === 1 ? '' : 's') + ', so' : 'For "nearest",'} the ${added.length} nearest ZIPs by centre were added: ${added.join(', ')}.`);
          break;
        }
      }
    }
    zips.sort((a, b) => (dist[a] ?? 999) - (dist[b] ?? 999));
  } else notes.push('No location data for ' + zip + ', so nearby ZIPs could not be added and distances are unknown.');
  if (zips.length > MAX_ZIPS) { notes.push(`The map holds ${zips.length} ZIPs; this covers the ${MAX_ZIPS} nearest to ${zip}.`); zips = zips.slice(0, MAX_ZIPS); }
  const list = zips.join(',');

  // ---- the three reads, in parallel. Procedures take one CMS specialty name
  // (as get_procedures does); with none, a busy area's all-specialty Medicare
  // rows are capped and its totals become floors.
  const specialty = typeof input.specialty === 'string' && input.specialty.trim() ? input.specialty.trim().slice(0, 80) : null;
  const procOpts = { fetch: doFetch, env, zips: zips.slice(0, 30), budgetMs: Math.max(1000, BUDGET_MS - (Date.now() - started)) };
  const [acs, places, med, mcd] = await Promise.all([
    pagedAll(`census_acs_zcta?zip=in.(${list})&select=zip,acs_year,pop_total,households,median_hh_income,poverty_universe,poverty_below,income_bands,age_male,age_female,education,ins_universe,ins_uninsured,ins_medicare,ins_medicaid,pop_prior,pop_prior_year,signals&order=zip`, 1),
    pagedAll(`cdc_places?zip=in.(${list})&select=zip,measureid,short_text,measure,categoryid,value,pop_18plus,data_year&order=zip,measureid,data_year`, 5),
    getProcedures({ zip, source: 'medicare_clinicians', specialty, query: null, radius_miles: 0 }, procOpts),
    getProcedures({ zip, source: 'medicaid', specialty, query: null, radius_miles: 0 }, procOpts)
  ]);

  // ---- demographics
  const rows = acs.rows || [];
  const sum = k => rows.reduce((a, r) => a + N(r[k]), 0);
  const band = (r, key, from, to) => (Array.isArray(r[key]) ? r[key].slice(from, to + 1).reduce((a, v) => a + N(v), 0) : 0);
  const pop = sum('pop_total'), hh = sum('households');
  const hhInc = rows.filter(r => r.median_hh_income != null && N(r.households) > 0);
  const hhW = hhInc.reduce((a, r) => a + N(r.households), 0);
  const allIns = rows.length && rows.every(r => r.ins_universe != null && r.ins_uninsured != null);
  const insU = allIns ? sum('ins_universe') : 0;
  const age65 = rows.reduce((a, r) => a + band(r, 'age_male', 13, 17) + band(r, 'age_female', 13, 17), 0);
  const under20 = rows.reduce((a, r) => a + band(r, 'age_male', 0, 3) + band(r, 'age_female', 0, 3), 0);
  const inc100 = rows.reduce((a, r) => a + band(r, 'income_bands', 12, 15), 0);
  const inc200 = rows.reduce((a, r) => a + band(r, 'income_bands', 15, 15), 0);
  const eduU = rows.reduce((a, r) => a + N(r.education && r.education.universe), 0);
  const bach = rows.reduce((a, r) => a + N(r.education && r.education.bachelor) + N(r.education && r.education.graduate), 0);
  const signal = k => (rows.length && rows.every(r => r.signals && r.signals[k] && r.signals[k].of > 0)
    ? { people: rows.reduce((a, r) => a + N(r.signals[k].n), 0), of: rows.reduce((a, r) => a + N(r.signals[k].of), 0) } : null);
  const withSig = (s) => (s ? { people: s.people, share_pct: pct(s.people, s.of) } : null);
  const grown = rows.length && rows.every(r => r.pop_prior != null && r.pop_total != null) ? { from_year: rows[0].pop_prior_year, then: sum('pop_prior'), now: pop } : null;
  const demographics = rows.length ? {
    source: `Census ACS 5-year (${rows[0].acs_year})`, zips_with_data: rows.length,
    population: pop, households: hh,
    median_household_income: hhW ? Math.round(hhInc.reduce((a, r) => a + N(r.median_hh_income) * N(r.households), 0) / hhW) : null,
    median_income_note: rows.length > 1 ? 'household-weighted average of ZIP medians, not a true median' : undefined,
    below_poverty: { people: sum('poverty_below'), share_pct: pct(sum('poverty_below'), sum('poverty_universe')) },
    households_100k_plus: { households: inc100, share_pct: pct(inc100, hh) },
    households_200k_plus: { households: inc200, share_pct: pct(inc200, hh) },
    age_65_plus: { people: age65, share_pct: pct(age65, pop) },
    under_20: { people: under20, share_pct: pct(under20, pop) },
    insurance: allIns ? {
      uninsured: { people: sum('ins_uninsured'), share_pct: pct(sum('ins_uninsured'), insU) },
      medicare: rows.every(r => r.ins_medicare != null) ? { people: sum('ins_medicare'), share_pct: pct(sum('ins_medicare'), insU) } : null,
      medicaid: rows.every(r => r.ins_medicaid != null) ? { people: sum('ins_medicaid'), share_pct: pct(sum('ins_medicaid'), insU) } : null,
      note: 'Civilian non-institutionalized population. Medicare and Medicaid overlap; do not add them.'
    } : null,
    bachelors_or_higher: { adults_25_plus: bach, share_pct: pct(bach, eduU) },
    disability: withSig(signal('disability')), employer_insurance: withSig(signal('employer')), seniors_living_alone: withSig(signal('seniors_alone')),
    population_change: grown && grown.then > 0 && Math.abs((grown.now - grown.then) / grown.then) <= 0.5
      ? { since: grown.from_year, people: grown.now - grown.then, pct: pct(grown.now - grown.then, grown.then) } : null
  } : null;
  if (!rows.length) notes.push(acs.ok ? 'No Census ACS rows for these ZIPs.' : 'The Census table did not answer; demographics are missing.');

  // ---- health survey (CDC PLACES)
  const prow = places.rows || [];
  const meas = {};
  for (const r of prow) {
    if (r.value == null || r.pop_18plus == null) continue;
    const m = meas[r.measureid] || (meas[r.measureid] = { id: r.measureid, name: r.short_text || r.measure || r.measureid, category: r.categoryid || null, year: r.data_year || null, w: 0, adults: 0, est: 0, zips: 0 });
    const a = N(r.pop_18plus);
    m.w += N(r.value) * a; m.adults += a; m.est += N(r.value) / 100 * a; m.zips++;
  }
  const measures = Object.values(meas).filter(m => m.adults > 0)
    .map(m => ({ id: m.id, measure: m.name, category: m.category, year: m.year, pct_of_adults: r1(m.w / m.adults), est_adults: Math.round(m.est), zips: m.zips }))
    .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.id.localeCompare(b.id));
  if (!prow.length) notes.push(places.ok ? 'No CDC PLACES rows for these ZIPs.' : 'The health survey table did not answer; health measures are missing.');
  const keyIds = (Array.isArray(o.keyMeasures) && o.keyMeasures.length ? o.keyMeasures : KEY_MEASURES).slice(0, 8);

  // ---- one line per ZIP
  const byZipAcs = {}; rows.forEach(r => { byZipAcs[r.zip] = r; });
  const byZipPlaces = {}; prow.forEach(r => { (byZipPlaces[r.zip] = byZipPlaces[r.zip] || {})[r.measureid] = r.value == null ? null : r1(N(r.value)); });
  const perZip = zips.map(z => {
    const a = byZipAcs[z], p = byZipPlaces[z] || {};
    const zpop = a ? N(a.pop_total) : null;
    const z65 = a ? band(a, 'age_male', 13, 17) + band(a, 'age_female', 13, 17) : null;
    const out = { zip: z, miles: dist[z] == null ? null : r1(dist[z]), on_map: onMap.includes(z) || z === zip };
    if (a) Object.assign(out, {
      population: zpop, median_household_income: a.median_hh_income,
      uninsured: a.ins_uninsured, uninsured_pct: pct(N(a.ins_uninsured), N(a.ins_universe)),
      age_65_plus: z65, age_65_plus_pct: pct(z65, zpop), below_poverty_pct: pct(N(a.poverty_below), N(a.poverty_universe))
    });
    const hm = {}; keyIds.forEach(id => { if (p[id] != null) hm[id] = p[id]; });
    if (Object.keys(hm).length) out.health_pct_of_adults = hm;
    return out;
  });

  // ---- procedures (all specialties; get_procedures narrows to one)
  // Pages are ordered by specialty, so a capped all-specialty read holds the
  // first specialties alphabetically: its rankings would mislead (live,
  // 2026-10-20: radiology codes "led" Fort Worth). Keep only floor totals.
  const slim = (r, n) => {
    if (!r || r.error) return { error: (r && r.error) || 'did not answer' };
    const skewed = !specialty && r.incomplete && /capped/.test(r.incomplete_reason || '');
    return skewed
      ? { totals: r.totals, incomplete: true, incomplete_reason: r.incomplete_reason,
        note: 'Too many rows for every specialty at once, so only floor totals are given. Call again with a CMS specialty name, or get_procedures, for codes and per-ZIP figures.' }
      : { totals: r.totals, top_codes: (r.top_codes || []).slice(0, n), by_specialty: r.by_specialty, by_zip: r.by_zip, incomplete: r.incomplete, incomplete_reason: r.incomplete_reason };
  };
  const procedures = {
    specialty: specialty || 'all specialties',
    medicare_clinicians: slim(med, 8), medicaid: slim(mcd, 5),
    notes: ['Traditional Medicare 2024 (65+ and some disabled; codes under 11 patients left out; patients are summed across clinicians) and HHS Medicaid 2024 (provider-months under 12 patients withheld, so counts are floors).',
      'For more codes, a code or procedure words, or hospitals, call get_procedures with use_map_area true.'],
    zips_covered: Math.min(zips.length, 30)
  };
  if (zips.length > 30) notes.push(`Procedures cover the 30 nearest of these ${zips.length} ZIPs.`);

  const incomplete = failed > 0 || outOfTime || !!places.capped || !!(med && (med.incomplete || med.error)) || !!(mcd && (mcd.incomplete || mcd.error));
  return {
    area: { centre_zip: zip, zips: zips.length, from_map: useMap ? onMap.length : 0, zip_list: zips },
    demographics, health: { source: 'CDC PLACES, model-based estimates of adults (BRFSS)', measures, key_measures_per_zip: keyIds },
    procedures, per_zip: perZip,
    incomplete, incomplete_reason: incomplete ? 'Some requests failed, timed out or were capped, so some figures are floors.' : null,
    notes, ms: Date.now() - started
  };
}

module.exports = { getAreaProfile, mapZips, MIN_ZIPS, MAX_ZIPS };
