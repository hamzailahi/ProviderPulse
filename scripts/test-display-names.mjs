// How the patient app and portal print listing names and cities
// (v2/assets/directory.js displayName / cityName), run in a sandbox like the
// browser loads it.
//
// node scripts/test-display-names.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { window: {}, document: {}, console };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../v2/assets/directory.js', import.meta.url), 'utf8'), ctx);
const { displayName, cityName } = ctx;

let pass = 0, fail = 0;
const eq = (label, got, want) => { if (got === want) { pass++; console.log(`  PASS  ${label}`); } else { fail++; console.log(`  FAIL  ${label}\n        got "${got}", want "${want}"`); } };

console.log('Names');
eq('a legal suffix after a comma goes', displayName('HALTOM DENTAL, P.A.'), 'Haltom Dental');
eq('PLLC goes', displayName('TY ORTHO MANAGEMENT PLLC'), 'Ty Ortho Management');
eq('INC. goes and an acronym stays', displayName('CVS PHARMACY, INC.'), 'CVS Pharmacy');
eq('two suffixes in a row go', displayName('OPEN ARMS HEALTHCARE OF TEXAS, INC. LLC'), 'Open Arms Healthcare of Texas');
eq('a credential is kept, only the suffix goes', displayName('JOHN SMITH MD PA'), 'John Smith MD');
eq('a name that is only a suffix is not emptied', displayName('PA'), 'PA');
eq('mixed-case names are left as written', displayName('Baylor Scott & White Clinic'), 'Baylor Scott & White Clinic');
eq('St stays a word, not an acronym', displayName('ST JOSEPH HOSPITAL'), 'St Joseph Hospital');
eq('a person keeps their name', displayName('BRYAN ONG'), 'Bryan Ong');
eq('"company" inside a name stays', displayName('ACME COMPANY CLINIC'), 'Acme Company Clinic');
eq('empty is empty', displayName(''), '');

console.log('\nCities');
eq('FT WORTH', cityName('FT WORTH'), 'Fort Worth');
eq('Ft. Lauderdale', cityName('Ft. Lauderdale'), 'Fort Lauderdale');
eq('MT PLEASANT', cityName('MT PLEASANT'), 'Mount Pleasant');
eq('Fort Worth unchanged', cityName('Fort Worth'), 'Fort Worth');
eq('a city that only starts with Ft letters is left alone', cityName('FTWORTH'), 'Ftworth');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
