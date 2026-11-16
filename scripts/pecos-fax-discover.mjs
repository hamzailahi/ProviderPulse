// Read only: which CMS (PECOS and related provider) datasets carry a fax
// column? Lists each matching dataset's columns from one API row and writes
// supabase/reference/pecos-fax-discovery.md. 2026-11-16, the user's ask.
import { writeFileSync, mkdirSync } from 'node:fs';
const PAT = /(enrollment|pecos|order and referring|reassignment|clinician|practitioner|supplier|provider)/i;
const cat = await (await fetch('https://data.cms.gov/data.json')).json();
const sets = cat.dataset.filter(d => PAT.test(d.title) && !/by provider and service|by geography/i.test(d.title));
const out = ['# PECOS / CMS provider files: is there a fax column?', '', `Checked ${new Date().toISOString().slice(0, 10)} by scripts/pecos-fax-discover.mjs (read only).`, ''];
let withFax = 0;
for (const d of sets) {
  const api = (d.distribution || []).find(x => /data-api\/v1\/dataset\/[^/]+\/data$/.test(x.accessURL || ''));
  if (!api) { out.push(`- ${d.title}: no data API`); continue; }
  try {
    const r = await fetch(api.accessURL + '?size=1', { signal: AbortSignal.timeout(20000) });
    const rows = await r.json();
    const cols = Array.isArray(rows) && rows[0] ? Object.keys(rows[0]) : [];
    const fax = cols.filter(c => /fax/i.test(c));
    const phone = cols.filter(c => /phone|tel/i.test(c));
    if (fax.length) withFax++;
    out.push(`- **${d.title}**: fax ${fax.length ? '**' + fax.join(', ') + '**' : 'none'}; phone ${phone.join(', ') || 'none'}; ${cols.length} columns`);
    if (fax.length) out.push(`  - columns: ${cols.join(', ')}`, `  - ${api.accessURL}`);
  } catch (e) { out.push(`- ${d.title}: lookup failed (${e.message})`); }
}
out.splice(3, 0, `${sets.length} datasets checked; ${withFax} carry a fax column.`, '');
mkdirSync('supabase/reference', { recursive: true });
writeFileSync('supabase/reference/pecos-fax-discovery.md', out.join('\n') + '\n');
console.log(out.join('\n'));
