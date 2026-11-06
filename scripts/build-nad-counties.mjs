// The reviewed list of counties an NAD apply may use in the partly public
// states (2026-11-06, the user's county check). Built from USDOT's NAD County
// Participation Status layer, saved by nad-status-discover.yml:
//
//   node scripts/build-nad-counties.mjs [--check]
//
// reads supabase/reference/nad-status/county-status-2.jsonl and writes
// supabase/reference/nad-public-counties.csv (state,county,verdict,statuses):
// a county is public only when every piece of it is "Data in the NAD" (10);
// any piece "Data not in public domain" (40) makes the whole county
// not_public, because the layer does not say which part is which (six South
// Dakota counties, Minnehaha and Lincoln among them, are split); anything
// else is not_in_nad. --check fails when the committed CSV is stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { countyKey, PARTLY_PUBLIC } from './lib/nad-match.mjs';

const SRC = 'supabase/reference/nad-status/county-status-2.jsonl';
const OUT = 'supabase/reference/nad-public-counties.csv';

export function buildCounties(lines) {
  const by = new Map();
  for (const line of lines) {
    if (!line.trim()) continue;
    const r = JSON.parse(line);
    const s = String(r.STATE_ABBR || '').toUpperCase();
    if (!PARTLY_PUBLIC.has(s)) continue;
    // The full name tells an independent city from the county of the same
    // name (Maryland's "Baltimore" and "Baltimore city" share NAME).
    const k = countyKey(r.NAMELSAD || r.NAME);
    if (!k) continue;
    const e = by.get(s + '|' + k) || by.set(s + '|' + k, { state: s, county: k, statuses: new Set() }).get(s + '|' + k);
    e.statuses.add(Number(r.CountyStatus));
  }
  return [...by.values()].map(e => ({
    state: e.state, county: e.county,
    verdict: e.statuses.has(40) ? 'not_public' : [...e.statuses].every(x => x === 10) ? 'public' : 'not_in_nad',
    statuses: [...e.statuses].sort((a, b) => a - b).join(';')
  })).sort((a, b) => (a.state + a.county).localeCompare(b.state + b.county));
}

export function toCsv(rows) {
  return 'state,county,verdict,statuses\n' + rows.map(r => [r.state, r.county, r.verdict, r.statuses].join(',')).join('\n') + '\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const csv = toCsv(buildCounties(readFileSync(SRC, 'utf8').split('\n')));
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf8') !== csv) { console.error(`${OUT} is stale: run node scripts/build-nad-counties.mjs`); process.exit(1); }
    console.log(`${OUT} is current`);
  } else {
    writeFileSync(OUT, csv);
    const rows = buildCounties(readFileSync(SRC, 'utf8').split('\n'));
    const t = {}; for (const r of rows) { t[r.state] = t[r.state] || {}; t[r.state][r.verdict] = (t[r.state][r.verdict] || 0) + 1; }
    console.log(OUT, JSON.stringify(t));
  }
}
