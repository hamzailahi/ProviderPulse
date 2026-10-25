// Tests for the reviewed hospital campus list (scripts/build-hospital-campuses.mjs,
// v2/assets/hospital-campuses.js): every row is checked, the asset is current,
// and campuses reach patient search only inside the search box, under their
// own id, with a hospital code.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseCampuses, renderAsset } from './build-hospital-campuses.mjs';

const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const codes = new Set(TaxonomyMap.codesForCare('Emergency rooms & hospitals'));
const text = readFileSync('supabase/reference/hospital-campuses.csv', 'utf8');
const list = parseCampuses(text, codes);
ok(list.length >= 1, 'the reviewed list loads');
ok(list.some(c => c.id === 'bmh-collierville' && c.billing_npi === '1578527172' && c.zip === '38017'), 'Baptist Memorial Hospital-Collierville is on it, billing under the Memphis NPI');
ok(readFileSync('v2/assets/hospital-campuses.js', 'utf8') === renderAsset(list), 'the generated asset is current');

const head = text.split('\n')[0];
const row = (over) => head + '\n' + Object.entries({ id: 'x-campus', name: 'X Hospital', address: '1 A St', city: 'Y', state: 'TN', zip: '38017', latitude: '35', longitude: '-89.7',
  phone: '9015550100', taxonomy_code: '282N00000X', billing_npi: '1578527172', billing_name: 'X', emergency: 'yes', source: 'checked', verified_on: '2026-10-25', ...over }).map(([, v]) => v).join(',') + '\n';
const refuses = (over, why) => { let t = false; try { parseCampuses(row(over), codes); } catch { t = true; } ok(t, 'refuses ' + why); };
ok(parseCampuses(row({}), codes).length === 1, 'a complete row passes');
refuses({ taxonomy_code: '3336C0003X' }, 'a code outside the hospitals door (a pharmacy)');
refuses({ billing_npi: '1578527173' }, 'an NPI that fails the check digit');
refuses({ zip: '3801' }, 'a bad ZIP');
refuses({ latitude: '0' }, 'a point outside the US');
refuses({ source: '' }, 'a row with no source');
refuses({ emergency: 'maybe' }, 'an unclear emergency flag');
let dup = false; try { parseCampuses(row({}) + row({}).split('\n')[1] + '\n', codes); } catch { dup = true; } ok(dup, 'refuses a duplicate id');

const H = require('../v2/assets/hospital-campuses.js');
const near = H.inBox({ s: 35.0, n: 35.1, w: -89.8, e: -89.6 });
const far = H.inBox({ s: 32.7, n: 32.9, w: -97.4, e: -97.2 });
ok(near.some(r => r.npi === 'campus-bmh-collierville') && !far.length, 'only campuses inside the box come back');
const r = near[0];
ok(r._src === 'campus' && codes.has(r.taxonomy_code) && r.campus.billing_npi === '1578527172' && !/^\d{10}$/.test(r.npi), 'a campus row has its own id, a hospital code and its billing NPI');

const patient = readFileSync('v2/assets/patient.js', 'utf8');
ok(/HospitalCampuses\.inBox\(box\)/.test(patient) && /regNpi = p\.campus \? p\.campus\.billing_npi/.test(patient), 'patient search adds campuses and the sheet looks up the billing NPI');
ok(/assets\/hospital-campuses\.js/.test(readFileSync('v2/app.html', 'utf8')), 'app.html loads the campus list');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
