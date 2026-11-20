// Read only (2026-11-20): where named clinicians really practise. For each NPI
// in our directory matching the name: our listing, the live NPPES record (and
// when it was last updated), CMS Doctors and Clinicians (Medicare enrollment,
// refreshed monthly) and the 2024 Medicare by-provider file (where they
// billed). Prints to the job log only; nothing is written or committed.
// Usage: node scripts/live/doctor-lookup.mjs ROWS.tsv  (npi\tname\taddress\tcity\tstate\tzip\ttaxonomy)
import { readFileSync } from 'node:fs';
import { catalog, baseTitle } from '../lib/cms-catalog.mjs';

const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').filter(Boolean).map(l => l.split('\t'));
const get = async (u) => { try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProviderPulse-loader)', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) }); return r.ok ? await r.json() : { _status: r.status }; } catch (e) { return { _error: e.message }; } };

let pufApi = null;
try {
  const sets = await catalog();
  const hits = sets.filter(d => /^Medicare Physician & Other Practitioners - by Provider$/i.test(baseTitle(d.title)));
  const dists = hits.flatMap(d => d.distribution || []).map(d => ({ url: d.accessURL || d.downloadURL || '', title: d.title || '' }))
    .filter(d => /data-api\/v1\/dataset\/[^/]+\/data/.test(d.url));
  dists.sort((a, b) => (Number((b.title.match(/20\d\d/g) || [0]).pop())) - (Number((a.title.match(/20\d\d/g) || [0]).pop())));
  pufApi = dists[0] || null;
  console.log('Medicare by-provider API:', pufApi ? pufApi.title + ' ' + pufApi.url : 'not found');
} catch (e) { console.log('catalog failed:', e.message); }

for (const [npi, name, addr, city, st, zip, tax] of rows) {
  console.log('\n==== ' + name + '  NPI ' + npi + '  (' + tax + ')');
  console.log('  Our directory:  ' + [addr, city, st, zip].join(', '));
  const n = await get('https://npiregistry.cms.hhs.gov/api/?version=2.1&number=' + npi);
  const r = n.results && n.results[0];
  if (r) {
    const loc = (r.addresses || []).find(a => a.address_purpose === 'LOCATION') || {};
    console.log('  NPPES live:     ' + [loc.address_1, loc.city, loc.state, String(loc.postal_code || '').slice(0, 5)].join(', ') + '  | last updated ' + (r.basic && r.basic.last_updated) + ', enumerated ' + (r.basic && r.basic.enumeration_date));
    for (const p of r.practiceLocations || []) console.log('    other site:   ' + [p.address_1, p.city, p.state].join(', '));
  } else console.log('  NPPES live:     ' + JSON.stringify(n).slice(0, 200));
  const d = await get('https://data.cms.gov/provider-data/api/1/datastore/query/mj5m-pzi6/0?conditions[0][property]=npi&conditions[0][value]=' + npi + '&limit=50');
  const dr = Array.isArray(d.results) ? d.results : [];
  if (dr.length) {
    const seen = new Set();
    for (const x of dr) { const k = [x.adr_ln_1, x.citytown, x.state].join(', '); if (seen.has(k)) continue; seen.add(k); console.log('  Medicare enrollment (CMS Doctors & Clinicians): ' + k + ' ' + String(x.zip_code || '').slice(0, 5) + (x.facility_name ? ' @ ' + x.facility_name : '')); }
  } else console.log('  Medicare enrollment: none found ' + (d._status || d._error || ''));
  if (pufApi) {
    const p = await get(pufApi.url + (pufApi.url.includes('?') ? '&' : '?') + 'filter[Rndrng_NPI]=' + npi);
    const pr = Array.isArray(p) ? p : [];
    console.log('  Billed Medicare (' + pufApi.title + '): ' + (pr.length ? pr.map(x => [x.Rndrng_Prvdr_City, x.Rndrng_Prvdr_State_Abrvtn, x.Rndrng_Prvdr_Zip5, (x.Tot_Benes || '?') + ' patients'].join(', ')).join(' | ') : 'no row ' + (p._status || p._error || '')));
  }
}
