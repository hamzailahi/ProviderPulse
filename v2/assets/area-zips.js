/* area-zips.js: stray ZIPs in a city search (2026-10-21).
 *
 * A city search loads every listing whose city field matches, so a few
 * mis-addressed listings drag far-away ZIPs onto the map: "Fort Worth, TX"
 * brought in 78705 (Austin), 26109 (West Virginia) and 76401 (Stephenville),
 * and every ZIP on the map feeds Demographics, Health and Procedures, so
 * Austin's campus clinicians became the third-busiest ZIP in a Fort Worth
 * code list. strayZips() names the ZIPs to leave out.
 *
 * A ZIP is stray only when both hold: it carries under MIN_SHARE of the
 * listings, and it sits more than MAX_MILES from every "core" ZIP (one
 * carrying at least MIN_SHARE). Measuring to the nearest core ZIP, not one
 * centre, keeps multi-city searches ("Dallas, Austin") and sprawling cities
 * (Houston's edge ZIPs) whole. Where a ZIP is: its official centre when
 * opts.centroids has it, else the middle of its listings; unknown is kept,
 * never called far.
 *
 * Two kinds come back. Most Fort Worth strays were mistyped ZIPs (26109 for
 * 76109, 78705 for 76105): the listing's pin is in Fort Worth but its ZIP is
 * not, so the ZIP leaves the area while the pin stays. `pinsFar` lists the
 * ZIPs whose listings themselves sit far away (an Austin address under
 * "Fort Worth"); those listings leave the map too.
 * Dual-exported: window.AreaZips in the browser, module.exports under Node.
 */
(function (root) {
  'use strict';

  var MIN_SHARE = 0.01;
  var MAX_MILES = 25;

  function miles(a, b, c, d) {
    var R = 3958.8, r = Math.PI / 180;
    var x = Math.pow(Math.sin((c - a) * r / 2), 2) + Math.cos(a * r) * Math.cos(c * r) * Math.pow(Math.sin((d - b) * r / 2), 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
  }
  function median(v) { var s = v.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

  // rows: [{ zip, latitude, longitude }]; opts.centroids: { zip: [lat, lon] }.
  // Returns { stray: [zip], listings: n, pinsFar: [zip] }.
  function strayZips(rows, opts) {
    var o = opts || {}, share = o.minShare || MIN_SHARE, far = o.maxMiles || MAX_MILES, cen = o.centroids || {};
    var by = {}, total = 0;
    (rows || []).forEach(function (r) {
      var z = String(r.zip || '').split('-')[0].trim();
      if (!z) return;
      total++;
      var g = by[z] || (by[z] = { n: 0, lat: [], lon: [] });
      g.n++;
      var lat = parseFloat(r.latitude), lon = parseFloat(r.longitude);
      if (isFinite(lat) && isFinite(lon) && (lat !== 0 || lon !== 0)) { g.lat.push(lat); g.lon.push(lon); }
    });
    var zips = Object.keys(by);
    var ok = function (p) { return p && isFinite(p[0]) && isFinite(p[1]) && (p[0] !== 0 || p[1] !== 0); };
    zips.forEach(function (z) {
      var g = by[z];
      g.mid = g.lat.length ? [median(g.lat), median(g.lon)] : null;
      g.pos = ok(cen[z]) ? [+cen[z][0], +cen[z][1]] : g.mid;
    });
    var core = zips.filter(function (z) { return by[z].n >= share * total && by[z].pos; });
    if (!core.length) return { stray: [], listings: 0, pinsFar: [] };
    var farFromCore = function (p) { return core.every(function (c) { return miles(p[0], p[1], by[c].pos[0], by[c].pos[1]) > far; }); };
    var stray = zips.filter(function (z) {
      var g = by[z];
      return g.n < share * total && g.pos && farFromCore(g.pos);
    }).sort();
    return {
      stray: stray,
      listings: stray.reduce(function (a, z) { return a + by[z].n; }, 0),
      pinsFar: stray.filter(function (z) { return by[z].mid && farFromCore(by[z].mid); })
    };
  }

  var api = { strayZips: strayZips, MIN_SHARE: MIN_SHARE, MAX_MILES: MAX_MILES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AreaZips = api;
})(typeof window !== 'undefined' ? window : this);
