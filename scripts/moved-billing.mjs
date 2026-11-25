// Where moved clinicians billed Medicare (2026-11-25, the user's ask). Read
// only. Input: the clinicians shown at a Medicare address since 2026-11-20
// (provider_individuals.address_source = 'medicare'), with the NPPES address
// they replaced (nppes_*) and the Medicare address now shown. Each is looked
// up in the newest Medicare Physician & Other Practitioners by Provider file,
// which carries one practice address per NPI (Rndrng_Prvdr_St1, State, Zip5),
// and classed: billing address in the new (shown) ZIP, in the old (NPPES)
// ZIP, both (same ZIP), or neither; and by state the same way. A moved
// clinician absent from the file did not bill traditional Medicare that year
// (or billed under a group only); that is counted, never read as inactive.
//
// node scripts/moved-billing.mjs --moved moved.csv --report out.md [--puf-url URL]
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { resolve } from './lib/cms-catalog.mjs';
import { fetchCsvRows, columnIndex, cleanNpi } from './lib/bulk.mjs';
const arg = k => { const i = process.argv.indexOf('--' + k); return i < 0 ? null : process.argv[i + 1]; };
const PUF_TITLE = /medicare physician .* practitioners\s*[-–]\s*by provider$/i;
const rows = parseCsv(readFileSync(arg('moved'), 'utf8')); rows.shift();
const moved = new Map(rows.map(([npi, ozip, ost, nzip, nst]) => [npi, { ozip: (ozip || '').slice(0, 5), ost, nzip: (nzip || '').slice(0, 5), nst }]));
let url = arg('puf-url'), title = '';
if (!url) { const p = await resolve(PUF_TITLE, 'PUF'); url = p.url; title = `${p.dataset} (${p.year || 'year n/a'})`; }
console.log('moved', moved.size, 'PUF', url);
const t = { found: 0, zipNew: 0, zipOld: 0, zipBoth: 0, zipNeither: 0, stNew: 0, stOld: 0, stBoth: 0, stNeither: 0 };
let header = null, at = null, read = 0;
for await (const row of fetchCsvRows(url, 'PUF')) {
  if (!header) { header = row; at = columnIndex(header, ['Rndrng_NPI', 'Rndrng_Prvdr_Zip5', 'Rndrng_Prvdr_State_Abrvtn'], 'PUF'); continue; }
  read++;
  const npi = cleanNpi(row[at('Rndrng_NPI')]); const m = npi && moved.get(npi); if (!m) continue;
  t.found++;
  const z = String(row[at('Rndrng_Prvdr_Zip5')] || '').trim().padStart(5, '0'), st = String(row[at('Rndrng_Prvdr_State_Abrvtn')] || '').trim();
  const zn = z === m.nzip, zo = z === m.ozip, sn = st === m.nst, so = st === m.ost;
  if (zn && zo) t.zipBoth++; else if (zn) t.zipNew++; else if (zo) t.zipOld++; else t.zipNeither++;
  if (sn && so) t.stBoth++; else if (sn) t.stNew++; else if (so) t.stOld++; else t.stNeither++;
}
const pc = (a, b) => (b ? (100 * a / b).toFixed(1) + '%' : 'n/a'), n = v => v.toLocaleString();
const L = ['# Moved clinicians: where they billed Medicare', '',
  `Run ${new Date().toISOString().slice(0, 10)} by scripts/moved-billing.mjs (scripts/moved-billing.sh). Read only.`, '',
  `- Moved clinicians (address_source = 'medicare'): ${n(moved.size)}`,
  `- Billing file: ${title || url}; rows read: ${n(read)}`,
  `- Found in the billing file: ${n(t.found)} (${pc(t.found, moved.size)}); not found: ${n(moved.size - t.found)} (did not bill traditional Medicare under their own NPI that year, or billed only through a group; not read as inactive)`, '',
  'The billing file holds one practice address per NPI, so each clinician is classed by that one address.', '',
  '| Billing address | By ZIP | Share of found | By state | Share of found |', '|---|---|---|---|---|',
  `| At the new (Medicare) address only | ${n(t.zipNew)} | ${pc(t.zipNew, t.found)} | ${n(t.stNew)} | ${pc(t.stNew, t.found)} |`,
  `| At the old (NPPES) address only | ${n(t.zipOld)} | ${pc(t.zipOld, t.found)} | ${n(t.stOld)} | ${pc(t.stOld, t.found)} |`,
  `| Same for both | ${n(t.zipBoth)} | ${pc(t.zipBoth, t.found)} | ${n(t.stBoth)} | ${pc(t.stBoth, t.found)} |`,
  `| Neither | ${n(t.zipNeither)} | ${pc(t.zipNeither, t.found)} | ${n(t.stNeither)} | ${pc(t.stNeither, t.found)} |`, ''];
writeFileSync(arg('report'), L.join('\n')); console.log(L.join('\n'));
