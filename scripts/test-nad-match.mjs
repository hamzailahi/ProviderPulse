// Tests for the NAD matcher (scripts/lib/nad-match.mjs) and the dry run's
// keys and match steps on small files. node scripts/test-nad-match.mjs
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { houseOf, nadLine, matchOne, applicable, countyKey, NOT_PUBLIC } from './lib/nad-match.mjs';
import { buildCounties } from './build-nad-counties.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };

ok(houseOf('331 W HARWOOD RD STE A') === '331' && houseOf('0042 MAIN ST') === '42' && houseOf('PO BOX 5') === null, 'house numbers from the street line, leading zeros off, none for a PO box');
ok(nadLine({ num: '710', pre_dir: 'North', name: 'Turner', post_type: 'Avenue' }) === '710 North Turner Avenue', 'a NAD street line joins its parts');
ok(nadLine({ num_pre: '', num: '12', num_suf: 'A', name: 'Oak', post_type: 'St' }) === '12A Oak St', 'a NAD suffix stays on the number');

const c = (o) => Object.assign({ num: '710', name: 'Turner', post_type: 'Avenue', lat: '40.586', lng: '-98.389', placement: 'Structure - Rooftop' }, o);
const row = { address: '710 N TURNER AVE STE 2', state: 'NE', zip: '68901' };
let m = matchOne(row, [c({ pre_dir: 'North' })]);
ok(m.status === 'placed' && Math.abs(m.lat - 40.586) < 1e-9 && m.placement === 'Structure - Rooftop', 'the same street written in full is placed at the NAD point');
m = matchOne(row, [c({})]);
ok(m.status === 'placed', 'a direction word on one side only is still the same address');
m = matchOne(row, [c({ name: 'Elm' })]);
ok(m.status === 'no_street', 'the same number on another street is not placed');
m = matchOne(row, [c({ post_type: 'Drive' })]);
ok(m.status === 'no_street', 'a different street type is not placed');
m = matchOne(row, [c({ pre_dir: 'North' }), c({ pre_dir: 'North', lat: '40.5862' })]);
ok(m.status === 'placed' && m.points === 2, 'two points a few metres apart (units) are one place');
m = matchOne(row, [c({ pre_dir: 'North' }), c({ pre_dir: 'North', lat: '40.60' })]);
ok(m.status === 'tie', 'two matching points far apart are a tie, not a guess');
ok(matchOne(row, []).status === 'no_candidates' && matchOne(row, [c({ lat: '' })]).status === 'no_street', 'nothing, or a point with no coordinates, places nothing');
ok(NOT_PUBLIC.has('MI') && !NOT_PUBLIC.has('TX'), 'states USDOT does not mark public domain are listed');

ok(applicable('placed', 'tx') && !applicable('placed', 'MI') && !applicable('placed', 'IL') && !applicable('tie', 'TX') && !applicable('placed', ''), 'only placed matches in wholly public states may be applied');

// the county check for partly public states
const pub = new Set(['IL|COOK', 'MN|ST LOUIS']);
ok(applicable('placed', 'IL', 'Cook County', pub) && !applicable('placed', 'IL', 'Saline', pub) && !applicable('placed', 'IL', null, pub) && !applicable('placed', 'IL', 'Cook', null), 'a partly public state is applied only in a listed public county; no county is never public');
ok(applicable('placed', 'MN', 'Saint Louis', pub) && countyKey("St. Louis County") === 'ST LOUIS' && countyKey('') === null, 'county names are spelled one way on both sides');
ok(!applicable('placed', 'MI', 'Wayne', new Set(['MI|WAYNE'])), 'a county list never opens a non-public state');
const bc = buildCounties([
  JSON.stringify({ STATE_ABBR: 'SD', NAME: 'Minnehaha', CountyStatus: 10 }), JSON.stringify({ STATE_ABBR: 'SD', NAME: 'Minnehaha', CountyStatus: 40 }),
  JSON.stringify({ STATE_ABBR: 'ND', NAME: 'Cass', CountyStatus: 10 }), JSON.stringify({ STATE_ABBR: 'CO', NAME: 'Mesa', CountyStatus: 30 }),
  JSON.stringify({ STATE_ABBR: 'TX', NAME: 'Harris', CountyStatus: 10 }),
  JSON.stringify({ STATE_ABBR: 'MD', NAME: 'Baltimore', NAMELSAD: 'Baltimore city', CountyStatus: 10 }),
  JSON.stringify({ STATE_ABBR: 'MD', NAME: 'Baltimore', NAMELSAD: 'Baltimore County', CountyStatus: 10 })]);
ok(bc.length === 5 && bc.some(r => r.county === 'BALTIMORE CITY' && r.verdict === 'public') && bc.some(r => r.county === 'BALTIMORE') && bc.find(r => r.county === 'MINNEHAHA').verdict === 'not_public' && bc.find(r => r.county === 'CASS').verdict === 'public' && bc.find(r => r.county === 'MESA').verdict === 'not_in_nad', 'a county split between public and non-public pieces is not public; only partly public states are listed; an independent city is its own entry');
ok(applicable('placed', 'MD', 'Baltimore City', new Set(['MD|BALTIMORE CITY'])), 'a NAD point in Baltimore City matches the city entry');
const m2 = matchOne(row, [c({ county: 'Adams County' }), c({ lat: '40.5861', county: 'ADAMS' })]);
ok(m2.status === 'placed' && m2.county === 'ADAMS', 'a match carries its NAD county');
ok(matchOne(row, [c({ county: 'Adams' }), c({ lat: '40.5861', county: 'Hall' })]).county === null, 'points that disagree on the county give none');

// keys and match end to end on small files
const d = mkdtempSync(join(tmpdir(), 'nad-'));
writeFileSync(join(d, 'un.csv'), 'tbl,key,address,city,state,zip\nclinics,1,710 N TURNER AVE,HASTINGS,NE,68901\nprovider_individuals,2,5 ELM ST,LANSING,MI,48933\nprovider_individuals,3,PO BOX 9,X,TX,75001\nclinics,4,99 NOPE RD,Y,TX,75001\n');
writeFileSync(join(d, 'sa.csv'), 'tbl,key,address,city,state,zip,lat,lng\nprovider_individuals,9,710 TURNER AVE,HASTINGS,NE,68901,40.5861,-98.389\n');
const run = (...a) => execFileSync('node', ['scripts/nad-dry-run.mjs', ...a], { encoding: 'utf8' });
run('keys', '--rows', join(d, 'un.csv'), '--rows', join(d, 'sa.csv'), '--out', join(d, 'keys.csv'));
const keys = readFileSync(join(d, 'keys.csv'), 'utf8').trim().split('\n');
ok(keys[0] === 'zip,house' && keys.includes('68901,710') && keys.includes('48933,5') && keys.length === 4, 'keys are the distinct ZIP and house pairs, PO boxes left out');
writeFileSync(join(d, 'c.csv'), 'num,num_pre,num_suf,pre_mod,pre_dir,pre_type,pre_sep,name,post_type,post_dir,post_mod,zip,state,lat,lng,placement,source\n' +
  '710,,,,North,,,Turner,Avenue,,,68901,NE,40.586,-98.389,Structure - Rooftop,x\n5,,,,,,,Elm,Street,,,48933,MI,42.7,-84.5,Parcel - Centroid,y\n');
writeFileSync(join(d, 'un.csv'), readFileSync(join(d, 'un.csv'), 'utf8') + 'clinics,5,"710 N TURNER AVE, STE 2",HASTINGS,IL,68901\n');
const rep = run('match', '--unplaced', join(d, 'un.csv'), '--sample', join(d, 'sa.csv'), '--cands', join(d, 'c.csv'), '--out', join(d, 'r.md'), '--placements', join(d, 'p.csv'));
const pl = readFileSync(join(d, 'p.csv'), 'utf8').trim().split('\n');
ok(pl[0] === 'tbl,key,address,zip,lat,lng' && pl.length === 2 && pl[1] === 'clinics,1,710 N TURNER AVE,68901,40.5860000,-98.3890000', 'the apply list holds only the public-state match, with its address and point');
ok(/An apply may write: \*\*1\*\*/.test(rep) && /partly public states but not applied: 1 \(county not public domain or split, 1 with no single NAD county\)/.test(rep), "the report counts what an apply may write, and the partly public match with no county is held back");
ok(/Would be placed: \*\*2\*\*/.test(rep) && /partly not public domain/.test(rep), 'two would be placed, one in a partly public state');
ok(/not public domain in the NAD \(HI, MI, NH, OR\): 1/.test(rep), 'a Michigan match is counted but left out');
ok(/no house number \(PO box, building name\): 1/.test(rep) && /nothing at this house number in the ZIP: 1/.test(rep), 'PO boxes and missing numbers are counted apart');
ok(/NAD matched 1\. Distance from the Census pin to the NAD point: median 11 m/.test(rep), 'agreement with the Census is measured in metres');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
