// node scripts/validation-summary.mjs > out.md
// Aggregates the 52 committed drive-time reports
// (supabase/reference/access-e2sfca/*-dry-run.md, written by
// scripts/access-dry-run.mjs) into national tables. It reads only those
// files and adds nothing: per-specialty rank agreement is reported as the
// range and ZIP-weighted mean of the state figures (a true national rho needs
// the per-ZIP CSVs, which are 7-day artifacts and not in git), and the
// Medicare Advantage time check is summed (ZIPs and adults over the limit
// are counts, so they add).
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'supabase/reference/access-e2sfca';
const files = readdirSync(DIR).filter(f => f.endsWith('-dry-run.md')).sort();
const num = s => Number(String(s).replace(/,/g, ''));
const rho = new Map(); // spec -> [{state, n, r}]
const ma = new Map();  // spec|code -> {over, zips, adultsOver}
let states = 0, focusZips = 0, adultsAll = 0, adultsKnown = 0, unmatched = 0;
const perState = [];
for (const f of files) {
  const t = readFileSync(`${DIR}/${f}`, 'utf8');
  const name = (t.match(/^# E2SFCA access dry run: (.+)$/m) || [])[1] || f;
  const nf = num((t.match(/in [^:\n]+: ([\d,]+)\s*$/m) || [])[1] || 0);
  const run = (t.match(/^Run (\d{4}-\d{2}-\d{2})/m) || [])[1] || '';
  states++; focusZips += nf;
  const ad = t.match(/no vehicle: about [\d,]+ of ([\d,]+)/);
  if (ad) { adultsAll += num(ad[1]); adultsKnown++; }
  const um = t.match(/Counties not matched by name to the HSD file: (\d+)/);
  if (um) unmatched += Number(um[1]);
  perState.push({ name, run, n: nf, adults: ad ? num(ad[1]) : null });
  const by = t.split('## By specialty')[1]?.split('\n## ')[0] || '';
  for (const line of by.split('\n')) {
    const c = line.split('|').map(s => s.trim());
    if (c.length > 7 && /^-?[0-9.]+$/.test(c[5]) && /of \d/.test(c[6])) {
      const a = rho.get(c[1]) || rho.set(c[1], []).get(c[1]);
      a.push({ state: name, n: nf, r: Number(c[5]) });
    }
  }
  const tb = t.split('## Travel burden')[1]?.split('\n## ')[0] || '';
  for (const line of tb.split('\n')) {
    const c = line.split('|').map(s => s.trim());
    const m = c[3] && c[3].match(/^([\d,]+) of ([\d,]+)$/);
    const a = c[4] && c[4].match(/^([\d,]+)/);
    if (m && a) {
      const k = c[1] + '|' + c[2];
      const o = ma.get(k) || ma.set(k, { over: 0, zips: 0, adultsOver: 0, states: 0 }).get(k);
      o.over += num(m[1]); o.zips += num(m[2]); o.adultsOver += num(a[1]); o.states++;
    }
  }
}
const f2 = x => x.toFixed(2), pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : 'n/a';
const out = [];
out.push(`Reports read: ${states} (${perState.map(s => s.run).sort()[0]} to ${perState.map(s => s.run).sort().pop()}); focus ZIPs: ${focusZips.toLocaleString()}; adults in focus ZIPs (from the no-vehicle line, ${adultsKnown} reports): ${adultsAll.toLocaleString()}; counties not matched to the HSD file across all reports: ${unmatched}.`, '');
out.push('### Rank agreement (Spearman rho), drive time vs 10-mile count, by specialty', '');
out.push('| Specialty | States | ZIPs | Lowest state rho | Highest state rho | ZIP-weighted mean rho |', '|---|---|---|---|---|---|');
const all = [];
for (const [s, a] of rho) {
  const n = a.reduce((x, y) => x + y.n, 0), w = a.reduce((x, y) => x + y.n * y.r, 0) / n;
  const lo = a.reduce((x, y) => y.r < x.r ? y : x), hi = a.reduce((x, y) => y.r > x.r ? y : x);
  all.push(...a.map(x => x.r));
  out.push(`| ${s} | ${a.length} | ${n.toLocaleString()} | ${f2(lo.r)} (${lo.state}) | ${f2(hi.r)} (${hi.state}) | ${f2(w)} |`);
}
all.sort((x, y) => x - y);
out.push('', `Across every state and specialty: ${all.length} figures, lowest ${f2(all[0])}, median ${f2(all[Math.floor(all.length / 2)])}, highest ${f2(all[all.length - 1])}.`, '');
out.push('### Medicare Advantage time limits: ZIPs and adults with no listing of the kind within the CMS maximum', '');
out.push('| Specialty | CMS code | States | ZIPs over | Share of ZIPs | Adults in those ZIPs | Share of adults |', '|---|---|---|---|---|---|---|');
for (const [k, o] of ma) {
  const [s, code] = k.split('|');
  out.push(`| ${s} | ${code} | ${o.states} | ${o.over.toLocaleString()} of ${o.zips.toLocaleString()} | ${pct(o.over, o.zips)} | ${o.adultsOver.toLocaleString()} | ${pct(o.adultsOver, adultsAll)} |`);
}
console.log(out.join('\n'));
