// Builds docs/project-log.md, the dated record of every change for review
// (2026-11-20, the user's ask: "keep a log of all of this from the beginning
// ... so that when it comes time to review with someone I can see what all we
// have done with dates"). The source is README.md's Changelog, which every push
// to main already updates; this file is generated from it, so the two never
// drift. --check fails when docs/project-log.md is stale (CI runs it).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// The work before the README changelog began (2026-05-13 to 2026-08-18) comes
// from the git history, saved once to docs/project-log-early.md by
// --from-git (needs a full clone: git fetch --unshallow). That history never
// changes, so the saved file stays as it is and CI's shallow clone can check.
const EARLY = 'docs/project-log-early.md';
if (process.argv.includes('--from-git')) {
  const until = process.argv[process.argv.indexOf('--from-git') + 1] || '2026-08-19';
  const raw = execSync(`git log --reverse --date=short --format='@@%H|%ad|%s' --name-status --until=${until}`).toString();
  const byDay = new Map();
  for (const block of raw.split('@@').filter(Boolean)) {
    const [head, ...files] = block.trim().split('\n');
    const [, day, subj] = head.split('|');
    let line = subj;
    if (/^Add files via upload$/i.test(subj) || /^Create /.test(subj) && false) {
      const names = files.map(f => f.split('\t').pop()).filter(Boolean);
      line = 'Uploaded ' + (names.length ? names.slice(0, 8).join(', ') + (names.length > 8 ? ` and ${names.length - 8} more` : '') : 'files');
    }
    const list = byDay.get(day) || byDay.set(day, []).get(day);
    if (!list.includes(line)) list.push(line);
  }
  const days = [...byDay.keys()].sort().reverse();
  const md = ['## Before the changelog: from the code history', '',
    `The README changelog starts on 2026-08-19. The work before it, ${days[days.length - 1]} to ${days[0]}, is listed here from the commit messages, one line per change.`, '',
    ...days.flatMap(d => ['### ' + d, '', ...byDay.get(d).map(x => '- ' + x), ''])].join('\n');
  writeFileSync(EARLY, md + '\n');
  console.log(EARLY, days.length, 'days');
  process.exit(0);
}
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
const early = existsSync(EARLY) ? readFileSync(EARLY, 'utf8') : '';
const eDays = [...early.matchAll(/^### (\d{4}-\d{2}-\d{2})/gm)].map(m => m[1]);
const eLines = early.split('\n').filter(l => /^- /.test(l)).length;
cur = null;
for (const l of early.split('\n')) {
  const d = l.match(/^### (\d{4}-\d{2})-\d{2}/); if (d) { cur = d[1]; continue; }
  if (cur && /^- /.test(l)) months.set(cur, (months.get(cur) || 0) + 1);
}
const name = m => new Date(m + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const out = ['# ProviderPulse project log', '',
  'Every change to the product, newest first, with the date it shipped. Generated from the Changelog in README.md by `scripts/build-project-log.mjs`; do not edit by hand.', '',
  `- ${(entries + eLines).toLocaleString()} changes over ${days.length + eDays.length} working days, ${(eDays[eDays.length - 1] || days[days.length - 1])} to ${days[0]}.`,
  `- ${days[days.length - 1]} onward: from the README changelog (${entries.toLocaleString()} entries, written for a reader).`,
  eDays.length ? `- ${eDays[eDays.length - 1]} to ${eDays[0]}: from the code history (${eLines.toLocaleString()} commit messages), at the end of this file.` : '', '',
  '| Month | Changes |', '|---|---|', ...[...months].sort((a, b) => b[0].localeCompare(a[0])).map(([m, n]) => `| ${name(m)} | ${n} |`), '',
  body.replace(/^### /gm, '## '), '',
  existsSync(EARLY) ? readFileSync(EARLY, 'utf8').replace(/^## Before/m, '# Before').replace(/^### /gm, '## ') : ''].join('\n');
if (process.argv.includes('--check')) {
  const have = existsSync('docs/project-log.md') ? readFileSync('docs/project-log.md', 'utf8') : '';
  if (have !== out) { console.error('docs/project-log.md is stale: run node scripts/build-project-log.mjs'); process.exit(1); }
  console.log('project log current');
} else { writeFileSync('docs/project-log.md', out); console.log('docs/project-log.md:', entries, 'changes,', days.length, 'days'); }
