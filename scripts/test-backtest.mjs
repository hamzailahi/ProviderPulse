// Back-test scorer on synthetic data: entry, catchments, HPSA matching.
import { run, summarize, parseCsv, outcomes, payerYield } from './backtest-entry.mjs';
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
{
  // Ability to pay and competition give the viability score; ZIP-level ACS ranked within the state.
  const acs = zips.map((z, i) => ({ zip: z.zip, state: 'TN', insured: 0.8 + i * 0.005, income: 40000 + i * 1000 }));
  const zc2 = zips.map((z, i) => ({ zip: z.zip, fips: i < 15 ? '47001' : '47003', county: i < 15 ? 'West County' : 'East County', state: 'TN' }));
  const r2 = run({ counts, zips, places: [], bench, hpsa, zipcounty: zc2, acs }).filter(r => r.specialty === 'Primary care / family doctor');
  check('pay and competition make the viability score', r2.every(r => r.pay != null && r.competition != null && r.viability === (r.pay + r.competition) / 2));
  check('state names follow two-letter codes for HPSA', r2.find(r => r.zip === '10029').hpsa === 18);
  const all = run({ counts, zips, places: [], bench, hpsa, zipcounty: zc2, acs }, { supply: 'all' }).filter(r => r.specialty === 'Primary care / family doctor');
  check('today\'s supply adds the entrants to the 2020 supply', all.find(r => r.zip === '10029').access <= r2.find(r => r.zip === '10029').access);
  const scored = all.map(r => ({ ...r, needScore: r.access }));
  const util = [{ fips: '47001', er: 500, readm: 15, pqi: 1000 }, { fips: '47003', er: 900, readm: 18, pqi: 3000 }];
  const o = outcomes(scored, util);
  check('counties under 30 give no correlation, never a made-up one', o[0].counties === 2 && o[0].pqi === null);
}
{
}
{
  const all = payerYield({ insured: 1, employer: 100, direct: 0, tricare: 0, medicare: 0, medicaid: 0 });
  const mcd = payerYield({ insured: 1, employer: 0, direct: 0, tricare: 0, medicare: 0, medicaid: 100 });
  const half = payerYield({ insured: 0.5, employer: 100, direct: 0, tricare: 0, medicare: 0, medicaid: 0 });
  check('payer yield: commercial pays more than Medicaid, uninsured scales it down', all === 1.43 && mcd === 0.72 && half === 0.715, JSON.stringify([all, mcd, half]));
  check('payer yield: missing coverage counts give no figure', payerYield({ insured: 1, employer: null, medicare: 1, medicaid: 1 }) === null);
}
{
  const PC = 'Primary care / family doctor';
  const z0 = pc[0].zip, e2 = new Map([[z0, { [PC]: { per_1k: 0.001, catchment_minutes: 30 } }]]);
  const a = run({ counts, zips, places: [], bench, hpsa, zipcounty }, { supply: 'all', e2sfca: e2 }).filter(r => r.specialty === PC);
  const hit = a.find(r => r.zip === z0), rest = a.filter(r => r.zip !== z0);
  check('today\'s access reads the stored drive-time figure where one exists', hit.accessBasis === 'e2sfca' && hit.access > 99, JSON.stringify([hit.accessBasis, hit.access]));
  check('ZIPs without a drive-time row keep the 10-mile count', rest.every(r => r.accessBasis !== 'e2sfca'));
  const b = run({ counts, zips, places: [], bench, hpsa, zipcounty }, { e2sfca: e2 }).filter(r => r.specialty === PC);
  check('the 2020 run never reads today\'s drive-time figures', b.every(r => r.accessBasis !== 'e2sfca'));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
