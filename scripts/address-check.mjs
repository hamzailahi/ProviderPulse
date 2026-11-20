// Address check, dry run (2026-11-20, the user's report: searched doctors show
// in states they left years ago; Furhan Yunus listed in New Orleans now
// practises in Mobile, AL; Musaid Khan listed in Charlotte now practises in
// Jersey City, NJ). Our clinician listings come from NPPES, which clinicians
// rarely update. CMS's Doctors and Clinicians file is Medicare enrollment,
// refreshed monthly. This compares the two per NPI and reports counts only.
// Absence from the CMS file never means inactive (Medicare-enrolled only).
// node scripts/address-check.mjs --ours F --secondary F --report F --csv F [--check npi,npi]
//   [--moves F --sites F --restore F --release-out F]  (files for scripts/address-apply.sh)
// --ours rows: npi, NPPES state, NPPES zip, city, taxonomy_code, address_source
// (the NPPES address even when the displayed one is Medicare's, so a
// clinician who moves back is restored).
import { readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { createRequire } from 'node:module';
import { splitCsv } from './lib/dac.mjs';
const require = createRequire(import.meta.url);
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const HDRS = { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)', Accept: 'application/json,text/csv,*/*' };
const check = new Set(String(arg('check') || '').split(',').map(s => s.trim()).filter(Boolean));
const z5 = v => String(v || '').replace(/\D/g, '').slice(0, 5).padStart(5, '0');

// Our NPI-1 listings: npi, state, zip, city, taxonomy_code
const ours = new Map();
for (const l of readFileSync(arg('ours'), 'utf8').split('\n')) {
  if (!l) continue; const [npi, st, zip, city, code, src] = splitCsv(l);
  if (/^\d{10}$/.test(npi)) ours.set(npi, { st: (st || '').toUpperCase(), zip: z5(zip), city, code, medicare: src === 'medicare' });
}
const sec = new Map();   // NPPES secondary sites: npi -> set of states
for (const l of readFileSync(arg('secondary'), 'utf8').split('\n')) {
  if (!l) continue; const [npi, st] = splitCsv(l); if (!npi) continue;
  (sec.get(npi) || sec.set(npi, new Set()).get(npi)).add((st || '').toUpperCase());
}
console.log('our clinicians', ours.size, 'with NPPES secondary sites', sec.size);

async function getJson(u) {
  for (let i = 0; i < 4; i++) { const r = await fetch(u, { headers: HDRS }); const t = await r.text(); try { return JSON.parse(t); } catch { console.log('metastore try', i + 1, r.status); } await new Promise(z => setTimeout(z, 5000 * (i + 1))); }
  throw new Error('CMS metastore did not answer');
}
const meta = await getJson('https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/mj5m-pzi6?show-reference-ids=false');
const dist = (meta.distribution || []).find(d => /csv/i.test(d.mediaType || d.format || d.downloadURL || '')) || meta.distribution[0];
const url = dist.downloadURL || (dist.data && dist.data.downloadURL);
const release = String(meta.modified || '').slice(0, 10);
console.log('CMS Doctors and Clinicians', release, url);
const res = await fetch(url, { headers: HDRS });
if (!res.ok) throw new Error('download ' + res.status);

const dac = new Map(); let header = null, col = {}, rows = 0;
const pick = (...names) => { for (const n of names) if (col[n] != null) return col[n]; return null; };
let iNpi, iSt, iZip, iCity, iAdr, iFac;
for await (const line of readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity })) {
  if (!header) {
    header = splitCsv(line).map(h => h.trim().toLowerCase()); header.forEach((h, i) => { col[h] = i; });
    iNpi = pick('npi'); iSt = pick('state', 'st'); iZip = pick('zip code', 'zip_code', 'zip'); iCity = pick('citytown', 'city/town', 'cty', 'city'); iAdr = pick('adr_ln_1'); iFac = pick('facility name', 'facility_name', 'org_nm');
    console.log('columns:', header.join(' | '));
    if (iNpi == null || iSt == null || iZip == null) throw new Error('needed column missing (npi, state, zip)');
    continue;
  }
  const r = splitCsv(line); const npi = String(r[iNpi] || '').trim(); if (!ours.has(npi)) continue;
  rows++;
  const a = { st: String(r[iSt] || '').trim().toUpperCase(), zip: z5(r[iZip]), city: iCity == null ? '' : String(r[iCity]).trim(), adr: iAdr == null ? '' : String(r[iAdr]).trim().toUpperCase(), fac: iFac == null ? '' : String(r[iFac]).trim(), n: 1 };
  const list = dac.get(npi) || dac.set(npi, []).get(npi);
  const same = list.find(x => x.st === a.st && x.zip === a.zip && x.adr === a.adr);
  if (same) same.n++; else if (list.length < 20) list.push(a);
}
console.log('CMS rows for our clinicians', rows, 'NPIs', dac.size);

const K = ['confirmed_zip', 'same_state_other_zip', 'other_state_only', 'other_state_but_nppes_lists_it', 'not_in_medicare_file'];
const tally = Object.fromEntries(K.map(k => [k, 0]));
const byState = new Map(), bySpec = new Map();
const csv = createWriteStream(arg('csv'));
const out = k => (arg(k) ? createWriteStream(arg(k)) : null);
const moves = out('moves'), sites = out('sites'), restore = out('restore');
const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
let nMoves = 0, nSites = 0, nRestore = 0;
// The Medicare address a moved clinician is shown at: the one CMS lists most
// often (one row per group they bill through), else the first.
const best = list => list.filter(x => x.adr && x.zip !== '00000').sort((a, b) => b.n - a.n)[0] || null;
csv.write('npi,class,our_state,our_zip,medicare_states,medicare_zips,single_medicare_address\n');
for (const [npi, o] of ours) {
  const list = dac.get(npi);
  let cls;
  if (!list) cls = 'not_in_medicare_file';
  else if (list.some(x => x.zip === o.zip)) cls = 'confirmed_zip';
  else if (list.some(x => x.st === o.st)) cls = 'same_state_other_zip';
  else cls = list.some(x => (sec.get(npi) || new Set()).has(x.st)) ? 'other_state_but_nppes_lists_it' : 'other_state_only';
  tally[cls]++;
  const bs = byState.get(o.st) || byState.set(o.st, Object.fromEntries(K.map(k => [k, 0]))).get(o.st); bs[cls]++;
  const t = TaxonomyMap.get(o.code); const sp = (t && t.patientSpecialties && t.patientSpecialties[0]) || '(no specialty)';
  const bp = bySpec.get(sp) || bySpec.set(sp, Object.fromEntries(K.map(k => [k, 0]))).get(sp); bp[cls]++;
  if (cls.startsWith('other_state') || cls === 'same_state_other_zip') {
    const sts = [...new Set(list.map(x => x.st))], zs = [...new Set(list.map(x => x.zip))];
    csv.write([npi, cls, o.st, o.zip, sts.join(' '), zs.join(' '), zs.length === 1 ? 'yes' : 'no'].join(',') + '\n');
  }
  const isMove = cls === 'other_state_only' || cls === 'other_state_but_nppes_lists_it';
  if (isMove && moves) { const b = best(list); if (b) { moves.write([npi, q(b.adr), q(b.city), b.st, b.zip, q(b.fac)].join(',') + '\n'); nMoves++; } }
  if (!isMove && o.medicare && restore) { restore.write(npi + '\n'); nRestore++; }
  if (cls === 'same_state_other_zip' && sites) for (const x of list) if (x.adr && x.zip !== o.zip) { sites.write([npi, q(x.adr), q(x.city), x.st, x.zip, q(x.fac)].join(',') + '\n'); nSites++; }
  if (check.has(npi)) console.log('CHECK', npi, cls, 'ours', o.st, o.zip, '| Medicare:', (list || []).map(x => [x.adr, x.city, x.st, x.zip, x.fac].filter(Boolean).join(', ')).join(' || ') || 'none');
}
csv.end(); for (const w of [moves, sites, restore]) if (w) w.end();
if (arg('release-out')) writeFileSync(arg('release-out'), release);
console.log('moves', nMoves, 'other-office rows', nSites, 'restores', nRestore);
const n = ours.size, enrolled = n - tally.not_in_medicare_file, pc = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const L = ['# Clinician address check (dry run)', '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/address-check.mjs. Read only; nothing in the directory changed.`, '',
  `Our clinician listings (NPPES NPI-1) compared with CMS Doctors and Clinicians (Medicare enrollment), release ${release}. Only Medicare-enrolled clinicians can be checked; absence from the CMS file never means inactive.`, '',
  '| Result | Clinicians | Share of all | Share of those in Medicare |', '|---|---|---|---|',
  ...K.map(k => `| ${k.replace(/_/g, ' ')} | ${tally[k].toLocaleString()} | ${pc(tally[k], n)} | ${k === 'not_in_medicare_file' ? '' : pc(tally[k], enrolled)} |`), '',
  '"other state only": every Medicare enrollment address is in a state our listing does not show, and NPPES lists no secondary site there. These are the likeliest moves.', '',
  '## By listed state (other state only, share of those in Medicare)', '', '| State | In Medicare | Other state only | Share |', '|---|---|---|---|',
  ...[...byState].filter(([s]) => s).map(([s, b]) => [s, b, Object.entries(b).filter(([k]) => k !== 'not_in_medicare_file').reduce((a, [, v]) => a + v, 0)]).sort((a, b) => b[1].other_state_only - a[1].other_state_only)
    .map(([s, b, e]) => `| ${s} | ${e.toLocaleString()} | ${b.other_state_only.toLocaleString()} | ${pc(b.other_state_only, e)} |`), '',
  '## By specialty', '', '| Specialty | In Medicare | Confirmed ZIP | Other ZIP same state | Other state only |', '|---|---|---|---|---|',
  ...[...bySpec].map(([s, b]) => [s, b, Object.entries(b).filter(([k]) => k !== 'not_in_medicare_file').reduce((a, [, v]) => a + v, 0)]).filter(x => x[2] >= 500).sort((a, b) => b[2] - a[2])
    .map(([s, b, e]) => `| ${s} | ${e.toLocaleString()} | ${pc(b.confirmed_zip, e)} | ${pc(b.same_state_other_zip, e)} | ${pc(b.other_state_only, e)} |`), ''];
L.push('## What the apply step would do', '', `- Show the Medicare address for ${nMoves.toLocaleString()} clinicians whose Medicare enrollment is only in other states (the NPPES address is kept beside it).`,
  `- List ${nSites.toLocaleString()} other Medicare offices for clinicians in the right state but another ZIP ("also practises at").`,
  `- Put the NPPES address back for ${nRestore.toLocaleString()} clinicians shown at a Medicare address who no longer qualify.`, '');
writeFileSync(arg('report'), L.join('\n'));
console.log(L.slice(0, 16).join('\n'));
