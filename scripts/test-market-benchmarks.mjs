// The market benchmark builder (scripts/build-market-benchmarks.mjs), end to
// end against a fake Supabase: a specialty's national rate counts listings by
// NUCC code through the reviewed table, never by name.
//
// node scripts/test-market-benchmarks.mjs
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const L = (npi, code, state = 'TN', name = 'Cardiovascular Disease Physician') => ({ npi, taxonomy_code: code, primary_taxonomy: name, state });
const individuals = [
  L('1000000001', '207RC0000X'), L('1100000002', '207RC0000X'), L('1200000003', '207RC0000X'),
  // the name says cardiology; the code says dermatology, and the code counts
  L('1300000004', '207N00000X'), L('1400000005', '207N00000X', 'AR'),
  L('1500000006', null),                                   // no code: state density only
  L('1600000007', '363LF0000X', 'TN', 'Family Nurse Practitioner')
];
const clinics = [L('1700000008', '261QP2300X', 'TN', 'Primary Care Clinic/Center')];

const dir = mkdtempSync(join(tmpdir(), 'bench-'));
const preload = join(dir, 'preload.mjs');
writeFileSync(preload, `
const IND = ${JSON.stringify(individuals)}, ORG = ${JSON.stringify(clinics)};
const J = v => ({ ok: true, status: 200, json: async () => v, text: async () => JSON.stringify(v) });
globalThis.fetch = async url => {
  const u = decodeURIComponent(String(url));
  if (u.includes('cdc_places')) return J(u.includes('measureid=eq.DENTAL') && !u.includes('zip=gt.')
    ? [{ zip: '38017', value: 60, pop_18plus: 100000000 }, { zip: '72201', value: 60, pop_18plus: 100000000 }] : []);
  if (u.includes('demographics_raw')) return J(u.includes('zip=gt.') ? [] : [
    { zip: '38017', state: 'TN', 'Total Population': 200000000 }, { zip: '72201', state: 'AR', 'Total Population': 100000000 }]);
  const table = u.includes('provider_individuals') ? IND : u.includes('clinics') ? ORG : null;
  if (table) {
    if (!u.includes('select=npi,taxonomy_code,state')) throw new Error('builder must read taxonomy_code: ' + u);
    if (u.includes('npi=gt.')) return J([]);
    const lo = u.match(/npi=gte\\.(\\d+)/)[1], hi = u.match(/npi=lt\\.(\\d+)/)[1];
    return J(table.filter(r => r.npi.slice(0, 2) >= lo && r.npi.slice(0, 2) < hi));
  }
  throw new Error('unexpected fetch ' + u);
};
`);
const p = spawnSync(process.execPath, ['--import', preload, 'scripts/build-market-benchmarks.mjs', '--dry-run'],
  { env: { ...process.env, SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'svc', MIN_LISTINGS: '5' }, encoding: 'utf8', timeout: 60000 });
const out = p.stdout + p.stderr;
const listings = label => { const m = out.match(new RegExp('  ' + label.replace(/[/()]/g, '\\$&') + ': (\\d+) listings')); return m ? Number(m[1]) : null; };

check('the builder runs in dry-run mode', p.status === 0 && /dry run, nothing written/.test(out), out.slice(-800));
check('cardiology counts its 3 coded listings, not the 6 that carry its name', listings('Heart / cardiology') === 3, String(listings('Heart / cardiology')));
check('dermatology counts the listings whose code says dermatology', listings('Skin / dermatology') === 2);
check('primary care counts the family NP and the primary care clinic by code', listings('Primary care / family doctor') === 2);
check('nursing and physician assistant are searchable but not scored', listings('Nursing (RN, LPN)') === null && listings('Physician assistant') === null);
check('a category that is searchable but not scored gets no benchmark', listings('Other health services') === null && listings('Hospital-based clinicians') === null);
check('the uncoded listing is reported', /provider_individuals: 7 rows, 4 distinct taxonomy codes, 1 without one/.test(out), out.match(/provider_individuals:.*/) && out.match(/provider_individuals:.*/)[0]);
check('state density still counts every listing, coded or not', /TN: 7 listings/.test(out) && /AR: 1 listings/.test(out), (out.match(/  (TN|AR): .*/g) || []).join(' | '));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
