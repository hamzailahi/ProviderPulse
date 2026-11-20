// Builds docs/project-log.md, the dated record of every change for review
// (2026-11-20, the user's ask: "keep a log of all of this from the beginning
// ... so that when it comes time to review with someone I can see what all we
// have done with dates"). The source is README.md's Changelog, which every push
// to main already updates; this file is generated from it, so the two never
// drift. --check fails when docs/project-log.md is stale (CI runs it).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const readme = readFileSync('README.md', 'utf8');
const start = readme.indexOf('\n## Changelog');
if (start < 0) throw new Error('README.md has no ## Changelog');
const rest = readme.slice(start + 1).split('\n').slice(1);
const end = rest.findIndex(l => /^## /.test(l));
const body = (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
const days = [...body.matchAll(/^### (\d{4}-\d{2}-\d{2})/gm)].map(m => m[1]);
const entries = body.split('\n').filter(l => /^- /.test(l)).length;
const months = new Map();
let cur = null;
for (const l of body.split('\n')) {
  const d = l.match(/^### (\d{4}-\d{2})-\d{2}/); if (d) { cur = d[1]; continue; }
  if (cur && /^- /.test(l)) months.set(cur, (months.get(cur) || 0) + 1);
}
const name = m => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const out = ['# ProviderPulse project log', '',
  'Every change to the product, newest first, with the date it shipped. Generated from the Changelog in README.md by `scripts/build-project-log.mjs`; do not edit by hand.', '',
  `- ${entries.toLocaleString()} changes over ${days.length} working days, ${days[days.length - 1]} to ${days[0]}.`, '',
  '| Month | Changes |', '|---|---|', ...[...months].map(([m, n]) => `| ${name(m)} | ${n} |`), '',
  body.replace(/^### /gm, '## '), ''].join('\n');
if (process.argv.includes('--check')) {
  const have = existsSync('docs/project-log.md') ? readFileSync('docs/project-log.md', 'utf8') : '';
  if (have !== out) { console.error('docs/project-log.md is stale: run node scripts/build-project-log.mjs'); process.exit(1); }
  console.log('project log current');
} else { writeFileSync('docs/project-log.md', out); console.log('docs/project-log.md:', entries, 'changes,', days.length, 'days'); }
