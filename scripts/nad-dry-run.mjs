// NAD dry run (nad-dry-run.yml, scripts/nad-dry-run.sh). Two steps:
//
//   node scripts/nad-dry-run.mjs keys --rows unplaced.csv --rows sample.csv --out keys.csv
//     the distinct (zip, house) pairs to pull out of the NAD file
//   node scripts/nad-dry-run.mjs match --unplaced unplaced.csv --sample sample.csv --cands cands.csv --out report.md
//     matches each listing (scripts/lib/nad-match.mjs) and writes the report;
//     nothing is written to the database
//
// unplaced.csv: tbl,key,address,city,state,zip (listings with no pin)
// sample.csv:   tbl,key,address,city,state,zip,lat,lng (listings the Census
//               placed exactly; the distance between their pin and NAD's
//               point shows how far the two sources agree)
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { houseOf, matchOne, metres, NOT_PUBLIC, PARTLY_PUBLIC } from './lib/nad-match.mjs';

const args = process.argv.slice(2);
const cmd = args[0];
const all = k => args.flatMap((a, i) => (a === '--' + k ? [args[i + 1]] : []));
const one = k => all(k)[0];
const fmt = n => Number(n || 0).toLocaleString('en-US');
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a');

function readRows(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const head = rows.shift() || [];
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const zip5 = z => String(z || '').trim().slice(0, 5).padStart(5, '0');

if (cmd === 'keys') {
  const keys = new Set();
  for (const p of all('rows')) for (const r of readRows(p)) { const h = houseOf(r.address); if (h && /^\d{5}$/.test(zip5(r.zip))) keys.add(zip5(r.zip) + ',' + h); }
  writeFileSync(one('out'), 'zip,house\n' + [...keys].join('\n') + '\n');
  console.log(`${keys.size} (zip, house) pairs`);
} else if (cmd === 'match') {
  const byKey = new Map();
  for (const c of readRows(one('cands'))) {
    const k = zip5(c.zip) + ',' + String(c.num || '').trim().replace(/^0+(?=\d)/, '');
    (byKey.get(k) || byKey.set(k, []).get(k)).push(c);
  }
  const run = rows => rows.map(r => {
    const h = houseOf(r.address);
    const res = h ? matchOne(r, byKey.get(zip5(r.zip) + ',' + h)) : { status: 'no_house_number' };
    return Object.assign({ row: r }, res);
  });

  // ---- unplaced listings
  const un = run(readRows(one('unplaced')));
  const st = {}, byState = {}, byTbl = {}, placement = {};
  const examples = { no_street: [], tie: [] };
  for (const m of un) {
    const s = String(m.row.state || '').toUpperCase() || '?';
    const excluded = NOT_PUBLIC.has(s);
    const status = m.status === 'placed' && excluded ? 'placed_not_public' : m.status;
    st[status] = (st[status] || 0) + 1;
    const b = byState[s] || (byState[s] = { rows: 0, placed: 0 });
    b.rows++; if (m.status === 'placed') b.placed++;
    const t = byTbl[m.row.tbl] || (byTbl[m.row.tbl] = { rows: 0, placed: 0 });
    t.rows++; if (status === 'placed') t.placed++;
    if (status === 'placed') placement[m.placement] = (placement[m.placement] || 0) + 1;
    if (examples[m.status] && examples[m.status].length < 10) examples[m.status].push(`${m.row.address}, ${m.row.city}, ${s} ${m.row.zip}`);
  }
  const usable = st.placed || 0;
  const partly = un.filter(m => m.status === 'placed' && PARTLY_PUBLIC.has(String(m.row.state || '').toUpperCase())).length;

  // ---- agreement with the Census on listings already placed exactly
  const sampleRows = one('sample') ? readRows(one('sample')) : [];
  const sm = run(sampleRows).filter(m => m.status === 'placed');
  const d = sm.map(m => metres({ lat: Number(m.row.lat), lng: Number(m.row.lng) }, m)).filter(Number.isFinite).sort((a, b) => a - b);
  const q = p => (d.length ? Math.round(d[Math.min(d.length - 1, Math.floor(p * d.length))]) : null);

  const lines = [
    '# National Address Database: dry run', '',
    `Run ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by scripts/nad-dry-run.sh. Nothing was written to the database.`, '',
    'Rule: the same ZIP, the same house number, and the same street or one of the placement job\'s one-word differences (scripts/lib/nad-match.mjs). Several matching points count as one place only within 100 m of each other.', '',
    `NAD file: ${process.env.NAD_FILE || 'unknown'}`, '',
    '## Listings with no pin', '',
    `- Listings tried: **${fmt(un.length)}**`,
    `- Would be placed: **${fmt(usable)}** (${pct(usable, un.length)})${partly ? `, of which ${fmt(partly)} are in states USDOT marks partly not public domain (${[...PARTLY_PUBLIC].join(', ')}); their sources need checking before an apply` : ''}`,
    `- Matched but left out, because the state is not public domain in the NAD (${[...NOT_PUBLIC].join(', ')}): ${fmt(st.placed_not_public)}`,
    `- Several matching points far apart (left unplaced): ${fmt(st.tie)}`,
    `- NAD has this house number in the ZIP, but on another street: ${fmt(st.no_street)}`,
    `- NAD has nothing at this house number in the ZIP: ${fmt(st.no_candidates)}`,
    `- The address has no house number (PO box, building name): ${fmt(st.no_house_number)}`, '',
    '| Table | Tried | Would be placed |', '|---|---|---|',
    ...Object.entries(byTbl).map(([t, v]) => `| ${t} | ${fmt(v.rows)} | ${fmt(v.placed)} (${pct(v.placed, v.rows)}) |`), '',
    'How NAD placed the points it matched (its own `Placement` field):', '',
    '| Placement | Listings |', '|---|---|',
    ...Object.entries(placement).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${fmt(v)} |`), '',
    '## By state (most unplaced first)', '',
    '| State | Unplaced | Would be placed | Note |', '|---|---|---|---|',
    ...Object.entries(byState).sort((a, b) => b[1].rows - a[1].rows).map(([s, v]) => `| ${s} | ${fmt(v.rows)} | ${fmt(v.placed)} (${pct(v.placed, v.rows)}) | ${NOT_PUBLIC.has(s) ? 'not public domain: skipped' : PARTLY_PUBLIC.has(s) ? 'partly not public domain' : ''} |`), '',
    '## Agreement with the Census', '',
    sampleRows.length
      ? `Of ${fmt(sampleRows.length)} listings the Census already placed exactly, NAD matched ${fmt(sm.length)}. Distance from the Census pin to the NAD point: median ${q(0.5)} m, 75th percentile ${q(0.75)} m, 90th percentile ${q(0.9)} m, 99th percentile ${q(0.99)} m; ${fmt(d.filter(x => x > 500).length)} more than 500 m apart.`
      : 'No sample was given.', '',
    '## Examples (public listing addresses)', '',
    'Another street at the same number:', '', ...examples.no_street.map(e => '- ' + e), '',
    'Points far apart:', '', ...examples.tie.map(e => '- ' + e), ''
  ];
  writeFileSync(one('out'), lines.join('\n'));
  console.log(lines.join('\n'));
} else {
  console.error('usage: nad-dry-run.mjs keys|match ...');
  process.exit(2);
}
