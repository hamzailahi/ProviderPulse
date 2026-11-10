// Overture Maps addresses dry run (overture-dry-run.sh): matches every
// listing with no pin against Overture address points with the NAD matcher's
// rule (scripts/lib/nad-match.mjs: same ZIP, same house number, same street or
// a one-word difference; several points within 100 m are one place) and
// writes a report. Nothing is written to the database.
//
//   node scripts/overture-dry-run.mjs --unplaced unplaced.csv --cands cands.csv --out report.md
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { houseOf, matchOne, NOT_PUBLIC, PARTLY_PUBLIC } from './lib/nad-match.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const fmt = n => Number(n || 0).toLocaleString('en-US');
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');
const zip5 = z => String(z || '').trim().slice(0, 5).padStart(5, '0');
function readRows(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const head = rows.shift() || [];
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

export function summarize(unplaced, cands) {
  const byKey = new Map();
  for (const c of cands) {
    const k = zip5(c.zip) + ',' + String(c.num || '').trim().replace(/^0+(?=\d)/, '');
    (byKey.get(k) || byKey.set(k, []).get(k)).push(c);
  }
  const st = {}, byState = {}, bySource = {}, byTbl = {};
  for (const r of unplaced) {
    const h = houseOf(r.address);
    const m = h ? matchOne(r, byKey.get(zip5(r.zip) + ',' + h)) : { status: 'no_house_number' };
    st[m.status] = (st[m.status] || 0) + 1;
    const s = String(r.state || '').toUpperCase() || '?';
    const b = byState[s] || (byState[s] = { rows: 0, placed: 0 });
    b.rows++;
    const t = byTbl[r.tbl] || (byTbl[r.tbl] = { rows: 0, placed: 0 });
    t.rows++;
    if (m.status === 'placed') { b.placed++; t.placed++; bySource[m.placement] = (bySource[m.placement] || 0) + 1; }
  }
  return { st, byState, bySource, byTbl };
}

if (process.argv[1] && process.argv[1].endsWith('overture-dry-run.mjs')) {
  const un = readRows(arg('unplaced'));
  const { st, byState, bySource, byTbl } = summarize(un, readRows(arg('cands')));
  const lines = [
    '# Overture Maps addresses: dry run', '',
    `Run ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by scripts/overture-dry-run.sh. Nothing was written to the database.`, '',
    `Source: Overture Maps Foundation, addresses theme, release ${process.env.OVERTURE_RELEASE || 'unknown'} (public S3 bucket, free, no account). Each record names its source dataset and licence; a licence must be checked before any point is stored.`, '',
    'Rule: the same ZIP, the same house number, and the same street or one of the placement job\'s one-word differences. Several matching points count as one place only within 100 m of each other. Overture rows with no postcode cannot match.', '',
    '## Listings with no pin', '',
    `- Listings tried: **${fmt(un.length)}**`,
    `- Would be placed: **${fmt(st.placed)}** (${pct(st.placed || 0, un.length)})`,
    `- Several matching points far apart: ${fmt(st.tie)}`,
    `- This house number is in the ZIP, but on another street: ${fmt(st.no_street)}`,
    `- Nothing at this house number in the ZIP: ${fmt(st.no_candidates)}`,
    `- The address has no house number (PO box, building name): ${fmt(st.no_house_number)}`, '',
    '| Table | Tried | Would be placed |', '|---|---|---|',
    ...Object.entries(byTbl).map(([t, v]) => `| ${t} | ${fmt(v.rows)} | ${fmt(v.placed)} (${pct(v.placed, v.rows)}) |`), '',
    '## By source dataset and licence', '',
    '| Source dataset, licence | Listings |', '|---|---|',
    ...Object.entries(bySource).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k.replace(/\|/g, '/')} | ${fmt(v)} |`), '',
    '## By state (most unplaced first)', '',
    '| State | Unplaced | Would be placed | Note |', '|---|---|---|---|',
    ...Object.entries(byState).sort((a, b) => b[1].rows - a[1].rows).map(([s, v]) => `| ${s} | ${fmt(v.rows)} | ${fmt(v.placed)} (${pct(v.placed, v.rows)}) | ${NOT_PUBLIC.has(s) ? 'NAD rows here are not public domain' : PARTLY_PUBLIC.has(s) ? 'NAD rows here are public only in some counties' : ''} |`), ''
  ];
  writeFileSync(arg('out'), lines.join('\n'));
  console.log(lines.slice(0, 22).join('\n'));
}
