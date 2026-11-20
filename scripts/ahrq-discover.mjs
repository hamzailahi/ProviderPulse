// AHRQ Compendium of U.S. Health Systems, discovery (2026-11-20, step 7 of the
// research plan: competition as concentration and system ownership). Read
// only: finds the data files on AHRQ's compendium page, downloads each CSV (or
// the CSVs inside a zip), and records columns, row counts and three sample
// rows to supabase/reference/ahrq/discovery.md, so the parser is written
// against what the files really hold. Runs in Actions (ahrq.gov is not
// reachable from the dev container).
import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
const HDRS = { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)' };
const PAGES = ['https://www.ahrq.gov/chsp/data-resources/compendium.html', 'https://www.ahrq.gov/chsp/data-resources/compendium-2023.html', 'https://www.ahrq.gov/chsp/data-resources/compendium-2022.html'];
const out = ['# AHRQ Compendium of U.S. Health Systems: discovery', '', `Run ${new Date().toISOString().slice(0, 10)} by scripts/ahrq-discover.mjs. Read only.`, ''];
const links = new Set();
// ahrq.gov answers automated requests with an empty 202 (a bot check), so the
// Internet Archive's newest copy of each page is read when the live one has
// no links. Archive links are turned back into ahrq.gov links.
const unwrap = h => h.replace(/^https?:\/\/web\.archive\.org\/web\/\d+(id_)?\//, '');
for (const p of PAGES) {
  for (const src of [p, 'https://web.archive.org/web/2026/' + p]) {
    try {
      const r = await fetch(src, { headers: HDRS }); const t = await r.text();
      const before = links.size;
      for (const m of t.matchAll(/href="([^"]+\.(?:csv|xlsx|zip))"/gi)) links.add(unwrap(new URL(m[1], src).href));
      out.push(`- ${src}: HTTP ${r.status}, ${links.size - before} file links`);
      if (links.size > before) break;
    } catch (e) { out.push(`- ${src}: ${e.message}`); }
  }
}
out.push('', '## Files linked', '', ...[...links].map(l => '- ' + l), '');
mkdirSync('/tmp/ahrq', { recursive: true });
const csvs = [];
for (const l of [...links].filter(l => /\.(csv|zip)$/i.test(l))) {
  const f = '/tmp/ahrq/' + l.split('/').pop();
  // Direct first; a bot-check page (HTML or empty) falls back to the archive's raw copy.
  const okFile = () => { try { const head = execSync(`head -c 200 "${f}"`).toString(); return head.length > 20 && !/<html|<!doctype/i.test(head); } catch { return false; } };
  try { execSync(`curl -sSL --retry 3 -A "${HDRS['User-Agent']}" -o "${f}" "${l}"`); } catch {}
  if (!okFile()) { try { execSync(`curl -sSL --retry 3 -o "${f}" "https://web.archive.org/web/2026id_/${l}"`); } catch {} }
  if (!okFile()) { out.push('download failed (direct and archive): ' + l); continue; }
  out.push('downloaded: ' + l);
  if (/\.zip$/i.test(f)) { try { execSync(`unzip -o -q "${f}" -d /tmp/ahrq/${f.split('/').pop()}_x`); csvs.push(...execSync(`find /tmp/ahrq/${f.split('/').pop()}_x -iname '*.csv'`).toString().trim().split('\n').filter(Boolean)); } catch { out.push('unzip failed: ' + f); } }
  else csvs.push(f);
}
for (const f of csvs) {
  const head = execSync(`head -c 200000 "${f}" | head -4`).toString().split('\n');
  const n = execSync(`wc -l < "${f}"`).toString().trim();
  out.push(`## ${f.split('/').pop()}`, '', `- rows: ${n}`, '- columns: ' + head[0].trim(), '', '```', ...head.slice(1, 4).map(x => x.slice(0, 600)), '```', '');
}
mkdirSync('supabase/reference/ahrq', { recursive: true });
writeFileSync('supabase/reference/ahrq/discovery.md', out.join('\n'));
console.log(out.join('\n'));
