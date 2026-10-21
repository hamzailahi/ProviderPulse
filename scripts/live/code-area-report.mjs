#!/usr/bin/env node
// A list of procedure codes around one ZIP, from the public procedure tables
// through the publishable key: traditional Medicare by clinician
// (cms_procedures_full), Medicaid by ZIP and specialty (medicaid_procedures,
// with descriptions from procedure_codes), and Medicare hospital outpatient
// rows at the hospitals in the radius (medicare_hospital_procedures, APC
// groups; the descriptions that look gastrointestinal or endoscopic, since
// hospitals report payment groups rather than CPT codes).
//
// Writes CSVs to OUT_DIR for a spreadsheet: medicare_rows (one per clinician,
// code and place of service), medicaid_rows, hospital_rows, zips (every ZIP
// searched with its distance), and a run summary. Read only; a failed request
// stops the run, so nothing partial is written as if complete.
//
// node scripts/live/code-area-report.mjs <centre zip> <radius miles> <codes> <out dir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const URL_ = 'https://khkmdultmrggpfvkbfzj.supabase.co', KEY = 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';
const [centreZip = '76117', radiusArg = '20', codesArg = '', outDir = 'code-area-report'] = process.argv.slice(2);
const radius = Number(radiusArg);
const codes = [...new Set(codesArg.split(/[\s,]+/).map(c => c.trim().toUpperCase()).filter(c => /^[A-Z0-9]{5}$/.test(c)))];
if (!/^\d{5}$/.test(centreZip) || !(radius > 0 && radius <= 50) || !codes.length) { console.error('usage: <zip> <radius 1-50> <codes> <out>'); process.exit(2); }
mkdirSync(outDir, { recursive: true });

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: 'application/json' };
async function get(path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(15000) }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
    if (r.ok) { const b = await r.json(); if (Array.isArray(b)) return b; }
    const why = r.ok ? 'not a list' : `${r.status} ${(await r.text()).slice(0, 200)}`;
    if (attempt === 3) throw new Error(`request failed: ${path.slice(0, 160)}: ${why}`);
    await new Promise(res => setTimeout(res, 1500 * attempt));
  }
}
async function paged(path) {
  const out = [];
  for (let p = 0; p < 200; p++) {
    const rows = await get(`${path}&limit=1000&offset=${p * 1000}`);
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
  throw new Error('more than 200 pages: ' + path.slice(0, 120));
}
const miles = (a, b, c, d) => { const R = 3958.8, r = Math.PI / 180; const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(x))); };
const csv = (name, rows, cols) => {
  const q = v => (v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
  writeFileSync(join(outDir, name + '.csv'), [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n') + '\n');
  console.log(`${name}.csv: ${rows.length} rows`);
};
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

// ---- the area: every ZCTA whose centre is within the radius
const home = await get(`cdc_places?zip=eq.${centreZip}&measureid=eq.DENTAL&select=zip,lat,lon&limit=1`);
if (!home.length || home[0].lat == null) throw new Error('no centroid for ' + centreZip);
const c = { lat: +home[0].lat, lon: +home[0].lon };
const dLat = radius / 69, dLon = radius / (69 * Math.cos(c.lat * Math.PI / 180));
const box = await get(`cdc_places?measureid=eq.DENTAL&lat=gte.${(c.lat - dLat).toFixed(4)}&lat=lte.${(c.lat + dLat).toFixed(4)}&lon=gte.${(c.lon - dLon).toFixed(4)}&lon=lte.${(c.lon + dLon).toFixed(4)}&select=zip,lat,lon&limit=1000`);
const zipMiles = {};
box.forEach(r => { const m = miles(c.lat, c.lon, +r.lat, +r.lon); if (m <= radius) zipMiles[r.zip] = Math.round(m * 10) / 10; });
const zips = Object.keys(zipMiles).sort((a, b) => zipMiles[a] - zipMiles[b]);
console.log(`${zips.length} ZIPs within ${radius} miles of ${centreZip}`);

// ---- Medicare clinicians
const codeList = codes.map(encodeURIComponent).join(',');
const med = [];
for (const group of chunks(zips, 10)) {
  med.push(...await paged(`cms_procedures_full?zip=in.(${group.join(',')})&hcpcs_cd=in.(${codeList})` +
    '&select=npi,provider_name,first_name,credentials,entity_code,address1,city,zip,specialty,hcpcs_cd,hcpcs_desc,place_of_service,tot_benes,tot_srvcs,avg_sbmtd_chrg,avg_mdcr_alowd_amt,avg_mdcr_pymt_amt' +
    '&order=npi,hcpcs_cd,place_of_service,id'));
}
med.forEach(r => { r.miles = zipMiles[r.zip]; });
csv('medicare_rows', med, ['hcpcs_cd', 'hcpcs_desc', 'npi', 'provider_name', 'first_name', 'credentials', 'entity_code', 'specialty', 'address1', 'city', 'zip', 'miles', 'place_of_service', 'tot_benes', 'tot_srvcs', 'avg_sbmtd_chrg', 'avg_mdcr_alowd_amt', 'avg_mdcr_pymt_amt']);

// ---- Medicaid
const mcd = [];
for (const group of chunks(zips, 50)) mcd.push(...await paged(`medicaid_procedures?zip=in.(${group.join(',')})&code=in.(${codeList})&select=zip,specialty,code,claims,patient_months,paid,providers,year&order=zip,specialty,code`));
const desc = {};
(await get(`procedure_codes?code=in.(${codeList})&select=code,description`)).forEach(d => { desc[d.code] = d.description; });
mcd.forEach(r => { r.miles = zipMiles[r.zip]; r.description = desc[r.code] || null; });
csv('medicaid_rows', mcd, ['code', 'description', 'zip', 'miles', 'specialty', 'claims', 'patient_months', 'paid', 'providers', 'year']);
csv('code_descriptions', codes.map(code => ({ code, description: desc[code] || (med.find(r => r.hcpcs_cd === code) || {}).hcpcs_desc || null })), ['code', 'description']);

// ---- Hospital outpatient: the hospitals in the radius, their GI / endoscopy groups
const hb = await get(`medicare_hospitals?lat=gte.${(c.lat - dLat).toFixed(4)}&lat=lte.${(c.lat + dLat).toFixed(4)}&lon=gte.${(c.lon - dLon).toFixed(4)}&lon=lte.${(c.lon + dLon).toFixed(4)}&select=ccn,hospital,zip,lat,lon&limit=1000`);
const hospitals = hb.map(h => Object.assign(h, { miles: Math.round(miles(c.lat, c.lon, +h.lat, +h.lon) * 10) / 10 })).filter(h => h.miles <= radius);
const hosp = [];
for (const group of chunks(hospitals, 20)) {
  hosp.push(...await paged(`medicare_hospital_procedures?setting=eq.outpatient&ccn=in.(${group.map(h => encodeURIComponent(h.ccn)).join(',')})&select=ccn,hospital,zip,code,description,patients,services,avg_charge,avg_allowed,avg_paid,year&order=ccn,code`));
}
const GI = /gastro|endoscop|\bGI\b|colon|esophag|anal|rectal|biliary|pancrea|upper GI|lower GI|anesthesia/i;
const hospGi = hosp.filter(r => GI.test(r.description || '') || codes.includes(String(r.code).toUpperCase()));
hospGi.forEach(r => { r.miles = (hospitals.find(h => h.ccn === r.ccn) || {}).miles; });
csv('hospital_rows', hospGi, ['code', 'description', 'hospital', 'ccn', 'zip', 'miles', 'patients', 'services', 'avg_charge', 'avg_allowed', 'avg_paid', 'year']);
csv('hospital_groups_all', [...new Set(hosp.map(r => r.code + '|' + r.description))].map(s => ({ code: s.split('|')[0], description: s.split('|').slice(1).join('|') })), ['code', 'description']);
csv('zips', zips.map(z => ({ zip: z, miles: zipMiles[z] })), ['zip', 'miles']);

const summary = { centre_zip: centreZip, centre: c, radius_miles: radius, zips: zips.length, codes, hospitals_in_radius: hospitals.length,
  medicare_rows: med.length, medicare_codes_found: [...new Set(med.map(r => r.hcpcs_cd))].length,
  medicaid_rows: mcd.length, medicaid_codes_found: [...new Set(mcd.map(r => r.code))].length,
  hospital_rows: hospGi.length, hospital_outpatient_rows_all: hosp.length, run_at: new Date().toISOString() };
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
