// node scripts/dac-load.mjs --individuals F --secondary F --out F --report F
// Step 1 of the scoring upgrade (2026-11-19). Streams CMS's Doctors and
// Clinicians file, folds it to one row per NPI (written to --out for
// clinician_status), and reports what the site split would do to supply per
// scored specialty, plus the share of clinicians who graduated 35+ years ago
// ("supply at risk", provider side only). Reads exports; never the database.
import { createReadStream, writeFileSync, createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import readline from 'node:readline';
import { createRequire } from 'node:module';
import { addRow, splitCsv, siteWeight } from './lib/dac.mjs';
const require = createRequire(import.meta.url);
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');
const { SCORED } = require('../v2/assets/specialties.js');

const arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const HDRS = { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)', Accept: 'application/json,text/csv,*/*' };
async function getJson(u) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(u, { headers: HDRS }); const t = await r.text();
    try { return JSON.parse(t); } catch { console.log(`metastore try ${i + 1}: HTTP ${r.status}`); }
    await new Promise(z => setTimeout(z, 5000 * (i + 1)));
  }
  throw new Error('CMS metastore did not answer with JSON');
}
const meta = await getJson('https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/mj5m-pzi6?show-reference-ids=false');
const dist = (meta.distribution || []).find(d => /csv/i.test(d.mediaType || d.format || d.downloadURL || '')) || meta.distribution[0];
const url = dist.downloadURL || (dist.data && dist.data.downloadURL);
const release = String(meta.modified || '').slice(0, 10);
console.log('DAC', release, url);

const res = await fetch(url, { headers: HDRS });
if (!res.ok) throw new Error('download ' + res.status);
const map = new Map(), col = {}; let header = null, rows = 0;
for await (const line of readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity })) {
  if (!header) { header = splitCsv(line).map(h => h.trim()); header.forEach((h, i) => { col[h.toLowerCase()] = i; }); continue; }
  if (addRow(map, col, splitCsv(line))) rows++;
}
for (const need of ['npi', 'grd_yr', 'telehlth', 'org_pac_id', 'adrs_id']) if (col[need] == null) throw new Error('column missing: ' + need);
console.log(`rows ${rows}, NPIs ${map.size}`);

const out = createWriteStream(arg('out'));
const q = (s) => s == null ? '' : '"' + String(s).replace(/"/g, '""') + '"';
for (const [npi, r] of map) out.write([npi, q(r.pac), r.grad ?? '', r.tele, r.addrs.size || 1, q('{' + [...r.orgs].join(',') + '}'), q(r.spec), release].join(',') + '\n');
await new Promise(z => out.end(z));

// NPPES sites per clinician: 1 primary + secondary locations.
const sec = new Map();
for await (const l of readline.createInterface({ input: createReadStream(arg('secondary')) })) { const [n, c] = l.split(','); if (n) sec.set(n, Number(c)); }
const codeOf = new Map(); let ind = 0;
const tally = new Map(); // code -> {n, w, inDac, grad, old}
const cutoff = new Date().getUTCFullYear() - 35;
for await (const l of readline.createInterface({ input: createReadStream(arg('individuals')) })) {
  const [npi, code] = l.split(','); if (!npi || !code) continue; ind++;
  const d = map.get(npi);
  const w = siteWeight(d ? d.addrs.size : null, 1 + (sec.get(npi) || 0));
  let t = tally.get(code); if (!t) tally.set(code, t = { n: 0, w: 0, inDac: 0, grad: 0, old: 0 });
  t.n++; t.w += w; if (d) { t.inDac++; if (d.grad != null) { t.grad++; if (d.grad <= cutoff) t.old++; } }
}
const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : 'n/a';
const lines = [`# Clinician status load: dry run`, '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/dac-load.mjs. CMS Doctors and Clinicians file released ${release}.`, '',
  `- File rows: ${rows.toLocaleString()}; clinicians (NPIs): ${map.size.toLocaleString()}`,
  `- Directory clinicians read: ${ind.toLocaleString()}`,
  `- Site split: a clinician at one site counts 1; at several (the larger of the file's practice addresses and NPPES primary + secondary) the main address keeps 0.6. Not in the file: NPPES alone.`,
  `- Supply at risk: share of clinicians in the file with a graduation year who graduated in ${cutoff} or earlier (35+ years). Provider side only.`, '',
  '| Specialty | Listings | After site split | Change | In CMS file | Graduated 35+ years ago |', '|---|---|---|---|---|---|'];
let N = 0, W = 0;
for (const [label] of SCORED) {
  const s = { n: 0, w: 0, inDac: 0, grad: 0, old: 0 };
  for (const c of TaxonomyMap.codesFor(label)) { const t = tally.get(c); if (t) for (const k in s) s[k] += t[k]; }
  N += s.n; W += s.w;
  lines.push(`| ${label} | ${s.n.toLocaleString()} | ${Math.round(s.w).toLocaleString()} | ${s.n ? '-' + (100 - 100 * s.w / s.n).toFixed(1) + '%' : 'n/a'} | ${pct(s.inDac, s.n)} | ${pct(s.old, s.grad)} |`);
}
lines.push('', `Specialties can share a code, so the column totals overlap and are not shown.`);
writeFileSync(arg('report'), lines.join('\n') + '\n');
console.log(lines.slice(0, 8).join('\n'));
if (map.size < 1200000) { console.error(`only ${map.size} NPIs: refusing`); process.exit(1); }
