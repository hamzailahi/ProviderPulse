// Tests for the weekly NPPES refresh: the record rules
// (scripts/lib/nppes-refresh.mjs), the accurate-geocoding chain
// (scripts/lib/geocode-batch.mjs), and scripts/nppes-refresh.mjs end to end
// against a local fake database and fake geocoders.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileIndex, plIndex, fileRecord, apiRecord, plRecord, isDeactivated, planChunk, rowFor, changes, overLimit, weeksToApply, weeklyRange } from './lib/nppes-refresh.mjs';
import { parseCensus, censusAccepts, googleAccepts, geocodeAll } from './lib/geocode-batch.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);

// ---- an npidata_pfile header and rows ----
const HEAD = ['NPI', 'Entity Type Code', 'Provider Organization Name (Legal Business Name)', 'Provider Last Name (Legal Name)', 'Provider First Name',
  'Provider First Line Business Practice Location Address', 'Provider Second Line Business Practice Location Address',
  'Provider Business Practice Location Address City Name', 'Provider Business Practice Location Address State Name',
  'Provider Business Practice Location Address Postal Code', 'Provider Business Practice Location Address Telephone Number',
  'NPI Deactivation Date', 'NPI Reactivation Date',
  ...Array.from({ length: 15 }, (_, i) => [`Healthcare Provider Taxonomy Code_${i + 1}`, `Healthcare Provider Primary Taxonomy Switch_${i + 1}`]).flat()];
const row = o => {
  const r = HEAD.map(() => '');
  const set = (k, v) => { r[HEAD.indexOf(k)] = v; };
  set('NPI', o.npi); set('Entity Type Code', o.type || '');
  if (o.org) set('Provider Organization Name (Legal Business Name)', o.org);
  if (o.first) set('Provider First Name', o.first);
  if (o.last) set('Provider Last Name (Legal Name)', o.last);
  set('Provider First Line Business Practice Location Address', o.addr || '');
  set('Provider Business Practice Location Address City Name', o.city || '');
  set('Provider Business Practice Location Address State Name', o.state || '');
  set('Provider Business Practice Location Address Postal Code', o.zip || '');
  set('Provider Business Practice Location Address Telephone Number', o.phone || '');
  set('NPI Deactivation Date', o.deact || ''); set('NPI Reactivation Date', o.react || '');
  (o.codes || []).forEach(([c, sw], i) => { set(`Healthcare Provider Taxonomy Code_${i + 1}`, c); set(`Healthcare Provider Primary Taxonomy Switch_${i + 1}`, sw); });
  return r;
};
const display = new Map([['261QP2300X', 'Primary Care Clinic/Center'], ['207R00000X', 'Internal Medicine Physician'], ['1223G0001X', 'General Practice Dentistry']]);
const ix = fileIndex(HEAD);

// 1. Records from the file
const org = fileRecord(row({ npi: '1234567893', type: '2', org: 'Main Street Clinic, PLLC', addr: '12 main st', city: 'Collierville', state: 'TN', zip: '380171234', phone: '(901) 555-0100', codes: [['207R00000X', 'N'], ['261QP2300X', 'Y']] }), ix, display);
eq([org.type, org.name, org.address, org.city, org.zip, org.phone, org.code, org.taxonomy], [2, 'MAIN STREET CLINIC, PLLC', '12 MAIN ST', 'COLLIERVILLE', '38017', '9015550100', '261QP2300X', 'Primary Care Clinic/Center'], 'an organization takes the flagged taxonomy and capitals');
const doc = fileRecord(row({ npi: '1245319599', type: '1', first: 'jane', last: 'doe', addr: '5 OAK AVE', city: 'MEMPHIS', state: 'TN', zip: '38120', codes: [['207R00000X', '']] }), ix, display);
eq([doc.name, doc.code, doc.src, doc.phone], ['JANE DOE', '207R00000X', 'nppes_first', null], 'a clinician is FIRST LAST, first code when none flagged, no phone');
eq(fileRecord(row({ npi: '1003000126', deact: '05/01/2026' }), ix, display), { npi: '1003000126', deactivated: true }, 'a deactivated row carries only its NPI');
ok(!fileRecord(row({ npi: '1003000126', type: '1', last: 'X', deact: '05/01/2026', react: '06/01/2026', addr: '1 A', zip: '38017' }), ix, display).deactivated, 'a later reactivation means active');
ok(isDeactivated('06/01/2026', '05/01/2026'), 'a reactivation before the deactivation still means deactivated');
eq(fileRecord(row({ npi: '12345', type: '2' }), ix, display), null, 'a bad NPI is no record');
let threw = false; try { fileIndex(HEAD.slice(1)); } catch { threw = true; } ok(threw, 'a missing column stops the run');

// pl_pfile headers, with NPPES's double space
const PL = ['NPI', 'Provider Secondary Practice Location Address- Address Line 1', 'Provider Secondary Practice Location Address-  Address Line 2',
  'Provider Secondary Practice Location Address - City Name', 'Provider Secondary Practice Location Address - State Name', 'Provider Secondary Practice Location Address - Postal Code'];
const pix = plIndex(PL);
eq(plRecord(['1234567893', '1500 W Poplar Ave', 'Ste 2', 'Collierville', 'TN', '38017-1234'], pix), { npi: '1234567893', address: '1500 W Poplar Ave', address2: 'Ste 2', city: 'Collierville', state: 'TN', zip: '38017' }, 'a secondary site keeps NPPES case');

// API records match file records
const api = apiRecord({ number: '1234567893', enumeration_type: 'NPI-2', basic: { organization_name: 'Main Street Clinic, PLLC' },
  addresses: [{ address_purpose: 'MAILING', address_1: 'PO BOX 1' }, { address_purpose: 'LOCATION', address_1: '12 Main St', city: 'Collierville', state: 'TN', postal_code: '380171234', telephone_number: '901-555-0100' }],
  taxonomies: [{ code: '207R00000X', primary: false }, { code: '261QP2300X', primary: true }] }, display);
eq([api.name, api.address, api.zip, api.phone, api.code], [org.name, org.address, org.zip, org.phone, org.code], 'an API record reads like the file');
eq(apiRecord({ number: '1003000126', basic: { status: 'D' } }, display), { npi: '1003000126', deactivated: true }, 'an API deactivation');

// 2. Planning against the directory
const stored = { npi: '1234567893', name: 'MAIN STREET CLINIC, PLLC', address: '12 MAIN ST', city: 'COLLIERVILLE', state: 'TN', zip: '38017', phone: '9015550100', taxonomy_code: '261QP2300X', primary_taxonomy: 'Primary Care Clinic/Center', latitude: 35.04, longitude: -89.7 };
const ex = () => ({ clinics: new Map([['1234567893', stored]]), provider_individuals: new Map([['1003000126', { npi: '1003000126' }]]) });
let p = planChunk([org], ex());
eq([p.inserts.length, p.updates.length, p.stats.unchanged], [0, 0, 1], 'an unchanged NPI does nothing');
p = planChunk([{ ...org, phone: '9015550199' }], ex());
eq([p.updates.length, p.geocode.length, p.stats.changed_phone], [1, 0, 1], 'a new phone updates without a geocode');
p = planChunk([{ ...org, address: '99 ELM ST' }], ex());
eq([p.updates.length, p.geocode.length], [1, 1], 'a move updates and geocodes');
p = planChunk([{ ...org, phone: null, code: null }], ex());
eq(p.stats.unchanged, 1, 'a blank phone or taxonomy never counts as a change');
p = planChunk([doc], ex());
eq([p.inserts.length, p.stats.new_clinicians], [1, 1], 'a new clinician is added');
p = planChunk([{ npi: '1003000126', deactivated: true }, { npi: '1999999984', deactivated: true }], ex());
eq([p.deletes, p.stats.deactivated_not_listed], [['1003000126'], 1], 'only listed deactivations are deleted');
p = planChunk([{ ...doc, npi: '1234567893' }], ex());
eq(p.stats.type_changed_skipped, 1, 'an NPI listed under the other entity type is skipped');
p = planChunk([{ ...doc, address: null }], ex());
eq(p.stats.no_practice_address, 1, 'no practice address, no row');

// 3. Rows
let r = rowFor({ ...org, phone: '9015550199' }, stored, null, 'T');
eq([r.latitude, r.longitude, r.phone], [35.04, -89.7, '9015550199'], 'an unmoved update keeps its coordinates');
r = rowFor({ ...org, address: '99 ELM ST' }, stored, null, 'T');
eq([r.latitude, r.longitude], [null, null], 'a move with no accurate geocode is unplaced, never left at the old pin');
r = rowFor({ ...org, address: '99 ELM ST' }, stored, { lat: 35.1, lng: -89.8 }, 'T');
eq([r.latitude, r.longitude], [35.1, -89.8], 'a move takes its new coordinates');
r = rowFor(doc, null, null, 'T');
eq([r.source, r.enumeration_type, r.refreshed_at], ['nppes_weekly', 'NPI-1', 'T'], 'a new clinician row says where it came from');
ok(!('source' in rowFor(doc, { npi: doc.npi, address: '5 OAK AVE', city: 'MEMPHIS', state: 'TN', zip: '38120' }, null, 'T')), 'an update never rewrites a clinician row\'s source');
eq(changes(stored, { ...org, name: 'Main Street Clinic, Pllc' }), [], 'case is not a change');

// 4. Limits and weeks
ok(overLimit({ records: 50, deletes: 0, inserts: 0, updates: 0 }, 'weekly'), 'a tiny weekly file is refused');
ok(overLimit({ records: 90000, deletes: 30000, inserts: 0, updates: 0 }, 'weekly'), 'too many deletions are refused');
eq(overLimit({ records: 90000, deletes: 900, inserts: 9000, updates: 20000 }, 'weekly'), null, 'a normal week passes');
ok(overLimit({ records: 0, deletes: 1, inserts: 0, updates: 0 }, 'api'), 'the API sweep never deletes');
eq(weeklyRange('NPPES_Data_Dissemination_101326_101926_Weekly_V2.zip'), { start: '2026-10-13', end: '2026-10-19' }, 'week range from a name');
const names = ['NPPES_Data_Dissemination_100626_101226_Weekly.zip', 'NPPES_Data_Dissemination_100626_101226_Weekly_V2.zip', 'NPPES_Data_Dissemination_101326_101926_Weekly.zip', 'NPPES_Data_Dissemination_092926_100526_Weekly.zip'];
let w = weeksToApply(names, '2026-10-05');
eq([w.todo.map(x => x.end), w.todo[0].name.includes('_V2'), w.gap], [['2026-10-12', '2026-10-19'], true, false], 'later weeks in order, V2 preferred, no gap');
w = weeksToApply(names, '2026-09-20');
ok(w.gap, 'a missing week is a gap');
eq(weeksToApply(names, '2026-10-19').todo.length, 0, 'nothing after the newest week');
eq(weeksToApply(names, null).todo.length, 3, 'the first run takes every week on offer');

// 5. Geocoding rules
const census = parseCensus('"1","12 MAIN ST, X, TN, 38017","Match","Exact","12 MAIN ST, COLLIERVILLE, TN, 38017","-89.7,35.04","1","L"\n"2","9 ELM","No_Match"\n"3","4 OAK","Match","Non_Exact","4 OAK ST, MEMPHIS, TN, 38120","-90,35","1","R"\n');
ok(censusAccepts(census.get('1'), '38017'), 'Census exact in the same ZIP counts');
ok(!censusAccepts(census.get('1'), '38120'), 'Census in another ZIP does not');
ok(!censusAccepts(census.get('3'), '38120'), 'Census non-exact does not');
ok(!censusAccepts(census.get('2'), '38017'), 'no match does not');
const gres = (type, zip, partial) => ({ status: 'OK', results: [{ partial_match: partial, geometry: { location_type: type, location: { lat: 1, lng: 2 } }, address_components: [{ types: ['postal_code'], short_name: zip }] }] });
ok(googleAccepts(gres('ROOFTOP', '38017'), '38017'), 'Google rooftop counts');
ok(!googleAccepts(gres('APPROXIMATE', '38017'), '38017'), 'Google approximate (a ZIP or city centre) does not');
ok(!googleAccepts(gres('ROOFTOP', '38018'), '38017'), 'Google in another ZIP does not');
ok(!googleAccepts(gres('ROOFTOP', '38017', true), '38017'), 'a Google partial match does not');

const items = [{ id: 'a', address: '12 MAIN ST', city: 'C', state: 'TN', zip: '38017' }, { id: 'b', address: '4 OAK', city: 'M', state: 'TN', zip: '38120' }];
const fakeFetch = (censusText, googleBody) => async (url) => {
  if (String(url).includes('census')) { if (censusText === null) throw new Error('down'); return new Response(censusText); }
  return new Response(JSON.stringify(googleBody));
};
let g = await geocodeAll(items, { fetch: fakeFetch('"a","x","Match","Exact","12 MAIN ST, C, TN, 38017","-89.7,35.04"\n"b","x","Match","Non_Exact","4 OAK, M, TN, 38120","-90,35"\n', gres('ROOFTOP', '38120')), googleKey: 'k', censusUrl: 'http://census', googleUrl: 'http://google' });
eq([g.coords.get('a').how, g.coords.get('b').how, g.stats.unplaced], ['census_exact', 'google', 0], 'Census exact first, Google for the non-exact');
g = await geocodeAll(items, { fetch: fakeFetch('"a","x","No_Match"\n"b","x","No_Match"\n', null), censusUrl: 'http://census' });
eq([g.coords.size, g.stats.unplaced, g.stats.google_not_configured, g.failed.size], [0, 2, 2, 0], 'no Google key: unmatched addresses stay unplaced');
g = await geocodeAll(items, { fetch: fakeFetch(null, null), censusUrl: 'http://census' });
eq([g.failed.size, g.stats.unplaced], [2, 0], 'a Census outage is a failure, not "unplaced"');

// 6. End to end against a fake database and geocoders
const db = {
  clinics: [{ ...stored }],
  provider_individuals: [{ npi: '1003000126', name: 'OLD DOC', address: '1 A ST', city: 'X', state: 'TN', zip: '38017', latitude: 1, longitude: 2 }],
  clinic_secondary_locations: [{ parent_npi: '1003000126', address: '2 B ST', zip: '38017' }],
  provider_profiles: [], provider_npis: []
};
const posted = [];
const inList = (q, col) => { const m = new RegExp('(?:^|[?&])' + col + '=in\\.\\(([^)]*)\\)').exec(q); return m ? m[1].split(',') : null; };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  let body = ''; for await (const c of req) body += c;
  if (u.pathname === '/census') {
    const out = [];
    for (const line of body.split('\n')) {
      const m = /^(p\d+|s\d+),([^,]*),/.exec(line.trim());
      if (!m) continue;
      out.push(/MAIN|ELM/i.test(m[2]) ? `"${m[1]}","x","Match","Exact","${m[2]}, X, TN, ${/ELM/.test(m[2]) ? '38017' : '38120'}","-89.9,35.1","1","L"` : `"${m[1]}","x","No_Match"`);
    }
    return res.end(out.join('\n'));
  }
  const table = u.pathname.replace('/rest/v1/', '');
  const q = decodeURIComponent(u.search);
  if (!db[table]) { res.statusCode = 404; return res.end('[]'); }
  if (req.method === 'GET') {
    const npis = inList(q, 'npi'), parents = inList(q, 'parent_npi');
    const rows = db[table].filter(r => (npis ? npis.includes(r.npi) : true) && (parents ? parents.includes(r.parent_npi) : true));
    return res.end(JSON.stringify(rows));
  }
  if (req.method === 'DELETE') {
    const npis = inList(q, 'npi'), parents = inList(q, 'parent_npi');
    db[table] = db[table].filter(r => !((npis && npis.includes(r.npi)) || (parents && parents.includes(r.parent_npi))));
    res.statusCode = 204; return res.end();
  }
  if (req.method === 'POST') {
    const rows = JSON.parse(body); posted.push([table, rows]);
    const key = table === 'clinic_secondary_locations' ? r => `${r.parent_npi}|${r.address}|${r.zip}` : r => r.npi;
    for (const r of rows) {
      const i = db[table].findIndex(x => key(x) === key(r));
      if (i >= 0) db[table][i] = { ...db[table][i], ...r }; else db[table].push(r);
    }
    res.statusCode = 201; return res.end();
  }
  res.statusCode = 405; res.end();
});
await new Promise(r => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;
const dir = mkdtempSync(join(tmpdir(), 'nppes-refresh-'));
const csv = rows => rows.map(r => r.map(v => /[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n') + '\n';
const fileRows = [HEAD,
  row({ npi: '1234567893', type: '2', org: 'MAIN STREET CLINIC, PLLC', addr: '99 ELM ST', city: 'COLLIERVILLE', state: 'TN', zip: '38017', phone: '9015550100', codes: [['261QP2300X', 'Y']] }),
  row({ npi: '1245319599', type: '1', first: 'JANE', last: 'DOE', addr: '5 OAK AVE', city: 'MEMPHIS', state: 'TN', zip: '38120', codes: [['207R00000X', 'Y']] }),
  row({ npi: '1679576722', type: '2', org: 'NEW DENTAL PC', addr: '7 MAIN ST', city: 'MEMPHIS', state: 'TN', zip: '38120', codes: [['1223G0001X', 'Y']] }),
  row({ npi: '1003000126', deact: '10/14/2026' })];
writeFileSync(join(dir, 'np.csv'), csv(fileRows));
writeFileSync(join(dir, 'pl.csv'), csv([PL, ['1679576722', '8 Main St', '', 'Memphis', 'TN', '38120']]));
const run = (extra) => new Promise(resolve => {
  const c = spawn(process.execPath, ['scripts/nppes-refresh.mjs', '--mode', 'file', '--npidata', join(dir, 'np.csv'), '--pl', join(dir, 'pl.csv'),
    '--plan', join(dir, 'plan.jsonl'), '--summary', join(dir, 'sum.md'), '--state', join(dir, 'state.json'), '--week-end', '2026-10-19', ...extra],
    { env: { ...process.env, SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: 'k', CENSUS_GEOCODER_URL: base + '/census', GOOGLE_GEOCODING_KEY: '', NPPES_API_BASE: base + '/api' } });
  let err = ''; c.stderr.on('data', d => { err += d; }); c.stdout.on('data', () => {});
  c.on('close', code => resolve({ code, err }));
});
// A weekly file this small is under the limit, so the first run must refuse.
let res = await run([]);
ok(res.code !== 0 && /refusing to write/.test(res.err), 'a 4-record "weekly" file is refused');
eq(db.clinics.length, 1, 'nothing written when refused');
// Then the same file with the weekly floor lowered for the test (LIMITS is
// a shared object, so the script sees the change).
res = await new Promise(resolve => {
  const c = spawn(process.execPath, ['--input-type=module', '-e', `
    import * as L from './scripts/lib/nppes-refresh.mjs';
    L.LIMITS.weekly.min_records = 1;
    process.argv = [process.argv[0], 'x', ...${JSON.stringify(['--mode', 'file', '--npidata', join(dir, 'np.csv'), '--pl', join(dir, 'pl.csv'), '--plan', join(dir, 'plan.jsonl'), '--summary', join(dir, 'sum.md'), '--state', join(dir, 'state.json'), '--week-end', '2026-10-19', '--history', join(dir, 'h.csv')])}];
    await import('./scripts/nppes-refresh.mjs');`],
    { env: { ...process.env, SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: 'k', CENSUS_GEOCODER_URL: base + '/census', GOOGLE_GEOCODING_KEY: '' } });
  let err = ''; c.stderr.on('data', d => { err += d; }); c.stdout.on('data', () => {});
  c.on('close', code => resolve({ code, err }));
});
ok(res.code === 0, 'the run succeeds: ' + res.err.slice(-300));
const byNpi = (t, n) => db[t].find(r => r.npi === n);
eq([byNpi('clinics', '1234567893').address, byNpi('clinics', '1234567893').latitude], ['99 ELM ST', 35.1], 'the moved clinic has its new address and an exact geocode');
eq(byNpi('provider_individuals', '1245319599') && [byNpi('provider_individuals', '1245319599').latitude, byNpi('provider_individuals', '1245319599').source], [null, 'nppes_weekly'], 'a new clinician with no exact match is stored unplaced');
eq(byNpi('clinics', '1679576722') && [byNpi('clinics', '1679576722').name, byNpi('clinics', '1679576722').primary_taxonomy], ['NEW DENTAL PC', 'General Practice Dentistry'], 'a new organization is added with its NUCC name');
ok(!byNpi('provider_individuals', '1003000126') && !db.clinic_secondary_locations.some(r => r.parent_npi === '1003000126'), 'the deactivated NPI is gone from every table');
const site = db.clinic_secondary_locations.find(r => r.parent_npi === '1679576722');
eq(site && [site.name, site.entity_type, site.latitude, site.source], ['NEW DENTAL PC', '2', 35.1, 'nppes_weekly'], 'its secondary site is added, inheriting the name');
const st = existsSync(join(dir, 'state.json')) ? JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')) : {};
eq(st.last_week_end, '2026-10-19', 'the state records the week');
ok(/Added: 1 organizations, 1 clinicians, 1 secondary sites/.test(readFileSync(join(dir, 'sum.md'), 'utf8')), 'the summary counts what changed');
ok(readFileSync(join(dir, 'h.csv'), 'utf8').split('\n').length === 3, 'one history line per run');
const before = posted.length;
res = await new Promise(resolve => {
  const c = spawn(process.execPath, ['--input-type=module', '-e', `
    import * as L from './scripts/lib/nppes-refresh.mjs';
    L.LIMITS.weekly.min_records = 1;
    process.argv = [process.argv[0], 'x', ...${JSON.stringify(['--mode', 'file', '--npidata', join(dir, 'np.csv'), '--pl', join(dir, 'pl.csv'), '--plan', join(dir, 'plan.jsonl'), '--state', join(dir, 'state.json')])}];
    await import('./scripts/nppes-refresh.mjs');`],
    { env: { ...process.env, SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: 'k', CENSUS_GEOCODER_URL: base + '/census', GOOGLE_GEOCODING_KEY: '' } });
  c.stderr.on('data', () => {}); c.stdout.on('data', () => {}); c.on('close', code => resolve({ code }));
});
// Everything now matches the database, so nothing is written again.
eq([res.code, posted.length - before], [0, 0], 'a rerun of the same file writes nothing');
server.close();

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
