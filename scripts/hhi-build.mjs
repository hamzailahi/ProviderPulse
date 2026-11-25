// node scripts/hhi-build.mjs --individuals F --out F --report F
// Step 7 (2026-11-20): market concentration per ZIP3 and scored specialty,
// by Medicare billing group (the more accurate of the two views tried in
// the 2026-11-20 dry run, since removed: a group is who the clinician bills through; the system
// view counted hospital privileges, which overstate control). The specialty
// is the clinician's own NUCC code (export of provider_individuals), never
// CMS's specialty name. Cells under MIN clinicians get no figure.
import { createReadStream, writeFileSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { createRequire } from 'node:module';
import { splitCsv } from './lib/dac.mjs';
import { hhi, band, mode, top } from './lib/hhi.mjs';
const require = createRequire(import.meta.url);
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const { SCORED } = require('../v2/assets/specialties.js');
const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
export const MIN = 10;

const labelsOf = new Map();
for (const [label] of SCORED) for (const c of TaxonomyMap.codesFor(label)) { if (!labelsOf.has(c)) labelsOf.set(c, []); labelsOf.get(c).push(label); }
const codeOf = new Map();
for await (const l of readline.createInterface({ input: createReadStream(arg('individuals')) })) { const [n, c] = l.split(','); if (n && c) codeOf.set(n, c); }
console.log('directory clinicians', codeOf.size);

const HDRS = { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)', Accept: 'application/json,text/csv,*/*' };
let meta;
for (let i = 0; i < 4 && !meta; i++) {
  try { meta = JSON.parse(await (await fetch('https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/mj5m-pzi6?show-reference-ids=false', { headers: HDRS })).text()); } catch { await new Promise(z => setTimeout(z, 5000 * (i + 1))); }
}
if (!meta) throw new Error('CMS metastore did not answer');
const dist = meta.distribution.find(d => /csv/i.test(d.mediaType || d.downloadURL || '')) || meta.distribution[0];
const release = String(meta.modified || '').slice(0, 10);
const res = await fetch(dist.downloadURL || dist.data.downloadURL, { headers: HDRS });
if (!res.ok) throw new Error('download ' + res.status);

// key zip3|npi -> group list; names per group.
const clin = new Map(), gname = new Map(); let header = null, col = {}, rows = 0;
for await (const line of readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity })) {
  if (!header) { header = splitCsv(line).map(h => h.trim().toLowerCase()); header.forEach((h, i) => { col[h] = i; }); for (const k of ['npi', 'zip code', 'org_pac_id', 'facility name']) if (col[k] == null) throw new Error('column missing: ' + k); continue; }
  const r = splitCsv(line); rows++;
  const npi = r[col.npi], z3 = String(r[col['zip code']] || '').slice(0, 3);
  if (!/^\d{3}$/.test(z3) || !codeOf.has(npi)) continue;
  const k = z3 + '|' + npi; let g = clin.get(k); if (!g) clin.set(k, g = []);
  const org = r[col.org_pac_id]; if (org) { g.push(org); if (!gname.has(org) && r[col['facility name']]) gname.set(org, r[col['facility name']]); }
}
console.log('DAC rows', rows, 'clinician-areas', clin.size);

const cells = new Map(); // zip3|label -> Map firm -> n
for (const [k, groups] of clin) {
  const [z3, npi] = k.split('|'); const labels = labelsOf.get(codeOf.get(npi)); if (!labels) continue;
  const g = mode(groups); const firm = g ? 'G' + g : 'N' + npi;
  for (const l of labels) { const ck = z3 + '|' + l; let m = cells.get(ck); if (!m) cells.set(ck, m = new Map()); m.set(firm, (m.get(firm) || 0) + 1); }
}
const out = createWriteStream(arg('out')); const q = (s) => s == null ? '' : '"' + String(s).replace(/"/g, '""') + '"';
let written = 0; const bands = { unconcentrated: 0, moderate: 0, high: 0 }; const bySpec = new Map();
for (const [ck, m] of cells) {
  let n = 0; for (const v of m.values()) n += v; if (n < MIN) continue;
  const [z3, label] = ck.split('|'); const h = hhi(m); const t = top(m, 1)[0];
  const tg = t && t.id.startsWith('G') ? gname.get(t.id.slice(1)) || null : null;
  out.write([z3, q(label), n, m.size, h, q(tg), t ? t.share.toFixed(4) : '', release].join(',') + '\n'); written++;
  bands[band(h)]++; const s = bySpec.get(label) || { cells: 0, high: 0 }; s.cells++; if (band(h) === 'high') s.high++; bySpec.set(label, s);
}
await new Promise(z => out.end(z));
const lines = ['# Market concentration by ZIP3: build', '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/hhi-build.mjs. CMS Doctors and Clinicians released ${release}.`, '',
  `- Clinicians: Medicare-enrolled, matched to the directory by NPI, specialty from their own NUCC code; placed in every ZIP3 where CMS lists a practice address.`,
  `- Firm: the clinician's most frequent Medicare billing group in that ZIP3; no group is a solo practice. HHI over clinician shares; ZIP3 x specialty cells under ${MIN} clinicians get no figure.`, '',
  `- Cells written: ${written.toLocaleString()} (unconcentrated ${bands.unconcentrated.toLocaleString()}, moderate ${bands.moderate.toLocaleString()}, high ${bands.high.toLocaleString()})`, '',
  '| Specialty | ZIP3 areas with a figure | Highly concentrated |', '|---|---|---|',
  ...[...bySpec].sort((a, b) => b[1].cells - a[1].cells).map(([l, s]) => `| ${l} | ${s.cells} | ${s.high} (${(100 * s.high / s.cells).toFixed(0)}%) |`)];
writeFileSync(arg('report'), lines.join('\n') + '\n');
console.log(lines.slice(0, 9).join('\n'));
