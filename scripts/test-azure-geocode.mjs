import { azureAccepts, azureAll } from './lib/azure-geocode.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL', m); } };
const feat = (o = {}) => ({ features: [{ properties: { type: 'Address', confidence: 'High', matchCodes: ['Good'],
  address: { addressLine: '577 N Germantown Rd', postalCode: o.zip || '38018' },
  geocodePoints: [{ calculationMethod: o.method || 'Rooftop', geometry: { coordinates: [-89.8, 35.1] } }], ...(o.p || {}) } }] });
const it = { id: '1', address: '577 N. GERMANTOWN RD. STE 100', city: 'CORDOVA', state: 'TN', zip: '38018' };
ok(azureAccepts(feat(), it).ok, 'rooftop, same house, same ZIP accepted');
ok(azureAccepts(feat({ method: 'Parcel' }), it).ok, 'parcel accepted');
ok(azureAccepts(feat({ method: 'Interpolation' }), it).why === 'not_rooftop', 'interpolation refused');
ok(azureAccepts(feat({ p: { confidence: 'Medium' } }), it).why === 'low_confidence', 'medium refused');
ok(azureAccepts(feat({ p: { matchCodes: ['Good', 'Ambiguous'] } }), it).why === 'low_confidence', 'ambiguous refused');
ok(azureAccepts(feat({ p: { type: 'PostalCodeAddress' } }), it).why === 'not_an_address', 'postal centre refused');
const oz = azureAccepts(feat({ zip: '38017' }), it);
ok(oz.why === 'other_zip' && oz.building && oz.zip === '38017', 'right building in another ZIP reported');
ok(azureAccepts(feat(), { ...it, address: '579 N GERMANTOWN RD' }).why === 'other_house_number', 'neighbouring number refused');
ok(azureAccepts({ features: [] }, it).why === 'no_result', 'empty');
// azureAll: cap, retries, outage counted as failed
let calls = 0;
const fake = async () => { calls++; return { ok: true, status: 200, json: async () => feat() }; };
const r = await azureAll([it, { ...it, id: '2' }, { ...it, id: '3' }], { key: 'x', max: 2, fetch: fake, waitMs: 0 });
ok(calls === 2 && r.stats.not_sent === 1 && r.coords.size === 2, 'max caps requests sent');
let n = 0;
const flaky = async () => (++n === 1 ? { ok: false, status: 429 } : { ok: true, status: 200, json: async () => feat() });
ok((await azureAll([it], { key: 'x', fetch: flaky, waitMs: 0 })).coords.size === 1, '429 retried');
const down = async () => ({ ok: false, status: 503 });
const d = await azureAll([it], { key: 'x', fetch: down, waitMs: 0 });
ok(d.failed.size === 1 && d.misses.size === 0, 'outage is a failure, not a miss');
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
