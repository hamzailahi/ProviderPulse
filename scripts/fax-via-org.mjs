// Dry run (read only) of "fax via organization": see scripts/lib/fax-via-org.mjs.
//   node scripts/fax-via-org.mjs --docs individuals.csv --orgs clinics.csv \
//     --out matches.csv --report report.md [--ppef URL] [--reassign URL]
// individuals.csv: npi,address,state,zip (clinicians with no fax)
// clinics.csv: npi,name,address,state,zip,fax (organizations with a fax)
import { writeFileSync, createWriteStream } from 'node:fs';
import { fileCsvRows, fetchCsvRows } from './lib/bulk.mjs';
import { resolve } from './lib/cms-catalog.mjs';
import { addressKey, findCol, matchFaxViaOrg } from './lib/fax-via-org.mjs';

const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : null; };
const npiOk = v => /^\d{10}$/.test(String(v || '').trim());

async function readLocal(path, onRow) {
  let header = null;
  for await (const r of fileCsvRows(path)) { if (!header) { header = r; continue; } onRow(r); }
}

const docs = new Map();
await readLocal(arg('docs'), r => { if (npiOk(r[0])) docs.set(r[0], addressKey(r[1], r[2], r[3])); });
const orgs = new Map();
await readLocal(arg('orgs'), r => { if (npiOk(r[0]) && r[5]) orgs.set(r[0], { name: r[1], key: addressKey(r[2], r[3], r[4]), fax: r[5] }); });
console.log(`clinicians without a fax: ${docs.size}; organizations with a fax: ${orgs.size}`);

const urlOf = async (flag, re, label) => arg(flag) || (await resolve(re, label)).url;
const ppefUrl = await urlOf('ppef', /^Medicare Fee-For-Service\s+Public Provider Enrollment$/i, 'PPEF');
const reUrl = await urlOf('reassign', /^Revalidation Reassignment List$/i, 'Reassignment');
console.log('PPEF:', ppefUrl, '\nReassignment:', reUrl);

// PPEF: organization NPI <-> PAC ID (PECOS associate control id)
const pacOrgs = new Map();
let header = null, iNpi, iPac, ppefRows = 0;
for await (const r of fetchCsvRows(ppefUrl, 'PPEF')) {
  if (!header) { header = r; iNpi = findCol(r, /^NPI$/i, 'PPEF'); iPac = findCol(r, /ASCT_CNTL_ID|PAC/i, 'PPEF'); continue; }
  ppefRows++;
  const npi = (r[iNpi] || '').trim(), pac = (r[iPac] || '').trim();
  if (!orgs.has(npi) || !pac) continue;              // only organizations that carry a fax matter
  if (!pacOrgs.has(pac)) pacOrgs.set(pac, new Set());
  pacOrgs.get(pac).add(npi);
}
console.log(`PPEF rows: ${ppefRows}; PAC IDs with a faxed organization: ${pacOrgs.size}`);
if (ppefRows < 1e6) throw new Error(`PPEF: only ${ppefRows} rows, expected over 1M`);

// Reassignment: individual NPI -> group PAC ID
const reassign = new Map();
header = null; let reRows = 0, iInd, iGrp;
for await (const r of fetchCsvRows(reUrl, 'Reassignment')) {
  if (!header) { header = r; iInd = findCol(r, /individual.*npi/i, 'Reassignment'); iGrp = findCol(r, /group.*pac/i, 'Reassignment'); continue; }
  reRows++;
  const npi = (r[iInd] || '').trim(), pac = (r[iGrp] || '').trim();
  if (!docs.has(npi) || !pacOrgs.has(pac)) continue;
  if (!reassign.has(npi)) reassign.set(npi, new Set());
  reassign.get(npi).add(pac);
}
console.log(`Reassignment rows: ${reRows}`);
if (reRows < 1e6) throw new Error(`Reassignment: only ${reRows} rows, expected over 1M`);

const { matches, counts } = matchFaxViaOrg({ docs, reassign, pacOrgs, orgs });
// with_reassignment here counts only links to an organization that has a fax.
const out = createWriteStream(arg('out'));
out.write('npi,org_npi,org_name,fax\n');
const q = v => /[",\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
for (const m of matches) out.write([m.npi, m.org_npi, q(m.org_name || ''), m.fax].join(',') + '\n');
out.end();

const n = x => Number(x).toLocaleString('en-US');
const byOrg = {};
matches.forEach(m => { byOrg[m.org_name] = (byOrg[m.org_name] || 0) + 1; });
const top = Object.entries(byOrg).sort((a, b) => b[1] - a[1]).slice(0, 20);
writeFileSync(arg('report'), [
  '# Fax via organization: dry run', '',
  `Run ${new Date().toISOString().slice(0, 10)} by scripts/fax-via-org.sh. Read only; nothing written to the database.`, '',
  'Rule (the user\'s, 2026-11-16): a clinician with no fax of their own gets an organization\'s fax only when Medicare\'s reassignment list says they bill through that organization **and** their own NPPES practice address is the organization\'s address (same ZIP, house number and street; suite ignored). Shown labelled with the organization\'s name.', '',
  `- Clinicians with no fax: ${n(counts.clinicians_without_fax)}`,
  `- ... reassigned in Medicare to a group that is one of our organizations with a fax: ${n(counts.with_reassignment)}`,
  `- ... at that organization's own address: ${n(counts.same_address)}`,
  `- ... skipped, several such organizations with different faxes: ${n(counts.ambiguous)}`,
  `- **Would get a fax via their organization: ${n(counts.matched)}**`, '',
  `Sources: ${ppefUrl} (${n(ppefRows)} rows), ${reUrl} (${n(reRows)} rows).`, '',
  '## Organizations supplying the most', '', '| Organization | Clinicians |', '|---|---|',
  ...top.map(([k, v]) => `| ${String(k).replace(/\|/g, '/')} | ${n(v)} |`), ''
].join('\n'));
console.log(counts);
