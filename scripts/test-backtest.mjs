// Back-test scorer on synthetic data: entry, catchments, HPSA matching.
import { run, summarize, parseCsv } from './backtest-entry.mjs';
let pass = 0, fail = 0;
const check = (n, ok, d = '') => { if (ok) { pass++; console.log('  PASS  ' + n); } else { fail++; console.log('  FAIL  ' + n + (d ? ' :: ' + d : '')); } };
const PC = '207Q00000X';   // family medicine
// 30 ZIPs on a line, 3 miles apart: the east half has few doctors and gets the entrants.
const zips = Array.from({ length: 30 }, (_, i) => ({ zip: String(10000 + i), lat: 35, lon: -90 + i * 0.053, adults: 5000 }));
const counts = [];
zips.forEach((z, i) => { counts.push({ zip: z.zip, code: PC, entity: '1', before: i < 15 ? 40 : 2, entered: i < 15 ? 1 : 6 }); });
const bench = [{ kind: 'specialty', key: 'Primary care / family doctor', data: { rate_per_1k: 4.78 } }];
const hpsa = [{ state: 'Tennessee', county: 'East', discipline: 'Primary Care', score: 18 }];
const zipcounty = zips.map((z, i) => ({ zip: z.zip, county: i < 15 ? 'West County' : 'East County', state: 'Tennessee' }));
const rows = run({ counts, zips, places: [], bench, hpsa, zipcounty });
const pc = rows.filter(r => r.specialty === 'Primary care / family doctor');
check('every ZIP with 1,000+ adults is scored', pc.length === 30, String(pc.length));
const east = pc.find(r => r.zip === '10029'), west = pc.find(r => r.zip === '10000');
check('thin supply reads as higher access need', east.access > west.access, `${east.access} vs ${west.access}`);
check('entrants are counted per 1,000 adults in the catchment', east.entryPer1k > west.entryPer1k, `${east.entryPer1k} vs ${west.entryPer1k}`);
check('HPSA matches the county by name ("East County" to "East")', east.hpsa === 18 && west.hpsa === 0);
// With no PLACES measures need is unknown, so the combined score is too; the summary still runs.
check('unknown need leaves the combined score unknown, never filled', pc.every(r => r.need == null && r.needScore == null));
const withNeed = pc.map(r => ({ ...r, need: 50, needScore: (50 + r.access) / 2 }));
const s = summarize(withNeed)[0];
check('score and entry agree when entrants go to thin supply', s.rhoScore > 0.8, String(s.rhoScore));
check('HPSA compared on the same ZIPs', s.nHpsa === 30 && s.rhoHpsa > 0.5, String(s.rhoHpsa));
check('CSV reader keeps commas inside quotes', parseCsv('a,b\n"x, y",{"k":1}\n')[0][0] === 'x, y');
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
