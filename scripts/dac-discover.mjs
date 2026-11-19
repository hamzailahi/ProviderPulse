// node scripts/dac-discover.mjs: read-only look at CMS's Doctors and Clinicians
// National Downloadable File (Provider Data Catalog dataset mj5m-pzi6), step 1
// of the scoring upgrade (2026-11-19, the user's go-ahead: active clinicians,
// labelled, never hidden). Records the download URL, release date, columns,
// row and NPI counts, how many NPIs have several practice addresses, the
// graduation-year spread, telehealth and group columns, so the loader is
// written against what the file really holds. Writes
// supabase/reference/dac-discovery.md. Nothing touches the database.
import { writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import readline from 'node:readline';

const ITEM = 'https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/mj5m-pzi6?show-reference-ids=false';
const out = ['# CMS Doctors and Clinicians file: discovery', '', `Run ${new Date().toISOString().slice(0, 10)} (read only).`, ''];

function splitCsv(line) {
  const cells = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
    else if (ch === '"') q = true; else if (ch === ',') { cells.push(cur); cur = ''; } else cur += ch;
  }
  cells.push(cur); return cells;
}

const meta = await (await fetch(ITEM)).json();
const dist = (meta.distribution || []).find(d => /csv/i.test(d.mediaType || d.format || d.downloadURL || '')) || (meta.distribution || [])[0];
const url = dist && (dist.downloadURL || (dist.data && dist.data.downloadURL));
out.push(`- Title: ${meta.title}`, `- Modified: ${meta.modified}`, `- Download: ${url}`, '');
if (!url) { out.push('No CSV distribution found; metastore item follows.', '```', JSON.stringify(meta).slice(0, 4000), '```'); writeFileSync('supabase/reference/dac-discovery.md', out.join('\n') + '\n'); process.exit(1); }

const res = await fetch(url);
if (!res.ok) throw new Error('download ' + res.status);
const rl = readline.createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity });
let header = null, rows = 0;
const npiAddr = new Map(), grd = new Map(), col = {}, samples = [], tele = new Map(), cred = new Map();
const pick = (r, name) => { const i = col[name]; return i == null ? '' : (r[i] || '').trim(); };
for await (const line of rl) {
  if (!header) { header = splitCsv(line).map(h => h.trim()); header.forEach((h, i) => { col[h.toLowerCase()] = i; }); continue; }
  const r = splitCsv(line); rows++;
  if (samples.length < 3) samples.push(r);
  const npi = pick(r, 'npi');
  const addr = [pick(r, 'adr_ln_1') || pick(r, 'adrs_ln_1'), pick(r, 'zip_cd') || pick(r, 'zip')].join('|');
  if (npi) { let s = npiAddr.get(npi); if (!s) npiAddr.set(npi, s = new Set()); if (s.size < 20) s.add(addr); }
  const g = pick(r, 'grd_yr'); grd.set(g ? g.slice(0, 3) + '0s' : '(blank)', (grd.get(g ? g.slice(0, 3) + '0s' : '(blank)') || 0) + 1);
  const t = pick(r, 'telehlth'); tele.set(t || '(blank)', (tele.get(t || '(blank)') || 0) + 1);
  const c = pick(r, 'cred'); cred.set(c || '(blank)', (cred.get(c || '(blank)') || 0) + 1);
}
let multi = 0; for (const s of npiAddr.values()) if (s.size > 1) multi++;
out.push(`- Rows: ${rows.toLocaleString()}`, `- Distinct NPIs: ${npiAddr.size.toLocaleString()}`, `- NPIs at 2+ practice addresses: ${multi.toLocaleString()}`, '',
  '## Columns', '', header.map(h => '`' + h + '`').join(', '), '',
  '## Sample rows', '', '```', ...samples.map(r => JSON.stringify(Object.fromEntries(header.map((h, i) => [h, r[i]])))), '```', '',
  '## Graduation decade (rows)', '', ...[...grd.entries()].sort().map(([k, v]) => `- ${k}: ${v.toLocaleString()}`), '',
  '## Telehealth flag (rows)', '', ...[...tele.entries()].map(([k, v]) => `- ${k}: ${v.toLocaleString()}`), '',
  '## Top credentials (rows)', '', ...[...cred.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `- ${k}: ${v.toLocaleString()}`), '');
writeFileSync('supabase/reference/dac-discovery.md', out.join('\n') + '\n');
console.log(out.slice(0, 12).join('\n'));
