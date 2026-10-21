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
 * listings, and the middle of its listings sits more than MAX_MILES from the
 * middle of every "core" ZIP (one carrying at least MIN_SHARE). Measuring to
 * the nearest core ZIP, not one centre, keeps multi-city searches ("Dallas,
 * Austin") and sprawling cities (Houston's edge ZIPs) whole. A ZIP whose
 * listings have no coordinates is kept: its distance is unknown, not far.
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

  // rows: [{ zip, latitude, longitude }]. Returns { stray: [zip], listings: n }.
  function strayZips(rows, opts) {
    var o = opts || {}, share = o.minShare || MIN_SHARE, far = o.maxMiles || MAX_MILES;
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
    zips.forEach(function (z) { var g = by[z]; g.mid = g.lat.length ? [median(g.lat), median(g.lon)] : null; });
    var core = zips.filter(function (z) { return by[z].n >= share * total && by[z].mid; });
    if (!core.length) return { stray: [], listings: 0 };
    var stray = zips.filter(function (z) {
      var g = by[z];
      if (g.n >= share * total || !g.mid) return false;
      return core.every(function (c) { return miles(g.mid[0], g.mid[1], by[c].mid[0], by[c].mid[1]) > far; });
    }).sort();
    return { stray: stray, listings: stray.reduce(function (a, z) { return a + by[z].n; }, 0) };
  }

  var api = { strayZips: strayZips, MIN_SHARE: MIN_SHARE, MAX_MILES: MAX_MILES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AreaZips = api;
})(typeof window !== 'undefined' ? window : this);
