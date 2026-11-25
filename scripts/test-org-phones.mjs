// Phone rules and the NPI Registry API crawler: which numbers are usable,
// which rows change (scripts/lib/phones.mjs, also used by the fax backfill),
// and the API pass on a fake API (the 1,200-record ceiling, ZIP+4 splits,
// failures never empty) and its pacer (scripts/lib/nppes-api-phones.mjs, used
// by the weekly NPPES refresh). The one-off organization phone backfill that
// first used them was removed 2026-11-25; its scripts' end-to-end tests went
// with it.
//
// node scripts/test-org-phones.mjs
import { cleanPhone, phoneChanges } from './lib/phones.mjs';
import { apiError, collectPhones, makePacer, recordPhone } from './lib/nppes-api-phones.mjs';

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

console.log('1. Usable numbers');
check('10 digits pass', cleanPhone('8175550123') === '8175550123');
check('a leading 1 is dropped', cleanPhone('18175550123') === '8175550123');
check('punctuation is ignored', cleanPhone('(817) 555-0123') === '8175550123');
check('too short or with an extension is dropped', cleanPhone('5550123') === null && cleanPhone('81755501231234') === null);
check('an area code starting 0 or 1 is not a US number', cleanPhone('0175550123') === null && cleanPhone('1175550123') === null);
check('an exchange starting 0 or 1 is not a US number', cleanPhone('8171550123') === null);
check('a repeated digit is a placeholder', cleanPhone('9999999999') === null);

console.log('\n2. Which rows change');
const r = phoneChanges([['1000000001', ''], ['1000000002', '8175550123'], ['1000000003', '8175550000'], ['1000000004', '']],
  [['1000000001', '8175551111'], ['1000000002', '8175550123'], ['1000000003', '8175559999']]);
check('a new phone and a changed phone are written', r.changes.map(c => c[0]).join() === '1000000001,1000000003');
check('a phone already right is skipped', r.stats.already_right === 1);
check('no NPPES phone leaves the row alone (never blanked)', r.stats.no_nppes_phone === 1 && !r.changes.some(c => c[0] === '1000000004'));

console.log('\n3. NPI Registry API pass (fake API)');
// An organization record as the API returns it.
const org = (npi, zip9, phone, extra = {}) => ({ number: npi, enumeration_type: 'NPI-2', basic: { status: 'A' },
  addresses: [{ address_purpose: 'MAILING', postal_code: '999990000', telephone_number: '800-555-0000' },
    { address_purpose: 'LOCATION', postal_code: zip9, telephone_number: phone }], ...extra });
const npiOf = i => String(1100000000 + i);
// 76117: three organizations. 10001: 1,500, over the ceiling; the last 50 carry
// a bare 5-digit ZIP, so no ZIP+4 range finds them. 99999 fails every time.
const world = [org('1000000011', '761170001', '817-555-0101'), org('1000000012', '761171234', ''),
  org('1000000013', '761172000', '817-555-0103', { basic: { status: 'D' } })];
for (let i = 0; i < 1500; i++) world.push(org(npiOf(i), i >= 1450 ? '10001' : '10001' + String(i % 10) + String(Math.floor(i / 10) % 10) + '00', '212-555-' + String(1000 + i)));
const matches = (rec, pc) => { const z = rec.addresses[1].postal_code; return pc.endsWith('*') ? z.startsWith(pc.slice(0, -1)) && z.length === 9 : z.slice(0, 5) === pc; };
const fakeApi = ({ refuseWildcard = false, down = false } = {}) => {
  const calls = [];
  const get = async p => {
    calls.push(p);
    if (down || p.postal_code === '99999') throw new Error('HTTP 503');
    if (p.number) return { results: world.filter(r => r.number === p.number) };
    if (refuseWildcard && p.postal_code.endsWith('*')) throw new Error('Field postal_code: wildcard not allowed');
    const all = world.filter(r => matches(r, p.postal_code));
    return { results: all.slice(p.skip, p.skip + 200) };
  };
  return { get, calls };
};
const dirZips = [['10001', world.slice(3).map(r => r.number)], ['76117', ['1000000011', '1000000012', '1000000013', '1000000099']], ['99999', ['1000000098']]];

check('an Errors answer is a failure, not an empty ZIP', apiError({ Errors: [{ description: 'bad postal code' }] }) === 'bad postal code' && apiError({ results: [] }) === null && apiError({}) === 'no results array');
check('the practice (LOCATION) phone is used, not the mailing one', recordPhone(world[0]).phone === '8175550101');
check('no phone and deactivated are told apart', recordPhone(world[1]).why === 'no_phone' && recordPhone(world[2]).why === 'deactivated');
check('an individual record is ignored', recordPhone({ number: '1000000001', enumeration_type: 'NPI-1' }).npi === null);

let api = fakeApi();
let res = await collectPhones(dirZips, api.get, { concurrency: 2 });
check('every organization in an overflowing ZIP is found (ranges, then one by one)', [...Array(1500).keys()].every(i => res.phones.get(npiOf(i)) === '212555' + String(1000 + i)), `found ${res.phones.size}`);
check('the overflow is counted and only the leftovers are looked up singly', res.stats.overflow_zips === 1 && res.stats.single_lookups === 50, JSON.stringify(res.stats));
check('a small ZIP takes one query', api.calls.filter(c => c.postal_code === '76117').length === 1);
check('a failed ZIP is reported as failed, never as empty', res.stats.zips_failed === 1 && res.failed[0][0] === '99999');
check('counts: phones, none listed, deactivated', res.stats.with_phone === 1501 && res.stats.no_phone === 1 && res.stats.deactivated === 1, JSON.stringify(res.stats));

api = fakeApi({ refuseWildcard: true });
res = await collectPhones(dirZips.slice(0, 1), api.get, { concurrency: 3 });
check('a refused ZIP+4 range falls back to one-by-one lookups', res.stats.split_failed_zips === 1 && res.phones.size === 1500 && res.stats.single_lookups === 300, JSON.stringify(res.stats));
res = await collectPhones(dirZips.slice(0, 1), fakeApi({ refuseWildcard: true }).get, { maxSingle: 100 });
check('one-by-one lookups stop at the cap and say so', res.stats.single_skipped_cap === 200 && res.phones.size === 1300);

let t = 0;
res = await collectPhones(dirZips, fakeApi().get, { concurrency: 1, deadline: 1, now: () => t++ });
check('the time budget stops new ZIPs and counts the rest as not reached', res.stats.zips_not_reached > 0 && res.stats.zips_done + res.stats.zips_failed + res.stats.zips_not_reached === 3, JSON.stringify(res.stats));
const many = Array.from({ length: 300 }, (_, i) => [String(20000 + i), []]);
let stopped = false;
try { await collectPhones(many, fakeApi({ down: true }).get, { concurrency: 4 }); } catch (e) { stopped = /failing/.test(e.message); }
check('an API that is down ends the run early instead of reading as no phones', stopped);

console.log('\n4. Pacing (fake clock)');
let clock = 0;
const fakeSleep = async ms => { clock += ms; };
let pacer = makePacer({ startRate: 4, rate: 6, pauseMs: 60000, growEvery: 3, now: () => clock, sleep: fakeSleep });
for (let i = 0; i < 5; i++) await pacer.slot();
check('requests are spaced at the pace (4 a second: 5 starts take 1 second)', clock === 1000, String(clock));
pacer.refused(403); pacer.refused(403); pacer.refused(429);
check('refusals during a pause count once', pacer.pauses === 1 && pacer.refusals === 3 && pacer.rate === 2, `${pacer.pauses} ${pacer.refusals} ${pacer.rate}`);
const before = clock; await pacer.slot();
check('a refusal pauses everyone for a minute and halves the pace', clock - before >= 59000 && pacer.rate === 2, `${clock - before} ${pacer.rate}`);
for (let i = 0; i < 3; i++) pacer.ok();
check('a run of answers earns speed back', pacer.rate === 2.5);
for (let i = 0; i < 30; i++) pacer.ok();
check('never faster than the ceiling', pacer.rate === 6);
pacer = makePacer({ startRate: 4, maxPauses: 3, pauseMs: 1000, now: () => clock, sleep: fakeSleep });
for (let i = 0; i < 4; i++) { pacer.refused(403); clock += 5000; }
check('pause after pause with no answer stops the run', pacer.blocked === true);
t = 0;
res = await collectPhones(dirZips, fakeApi().get, { concurrency: 1, stop: () => true });
check('a stopped run keeps what it has and counts the rest as not reached', res.stats.zips_not_reached === 3 && res.stats.zips_failed === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
