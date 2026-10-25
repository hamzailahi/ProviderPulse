// Which geocoder matches patient search accepts for typed text (fitsQuery in
// v2/assets/patient.js, 2026-10-25). The geocoder always offers something:
// the live audit typed "zzzz nowhere street" and the search moved to a street
// in Oklahoma. The code is lifted out of patient.js, so this tests the real thing.
import { readFileSync } from 'node:fs';
const src = readFileSync('v2/assets/patient.js', 'utf8');
const a = src.indexOf('var ADDR_SYNONYMS'), b = src.indexOf("// The browser's location");
if (a < 0 || b < a) throw new Error('fitsQuery not found in patient.js');
const fitsQuery = new Function(src.slice(a, b) + '; return fitsQuery;')();
let pass = 0, fail = 0;
const t = (want, q, label, zip = '') => { if (fitsQuery(q, { label, zip }) === want) pass++; else { fail++; console.log('FAIL', want ? 'should accept' : 'should reject', q, '->', label); } };
t(false, 'zzzz nowhere street', 'County Street 2550, Caddo, Oklahoma 74729', '74729');
t(true, '1500 W Poplar Ave, Collierville, TN 38017', '1500 West Poplar Avenue, Collierville, Tennessee 38017', '38017');
t(true, '1500 W Poplar Ave', '1500 West Poplar Avenue, Collierville, Tennessee 38017', '38017');
t(false, '1500 W Poplar Ave', '1550 West Poplar Avenue, Collierville, Tennessee 38017', '38017');
t(true, '1500 w poplar ave ste 202', '1500 West Poplar Avenue, Collierville, Tennessee 38017', '38017');
t(true, 'collierville', 'Collierville, Tennessee');
t(true, 'Collierville TN', 'Collierville, Tennessee');
t(false, 'colierville', 'Collierville, Tennessee');
t(true, '6000 Denton Hwy Haltom City', '6000 Denton Highway, Haltom City, Texas 76148', '76148');
t(true, 'fort worth tx', 'Fort Worth, Texas');
t(true, 'ft worth', 'Fort Worth, Texas');
t(true, 'st louis', 'Saint Louis, Missouri');
t(true, 'main st 38017', 'Main Street, Collierville, Tennessee 38017', '38017');
t(false, 'main st 38017', 'Main Street, Memphis, Tennessee 38103', '38103');
t(false, '10 downing street', 'Downing Street, Springfield, Missouri');
t(true, 'new york ny', 'New York, New York');
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
