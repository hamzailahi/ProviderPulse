// The "hospital distance check" (2026-11-10, the user's go-ahead): the
// ArcGIS points taken back on 2026-11-08 because their ZIP has no Census
// area (single-institution ZIPs such as UCSF's 94143 or UConn Health's
// 06030) get a second, independent check. A point is put back only when
// another listing at the same street address in the same ZIP already has a
// pin from another source, and the ArcGIS point lies within --max-m metres
// (150, about one building) of it.
//
// An anchor pin counts only when every listing at that exact point has the
// same street address (suite dropped, words spelled the same way), so a ZIP
// centre shared by many addresses can never vouch for anything.
//
// Usage: node arcgis-anchor.mjs --rows rows.csv --anchors anchors.csv --out place.csv --report report.md [--max-m 150]
// rows: tbl, npi, parent_npi, address, city, state, zip, lat, lng, addr_type, score
// anchors: address, state, zip, lat, lng (every pinned listing in those ZIPs)
import fs from 'node:fs';
import { parseCsv } from './lib/taxonomy-map.mjs';
import { streetOnly, streetParts } from './lib/geocode-batch.mjs';

const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const MAX_M = Number(arg('max-m') || 150);

export function addressKey(address, state, zip) {
  const p = streetParts(streetOnly(address), String(state || '').toUpperCase());
  if (!/^\d/.test(p.house) || !p.rest.length) return null;
  return [String(zip || '').slice(0, 5), p.house, [...p.dirs].sort().join(' '), p.rest.join(' ')].join('|');
}
export function metres(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function table(file) {
  const [head, ...rows] = parseCsv(fs.readFileSync(file, 'utf8'));
  return rows.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Anchor points: a point is usable only when one address key sits there.
export function anchorIndex(anchors) {
  const atPoint = new Map();
  for (const a of anchors) {
    const lat = Number(a.lat), lng = Number(a.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const pt = lat.toFixed(6) + ',' + lng.toFixed(6);
    const k = addressKey(a.address, a.state, a.zip);
    if (!atPoint.has(pt)) atPoint.set(pt, { lat, lng, keys: new Set() });
    atPoint.get(pt).keys.add(k);
  }
  const byKey = new Map();
  for (const p of atPoint.values()) {
    if (p.keys.size !== 1) continue;
    const [k] = p.keys;
    if (!k) continue;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(p);
  }
  return byKey;
}

export function decide(rows, byKey, maxM = MAX_M) {
  const place = [], keep = [];
  for (const r of rows) {
    const k = addressKey(r.address, r.state, r.zip);
    const pts = (k && byKey.get(k)) || [];
    if (!pts.length) { keep.push({ ...r, why: 'no other pin at this address' }); continue; }
    const p = { lat: Number(r.lat), lng: Number(r.lng) };
    const d = Math.min(...pts.map(q => metres(p, q)));
    if (d <= maxM) place.push({ ...r, metres: Math.round(d) });
    else keep.push({ ...r, why: `${Math.round(d)} m from the pin at the same address`, metres: Math.round(d) });
  }
  return { place, keep };
}

if (process.argv[1] && process.argv[1].endsWith('arcgis-anchor.mjs')) {
  const rows = table(arg('rows')), anchors = table(arg('anchors'));
  const byKey = anchorIndex(anchors);
  const { place, keep } = decide(rows, byKey);
  const cols = ['tbl', 'npi', 'parent_npi', 'address', 'city', 'state', 'zip', 'lat', 'lng', 'addr_type'];
  const q = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  fs.writeFileSync(arg('out'), [cols.join(','), ...place.map(r => cols.map(c => q(r[c] ?? '')).join(','))].join('\n') + '\n');
  const why = {};
  for (const r of keep) { const w = r.why.replace(/^\d+ m/, 'over ' + MAX_M + ' m'); why[w] = (why[w] || 0) + 1; }
  const ds = place.map(r => r.metres).sort((a, b) => a - b);
  const med = ds.length ? ds[Math.floor(ds.length / 2)] : null;
  const byZip = {};
  for (const r of rows) { const z = r.zip.slice(0, 5); byZip[z] = byZip[z] || [0, 0]; byZip[z][0]++; }
  for (const r of place) byZip[r.zip.slice(0, 5)][1]++;
  const lines = [
    `- Rows checked: ${rows.length}`,
    `- Pinned listings read in those ZIPs: ${anchors.length}; addresses with a usable pin: ${byKey.size}`,
    `- Within ${MAX_M} m of the pin at the same address: **${place.length}** (median ${med ?? 'n/a'} m)`,
    ...Object.entries(why).sort((a, b) => b[1] - a[1]).map(([w, n]) => `- Not put back, ${w}: ${n}`),
    '', '| ZIP | Rows | Within ' + MAX_M + ' m |', '|---|---:|---:|',
    ...Object.entries(byZip).sort((a, b) => b[1][0] - a[1][0]).map(([z, [n, p]]) => `| ${z} | ${n} | ${p} |`),
  ];
  fs.writeFileSync(arg('report'), lines.join('\n') + '\n');
  console.log(lines.slice(0, 6).join('\n'));
}
