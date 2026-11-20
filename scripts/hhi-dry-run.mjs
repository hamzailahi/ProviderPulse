// node scripts/hhi-dry-run.mjs --areas "Memphis:380,381;Fort Worth:760,761" --report F
// Step 7 dry run (2026-11-20). Read only, no database. Market concentration
// (HHI) per area and CMS specialty, two ways: by Medicare group (org_pac_id in
// CMS Doctors and Clinicians) and by health system (the clinician's hospitals,
// CMS Facility Affiliation file, joined by CCN to AHRQ's 2023 Compendium).
// Shown as a fact, never scored.
import { writeFileSync, existsSync, statSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { splitCsv } from './lib/dac.mjs';
import { hhi, band, mode, firmOf, top } from './lib/hhi.mjs';

const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const areas = (arg('areas') || 'Memphis:380,381;Fort Worth:760,761').split(';').map(s => { const [n, z] = s.split(':'); return { name: n.trim(), zip3: new Set(z.split(',').map(x => x.trim())) }; });
const areaOf = (zip) => { const z3 = String(zip || '').slice(0, 3); return areas.find(a => a.zip3.has(z3)); };
const HDRS = { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)', Accept: 'application/json,text/csv,*/*' };

async function cmsUrl(id) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/${id}?show-reference-ids=false`, { headers: HDRS });
    try { const m = JSON.parse(await r.text()); const d = m.distribution.find(x => /csv/i.test(x.mediaType || x.downloadURL || '')) || m.distribution[0]; return { url: d.downloadURL || d.data.downloadURL, release: String(m.modified || '').slice(0, 10), title: m.title }; } catch { console.log(id, 'metastore try', i + 1); }
    await new Promise(z => setTimeout(z, 5000 * (i + 1)));
  }
  throw new Error('CMS metastore did not answer for ' + id);
}
async function* rows(url) {
  const res = await fetch(url, { headers: HDRS }); if (!res.ok) throw new Error('download ' + res.status + ' ' + url);
  let header = null;
  for await (const line of readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity })) {
    if (!header) { header = splitCsv(line).map(h => h.trim().toLowerCase()); continue; }
    const r = splitCsv(line); const o = {}; header.forEach((h, i) => { o[h] = r[i]; }); yield o;
  }
}
const pick = (o, re) => { for (const k in o) if (re.test(k)) return k; return null; };

// 1. Clinicians in the areas, from Doctors and Clinicians.
const dac = await cmsUrl('mj5m-pzi6'); console.log('DAC', dac.release);
const clin = new Map(); const groupName = new Map(); let K = null;
for await (const o of rows(dac.url)) {
  if (!K) K = { npi: pick(o, /^npi$/), zip: pick(o, /zip/), spec: pick(o, /^pri_spec$/), org: pick(o, /^org_pac_id$/), fac: pick(o, /facility.?name|^org_nm$/) };
  const a = areaOf(o[K.zip]); if (!a) continue;
  const key = a.name + '|' + o[K.npi];
  let c = clin.get(key); if (!c) clin.set(key, c = { npi: o[K.npi], area: a.name, spec: o[K.spec], groups: [], ccns: [] });
  if (o[K.org]) { c.groups.push(o[K.org]); if (o[K.fac] && !groupName.has(o[K.org])) groupName.set(o[K.org], o[K.fac]); }
}
for (const c of clin.values()) c.group = mode(c.groups);
console.log('columns', K, 'clinicians in areas', clin.size);
const byNpi = new Map(); for (const c of clin.values()) { if (!byNpi.has(c.npi)) byNpi.set(c.npi, []); byNpi.get(c.npi).push(c); }

// 2. Hospital affiliations.
const fa = await cmsUrl('27ea-46a8'); console.log('Facility affiliation', fa.release, fa.title);
let FK = null, affRows = 0, hospRows = 0;
for await (const o of rows(fa.url)) {
  if (!FK) { FK = { npi: pick(o, /^npi$/), type: pick(o, /facility_type$/), ccn: pick(o, /affiliations?_certification/) || pick(o, /certification/) }; console.log('affiliation columns', Object.keys(o).join(','), FK); }
  affRows++; const cs = byNpi.get(o[FK.npi]); if (!cs) continue;
  if (!/hospital/i.test(o[FK.type] || '')) continue;
  hospRows++; for (const c of cs) c.ccns.push(String(o[FK.ccn] || '').padStart(6, '0'));
}

// 3. AHRQ hospital linkage (CCN to system). Direct, else the archive's copy.
const ahrq = 'https://www.ahrq.gov/sites/default/files/wysiwyg/chsp/compendium/chsp-hospital-linkage-2023.csv';
const f = '/tmp/ahrq-hosp.csv';
const okF = () => existsSync(f) && statSync(f).size > 100000 && !/<html/i.test(readFileSync(f, 'utf8').slice(0, 500));
for (const u of [ahrq, 'https://web.archive.org/web/2026id_/' + ahrq]) { if (okF()) break; try { execSync(`curl -sSL --retry 3 -A "Mozilla/5.0" -o ${f} "${u}"`); } catch {} }
if (!okF()) throw new Error('AHRQ hospital linkage did not download');
const sysOf = new Map(), sysName = new Map();
const lines = readFileSync(f, 'utf8').split(/\r?\n/); const h = splitCsv(lines[0]).map(x => x.trim().toLowerCase());
const ix = (n) => h.indexOf(n);
for (const l of lines.slice(1)) { if (!l) continue; const r = splitCsv(l); const id = r[ix('health_sys_id')]; if (!id) continue; sysOf.set(String(r[ix('ccn')]).padStart(6, '0'), id); sysName.set(id, r[ix('health_sys_name')]); }
console.log('AHRQ hospitals in a system', sysOf.size);

// 4. HHI per area and specialty.
const out = [`# Market concentration (HHI): dry run`, '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/hhi-dry-run.mjs. Read only; nothing written to the database.`, '',
  `- Clinicians: CMS Doctors and Clinicians (released ${dac.release}), Medicare-enrolled only, placed in an area by any practice address there.`,
  `- Group: the clinician's most frequent Medicare group (org_pac_id) in the area; no group means a solo practice, its own firm.`,
  `- System: the AHRQ 2023 Compendium system of the clinician's affiliated hospitals (CMS Facility Affiliation, released ${fa.release}; ${affRows.toLocaleString()} rows, ${hospRows.toLocaleString()} hospital links for these clinicians); no system falls back to the group.`,
  `- HHI is the sum of squared percentage shares of clinicians (0 to 10,000). DOJ/FTC 2023 guidelines: over 1,800 highly concentrated, 1,000 to 1,800 moderate. Specialties with fewer than 20 clinicians are left out.`, ''];
for (const a of areas) {
  const specs = new Map();
  for (const c of clin.values()) if (c.area === a.name && c.spec) { if (!specs.has(c.spec)) specs.set(c.spec, []); specs.get(c.spec).push(c); }
  const all = [...clin.values()].filter(c => c.area === a.name);
  const withSys = all.filter(c => firmOf(c, sysOf).system.startsWith('S')).length;
  out.push(`## ${a.name} (ZIP3 ${[...a.zip3].join(', ')})`, '', `${all.length.toLocaleString()} clinicians; ${withSys.toLocaleString()} (${(100 * withSys / (all.length || 1)).toFixed(0)}%) tied to a health system through a hospital.`, '',
    '| Specialty | Clinicians | HHI by group | HHI by system | Largest systems or groups (share) |', '|---|---|---|---|---|');
  for (const [spec, cs] of [...specs].sort((x, y) => y[1].length - x[1].length)) {
    if (cs.length < 20) continue;
    const g = new Map(), s = new Map();
    for (const c of cs) { const fm = firmOf(c, sysOf); g.set(fm.group, (g.get(fm.group) || 0) + 1); s.set(fm.system, (s.get(fm.system) || 0) + 1); }
    const hg = hhi(g), hs = hhi(s);
    const nm = (id) => id.startsWith('S') ? sysName.get(id.slice(1)) : id.startsWith('G') ? (groupName.get(id.slice(1)) || 'group ' + id.slice(1)) : 'solo';
    const t = top(s).filter(x => !x.id.startsWith('N')).map(x => `${nm(x.id)} ${(100 * x.share).toFixed(0)}%`).join('; ');
    out.push(`| ${spec} | ${cs.length} | ${hg} (${band(hg)}) | ${hs} (${band(hs)}) | ${t.replace(/\|/g, '/')} |`);
  }
  out.push('');
}
writeFileSync(arg('report'), out.join('\n') + '\n');
console.log(out.slice(0, 30).join('\n'));
