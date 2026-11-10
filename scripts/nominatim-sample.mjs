// A read-only test of Nominatim (OpenStreetMap's free geocoder) on a sample
// of listings with no pin (2026-11-10, the user's ask). One request a
// second, as the public server's usage policy requires; nothing is written
// to the database and no coordinates are kept: the report holds counts only.
//
//   node scripts/nominatim-sample.mjs --rows sample.csv --out report.md [--limit 500]
// rows: tbl, address, city, state, zip, and optionally arcgis_lat, arcgis_lng
// (the point ArcGIS gave, to see how far the two sources agree).
//
// What counts as a building match: Nominatim returns an OpenStreetMap object
// (it has an osm_id, so it is not a TIGER street-range estimate) whose own
// house number and ZIP equal the listing's.
import fs from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { streetOnly } from './lib/geocode-batch.mjs';
import { houseOf, metres } from './lib/nad-match.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const URL_ = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const UA = 'ProviderPulse-geocoder-test/1.0 (https://github.com/hamzailahi/ProviderPulse)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function classify(row, hit) {
  if (!hit) return 'no_result';
  const a = hit.address || {};
  const zipOk = String(a.postcode || '').slice(0, 5) === String(row.zip || '').slice(0, 5);
  const num = String(a.house_number || '').replace(/^0+(?=\d)/, '');
  if (!num) return 'street_or_area';
  if (num !== houseOf(row.address)) return 'other_house_number';
  if (!zipOk) return 'other_zip';
  return hit.osm_id ? 'building' : 'street_estimate';
}

export async function lookup(row, f = fetch) {
  const q = new URLSearchParams({ street: streetOnly(row.address), city: row.city || '', state: row.state || '', postalcode: String(row.zip || '').slice(0, 5),
    countrycodes: 'us', format: 'jsonv2', addressdetails: '1', limit: '1' });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await f(URL_ + '?' + q, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
      if (r.ok) { const j = await r.json(); return { hit: Array.isArray(j) ? j[0] || null : null }; }
      if (r.status === 403) return { failed: 'refused' };
    } catch { /* retry */ }
    await sleep(5000 * (attempt + 1));
  }
  return { failed: 'error' };
}

if (process.argv[1] && process.argv[1].endsWith('nominatim-sample.mjs')) {
  const [head, ...raw] = parseCsv(fs.readFileSync(arg('rows'), 'utf8'));
  const rows = raw.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
    .filter(r => houseOf(r.address)).slice(0, Number(arg('limit') || 500));
  const st = {}, dist = [], types = {};
  let failed = 0, refusedRun = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const res = await lookup(r);
    if (res.failed) { failed++; refusedRun = res.failed === 'refused' ? refusedRun + 1 : 0; if (refusedRun >= 10) { console.log('refused ten times in a row; stopping'); break; } }
    else {
      refusedRun = 0;
      const c = classify(r, res.hit);
      st[c] = (st[c] || 0) + 1;
      if (c === 'building') {
        const k = `${res.hit.category || res.hit.class || '?'}/${res.hit.type || '?'}`; types[k] = (types[k] || 0) + 1;
        const la = Number(r.arcgis_lat), ln = Number(r.arcgis_lng);
        if (r.arcgis_lat && Number.isFinite(la) && Number.isFinite(ln)) dist.push(metres({ lat: la, lng: ln }, { lat: Number(res.hit.lat), lng: Number(res.hit.lon) }));
      }
    }
    if ((i + 1) % 50 === 0) console.log(`${i + 1}/${rows.length}`, JSON.stringify(st), 'failed', failed);
    await sleep(1100);
  }
  dist.sort((a, b) => a - b);
  const q = p => (dist.length ? Math.round(dist[Math.min(dist.length - 1, Math.floor(p * dist.length))]) : 'n/a');
  const done = Object.values(st).reduce((a, b) => a + b, 0);
  const pct = n => (done ? (100 * (n || 0) / done).toFixed(1) + '%' : 'n/a');
  const lines = [
    '# Nominatim (OpenStreetMap) test on listings with no pin', '',
    `Run ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by scripts/nominatim-sample.mjs: a sample, one request a second, read only. Nothing was written to the database and no coordinates were kept.`, '',
    `- Listings sent: ${rows.length}; answered: **${done}**; requests that failed: ${failed}`,
    `- A building in OpenStreetMap with the same house number and ZIP: **${st.building || 0}** (${pct(st.building)})`,
    `- Same house number and ZIP, but only an estimate along the street (TIGER ranges): ${st.street_estimate || 0} (${pct(st.street_estimate)})`,
    `- Only the street, or a wider area: ${st.street_or_area || 0} (${pct(st.street_or_area)})`,
    `- A different house number: ${st.other_house_number || 0} (${pct(st.other_house_number)})`,
    `- The right number in another ZIP: ${st.other_zip || 0} (${pct(st.other_zip)})`,
    `- No result: ${st.no_result || 0} (${pct(st.no_result)})`, '',
    dist.length ? `Building matches that also have an ArcGIS point (${dist.length}): distance between the two, median ${q(0.5)} m, 75th percentile ${q(0.75)} m, 90th percentile ${q(0.9)} m; ${dist.filter(d => d <= 50).length} within 50 m, ${dist.filter(d => d > 500).length} more than 500 m apart.` : 'No building match had an ArcGIS point to compare with.', '',
    'Kinds of OpenStreetMap object matched:', '', ...Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `- ${k}: ${v}`), ''
  ];
  fs.writeFileSync(arg('out'), lines.join('\n'));
  console.log(lines.join('\n'));
}
