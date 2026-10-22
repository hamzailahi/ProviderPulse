// Tests for v2/netlify/functions/lib/providers-near.js, the market assistant's
// find_providers tool (rewritten 2026-10-22): it asks for the specialty's
// NUCC codes inside a location box instead of every listing in the area,
// lists organizations and individual clinicians separately, covers a radius
// or the map's ZIPs, and never reads a failed or capped lookup as "none".
//
// node scripts/test-providers-near.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { findProviders } = require('../v2/netlify/functions/lib/providers-near.js');
const TaxonomyMap = require('../v2/assets/taxonomy-map.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };
const env = { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon' };
const GI = '207RG0100X', ENDO = '261QE0800X', FP = '207Q00000X';

function fakeDb(handlers) {
  const urls = [];
  const f = async (url) => {
    const u = decodeURIComponent(String(url)); urls.push(u);
    for (const [re, body] of handlers) if (re.test(u)) {
      if (body === 500) return { ok: false, status: 500, json: async () => ({ code: '57014' }) };
      return { ok: true, status: 200, json: async () => (typeof body === 'function' ? body(u) : body) };
    }
    return { ok: true, status: 200, json: async () => [] };
  };
  f.urls = urls;
  return f;
}
const centre = [/cdc_places\?zip=eq\./, [{ zip: '76117', lat: 32.80, lon: -97.27 }]];
const mapCentres = [/cdc_places\?measureid=eq\.DENTAL&zip=in/, [{ zip: '76117', lat: 32.80, lon: -97.27 }, { zip: '76180', lat: 32.86, lon: -97.22 }, { zip: '76104', lat: 32.73, lon: -97.32 }]];
const L = (npi, name, code, zip, lat, lon) => ({ npi, name, city: 'FORT WORTH', zip, primary_taxonomy: 'x', taxonomy_code: code, latitude: lat, longitude: lon });
const ORGS = [L('1', 'FORT WORTH ENDOSCOPY CENTERS', ENDO, '76104', 32.73, -97.32), L('2', 'TARRANT GASTROENTEROLOGY', GI, '76104', 32.731, -97.321), L('3', 'FAR GI', GI, '75201', 32.78, -96.80)];
const PEOPLE = [L('10', 'DR NEAR', GI, '76180', 32.86, -97.22), L('11', 'DR CITY', GI, '76104', 32.73, -97.32), L('12', 'DR FAMILY', FP, '76117', 32.80, -97.27)];
const page = rows => u => (u.includes('offset=0') ? rows : []);

// 1. Radius: the query names the codes and a box; rows are kept by distance
{
  const f = fakeDb([centre, [/\/clinics\?/, page(ORGS)], [/\/provider_individuals\?/, page(PEOPLE)]]);
  const r = await findProviders({ zip: '76117', specialty: 'Digestive / gastroenterology', radius_miles: 10 }, { fetch: f, env });
  const q = f.urls.find(u => u.includes('/provider_individuals?'));
  check('the query asks for the specialty\'s codes only', TaxonomyMap.codesFor('Digestive / gastroenterology').every(c => q.includes(c)) && /taxonomy_code=in\./.test(q));
  check('the query is a location box in a stable order, never every listing in the ZIPs', /latitude=gte\..*longitude=lte\./.test(q) && /order=latitude,longitude,npi/.test(q) && !/zip=in/.test(q));
  check('individual clinicians are found, not only organizations', r.individuals === 2 && r.nearest_individuals[0].name === 'DR NEAR');
  check('surgery centers carrying the specialty\'s codes count as organizations', r.nearest_organizations.some(o => /ENDOSCOPY/.test(o.name)) && r.organizations === 2);
  check('a listing outside the radius is left out (Dallas)', !r.nearest_organizations.some(o => o.name === 'FAR GI'));
  check('a listing with another specialty\'s code is left out', !r.nearest_individuals.some(o => o.name === 'DR FAMILY'));
  check('each listing names its specialty from the NUCC code', /Gastroenterology/.test(r.nearest_individuals[0].taxonomy));
  check('counts per ZIP', r.by_zip.find(z => z.zip === '76104').listings === 3);
  check('a complete lookup says so', r.incomplete === false && r.count_is_floor === false);
}

// 2. The map's ZIPs instead of a radius
{
  const f = fakeDb([centre, mapCentres, [/\/clinics\?/, page(ORGS)], [/\/provider_individuals\?/, page(PEOPLE)]]);
  const r = await findProviders({ zip: '76117', specialty: 'Digestive / gastroenterology', radius_miles: 5 }, { fetch: f, env, zips: ['76117', '76180', '76104'] });
  check('map area: listings in the map\'s ZIPs count whatever the radius', r.area.map_zips === 3 && r.total === 4, JSON.stringify(r.by_zip));
  check('map area: a ZIP not on the map is left out', !r.nearest_organizations.some(o => o.zip === '75201'));
  const q = f.urls.find(u => u.includes('/clinics?'));
  const lat = Number(q.match(/latitude=gte\.([\d.-]+)/)[1]);
  check('map area: the box reaches the southernmost map ZIP (76104) and past it', lat < 32.73);
}

// 3. Failures are never "none"
{
  const r = await findProviders({ zip: '76117', specialty: 'Digestive / gastroenterology', radius_miles: 25 }, { fetch: fakeDb([centre, [/\/clinics\?/, 500], [/\/provider_individuals\?/, 500]]), env });
  check('both tables failing is an error, not zero providers', !!r.error && r.total === undefined);
  const r2 = await findProviders({ zip: '76117', specialty: 'Digestive / gastroenterology', radius_miles: 25 }, { fetch: fakeDb([centre, [/\/clinics\?/, page(ORGS)], [/\/provider_individuals\?/, 500]]), env });
  check('one table failing: the result is incomplete and its counts are floors', r2.incomplete === true && r2.count_is_floor === true && /floors/.test(r2.incomplete_reason) && r2.organizations === 2);
  let n = 0;
  const full = Array.from({ length: 1000 }, (_, i) => L(String(100 + i), 'GI ' + i, GI, '76117', 32.80, -97.27));
  const r3 = await findProviders({ zip: '76117', specialty: 'Digestive / gastroenterology', radius_miles: 10 }, { fetch: fakeDb([centre, [/\/provider_individuals\?/, () => (++n <= 10 ? full : [])]]), env });
  check('more listings than ten pages hold: marked as floors', r3.incomplete === true && /more listings than one lookup holds/.test(r3.incomplete_reason));
  const r4 = await findProviders({ zip: '76117', specialty: null, radius_miles: 10 }, { fetch: fakeDb([[/cdc_places/, 500]]), env });
  check('a failed location lookup is an error', /did not answer/.test(r4.error || ''));
  const r5 = await findProviders({ zip: '7611', specialty: null, radius_miles: 10 }, { fetch: fakeDb([]), env });
  check('a malformed ZIP is refused', !!r5.error);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
