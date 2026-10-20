// Tests for v2/netlify/functions/lib/area-profile.js, the market assistant's
// get_area_profile tool, against a fake Supabase: the area is the ZIPs on the
// user's map (read from the newest <dashboard> block), topped up to 8 with the
// nearest when the map holds fewer; demographics add up as counts; health
// measures are weighted by adults; procedures come back per ZIP; and a failed
// request is reported as incomplete, never as zero. Also covers get_procedures'
// explicit map area.
//
// node scripts/test-area-profile.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { getAreaProfile, mapZips, MIN_ZIPS } = require('../v2/netlify/functions/lib/area-profile.js');
const { getProcedures } = require('../v2/netlify/functions/lib/procedures.js');
const { _internals } = require('../v2/netlify/functions/market-assistant.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };
const env = { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon' };

function fakeDb(handlers) {
  const urls = [];
  const f = async (url) => {
    const u = decodeURIComponent(String(url)); urls.push(u);
    for (const [re, body] of handlers) if (re.test(u)) {
      if (body === 500) return { ok: false, status: 500, json: async () => ({ code: '57014' }) };
      return { ok: true, status: 200, json: async () => (typeof body === 'function' ? body(u) : body) };
    }
    return { ok: true, status: 200, json: async () => [] };
  };
  f.urls = urls;
  return f;
}
const inList = u => ((u.match(/zip=in\.\(([^)]*)\)/) || [])[1] || '').split(',').filter(Boolean);
// 12 ZCTAs on a line east of 76104, about 0.6 miles apart.
const GEO = Array.from({ length: 12 }, (_, i) => ({ zip: String(76104 + i), lat: 32.73, lon: -97.32 + i * 0.01 }));
const geo = [
  [/cdc_places\?zip=eq\.\d+&measureid=eq\.DENTAL/, u => GEO.filter(g => u.includes('zip=eq.' + g.zip))],
  [/cdc_places\?measureid=eq\.DENTAL&zip=in/, u => GEO.filter(g => inList(u).includes(g.zip))],
  [/cdc_places\?measureid=eq\.DENTAL&lat/, GEO]
];
const band = (n, at) => Array.from({ length: 18 }, (_, i) => (at.includes(i) ? n : 0));
const acsRow = (zip, k) => ({
  zip, acs_year: 2024, pop_total: 1000 * k, households: 400 * k, median_hh_income: 50000 * k, poverty_universe: 1000 * k, poverty_below: 100 * k,
  income_bands: Array.from({ length: 16 }, (_, i) => (i === 15 ? 10 * k : i === 12 ? 30 * k : 0)),
  age_male: band(10 * k, [0, 13]), age_female: band(10 * k, [1, 17]),
  education: { universe: 600 * k, bachelor: 100 * k, graduate: 50 * k },
  ins_universe: 1000 * k, ins_uninsured: 50 * k, ins_medicare: 200 * k, ins_medicaid: 100 * k, pop_prior: 900 * k, pop_prior_year: 2019,
  signals: { disability: { n: 90 * k, of: 1000 * k } }
});
const acs = [/census_acs_zcta/, u => inList(u).map((z, i) => acsRow(z, i === 0 ? 1 : 2))];
const places = [/cdc_places\?zip=in/, u => (u.includes('offset=0') ? inList(u).flatMap((z, i) => [
  { zip: z, measureid: 'DIABETES', short_text: 'Diabetes', categoryid: 'HLTHOUT', value: i === 0 ? 10 : 20, pop_18plus: i === 0 ? 1000 : 3000, data_year: 2023 },
  { zip: z, measureid: 'OBESITY', short_text: 'Obesity', categoryid: 'HLTHOUT', value: 30, pop_18plus: i === 0 ? 1000 : 3000, data_year: 2023 }
]) : [])];
const med = [/cms_procedures_full/, u => (u.includes('offset=0') ? inList(u).slice(0, 2).map(z => ({ zip: z, npi: 'n' + z, specialty: 'Family Practice', hcpcs_cd: '99214', hcpcs_desc: 'Office visit', tot_benes: 100, tot_srvcs: 200, avg_mdcr_alowd_amt: 120, avg_mdcr_pymt_amt: 100 })) : [])];
const mcd = [/medicaid_procedures/, u => (u.includes('offset=0') ? [{ zip: inList(u)[0], specialty: 'Family Practice', code: '99214', claims: 50, patient_months: 40, paid: 3000, providers: 2 }] : [])];
const dash = (zips, spec) => [{ role: 'user', content: [{ type: 'text', text: _internals.contextBlock({ zip: '76104', specialty: spec || 'Primary care / family doctor', area_zips: zips }) }, { type: 'text', text: 'How is this market?' }] }];

// 1. The dashboard block carries the map's ZIPs, and the tool reads them back
{
  const block = _internals.contextBlock({ zip: '76104', area_zips: ['76104', '76105', 'bad', '76105', 12] });
  check('contextBlock lists the map\'s ZIPs, validated and de-duplicated', block.includes('area_zips: 2 on the map: 76104,76105'), block);
  check('contextBlock leaves the line out when the map is empty', !_internals.contextBlock({ zip: '76104' }).includes('area_zips'));
  const many = Array.from({ length: 150 }, (_, i) => String(70000 + i));
  check('a long map is counted in full but listed up to 120', _internals.contextBlock({ area_zips: many }).includes('150 on the map (first 120 listed)'));
  const msgs = dash(['76104', '76105']).concat([{ role: 'assistant', content: [{ type: 'text', text: 'x' }] }], dash(['76104', '76106', '76107']));
  check('mapZips reads the newest dashboard block', mapZips(msgs).join(',') === '76104,76106,76107');
  check('the per-ZIP health measures follow the dashboard specialty', (_internals.profileMeasures(dash(['76104'], 'Primary care / family doctor')) || []).join(',') === 'BPHIGH,DIABETES,HIGHCHOL,OBESITY,CHECKUP,CSMOKING');
  check('no specialty selected: the tool falls back to its general set', _internals.profileMeasures(dash(['76104'], 'not a label')) === null);
}

// 2. A one-ZIP map is topped up to 8 with the nearest ZIPs, and says so
{
  const f = fakeDb([...geo, acs, places, med, mcd]);
  const r = await getAreaProfile({ zip: '76104', area: 'map', specialty: 'Family Practice' }, { fetch: f, env, messages: dash(['76104']) });
  check('at least 8 ZIPs: the map plus the nearest', r.area.zips === MIN_ZIPS && r.area.zip_list.join(',') === '76104,76105,76106,76107,76108,76109,76110,76111', JSON.stringify(r.area));
  check('the added ZIPs are named in the notes', r.notes.some(n => /7 nearest ZIPs by centre were added: 76105/.test(n)), JSON.stringify(r.notes));
  check('one line per ZIP, nearest first, with miles', r.per_zip.length === 8 && r.per_zip[0].miles === 0 && r.per_zip[1].miles > 0 && r.per_zip[7].miles > r.per_zip[1].miles);
  check('the map ZIP is marked on_map and the added ones are not', r.per_zip[0].on_map === true && r.per_zip[1].on_map === false);
  // ACS: first ZIP k=1, the other seven k=2, so totals are 1 + 7*2 = 15 units.
  const d = r.demographics;
  check('population and households are summed', d.population === 15000 && d.households === 6000, JSON.stringify(d).slice(0, 200));
  check('65+ and under-20 count the right age bands', d.age_65_plus.people === 300 && d.under_20.people === 300 && d.age_65_plus.share_pct === 2);
  check('$100k+ households sum bands 12 to 15, $200k+ band 15 only', d.households_100k_plus.households === 600 && d.households_200k_plus.households === 150);
  check('median income is the household-weighted average of ZIP medians and says so', d.median_household_income === Math.round((50000 * 400 + 7 * 100000 * 800) / 6000) && /not a true median/.test(d.median_income_note));
  check('insurance comes as counts with shares, and warns not to add Medicare and Medicaid', d.insurance.uninsured.people === 750 && d.insurance.uninsured.share_pct === 5 && /do not add/.test(d.insurance.note));
  check('bachelor\'s or higher counts graduate degrees too', d.bachelors_or_higher.adults_25_plus === 2250 && d.bachelors_or_higher.share_pct === 25);
  check('population change since the prior release', d.population_change.people === 1500 && d.population_change.since === 2019);
  check('a signal every ZIP has is reported (disability)', d.disability.people === 1350 && d.disability.share_pct === 9);
  // PLACES: DIABETES 10% of 1,000 adults + 20% of 7 x 3,000 = 100 + 4,200 = 4,300 of 22,000.
  const dia = r.health.measures.find(m => m.id === 'DIABETES');
  check('health measures are weighted by adults, with estimated adults', dia && dia.est_adults === 4300 && dia.pct_of_adults === 19.5 && dia.measure === 'Diabetes', JSON.stringify(dia));
  check('the report\'s key measures: the general set when no specialty measures are given', r.health.key_measures.map(m => m.id).join(',') === 'DIABETES,OBESITY' && r.health.key_measures[0].est_adults === 4300 && r.health.key_measures[0].for_specialty === false);
  check('the health source names CDC PLACES and the year', /CDC PLACES 2023/.test(r.health.source));
  check('each ZIP line carries the specialty\'s health measures', r.per_zip[1].health_pct_of_adults && r.per_zip[1].health_pct_of_adults.DIABETES === 20);
  check('procedures cover the same ZIPs, with a line per ZIP', r.procedures.medicare_clinicians.by_zip.length === 8 && r.procedures.medicare_clinicians.by_zip[0].services === 200, JSON.stringify(r.procedures.medicare_clinicians.by_zip && r.procedures.medicare_clinicians.by_zip[0]));
  check('Medicare totals include what Medicare paid', r.procedures.medicare_clinicians.totals.medicare_paid === 40000);
  check('the procedures specialty is passed through', f.urls.some(u => u.includes('cms_procedures_full') && u.includes('specialty=ilike.*Family Practice*')) && r.procedures.specialty === 'Family Practice');
  check('a complete read says so', r.incomplete === false, r.incomplete_reason);
}

// 2b. With the specialty's measures, those come first in the report section
{
  const r = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, acs, places, med, mcd]), env, messages: dash(['76104']), keyMeasures: ['OBESITY', 'NOTREAL'] });
  check('specialty measures lead the report section and are marked, unknown ids are dropped', r.health.key_measures.map(m => m.id + ':' + m.for_specialty).join(',') === 'OBESITY:true,DIABETES:false');
}

// 3. A map with 10 ZIPs is used as is (no top-up); over 40 keeps the nearest 40
{
  const ten = GEO.slice(0, 10).map(g => g.zip);
  const r = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, acs, places, med, mcd]), env, messages: dash(ten) });
  check('a map with 10 ZIPs covers exactly those 10', r.area.zips === 10 && r.area.from_map === 10 && !r.notes.some(n => /added/.test(n)));
  check('with no specialty, procedures say "all specialties"', r.procedures.specialty === 'all specialties');
  const big = Array.from({ length: 60 }, (_, i) => String(76104 + i));
  const r2 = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, acs, places, med, mcd]), env, messages: dash(big) });
  check('a very large map is cut to 40 ZIPs and says so', r2.area.zips === 40 && r2.notes.some(n => /60 ZIPs; this covers the 40 nearest/.test(n)) && r2.notes.some(n => /30 nearest/.test(n)));
}

// 4. area "nearest", and a ZIP that is not on the map
{
  const r = await getAreaProfile({ zip: '76104', area: 'nearest', specialty: null }, { fetch: fakeDb([...geo, acs, places, med, mcd]), env, messages: dash(['76110', '76111']) });
  check('"nearest" ignores the map and takes the 8 nearest', r.area.zips === 8 && r.area.from_map === 0 && r.area.zip_list[1] === '76105');
  const r2 = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, acs, places, med, mcd]), env, messages: dash(['76110', '76111']) });
  check('a ZIP that is not on the map gets its own neighbors and a note', r2.area.zip_list[1] === '76105' && r2.notes.some(n => /not on the map/.test(n)));
}

// 5. Failures are never zeros
{
  const r = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, [/census_acs_zcta/, 500], places, [/cms_procedures_full/, 500], mcd]), env, messages: dash(['76104']) });
  check('a failed Census read leaves demographics null and says it did not answer', r.demographics === null && r.notes.some(n => /did not answer/.test(n)));
  check('a failed Medicare read is an error in the procedures part, not empty totals', !!r.procedures.medicare_clinicians.error && !r.procedures.medicare_clinicians.totals);
  check('the whole profile is marked incomplete', r.incomplete === true && /floors/.test(r.incomplete_reason));
  let n = 0;
  const r2 = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: null, radius_miles: 0 },
    { fetch: fakeDb([[/cms_procedures_full/, u => (++n === 1 ? [{ zip: '76104', npi: '1', specialty: 'X', hcpcs_cd: '99213', tot_benes: 20, tot_srvcs: 20, avg_mdcr_pymt_amt: 50 }] : { message: 'timeout' })]]), env, zips: GEO.map(g => g.zip) });
  check('get_procedures on the map area: a ZIP in a failed group reads unknown, not zero', r2.by_zip.find(z => z.zip === '76115') && r2.by_zip.find(z => z.zip === '76115').unknown === true && r2.incomplete === true, JSON.stringify(r2.by_zip && r2.by_zip.slice(-1)));
  check('get_procedures on the map area searches those ZIPs, no centroid lookup', r2.area.map_area === true && r2.area.zips_searched === 12);
  const full = Array.from({ length: 1000 }, (_, i) => ({ zip: '76104', npi: 'n' + i, specialty: 'Anesthesiology', hcpcs_cd: '0' + (1000 + i), tot_benes: 20, tot_srvcs: 20, avg_mdcr_pymt_amt: 50 }));
  const r4 = await getAreaProfile({ zip: '76104', area: 'map', specialty: null }, { fetch: fakeDb([...geo, acs, places, [/cms_procedures_full/, full], mcd]), env, messages: dash(['76104']) });
  const m4 = r4.procedures.medicare_clinicians;
  check('a capped all-specialty Medicare read keeps floor totals but no rankings or per-ZIP zeros', m4.incomplete === true && !m4.top_codes && !m4.by_zip && /specialty name/.test(m4.note) && m4.totals.rows === 8000, JSON.stringify(m4).slice(0, 300));
  const r5 = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: 'X', query: null, radius_miles: 0 }, { fetch: fakeDb([[/cms_procedures_full/, full]]), env, zips: ['76104', '76105'] });
  check('get_procedures: a capped map read marks unreached ZIPs unknown, not zero', r5.by_zip[1].unknown === true);
  const r3 = await getAreaProfile({ zip: '7610', area: 'map', specialty: null }, { fetch: fakeDb([]), env });
  check('a malformed ZIP is refused', !!r3.error);
}

// 6. The assistant offers the tool, strictly, and get_procedures can use the map
{
  const t = _internals.TOOLS.find(x => x.name === 'get_area_profile');
  check('get_area_profile is a strict tool with every property required', t && t.strict === true && t.input_schema.required.join(',') === 'zip,area,specialty');
  const gp = _internals.TOOLS.find(x => x.name === 'get_procedures');
  check('get_procedures requires use_map_area', gp.input_schema.required.includes('use_map_area') && gp.input_schema.properties.use_map_area.type === 'boolean');
  check('reports get a "Health of the area" section from the key measures', /"Health of the area" section listing get_area_profile's health.key_measures/.test(_internals.SYSTEM));
  check('the system prompt sends market questions and reports to get_area_profile', /get_area_profile with area "map"/.test(_internals.SYSTEM) && /always including get_area_profile/.test(_internals.SYSTEM));
  check('the step label says what is being read', /every ZIP on the map/.test(_internals.stepLabel('get_area_profile', { zip: '76104', area: 'map' })));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
