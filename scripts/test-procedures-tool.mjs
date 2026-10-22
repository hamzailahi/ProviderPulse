// Tests for v2/netlify/functions/lib/procedures.js, the market assistant's
// get_procedures tool, against a fake Supabase: Medicare sums and weighted
// averages, words reaching CMS's wording, a failed request reported as
// incomplete (never as "none"), Medicaid codes found through their
// descriptions, and the nearest hospitals.
//
// node scripts/test-procedures-tool.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { getProcedures, SOURCES } = require('../v2/netlify/functions/lib/procedures.js');

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
const centroid = [/cdc_places\?zip=eq\./, [{ zip: '76104', lat: 32.73, lon: -97.32 }]];
const box = [/cdc_places\?measureid=eq\./, [{ zip: '76104', lat: 32.73, lon: -97.32 }, { zip: '76110', lat: 32.71, lon: -97.34 }, { zip: '75001', lat: 32.96, lon: -96.83 }]];
const MED = [
  { npi: '1', specialty: 'Gastroenterology', hcpcs_cd: '45385', hcpcs_desc: 'Removal of polyps or growths of large bowel using an endoscope', tot_benes: 100, tot_srvcs: 110, avg_mdcr_alowd_amt: 300, avg_mdcr_pymt_amt: 240 },
  { npi: '2', specialty: 'Gastroenterology', hcpcs_cd: '45385', hcpcs_desc: 'Removal of polyps or growths of large bowel using an endoscope', tot_benes: 50, tot_srvcs: 90, avg_mdcr_alowd_amt: 200, avg_mdcr_pymt_amt: 160 },
  { npi: '1', specialty: 'Gastroenterology', hcpcs_cd: '45380', hcpcs_desc: 'Biopsy of large bowel using a flexible endoscope', tot_benes: 70, tot_srvcs: 70, avg_mdcr_alowd_amt: 250, avg_mdcr_pymt_amt: 200 }
];

// 1. Medicare: sums, service-weighted averages, distinct clinicians, area by radius
{
  const f = fakeDb([centroid, box, [/cms_procedures_full/, u => (u.includes('offset=0') ? MED : [])]]);
  const r = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: 'Gastroenterology', query: 'colonoscopy', radius_miles: 5 }, { fetch: f, env });
  const top = r.top_codes && r.top_codes[0];
  check('Medicare: the most-patients code leads', top && top.code === '45385' && top.patients === 150 && top.services === 200);
  check('Medicare: averages are weighted by services', top && top.avg_allowed === 255 && top.avg_medicare_paid === 204, JSON.stringify(top));
  check('Medicare: clinicians counted once each', r.totals.clinicians === 2 && top.clinicians === 2);
  check('Medicare: the radius keeps ZIPs within it and drops farther ones', r.area.zips_searched === 2);
  check('Medicare: "colonoscopy" reaches CMS wording in the request', f.urls.some(u => u.includes('cms_procedures_full') && u.includes('hcpcs_desc.ilike.*large bowel using*')));
  check('Medicare: the specialty is matched by name, either table\'s wording', f.urls.some(u => u.includes('specialty=ilike.*Gastroenterology*')));
  check('Medicare: complete answers say so, with the source notes', r.incomplete === false && r.notes.length >= 3 && r.data_year === 2024);
  check('Medicare: a specialty filter leaves out the specialty breakdown', r.by_specialty === undefined);
}

// 2. A failed request is never "no procedures"
{
  const f = fakeDb([centroid, [/cms_procedures_full/, 500]]);
  const r = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: null, radius_miles: 0 }, { fetch: f, env });
  check('a timed-out Medicare table returns an error, not an empty list', !!r.error && !r.top_codes);
  // The second group of ZIPs answers with a non-array: counted as a failure.
  let n = 0;
  const many = [centroid, [/cdc_places\?measureid=eq\./, Array.from({ length: 15 }, (_, i) => ({ zip: String(76100 + i), lat: 32.73, lon: -97.32 }))], [/cms_procedures_full/, u => (++n <= 1 ? MED : { message: 'timeout' })]];
  const r2 = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: null, radius_miles: 10 }, { fetch: fakeDb(many), env });
  check('a partly failed answer is marked incomplete and says totals are floors', r2.incomplete === true && /floors/.test(r2.incomplete_reason || ''), JSON.stringify(r2).slice(0, 300));
}

// 3. Codes typed as codes; bad input refused
{
  const f = fakeDb([centroid, [/cms_procedures_full/, u => (u.includes('offset=0') ? MED.filter(r => r.hcpcs_cd === '45380') : [])]]);
  const r = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: '45380', radius_miles: 0 }, { fetch: f, env });
  check('a 5-character code filters by code, not by description', f.urls.some(u => u.includes('hcpcs_cd=eq.45380')) && !f.urls.some(u => u.includes('hcpcs_desc.ilike')));
  check('without a specialty, the answer breaks down by specialty', Array.isArray(r.by_specialty) && r.by_specialty[0].specialty === 'Gastroenterology');
  const bad = await getProcedures({ zip: '7610', source: 'medicare_clinicians' }, { fetch: f, env });
  check('a bad ZIP is refused', !!bad.error);
  const badSrc = await getProcedures({ zip: '76104', source: 'commercial' }, { fetch: f, env });
  check('an unknown source is refused', !!badSrc.error && SOURCES.length === 4);
}

// 4. Medicaid: words become codes through procedure_codes; sums and paid per claim
{
  const f = fakeDb([centroid,
    [/procedure_codes\?select=code&or=/, [{ code: '76805' }, { code: '76815' }]],
    [/medicaid_procedures/, u => (u.includes('offset=0') ? [
      { specialty: 'Physician/Obstetrics & Gynecology', code: '76805', claims: 3000, patient_months: 2500, paid: 300000, providers: 10 },
      { specialty: 'Physician/Obstetrics & Gynecology', code: '76815', claims: 1000, patient_months: 900, paid: 50000, providers: 4 }] : [])],
    [/procedure_codes\?code=in\./, [{ code: '76805', description: 'Ultrasound scan of pregnant uterus' }]]]);
  const r = await getProcedures({ zip: '76104', source: 'medicaid', specialty: 'Obstetrics', query: 'pregnancy ultrasound', radius_miles: 0 }, { fetch: f, env });
  check('Medicaid: plain words find codes through their descriptions', f.urls.some(u => u.includes('medicaid_procedures') && u.includes('code=in.(76805,76815)')));
  check('Medicaid: claim lines, total paid and paid per claim', r.top_codes[0].code === '76805' && r.top_codes[0].claim_lines === 3000 && r.top_codes[0].paid_per_claim === 100 && r.totals.paid === 350000);
  check('Medicaid: descriptions attached; a missing one stays null', r.top_codes[0].description === 'Ultrasound scan of pregnant uterus' && r.top_codes[1].description === null);
  check('Medicaid: notes say the counts are floors', r.notes.some(n => /fewer than 12/.test(n)));
  const none = await getProcedures({ zip: '76104', source: 'medicaid', specialty: null, query: 'zzzz nothing', radius_miles: 0 }, { fetch: fakeDb([centroid]), env });
  check('Medicaid: words matching no description say so instead of erroring', Array.isArray(none.top_codes) && none.top_codes.length === 0 && none.notes.some(n => /No code description/.test(n)));
}

// 5. Hospitals: nearest within the radius, patients summed, specialty ignored
{
  const f = fakeDb([centroid,
    [/medicare_hospitals\?lat=/, [{ ccn: '450001', hospital: 'NEAR GENERAL', zip: '76104', lat: 32.74, lon: -97.33 }, { ccn: '450002', hospital: 'FAR GENERAL', zip: '79901', lat: 31.76, lon: -106.48 }]],
    [/medicare_hospital_procedures/, u => (u.includes('offset=0') ? [{ ccn: '450001', code: '5301', description: 'Level 1 Upper GI Procedures', patients: 400, services: 410, avg_allowed: 900, avg_paid: 700 }] : [])]]);
  const r = await getProcedures({ zip: '76104', source: 'hospital_outpatient', specialty: 'Gastroenterology', query: null, radius_miles: 0 }, { fetch: f, env });
  check('Hospitals: only those within the radius (25 miles by default)', r.hospitals.length === 1 && r.hospitals[0].hospital === 'NEAR GENERAL' && r.area.radius_miles === 25);
  check('Hospitals: the request names the setting and the nearby hospitals only', f.urls.some(u => u.includes('setting=eq.outpatient') && u.includes('ccn=in.(450001)')));
  check('Hospitals: payment-group rows with patients and average paid', r.top_codes[0].code === '5301' && r.top_codes[0].patients === 400 && r.top_codes[0].avg_medicare_paid === 700);
  check('Hospitals: the notes say specialty does not apply and codes are APC/DRG', r.notes.some(n => /specialty filter does not apply/.test(n)) && r.notes.some(n => /APC/.test(n)));
}

// A list of codes: every code reported, missing ones named, a wider map allowed
{
  const many = Array.from({ length: 50 }, (_, i) => String(76100 + i));
  const f = fakeDb([[/cms_procedures_full/, u => (u.includes('offset=0') ? MED : [])], [/medicaid_procedures/, u => (u.includes('offset=0') ? [{ specialty: 'Physician/Gastroenterology', code: '45380', claims: 10, patient_months: 9, paid: 1000, providers: 1 }] : [])], [/procedure_codes/, []]]);
  const r = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: '45385, 45380 45388\nC9777', radius_miles: 0 }, { fetch: f, env, zips: many });
  check('code list: the request filters by every listed code', f.urls.some(u => u.includes('hcpcs_cd=in.(45385,45380,45388,C9777)')));
  check('code list: every code with rows is returned and the rest are named', r.top_codes.map(c => c.code).join() === '45385,45380' && r.codes_without_rows.join() === '45388,C9777', JSON.stringify([r.top_codes.map(c => c.code), r.codes_without_rows]));
  check('code list: up to 120 map ZIPs, so 50 are not capped', r.area.zips_searched === 50 && r.incomplete === false);
  const m = await getProcedures({ zip: '76104', source: 'medicaid', specialty: null, query: '45380 45385', radius_miles: 0 }, { fetch: f, env, zips: ['76104'] });
  check('code list on Medicaid: by code, the missing code named', f.urls.some(u => u.includes('medicaid_procedures') && u.includes('code=in.(45380,45385)')) && m.codes_without_rows.join() === '45385');
  const bad = await getProcedures({ zip: '76104', source: 'medicare_clinicians', specialty: null, query: '45385 45380', radius_miles: 0 }, { fetch: fakeDb([[/cms_procedures_full/, 500]]), env, zips: ['76104', '76105'] });
  check('code list: a failed request never names codes as missing', !!bad.error || /unknown/.test(String(bad.codes_without_rows)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
