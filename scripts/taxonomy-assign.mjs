// Decides the NUCC code for every row of the three directory tables.
//
// Inputs (CSV): the NPPES extract from nppes-taxonomies.mjs (npi,code,source)
// and a read-only export of the directory (tbl,key,npi,primary_taxonomy,
// current_code, current_source), where key is the npi for clinics/individuals
// and the row id for secondary locations, whose code is their parent NPI's.
//
// Order, per row: the NPPES code for its NPI (primary flag, else first listed);
// if NPPES does not have the NPI, or lists a code missing from this NUCC
// release, an exact NUCC display-name match on the stored name; otherwise an
// exception with a reason. Never fuzzy, never keywords.
//
// Outputs: --assign (tbl,key,code,src; only rows that change), --exceptions
// (tbl,key,npi,primary_taxonomy,reason) and --summary (markdown).
// Usage: node --max-old-space-size=6144 scripts/taxonomy-assign.mjs \
//          --nppes nppes-taxonomy.csv --rows directory.csv \
//          --assign assign.csv --exceptions exceptions.csv --summary summary.md
import { createReadStream, readFileSync, writeFileSync, createWriteStream } from 'node:fs';
import { streamCsvRows } from './lib/bulk.mjs';
import { parseNucc, displayNameIndex, resolveByName } from './lib/taxonomy-map.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
for (const k of ['nppes', 'rows', 'assign', 'exceptions', 'summary']) if (!arg(k)) throw new Error(`missing --${k}`);

const nucc = parseNucc(readFileSync(arg('nucc') || 'supabase/reference/nucc_taxonomy.csv', 'utf8'));
const known = new Set(nucc.map(n => n.code));
const display = new Map(nucc.map(n => [n.code, n.display_name.toLowerCase()]));
const byName = displayNameIndex(nucc);

// npi (as a number) -> index into codeList * 2 + (first ? 1 : 0). Numbers keep
// ~9M entries to a few hundred MB.
const codeList = [], codeIdx = new Map();
const nppes = new Map();
let header = true;
for await (const r of streamCsvRows(createReadStream(arg('nppes')))) {
  if (header) { header = false; continue; }
  const [npi, code, src] = r;
  if (!codeIdx.has(code)) { codeIdx.set(code, codeList.length); codeList.push(code); }
  nppes.set(Number(npi), codeIdx.get(code) * 2 + (src === 'nppes_first' ? 1 : 0));
}

const assign = createWriteStream(arg('assign'));
const exc = createWriteStream(arg('exceptions'));
assign.write('tbl,key,code,src\n');
exc.write('tbl,key,npi,primary_taxonomy,reason\n');
const q = s => (/[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);

const stats = {};
const bump = (tbl, k) => { const t = stats[tbl] || (stats[tbl] = {}); t[k] = (t[k] || 0) + 1; };
const reasons = new Map();
const unknownNppes = new Map();
let header2 = true, cols = null;
for await (const r of streamCsvRows(createReadStream(arg('rows')))) {
  if (header2) { cols = Object.fromEntries(r.map((h, i) => [h, i])); header2 = false; continue; }
  const tbl = r[cols.tbl], key = r[cols.key], npi = r[cols.npi], name = r[cols.primary_taxonomy] || '';
  bump(tbl, 'rows');
  let code = null, src = null, reason = null;
  const hit = /^\d{10}$/.test(npi) ? nppes.get(Number(npi)) : undefined;
  if (hit !== undefined) {
    const c = codeList[hit >> 1];
    if (known.has(c)) { code = c; src = hit & 1 ? 'nppes_first' : 'nppes_primary'; }
    else {
      unknownNppes.set(c, (unknownNppes.get(c) || 0) + 1);
      const f = resolveByName(name, byName);
      if (f.code) { code = f.code; src = f.source; }
      else reason = `NPPES code ${c} is not in this NUCC release; ` + f.reason.replace(/^not in NPPES; /, '');
    }
  } else {
    const f = resolveByName(name, byName);
    if (f.code) { code = f.code; src = f.source; } else reason = f.reason;
  }
  if (code) {
    bump(tbl, src);
    if (name && display.get(code) === name.trim().toLowerCase()) bump(tbl, 'name_agrees');
    if (r[cols.current_code] !== code || r[cols.current_source] !== src) {
      assign.write(`${tbl},${q(key)},${code},${src}\n`);
      bump(tbl, 'to_write');
    }
  } else {
    bump(tbl, 'exception');
    exc.write(`${tbl},${q(key)},${npi},${q(name)},${q(reason)}\n`);
    const rk = `${name || '(blank)'}\u0000${reason}`;
    reasons.set(rk, (reasons.get(rk) || 0) + 1);
  }
}
await Promise.all([new Promise(r => assign.end(r)), new Promise(r => exc.end(r))]);

const total = Object.values(stats).reduce((a, t) => a + t.rows, 0);
const exceptions = Object.values(stats).reduce((a, t) => a + (t.exception || 0), 0);
const pct = (a, b) => (b ? (100 * a / b).toFixed(2) + '%' : '-');
const lines = [
  `# Taxonomy backfill summary`, '',
  `NPPES NPIs with a taxonomy: ${nppes.size.toLocaleString()}. NUCC codes known: ${known.size}.`, '',
  `| Table | Rows | NPPES primary | NPPES first (no flag) | Display name | Exceptions | Stored name agrees with code | Rows to write |`,
  `|---|---|---|---|---|---|---|---|`,
  ...Object.entries(stats).map(([t, s]) => `| ${t} | ${s.rows.toLocaleString()} | ${(s.nppes_primary || 0).toLocaleString()} | ${(s.nppes_first || 0).toLocaleString()} | ${(s.display_name || 0).toLocaleString()} | ${(s.exception || 0).toLocaleString()} | ${pct(s.name_agrees || 0, s.rows - (s.exception || 0))} | ${(s.to_write || 0).toLocaleString()} |`),
  '', `Coverage: ${pct(total - exceptions, total)} of ${total.toLocaleString()} rows have a code; ${exceptions.toLocaleString()} are exceptions.`, '',
];
if (unknownNppes.size) {
  lines.push('## NPPES codes missing from this NUCC release', '', '| Code | Rows |', '|---|---|',
    ...[...unknownNppes].sort((a, b) => b[1] - a[1]).map(([c, k]) => `| ${c} | ${k.toLocaleString()} |`), '');
}
if (reasons.size) {
  lines.push('## Exceptions by stored name and reason (top 50)', '', '| Stored name | Reason | Rows |', '|---|---|---|',
    ...[...reasons].sort((a, b) => b[1] - a[1]).slice(0, 50).map(([k, c]) => { const [n, why] = k.split('\u0000'); return `| ${n} | ${why} | ${c.toLocaleString()} |`; }), '');
}
writeFileSync(arg('summary'), lines.join('\n'));
console.log(lines.join('\n'));
