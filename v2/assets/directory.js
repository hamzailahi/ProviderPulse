/* ============================================================================
   directory.js — shared, dependency-free helpers for reading the public
   provider directory (clinics, provider_individuals, clinic_secondary_locations,
   cdc_places centroids) with the publishable key, plus the small formatting
   helpers both apps use. Loaded as a classic script before patient.js (app.html)
   and portal.js (portal.html); everything here is a global on purpose.
   ============================================================================ */
'use strict';

// Collapse the week into something readable: consecutive days that share the
// same times are grouped ("Mon–Thu 9:00–17:00").
// Same publishable key already shipped in index.html. It is anon-level and
// read-only; RLS governs what it can see.
var SB_URL = 'https://khkmdultmrggpfvkbfzj.supabase.co';
var SB_KEY = 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';

var leafletLoading = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve(true);
  if (leafletLoading) return leafletLoading;
  leafletLoading = new Promise(function (resolve) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = function () { resolve(true); };
    js.onerror = function () { resolve(false); };   // fall back to a list
    document.head.appendChild(js);
  });
  return leafletLoading;
}

// Copied verbatim from index.html. Both halves are load-bearing: without the
// leading space "Urology Physician" matches "NeUROLOGY PHYSICIAN"; adding a
// trailing space stops "Dentist" matching "General Practice Dentistry".
function taxNorm(s) {
  return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}
function taxMatches(stored, terms) {
  var nt = ' ' + taxNorm(stored);
  for (var i = 0; i < terms.length; i++) if (nt.indexOf(' ' + taxNorm(terms[i])) !== -1) return true;
  return false;
}

// ZIPs are stored both zero-padded and not, so always ask for both forms.
function zipOr(zips) {
  var forms = {};
  zips.forEach(function (z) {
    forms['zip.eq.' + z] = true;
    forms['zip.eq.' + String(parseInt(z, 10))] = true;
  });
  return '(' + Object.keys(forms).join(',') + ')';
}

// PostgREST caps every response at 1000 rows no matter what `limit` says. A
// single dense ZIP can hold more than that (77036 has 1,626), and a truncated
// reply looks identical to a complete one — no error, just fewer pins, and the
// patient has no way to know a practice near them was silently dropped.
//
// Paged with offset, not a keyset cursor: the result set here is bounded by one
// ZIP or one ~24-mile box, so it is at most a few thousand rows, nowhere near
// the depth where OFFSET on a 1.9M-row table gets expensive (that problem is
// real, but it lives in market-score.js's scan of the whole `clinics` table,
// not here).
var CLINICS_PAGE_CAP = 6000;
function tableQuery(table, select, filter) {
  var base = SB_URL + '/rest/v1/' + table + '?' + filter + '&select=' + select;
  function page(offset, acc) {
    return fetch(base + '&limit=1000&offset=' + offset, { headers: { apikey: SB_KEY, Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        var next = acc.concat(rows || []);
        if (!rows || rows.length < 1000 || next.length >= CLINICS_PAGE_CAP) return next;
        return page(offset + 1000, next);
      })
      .catch(function () { return acc; });
  }
  return page(0, []);
}

var PROVIDER_ROW_SELECT = 'npi,name,address,city,state,zip,primary_taxonomy,taxonomy_code,latitude,longitude';
function clinicsQuery(filter) {
  return tableQuery('clinics', PROVIDER_ROW_SELECT, filter);
}

// clinics (NPI-2 orgs) is what this used to query alone. provider_individuals
// (NPI-1 physicians, migration 013) and clinic_secondary_locations (pl_pfile
// secondary addresses, migration 014, parent_npi aliased to npi) share the same
// row shape, so every caller of clinicsQuery gets them for free by switching to
// this instead -- taxMatches/dedup/map-plotting downstream need no changes.
// _src tags where each row came from so the popup can note when a physician
// shares an address with a clinic (bulk NPPES has no confirmed affiliation
// link, so this is a same-coordinate inference, not a stored fact) and can
// label a clinic_secondary_locations row as a secondary address rather than
// implying it is the practice's main site.
function tagSrc(rows, src) { (rows || []).forEach(function (r) { r._src = src; }); return rows; }

function providerRowsQuery(filter) {
  return Promise.all([
    clinicsQuery(filter),
    tableQuery('provider_individuals', PROVIDER_ROW_SELECT, filter),
    tableQuery('clinic_secondary_locations', 'npi:parent_npi,name,address,city,state,zip,primary_taxonomy,taxonomy_code,latitude,longitude', filter)
  ]).then(function (results) {
    var all = tagSrc(results[0], 'clinic').concat(tagSrc(results[1], 'individual'), tagSrc(results[2], 'secondary'));
    // Any table that hit the page cap means the answer is a sample, and the
    // results list says so instead of presenting it as complete.
    all.truncated = results.some(function (r) { return (r || []).length >= CLINICS_PAGE_CAP; });
    return all;
  });
}

// CDC PLACES carries a real ZCTA centroid for every ZIP it covers (32,520 of
// them — see supabase/migrations/010_cdc_places_centroids.sql), including
// ZIPs with zero clinics. DENTAL is the measure asked for because it is
// published for all 32,520 ZCTAs; the 2023-only measures cover 29,983, which
// would silently lose ~2,500 ZIPs' worth of centroids for no reason.
//
// This exists so ranking neighbour ZIPs stops depending on averaging the
// coordinates of whichever clinics happened to be nearby — which cannot work
// at all for a ZIP with no clinics, is exactly the case that most needs a
// neighbour search, and was the best available anchor before this table
// existed (see patient.js's own prior comment on that, now removed because it
// is no longer true).
function zctaCentroid(zips) {
  if (!zips.length) return Promise.resolve({});
  var url = SB_URL + '/rest/v1/cdc_places?measureid=eq.DENTAL' +
    '&zip=in.(' + zips.join(',') + ')&select=zip,lat,lon';
  return fetch(url, { headers: { apikey: SB_KEY, Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var byZip = {};
      (rows || []).forEach(function (r) {
        if (r.lat == null || r.lon == null) return;
        byZip[String(r.zip).padStart(5, '0')] = { lat: +r.lat, lng: +r.lon };
      });
      return byZip;
    })
    .catch(function () { return {}; });
}


function summariseHours(h) {
  var order = [['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat'],['sun','Sun']];
  var out = [], run = null;
  order.forEach(function (d) {
    var v = h && h[d[0]];
    var key = v ? v.open + '-' + v.close : null;
    if (run && run.key === key && key) { run.end = d[1]; return; }
    if (run && run.key) out.push(run);
    run = key ? { key: key, start: d[1], end: d[1], open: v.open, close: v.close } : null;
  });
  if (run && run.key) out.push(run);
  return out.map(function (r) {
    return (r.start === r.end ? r.start : r.start + '–' + r.end) + ' ' + r.open + '–' + r.close;
  }).join(' · ') || 'Not listed';
}


var MAPTILER_KEY = '5LQ8tmZJYC4eWN4l4hdi';   // client-side map key, restricted by domain in MapTiler

function milesBetween(aLat, aLng, bLat, bLng) {
  var R = 3958.8, rad = Math.PI / 180;
  var dLat = (bLat - aLat) * rad, dLng = (bLng - aLng) * rad;
  var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

// The ZIP's centre: its real ZCTA centroid, else the average of its own listings.
function locateZip(zip) {
  return zctaCentroid([zip]).then(function (c) {
    if (c[zip]) return c[zip];
    return clinicsQuery('or=' + zipOr([zip])).then(function (rows) {
      var pts = (rows || []).filter(function (r) { return r.latitude && r.longitude; });
      if (!pts.length) return null;
      var lat = 0, lng = 0;
      pts.forEach(function (r) { lat += +r.latitude; lng += +r.longitude; });
      return { lat: lat / pts.length, lng: lng / pts.length };
    });
  });
}

// A coarse server-side prefilter: the first word of each term as an ilike. It
// can only over-include; taxMatches() still decides the final answer. Without
// it a 25-mile box in a city returns every listing of every kind and hits the
// row cap long before the specialty that was asked for.
function taxonomyPrefilter(terms) {
  var words = {};
  terms.forEach(function (t) {
    var w = String(t).split(/\s+/)[0].replace(/[^A-Za-z]/g, '');
    if (w.length >= 3) words[w.toLowerCase()] = true;
  });
  var keys = Object.keys(words);
  if (!keys.length) return '';
  return '&or=(' + keys.map(function (w) { return 'primary_taxonomy.ilike.*' + w + '*'; }).join(',') + ')';
}

// Patient specialties are keyed on NUCC codes (taxonomy codes phase 3): the
// reviewed table in supabase/reference/taxonomy-overrides.csv, read through
// TaxonomyMap.codesFor (assets/taxonomy-map.js, loaded before this file). An
// unknown label is an empty list; callers then fall back to name terms.
// taxonomy_code is indexed (migration 030), so in.() is cheap.
function specialtyCodes(label) {
  return (typeof TaxonomyMap !== 'undefined' && label) ? TaxonomyMap.codesFor(label) : [];
}
function codeFilter(codes) {
  return '&taxonomy_code=in.(' + codes.join(',') + ')';
}

function initials(name) {
  var parts = String(name || '').replace(/[^A-Za-z ]/g, ' ').trim().split(/\s+/);
  return ((parts[0] || '?').charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : '')).toUpperCase();
}
function hueFor(key) {
  var n = 0; key = String(key || '');
  for (var i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) % 360;
  return n;
}
function titleCase(s) {
  s = String(s || '');
  // NPPES and the bulk tables store names in capitals; shout-case reads as a
  // data dump. Only re-case strings that are entirely upper case.
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); })
    .replace(/\b(Md|Do|Np|Pa|Dds|Dmd|Od|Pc|Pllc|Llc|Inc|Fnp|Aprn|Lcsw|Lpc)\b/g, function (m) { return m.toUpperCase(); })
    .replace(/(\S) (Of|And|The|At|For|In)\b/g, function (m, a, w) { return a + ' ' + w.toLowerCase(); });
}

