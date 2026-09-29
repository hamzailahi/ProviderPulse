/* ============================================================================
   patient.js — ProviderPulse patient app.

   Classic script, not an ES module: modules are CORS-blocked on file://, and
   being able to open app.html directly is worth more than the syntax.

   RULE, no exceptions: values from the API, from storage, or from the URL are
   placed with h() / textContent. innerHTML is only ever given string literals.
   The old page interpolated profile values straight into innerHTML; making that
   structurally impossible is why h() exists.
   ============================================================================ */
(function () {
'use strict';

var FN = '/.netlify/functions';
// One session for the whole product. It was 'pp.patient.v1' and the provider
// page wrote a bare token to 'pp_token', so no surface could read another's
// session — a signed-in provider looked signed-out to the dashboard.
var SESSION_KEY = 'pp.session.v1';
var LEGACY_KEYS = ['pp.patient.v1'];   // read-only, so existing sessions survive
var REQ_TIMEOUT = 26000;             // matches the function ceiling in netlify.toml

/* ---------- tiny DOM layer ------------------------------------------------ */
function h(tag, attrs) {
  var el = document.createElement(tag), k, v;
  attrs = attrs || {};
  for (k in attrs) {
    v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;               // literals only
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = !!v;
    else el.setAttribute(k, v);
  }
  var kids = Array.prototype.slice.call(arguments, 2);
  (function add(list) {
    for (var i = 0; i < list.length; i++) {
      var kid = list[i];
      if (kid === null || kid === undefined || kid === false) continue;
      if (Array.isArray(kid)) { add(kid); continue; }
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
  })(kids);
  return el;
}
function $(sel) { return document.querySelector(sel); }
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/* ---------- state --------------------------------------------------------- */
var state = {
  session: null,      // {access_token, role, expiresAt}
  profile: null,
  search: null,       // the find view's query, results and filters (newSearch)
  askDraft: '',       // text handed to the "Not sure who to see?" helper
  documents: [],
  reviewing: null,    // {document_id, document_kind, facts[]}
  persist: false,     // "stay signed in" -> localStorage instead of sessionStorage
  ctrl: null          // in-flight AbortController
};

// A result by NPI, from the current search. Detail and booking sheets read it.
function findResult(npi) {
  var all = (state.search && state.search.all) || [];
  for (var i = 0; i < all.length; i++) if (String(all[i].npi) === String(npi)) return all[i];
  return null;
}

/* ---------- session ------------------------------------------------------- */
// The refresh token IS persisted, which is a deliberate trade-off. It is a
// longer-lived credential sitting next to PHI, but Supabase rotates it on every
// exchange (a stolen one is single-use and detectable), and the default store is
// sessionStorage, which dies with the tab. localStorage is used only when the
// patient explicitly ticks "stay signed in on this device".
function saveSession(s, persist) {
  var raw = JSON.stringify(s);
  try {
    (persist ? localStorage : sessionStorage).setItem(SESSION_KEY, raw);
    // Never leave a copy in the other store when the choice changes
    (persist ? sessionStorage : localStorage).removeItem(SESSION_KEY);
  } catch (e) {}
}
function loadSession() {
  var raw = null;
  try {
    raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    for (var i = 0; !raw && i < LEGACY_KEYS.length; i++) {
      raw = sessionStorage.getItem(LEGACY_KEYS[i]) || localStorage.getItem(LEGACY_KEYS[i]);
    }
  } catch (e) {}
  if (!raw) return null;
  try {
    var s = JSON.parse(raw);
    if (!s.access_token || !s.expiresAt) { clearSession(); return null; }
    // An expired access token is recoverable now: if a refresh token came with
    // it, keep the session and let doRefresh() revive it on load. Only discard
    // when there is nothing left to refresh with.
    if (s.expiresAt - 60000 < Date.now() && !s.refresh_token) { clearSession(); return null; }
    state.persist = (localStorage.getItem(SESSION_KEY) !== null);
    return s;
  } catch (e) { clearSession(); return null; }
}
function clearSession() {
  try {
    [SESSION_KEY].concat(LEGACY_KEYS).forEach(function (k) {
      sessionStorage.removeItem(k); localStorage.removeItem(k);
    });
  } catch (e) {}
}
// Revoke server-side first, then clear locally. The local clear runs regardless
// of whether the revoke succeeded — a user must always be able to sign out.
function signOut() {
  var had = state.session;
  if (had) api('/auth-logout', { method: 'POST' }).catch(function () {});
  clearSession();
  state.session = null; state.profile = null; state.search = null;
  state.documents = []; state.reviewing = null;
  payerCache = {};
  unmountFind();
  location.hash = '';
  render();
}

// Exchange the refresh token before the access token dies, so a session does not
// expire mid-conversation. Supabase ROTATES the refresh token on every exchange,
// so whatever comes back must replace what we stored or the next refresh fails.
var refreshTimer = null;
var refreshing = null;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  if (!state.session || !state.session.refresh_token) return;
  var lead = 120000;   // two minutes before expiry
  var due = state.session.expiresAt - Date.now() - lead;
  refreshTimer = setTimeout(doRefresh, Math.max(due, 5000));
}
function doRefresh() {
  if (!state.session || !state.session.refresh_token) return Promise.resolve(false);
  if (refreshing) return refreshing;
  refreshing = api('/auth-refresh', {
    auth: false, method: 'POST', body: { refresh_token: state.session.refresh_token }
  }).then(function (d) {
    state.session = {
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      role: d.role || state.session.role,
      expiresAt: Date.now() + (d.expires_in || 3600) * 1000
    };
    saveSession(state.session, state.persist);
    scheduleRefresh();
    refreshing = null;
    return true;
  }).catch(function () {
    refreshing = null;
    return false;   // caller falls back to the re-auth sheet
  });
  return refreshing;
}

/* ---------- API ----------------------------------------------------------- */
function ApiError(message, status, body) {
  this.name = 'ApiError'; this.message = message; this.status = status; this.body = body || {};
}
ApiError.prototype = Object.create(Error.prototype);

function api(path, opts) {
  opts = opts || {};
  var headers = { 'Content-Type': 'application/json' };
  if (opts.auth !== false && state.session) headers.Authorization = 'Bearer ' + state.session.access_token;

  var ctrl = new AbortController();
  if (opts.track) state.ctrl = ctrl;
  var timer = setTimeout(function () { ctrl.abort(); }, opts.timeout || REQ_TIMEOUT);

  return fetch(FN + path, {
    method: opts.method || 'GET',
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: ctrl.signal
  }).then(function (res) {
    clearTimeout(timer);
    return res.text().then(function (text) {
      var data = {};
      // Four of the older functions return a bare string on 405, so never assume JSON
      try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { error: text }; }
      if (res.status === 401 && opts.auth !== false) {
        // One silent refresh-and-retry before surfacing anything to the patient.
        // _retried guards against a loop when the refresh itself is what failed.
        if (!opts._retried && state.session && state.session.refresh_token) {
          return doRefresh().then(function (ok) {
            if (!ok) {
              state.session = null; clearSession();
              throw new ApiError('Your session timed out.', 401, data);
            }
            opts._retried = true;
            return api(path, opts);
          });
        }
        state.session = null; clearSession();
        throw new ApiError('Your session timed out.', 401, data);
      }
      if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status, data);
      return data;
    });
  }).catch(function (err) {
    clearTimeout(timer);
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('That took too long.', 0, { aborted: true });
    throw new ApiError('Could not reach the server.', 0, {});
  });
}

/* ---------- in-app map ----------------------------------------------------
   The map is a sheet inside the app, not a jump to the analyst dashboard.
   Leaflet is loaded on first open so the conversation home pays nothing for it.
   -------------------------------------------------------------------------- */

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

var PROVIDER_ROW_SELECT = 'npi,name,address,city,state,zip,primary_taxonomy,latitude,longitude';
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
    tableQuery('clinic_secondary_locations', 'npi:parent_npi,name,address,city,state,zip,primary_taxonomy,latitude,longitude', filter)
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

// NPI -> registered listing, loaded once when the map first opens
var registeredNpis = {};
var registeredLoading = null;
function loadRegistered() {
  if (!registeredLoading) {
    registeredLoading = api('/providers-public?all=1', { auth: false })
      .then(function (d) { registeredNpis = (d && d.providers) || {}; })
      .catch(function () { registeredLoading = null; });
  }
  return registeredLoading;
}

/* ---------- provider card ------------------------------------------------- */
function badgesFor(p) {
  var out = [];
  var payer = (state.search && state.search.payer) || (state.profile && state.profile.insurance_payer) || 'your insurance';
  if (p.registered) out.push(h('span', { class: 'badge verified' }, '✓ Verified listing'));

  // undefined is NOT false. patient-match only sets takes_your_insurance when the
  // patient has a payer on file AND the provider listed payers, so unknown must
  // never read as positive.
  if (p.takes_your_insurance === true) out.push(h('span', { class: 'badge good' }, 'Takes your ' + payer));
  else if (p.takes_your_insurance === false) out.push(h('span', { class: 'badge caution' }, payer + ' not listed — call to confirm'));
  else out.push(h('span', { class: 'badge unknown' }, 'Insurance not confirmed'));

  if (p.accepting_new_patients === true) out.push(h('span', { class: 'badge good' }, 'Accepting new patients'));
  else if (p.accepting_new_patients === false) out.push(h('span', { class: 'badge unknown' }, 'Not taking new patients'));
  // absent -> nothing, deliberately

  if (p.telehealth === true) out.push(h('span', { class: 'badge tele' }, 'Telehealth'));
  return out;
}

// Collapse the week into something readable on a card: consecutive days that
// share the same times are grouped ("Mon–Thu 9:00–17:00").
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

/* ---------- find: search, results, map --------------------------------------
   The patient home. A Zocdoc-style search: what (specialty or plain-language
   condition), where (ZIP), how far (radius in miles) and which insurance, then
   a full results list beside a large map.

   Results come straight from the directory tables (clinics, provider_individuals,
   clinic_secondary_locations) through the publishable key, the same public data
   the provider dashboard reads, so a search never waits on the AI and still
   works if the assistant is down. Claimed listings are overlaid from
   providers-public: that is what adds verified, accepting-new-patients,
   telehealth, insurance and request-to-book.

   The AI navigator is an optional helper (#/ask) that only fills in the search.
   -------------------------------------------------------------------------- */
var RADIUS_CHOICES = [5, 10, 25, 50];
var DEFAULT_RADIUS = 10;
var RESULTS_PAGE = 25;
var MAPTILER_KEY = '5LQ8tmZJYC4eWN4l4hdi';   // client-side map key, restricted by domain in MapTiler

// Plain-language words a patient types, mapped onto a SPECIALTIES label. Word
// boundaries throughout: "ear" must not fire on "near", "ent" on "patient".
var CONDITION_HINTS = [
  [/\b(diabet|thyroid|hormon|endocrin)/, 'Diabetes & hormones'],
  [/\b(heart|cardi|chest pain|blood pressure|hypertens|palpitat)/, 'Heart / cardiology'],
  [/\b(skin|rash|acne|eczema|psoria|mole|derma)/, 'Skin / dermatology'],
  [/\b(anxi|depress|therap(y|ist)|counsel|mental|adhd|bipolar|ptsd|psychiat|psycholog)/, 'Mental health & counseling'],
  [/\b(tooth|teeth|dent|gum)/, 'Dental'],
  [/\b(eye|vision|glasses|contacts|optom|ophthal)/, 'Eye care'],
  [/\b(chiropract|spine adjust)/, 'Chiropractic'],
  [/\b(physical therap|rehab|occupational therap)/, 'Physical & occupational therapy'],
  [/\b(knee|shoulder|hip|fracture|sprain|sports injur|ortho|broken bone)/, 'Orthopedics & sports injury'],
  [/\b(kid|child|baby|infant|toddler|pediatr)/, 'Pediatrics (children)'],
  [/\b(pregnan|prenatal|obgyn|ob-gyn|gyne|women'?s health|period|menopaus)/, "Women's health / OB-GYN"],
  [/\b(asthma|copd|lung|breath|sleep apnea|snor|pulmon)/, 'Lung, breathing & sleep'],
  [/\b(stomach|gut|acid reflux|reflux|ibs|colon|gastro|digest|crohn)/, 'Digestive / gastroenterology'],
  [/\b(kidney|renal|nephro|dialysis)/, 'Kidney / nephrology'],
  [/\b(cancer|tumou?r|oncolog|chemo)/, 'Cancer care / oncology'],
  [/\b(arthritis|lupus|gout|rheumat)/, 'Arthritis / rheumatology'],
  [/\b(headache|migraine|seizure|epilep|stroke|neuro|numbness|memory)/, 'Brain & nerves / neurology'],
  [/\b(ear|nose|throat|sinus|tonsil|ent)\b/, 'Ear, nose & throat'],
  [/\b(urin|bladder|prostate|urolog)/, 'Urology'],
  [/\b(foot|feet|ankle|heel|bunion|podiat)/, 'Foot & ankle / podiatry'],
  [/\b(chronic pain|pain management|back pain|neck pain)/, 'Pain management'],
  [/\b(allerg|immunolog)/, 'Allergy & immunology'],
  [/\b(urgent|emergency)\b/, 'Urgent care & emergency'],
  [/\b(diet|nutrition|weight loss)/, 'Nutrition & dietitian'],
  [/\b(x-?ray|mri|ct scan|imaging|blood test|lab work)/, 'Imaging & lab'],
  [/\b(check ?up|physical|primary care|family doctor|general doctor|flu|cold|fever|annual)/, 'Primary care / family doctor']
];

function specialtyByLabel(label) {
  for (var i = 0; i < SPECIALTIES.length; i++) if (SPECIALTIES[i][0] === label) return SPECIALTIES[i];
  return null;
}

// Free text -> {label, terms}. Specialty names first, then condition words.
// null means "we could not tell", which hands the text to the AI helper.
function resolveQuery(text) {
  var t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  var i, s;
  for (i = 0; i < SPECIALTIES.length; i++) {
    s = SPECIALTIES[i];
    if (s[0].toLowerCase() === t || s[2].toLowerCase() === t) return { label: s[0], terms: s[1].split(',') };
  }
  for (i = 0; i < SPECIALTIES.length; i++) {
    s = SPECIALTIES[i];
    var names = s[0].toLowerCase().split(/[\/&,()]+/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 2; });
    if (names.some(function (n) { return t.indexOf(n) !== -1 || n.indexOf(t) === 0; }) ||
        s[2].toLowerCase().indexOf(t) === 0) return { label: s[0], terms: s[1].split(',') };
  }
  for (i = 0; i < CONDITION_HINTS.length; i++) {
    if (CONDITION_HINTS[i][0].test(t)) {
      s = specialtyByLabel(CONDITION_HINTS[i][1]);
      if (s) return { label: s[0], terms: s[1].split(',') };
    }
  }
  return null;
}

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
    .replace(/\b(Md|Do|Np|Pa|Dds|Dmd|Od|Pc|Pllc|Llc|Inc|Fnp|Aprn|Lcsw|Lpc)\b/g, function (m) { return m.toUpperCase(); });
}

function newSearch() {
  var p = state.profile || {};
  return {
    text: '', label: '', terms: [],
    zip: /^\d{5}$/.test(String(p.zip || '')) ? p.zip : '',
    miles: DEFAULT_RADIUS,
    payer: p.insurance_payer || '',
    center: null, all: [], shown: RESULTS_PAGE,
    filters: { accepting: false, insurance: false, telehealth: false, verified: false },
    sort: 'near', loading: false, error: '', truncated: false, ran: false,
    suggested: {}, active: null, seq: 0
  };
}

function runProviderSearch() {
  var s = state.search;
  if (!s.terms.length) { s.error = 'Choose a specialty, or describe what you need.'; paintFind(); return; }
  if (!/^\d{5}$/.test(s.zip)) { s.error = 'Enter a 5-digit ZIP code.'; paintFind(); return; }
  var seq = ++s.seq;
  s.loading = true; s.error = ''; s.ran = true; s.shown = RESULTS_PAGE; s.active = null;
  paintFind();

  Promise.all([locateZip(s.zip), loadRegistered()]).then(function (res) {
    if (seq !== s.seq) return;
    var c = res[0];
    if (!c) { s.loading = false; s.all = []; s.center = null; s.error = 'We couldn\'t find ZIP ' + s.zip + '. Check it and try again.'; paintFind(); return; }
    s.center = c;
    var dLat = s.miles / 69, dLng = s.miles / (69 * Math.max(0.2, Math.cos(c.lat * Math.PI / 180)));
    var box = 'latitude=gte.' + (c.lat - dLat).toFixed(5) + '&latitude=lte.' + (c.lat + dLat).toFixed(5) +
              '&longitude=gte.' + (c.lng - dLng).toFixed(5) + '&longitude=lte.' + (c.lng + dLng).toFixed(5);
    return providerRowsQuery(box + taxonomyPrefilter(s.terms)).then(function (rows) {
      if (seq !== s.seq) return;
      s.truncated = !!rows.truncated;
      s.all = buildResults(rows, s);
      s.loading = false;
      paintFind(true);
      logSearch(s);
    });
  }).catch(function () {
    if (seq !== s.seq) return;
    s.loading = false; s.error = 'Search is unavailable right now. Please try again.'; paintFind();
  });
}

// Rows -> one result per NPI (its nearest site), with claimed-listing detail.
function buildResults(rows, s) {
  var c = s.center, byNpi = {};
  function consider(r) {
    if (!r.lat || !r.lng) return;
    r.miles = milesBetween(c.lat, c.lng, r.lat, r.lng);
    if (r.miles > s.miles) return;
    var cur = byNpi[r.npi];
    if (!cur) { r.sites = 1; byNpi[r.npi] = r; return; }
    cur.sites++;
    if (r.miles < cur.miles) { r.sites = cur.sites; byNpi[r.npi] = r; }
  }
  (rows || []).forEach(function (row) {
    if (!row.npi || !taxMatches(row.primary_taxonomy, s.terms)) return;
    consider({
      npi: String(row.npi), name: titleCase(row.name), specialty: row.primary_taxonomy || '',
      address: titleCase(row.address), city: titleCase(row.city), state: row.state, zip: row.zip,
      lat: +row.latitude, lng: +row.longitude, src: row._src
    });
  });
  // Claimed listings publish sites the bulk tables never saw.
  Object.keys(registeredNpis).forEach(function (npi) {
    var r = registeredNpis[npi] || {};
    if (!taxMatches(r.specialty, s.terms)) return;
    (r.locations || []).forEach(function (loc) {
      if (!loc.latitude || !loc.longitude) return;
      consider({ npi: String(npi), name: r.name, specialty: r.specialty || '', address: loc.address_line,
        city: loc.city, state: loc.state, zip: loc.zip, lat: +loc.latitude, lng: +loc.longitude,
        phone: loc.phone, src: loc.verified ? 'claimed' : 'self' });
    });
  });

  var want = String(s.payer || '').trim().toLowerCase();
  return Object.keys(byNpi).map(function (npi) {
    var p = byNpi[npi], reg = registeredNpis[npi];
    // A bulk secondary-location row is aliased to its parent's NPI (migration
    // 014): it must not wear the parent's verified badge.
    if (reg && p.src !== 'secondary') {
      p.registered = true;
      p.name = reg.name || p.name;
      p.phone = p.phone || reg.phone;
      p.accepting_new_patients = reg.accepting_new_patients;
      p.telehealth = reg.telehealth;
      p.payers = reg.payers || [];
      p.office_hours = reg.office_hours;
      p.bio = reg.bio;
      if (want && p.payers.length) p.takes_your_insurance = p.payers.some(function (x) { return String(x).trim().toLowerCase() === want; });
    }
    return p;
  });
}

function visibleResults() {
  var s = state.search, f = s.filters;
  var list = s.all.filter(function (p) {
    if (f.verified && !p.registered) return false;
    if (f.accepting && p.accepting_new_patients !== true) return false;
    if (f.insurance && p.takes_your_insurance !== true) return false;
    if (f.telehealth && p.telehealth !== true) return false;
    return true;
  });
  list.sort(function (a, b) {
    if (s.sort === 'verified' && !!a.registered !== !!b.registered) return a.registered ? -1 : 1;
    if (!!s.suggested[a.npi] !== !!s.suggested[b.npi]) return s.suggested[a.npi] ? -1 : 1;
    return a.miles - b.miles;
  });
  return list;
}

// Aggregate demand (migration 008) plus the ZIP backfill queue. Fire and forget:
// neither may slow or break a search.
function logSearch(s) {
  api('/patient-match', { method: 'POST', body: { mode: 'log', zip: s.zip, taxonomies: [s.label], matched: s.all.length } }).catch(function () {});
  fetch(FN + '/zip-enrich-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zip: s.zip }) }).catch(function () {});
}

/* ---------- find: view ---------------------------------------------------- */
var findEls = null;       // stable DOM for the mounted view
var findMap = { map: null, layer: null, ring: null, markers: {} };

function findView() {
  var s = state.search;
  var fWhat = h('input', { type: 'search', list: 'specList', value: s.text || s.label, autocomplete: 'off',
    placeholder: 'Specialty or condition, e.g. dermatology, back pain', 'aria-label': 'Specialty or condition' });
  var dl = h('datalist', { id: 'specList' }, SPECIALTIES.map(function (x) { return h('option', { value: x[0] }); }));
  var fZip = h('input', { value: s.zip, maxlength: '5', inputmode: 'numeric', placeholder: 'ZIP', 'aria-label': 'ZIP code' });
  var fMiles = h('select', { 'aria-label': 'Distance' }, RADIUS_CHOICES.map(function (m) {
    return h('option', { value: String(m), selected: m === s.miles }, 'Within ' + m + ' mi');
  }));
  var fPayer = h('select', { 'aria-label': 'Insurance' }, h('option', { value: '' }, 'Any insurance'));
  function paintPayers(list) {
    clear(fPayer);
    fPayer.appendChild(h('option', { value: '' }, 'Any insurance'));
    var names = list.map(function (x) { return x.name; });
    if (s.payer && names.indexOf(s.payer) === -1) names.unshift(s.payer);
    names.forEach(function (n) { fPayer.appendChild(h('option', { value: n, selected: n === s.payer }, n)); });
  }
  loadPayers(s.zip).then(paintPayers);
  fZip.addEventListener('change', function () {
    var z = fZip.value.trim();
    if (/^\d{5}$/.test(z)) loadPayers(z).then(paintPayers);
  });

  function submit(e) {
    if (e) e.preventDefault();
    s.zip = fZip.value.trim();
    s.miles = parseInt(fMiles.value, 10) || DEFAULT_RADIUS;
    s.payer = fPayer.value;
    var text = fWhat.value.trim();
    if (!text && s.terms.length) { runProviderSearch(); return; }
    var hit = resolveQuery(text);
    if (!hit) { state.askDraft = text; location.hash = '#/ask'; return; }
    s.text = hit.label; fWhat.value = hit.label;
    s.label = hit.label; s.terms = hit.terms; s.suggested = {};
    runProviderSearch();
  }
  // Changing distance or insurance re-runs a search that already has a subject.
  fMiles.addEventListener('change', function () { if (s.terms.length) submit(); });
  fPayer.addEventListener('change', function () {
    s.payer = fPayer.value;
    if (s.all.length) { rescorePayer(); paintFind(); }
  });

  var form = h('form', { class: 'sbar', onsubmit: submit },
    h('label', { class: 'sfield what' }, h('span', { class: 'slbl' }, 'Find'), fWhat, dl),
    h('label', { class: 'sfield zip' }, h('span', { class: 'slbl' }, 'Near'), fZip),
    h('label', { class: 'sfield miles' }, h('span', { class: 'slbl' }, 'Distance'), fMiles),
    h('label', { class: 'sfield payer' }, h('span', { class: 'slbl' }, 'Insurance'), fPayer),
    h('button', { class: 'sgo', type: 'submit' }, 'Search'));

  var helper = h('button', { class: 'ask-link', type: 'button', onclick: function () { state.askDraft = fWhat.value.trim(); location.hash = '#/ask'; } },
    '✦ Not sure who to see? Describe it and we\'ll pick the specialty');

  var filters = h('div', { class: 'fbar' });
  var results = h('div', { class: 'results', id: 'results' });
  var mapEl = h('div', { id: 'findMap' });
  var toggle = h('button', { class: 'map-toggle', type: 'button', onclick: function () {
    var on = body.classList.toggle('show-map');
    toggle.textContent = on ? '☰ List' : '🗺 Map';
    // The map was laid out while hidden (zero size), so re-measure it and
    // re-fit to the search radius, or it opens zoomed to nothing.
    if (on && findMap.map) setTimeout(function () {
      findMap.map.invalidateSize(); paintMarkers(visibleResults(), true);
      body.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 50);
  } }, '🗺 Map');
  var body = h('div', { class: 'find-body' }, results, h('div', { class: 'mapwrap' }, mapEl), toggle);

  findEls = { filters: filters, results: results, map: mapEl, what: fWhat };
  var view = h('section', { class: 'find' }, h('div', { class: 'find-top' }, form, helper, filters), body);
  setTimeout(function () { mountMap(); paintFind(true); }, 0);
  return view;
}

function rescorePayer() {
  var want = String(state.search.payer || '').trim().toLowerCase();
  state.search.all.forEach(function (p) {
    delete p.takes_your_insurance;
    if (want && p.registered && p.payers && p.payers.length) {
      p.takes_your_insurance = p.payers.some(function (x) { return String(x).trim().toLowerCase() === want; });
    }
  });
}

function chip(label, on, onclick) {
  return h('button', { class: 'fchip' + (on ? ' on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', onclick: onclick }, label);
}

function paintFind(refit) {
  if (!findEls) return;
  var s = state.search, f = s.filters;
  var list = visibleResults();

  // filters
  clear(findEls.filters);
  function toggle(k) { return function () { f[k] = !f[k]; s.shown = RESULTS_PAGE; paintFind(); }; }
  var sort = h('select', { class: 'fsort', 'aria-label': 'Sort results', onchange: function (e) { s.sort = e.target.value; paintFind(); } },
    h('option', { value: 'near', selected: s.sort === 'near' }, 'Nearest first'),
    h('option', { value: 'verified', selected: s.sort === 'verified' }, 'Verified first'));
  findEls.filters.appendChild(h('div', { class: 'fchips' },
    chip('Accepting new patients', f.accepting, toggle('accepting')),
    chip(s.payer ? 'Takes ' + s.payer : 'Takes my insurance', f.insurance, toggle('insurance')),
    chip('Telehealth', f.telehealth, toggle('telehealth')),
    chip('✓ Verified on ProviderPulse', f.verified, toggle('verified'))));
  findEls.filters.appendChild(sort);

  // results
  var r = findEls.results;
  clear(r);
  if (s.loading) {
    r.appendChild(h('div', { class: 'rhead' }, h('span', { class: 'spin' }), 'Searching ' + (s.label || 'providers') + ' within ' + s.miles + ' mi of ' + s.zip + '…'));
    for (var i = 0; i < 5; i++) r.appendChild(h('div', { class: 'res skel' }, h('div', { class: 'sk', style: 'width:52%' }), h('div', { class: 'sk', style: 'width:34%' }), h('div', { class: 'sk', style: 'width:70%' })));
  } else if (s.error) {
    r.appendChild(h('div', { class: 'empty' }, h('h3', {}, 'Let\'s fix the search'), h('p', {}, s.error)));
  } else if (!s.ran) {
    r.appendChild(startEl());
  } else {
    var filtered = list.length !== s.all.length;
    r.appendChild(h('div', { class: 'rhead' },
      h('b', {}, list.length.toLocaleString() + ' ' + (s.label || 'providers')),
      ' within ' + s.miles + ' mi of ' + s.zip,
      filtered ? h('span', { class: 'muted' }, ' · ' + (s.all.length - list.length) + ' hidden by filters') : null));
    if (s.truncated) r.appendChild(h('div', { class: 'note' }, 'This area has more listings than we can show at once, so these are a sample. Try a shorter distance.'));
    if (!list.length) {
      r.appendChild(h('div', { class: 'empty' },
        h('h3', {}, s.all.length ? 'No matches with these filters' : 'No ' + (s.label || 'providers') + ' within ' + s.miles + ' miles'),
        h('p', {}, s.all.length ? 'Filters like "Accepting new patients" only apply to practices verified on ProviderPulse. Try turning some off.'
          : 'Try a wider distance or a nearby ZIP.'),
        !s.all.length && s.miles < 50 ? h('button', { class: 'act primary', type: 'button', onclick: function () {
          s.miles = RADIUS_CHOICES.filter(function (m) { return m > s.miles; })[0] || 50; runProviderSearch();
        } }, 'Search within ' + (RADIUS_CHOICES.filter(function (m) { return m > s.miles; })[0] || 50) + ' miles') : null));
    }
    list.slice(0, s.shown).forEach(function (p) { r.appendChild(resultCard(p)); });
    if (list.length > s.shown) {
      r.appendChild(h('button', { class: 'more', type: 'button', onclick: function () { s.shown += RESULTS_PAGE; paintFind(); } },
        'Show ' + Math.min(RESULTS_PAGE, list.length - s.shown) + ' more of ' + (list.length - s.shown).toLocaleString()));
    }
  }
  paintMarkers(list, refit);
}

function startEl() {
  var p = state.profile || {};
  var name = p.first_name ? String(p.first_name).trim().split(' ')[0] : '';
  var picks = [0, 3, 4, 10, 5, 1, 9, 27, 8, 2];
  return h('div', { class: 'start' },
    h('h2', {}, name ? 'Hi ' + name + ', what kind of care do you need?' : 'What kind of care do you need?'),
    h('p', {}, 'Search by specialty or describe it in your own words. We show every match within your distance, with verified practices you can request an appointment from.'),
    h('div', { class: 'tiles' }, picks.map(function (i) {
      var sp = SPECIALTIES[i];
      if (!sp) return null;
      return h('button', { class: 'tile', type: 'button', onclick: function () { pickSpecialty(i); } }, sp[0]);
    })),
    h('button', { class: 'ask-link', type: 'button', onclick: function () { location.hash = '#/specialties'; } }, 'Browse all ' + SPECIALTIES.length + ' specialties →'));
}

function pickSpecialty(i) {
  var sp = SPECIALTIES[i];
  if (!sp) return;
  var s = state.search;
  s.text = sp[0]; s.label = sp[0]; s.terms = sp[1].split(','); s.suggested = {};
  if (findEls) findEls.what.value = sp[0];
  if (!/^\d{5}$/.test(s.zip)) { s.ran = true; s.error = 'Enter your ZIP code, then press Search.'; paintFind(); return; }
  runProviderSearch();
}

function fmtMiles(m) { return m < 0.1 ? '< 0.1 mi' : (m < 10 ? m.toFixed(1) : Math.round(m)) + ' mi'; }

function resultCard(p) {
  var s = state.search;
  var badges = [];
  if (s.suggested[p.npi]) badges.push(h('span', { class: 'badge sug' }, '✦ Suggested for you'));
  if (p.registered) badges.push(h('span', { class: 'badge verified' }, '✓ Verified'));
  if (p.accepting_new_patients === true) badges.push(h('span', { class: 'badge good' }, 'Accepting new patients'));
  if (p.takes_your_insurance === true) badges.push(h('span', { class: 'badge good' }, 'Takes ' + s.payer));
  else if (p.takes_your_insurance === false) badges.push(h('span', { class: 'badge caution' }, s.payer + ' not listed'));
  if (p.telehealth === true) badges.push(h('span', { class: 'badge tele' }, 'Telehealth'));
  if (p.src === 'self') badges.push(h('span', { class: 'badge unknown' }, 'Self-reported address'));

  var acts = [];
  if (p.registered) acts.push(h('button', { class: 'act primary', type: 'button', onclick: function (e) { e.stopPropagation(); location.hash = '#/book/' + p.npi; } }, 'Request appointment'));
  if (p.phone) acts.push(h('a', { class: 'act', href: 'tel:' + p.phone, onclick: function (e) { e.stopPropagation(); } }, 'Call ' + p.phone));
  acts.push(h('button', { class: 'act', type: 'button', onclick: function (e) { e.stopPropagation(); location.hash = '#/p/' + p.npi; } }, 'Details'));

  var card = h('article', { class: 'res' + (s.active === p.npi ? ' active' : ''), 'data-npi': p.npi, tabindex: '0',
    onmouseenter: function () { highlight(p.npi, false); },
    onmouseleave: function () { highlight(null, false); },
    onclick: function () { focusResult(p.npi, true); } },
    h('div', { class: 'res-av', style: '--h:' + hueFor(p.npi) }, initials(p.name)),
    h('div', { class: 'res-main' },
      h('div', { class: 'res-top' },
        h('h3', {}, p.name || 'Provider'),
        h('span', { class: 'dist' }, fmtMiles(p.miles))),
      h('div', { class: 'res-spec' }, p.specialty),
      h('div', { class: 'res-addr' }, [p.address, p.city].filter(Boolean).join(', '),
        p.sites > 1 ? h('span', { class: 'muted' }, ' · ' + (p.sites - 1) + ' more location' + (p.sites > 2 ? 's' : '')) : null),
      badges.length ? h('div', { class: 'badges' }, badges) : null,
      p.office_hours ? h('div', { class: 'res-hours' }, 'Hours: ', summariseHours(p.office_hours)) : null,
      h('div', { class: 'actions' }, acts)));
  return card;
}

/* ---------- find: map ----------------------------------------------------- */
function mountMap() {
  if (!findEls || findMap.map) return;
  loadLeaflet().then(function (ok) {
    if (!ok || !findEls || findMap.map) return;
    var c = state.search.center;
    var map = L.map(findEls.map, { zoomControl: false, preferCanvas: true })
      .setView(c ? [c.lat, c.lng] : [39.5, -98.35], c ? 11 : 4);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // Light, high-contrast streets at retina resolution. The previous dark
    // "dataviz" style made roads and labels nearly invisible.
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=' + MAPTILER_KEY, {
      tileSize: 512, zoomOffset: -1, maxZoom: 19,
      attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
    }).addTo(map);
    findMap.map = map;
    findMap.layer = L.layerGroup().addTo(map);
    paintFind(true);
    // The profile ZIP is known before any search: show that area straight away.
    var s = state.search;
    if (!s.center && /^\d{5}$/.test(s.zip)) locateZip(s.zip).then(function (cc) {
      if (cc && !s.center) { s.center = cc; paintMarkers(visibleResults(), true); }
    });
  });
}

function markerStyle(p, hot) {
  var ver = p.registered;
  return {
    radius: hot ? 11 : (ver ? 8 : 6),
    color: '#ffffff', weight: hot ? 3 : 2,
    fillColor: hot ? '#4f46e5' : (ver ? '#0d9488' : '#2563eb'),
    fillOpacity: hot ? 1 : 0.9
  };
}

function paintMarkers(list, refit) {
  var m = findMap.map;
  if (!m) return;
  var s = state.search;
  findMap.layer.clearLayers();
  findMap.markers = {};
  if (s.center) {
    L.circle([s.center.lat, s.center.lng], {
      radius: s.miles * 1609.34, color: '#4f46e5', weight: 1.5, dashArray: '6 6',
      fillColor: '#4f46e5', fillOpacity: 0.04, interactive: false
    }).addTo(findMap.layer);
    L.circleMarker([s.center.lat, s.center.lng], { radius: 5, color: '#fff', weight: 2, fillColor: '#111827', fillOpacity: 1, interactive: false })
      .addTo(findMap.layer);
  }
  // Draw nearest last so they sit on top of the pile.
  list.slice().reverse().forEach(function (p) {
    var mk = L.circleMarker([p.lat, p.lng], markerStyle(p, s.active === p.npi));
    mk.bindTooltip(p.name || 'Provider', { direction: 'top', offset: [0, -6] });
    mk.on('click', function () { focusResult(p.npi, false); });
    mk.addTo(findMap.layer);
    findMap.markers[p.npi] = { mk: mk, p: p };
  });
  if (refit && s.center) {
    var dLat = s.miles / 69, dLng = s.miles / (69 * Math.cos(s.center.lat * Math.PI / 180));
    m.fitBounds([[s.center.lat - dLat, s.center.lng - dLng], [s.center.lat + dLat, s.center.lng + dLng]], { padding: [20, 20] });
  }
}

function highlight(npi, pan) {
  Object.keys(findMap.markers).forEach(function (k) {
    var o = findMap.markers[k];
    var hot = k === npi || k === state.search.active;
    o.mk.setStyle(markerStyle(o.p, hot));
    if (hot) o.mk.bringToFront();
  });
  if (pan && npi && findMap.markers[npi] && findMap.map) {
    var ll = findMap.markers[npi].mk.getLatLng();
    if (!findMap.map.getBounds().pad(-0.15).contains(ll)) findMap.map.panTo(ll);
  }
}

// Select one result: ring it on the map and bring its card into view.
function focusResult(npi, fromList) {
  var s = state.search;
  s.active = npi;
  document.querySelectorAll('.res.active').forEach(function (n) { n.classList.remove('active'); });
  var list = visibleResults();
  var idx = -1;
  for (var i = 0; i < list.length; i++) if (list[i].npi === npi) { idx = i; break; }
  if (idx >= s.shown) { s.shown = idx + 1; paintFind(); }
  var card = document.querySelector('.res[data-npi="' + npi + '"]');
  if (card) {
    card.classList.add('active');
    if (!fromList) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  highlight(npi, true);
  if (!fromList) {
    var body = document.querySelector('.find-body');
    if (body && body.classList.contains('show-map') && findMap.markers[npi]) findMap.markers[npi].mk.openTooltip();
  }
}

/* ---------- ask: the optional AI helper ----------------------------------- */
function stripMarkdown(t) {
  return String(t || '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\s*[-*]\s+/gm, '• ').replace(/[*_`#]/g, '');
}

function askSheet() {
  var s = state.search;
  var ta = h('textarea', { maxlength: '600', placeholder: 'e.g. I keep getting headaches and my vision is blurry', 'aria-label': 'Describe what you need' });
  ta.value = state.askDraft || '';
  var out = h('div', { class: 'ask-out' });
  var btn = h('button', { class: 'btn-full', type: 'button', onclick: go }, 'Find the right kind of doctor');

  function go() {
    var text = ta.value.trim();
    if (!text) { ta.focus(); return; }
    btn.disabled = true;
    clear(out);
    out.appendChild(h('p', { class: 'muted' }, h('span', { class: 'spin' }), ' Thinking about the right specialty…'));
    api('/patient-match', { method: 'POST', timeout: 26000,
      body: { messages: [{ role: 'user', content: text }], zip: /^\d{5}$/.test(s.zip) ? s.zip : '' } })
      .then(function (d) {
        btn.disabled = false;
        clear(out);
        var terms = (d.map_taxonomies && d.map_taxonomies.length) ? d.map_taxonomies : (d.taxonomies || []);
        var label = (d.taxonomies || [])[0] || 'Providers';
        out.appendChild(h('div', { class: 'ask-reply' }, stripMarkdown(d.reply)));
        if (terms.length) {
          out.appendChild(h('button', { class: 'btn-full', type: 'button', onclick: function () {
            s.text = label; s.label = label; s.terms = terms; s.suggested = {};
            (d.providers || []).forEach(function (p) { if (p.npi) s.suggested[String(p.npi)] = true; });
            if (d.zip && /^\d{5}$/.test(d.zip)) s.zip = d.zip;
            state.askDraft = '';
            location.hash = '';
            if (findEls) findEls.what.value = label;
            runProviderSearch();
          } }, 'Show all ' + label + ' near ' + (d.zip || s.zip || 'me')));
        }
      })
      .catch(function (err) {
        btn.disabled = false;
        clear(out);
        out.appendChild(h('p', { class: 'msg err' }, err.status === 0 || err.status >= 500
          ? 'The assistant is unavailable right now. You can still search by specialty.' : err.message));
      });
  }
  if (ta.value) setTimeout(go, 0);
  return sheet('Not sure who to see?', [
    h('p', { class: 'muted', style: 'margin-bottom:12px' },
      'Describe what\'s going on in your own words. We\'ll suggest the right kind of provider and show every one near you. This is not medical advice; in an emergency call 911.'),
    h('div', { class: 'field' }, ta), btn, out
  ]);
}

/* ---------- document upload + review -------------------------------------- */
function reviewEl() {
  var r = state.reviewing;
  var boxes = {};
  var list = r.facts.map(function (f) {
    var cb = h('input', { type: 'checkbox', checked: true, 'aria-label': 'Add ' + f.value });
    boxes[f.id] = cb;
    return h('label', { class: 'fact' }, cb,
      h('div', { class: 'ft' },
        h('div', { class: 'kind' }, f.fact_type),
        h('div', { class: 'val' }, f.value),
        f.source_text ? h('div', { class: 'src' }, '“' + f.source_text + '”') : null));
  });

  function apply() {
    var accept = [], reject = [];
    r.facts.forEach(function (f) { (boxes[f.id] && boxes[f.id].checked ? accept : reject).push(f.id); });
    api('/doc-confirm', { method: 'POST', body: { accept: accept, reject: reject } })
      .then(function (data) {
        state.reviewing = null;
        return api('/profile').then(function (p) { state.profile = p.profile || state.profile; return data; });
      })
      .then(function (data) {
        toast(data.message || 'Added to your profile.');
        render();
        // A referral is a specialty the patient's own doctor already chose.
        // Offering to find it is carrying out that instruction, not advising.
        if (data.referrals && data.referrals.length) {
          var term = data.referrals[0];
          var match = null;
          for (var i = 0; i < SPECIALTIES.length; i++) {
            if (SPECIALTIES[i][0].toLowerCase().indexOf(term.toLowerCase()) !== -1 ||
                SPECIALTIES[i][2].toLowerCase().indexOf(term.toLowerCase()) !== -1) { match = i; break; }
          }
          // Straight into the search the referral names.
          if (match !== null) pickSpecialty(match);
          else { state.askDraft = 'My doctor referred me to ' + term + '.'; location.hash = '#/ask'; }
        }
      })
      .catch(function (err) { toast(err.message, true); });
  }

  return sheet('Review your document', [h('div', {},
      h('p', {}, r.facts.length
        ? 'Here\'s what I found in that ' + (r.document_kind || 'document') + '. Choose what to add to your profile — I only read what the document says, I don\'t interpret results.'
        : 'I couldn\'t find anything to add from that document.'),
      r.facts.length ? h('div', { class: 'facts' }, list) : null,
      h('div', { class: 'actions' },
        r.facts.length ? h('button', { class: 'act primary', type: 'button', onclick: apply }, 'Add selected to my profile') : null,
        h('button', { class: 'act', type: 'button', onclick: function () { state.reviewing = null; render(); } },
          r.facts.length ? 'Not now' : 'OK')))]);
}

function uploadDocument(file) {
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) { toast('Files must be under 15 MB.', true); return; }

  var docId = null;
  toast('Uploading…');
  api('/doc-upload-url', { method: 'POST', body: {
    filename: file.name, mime_type: file.type, size_bytes: file.size
  } }).then(function (d) {
    docId = d.document_id;
    // Straight to Storage: a Netlify function caps bodies near 6MB and would
    // die well before a phone photo finished uploading.
    return fetch(d.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type, Authorization: 'Bearer ' + (d.token || state.session.access_token) },
      body: file
    });
  }).then(function (res) {
    if (!res.ok) throw new ApiError('Upload failed. Please try again.', res.status, {});
    toast('Reading your document…');
    return api('/doc-extract', { method: 'POST', body: { document_id: docId } });
  }).then(function (data) {
    state.reviewing = { document_id: docId, document_kind: data.document_kind, facts: data.facts || [] };
    location.hash = '';
    render();
  }).catch(function (err) {
    toast(err.status === 503 ? 'Document upload isn\'t available yet.' : err.message, true);
  });
}

function documentsSheet() {
  var input = h('input', { type: 'file', accept: '.pdf,image/jpeg,image/png,image/webp,image/gif', hidden: true,
    onchange: function (e) { if (e.target.files[0]) { uploadDocument(e.target.files[0]); } } });

  var zone = h('div', { class: 'dropzone', role: 'button', tabindex: '0',
    onclick: function () { input.click(); },
    onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } },
    ondragover: function (e) { e.preventDefault(); zone.classList.add('over'); },
    ondragleave: function () { zone.classList.remove('over'); },
    ondrop: function (e) { e.preventDefault(); zone.classList.remove('over'); uploadDocument(e.dataTransfer.files[0]); } },
    h('div', { class: 'big' }, '📄'),
    h('div', { class: 't' }, 'Add a lab result, referral or visit summary'),
    h('div', { class: 's' }, 'PDF or photo, up to 15 MB'));

  return sheet('Your documents', [
    h('p', { style: 'color:var(--muted);font-size:14px;margin-bottom:14px' },
      'We read what the document says to help you find the right kind of doctor. We never interpret results — that\'s between you and your physician.'),
    zone, input,
    state.documents.length ? h('div', { class: 'sec-label' }, 'Uploaded') : null,
    state.documents.length ? h('div', { style: 'display:flex;flex-direction:column;gap:8px' },
      state.documents.map(function (d) {
        return h('div', { class: 'doc-row' },
          h('span', { class: 'nm' }, d.filename || 'Document'),
          h('span', { class: 'st' }, d.status),
          h('button', { class: 'act danger', type: 'button', onclick: function () { deleteDocument(d.id); } }, 'Delete'));
      })) : null,
    h('div', { class: 'phi' },
      'Your documents are encrypted, visible only to you, and never shared. Deleting one removes the file and everything read from it.')
  ]);
}

function deleteDocument(id) {
  if (!window.confirm('Delete this document and everything read from it? This cannot be undone.')) return;
  api('/doc-delete', { method: 'POST', body: { document_id: id } }).then(function (data) {
    state.documents = state.documents.filter(function (d) { return d.id !== id; });
    toast(data.message || 'Deleted.');
    render();
  }).catch(function (err) { toast(err.message, true); });
}

/* ---------- appointments -------------------------------------------------
   Request-to-book, not instant booking: the patient proposes a time, the
   practice confirms or declines from its inbox (register-provider.html). The
   server resolves the NPI to the practice's account, so the patient app never
   needs, or sees, a provider's account id.
   -------------------------------------------------------------------------- */
var APPT_STATUS = {
  requested: 'Waiting for the practice', confirmed: 'Confirmed',
  declined: 'Declined by the practice', cancelled: 'Cancelled', completed: 'Completed'
};

function fmtWhen(iso) {
  if (!iso) return 'Any time that suits the practice';
  var d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function bookSheet(npi) {
  var p = findResult(npi);
  if (!p || !p.registered) {
    return sheet('Request an appointment', [h('p', { style: 'color:var(--muted)' },
      'That provider is no longer in your results, or does not take requests here yet. Search again, or call them.')]);
  }

  // datetime-local wants local "YYYY-MM-DDTHH:MM"; default to tomorrow 9:00.
  var t = new Date(); t.setDate(t.getDate() + 1); t.setHours(9, 0, 0, 0);
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var local = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  var fWhen = h('input', { type: 'datetime-local', value: local(t), min: local(new Date()), 'aria-label': 'Preferred date and time' });
  var fWhy = h('textarea', { maxlength: '300', placeholder: 'e.g. New patient, follow-up on blood pressure', 'aria-label': 'Reason for visit' });
  var msg = h('div', { class: 'msg' });

  function submit(btn) {
    btn.disabled = true;
    var when = fWhen.value ? new Date(fWhen.value) : null;
    api('/appointment-request', { method: 'POST', body: {
      npi: p.npi,
      requested_time: when && !isNaN(when.getTime()) ? when.toISOString() : null,
      reason: fWhy.value.trim()
    } }).then(function () {
      toast('Request sent. ' + (p.name || 'The practice') + ' will confirm or suggest another time.');
      location.hash = '#/appointments';
    }).catch(function (err) {
      msg.className = 'msg err'; msg.textContent = err.message; btn.disabled = false;
    });
  }
  var go = h('button', { class: 'btn-full', type: 'button', onclick: function () { submit(go); } }, 'Send request');

  return sheet('Request an appointment', [
    h('p', { style: 'margin-bottom:14px' }, h('b', {}, p.name || 'Provider'),
      p.specialty ? h('span', { style: 'color:var(--muted)' }, ' · ' + p.specialty) : null),
    h('div', { class: 'field' }, h('label', {}, 'Preferred date and time'), fWhen),
    h('div', { class: 'field' }, h('label', {}, 'Reason for visit (optional)'), fWhy),
    go, msg,
    h('div', { class: 'phi' },
      'The practice sees your name, this time and your reason. Once they confirm, they can also see the health details on your profile to prepare for the visit.')
  ]);
}

function appointmentsSheet() {
  var list = h('div', { style: 'display:flex;flex-direction:column;gap:10px' },
    h('p', { style: 'color:var(--muted)' }, 'Loading…'));

  function paint(items) {
    clear(list);
    if (!items.length) {
      list.appendChild(h('p', { style: 'color:var(--muted)' },
        'No requests yet. Look for "Request appointment" on a verified listing.'));
      return;
    }
    items.forEach(function (a) {
      var canCancel = a.status === 'requested' || a.status === 'confirmed';
      list.appendChild(h('div', { class: 'card' },
        h('div', { class: 'card-top' }, h('div', {},
          h('h3', {}, a.provider_name || 'Provider'),
          h('div', { class: 'spec' }, APPT_STATUS[a.status] || a.status))),
        h('div', { class: 'addr' }, fmtWhen(a.requested_time),
          a.provider_city ? ' · ' + a.provider_city : ''),
        a.reason ? h('div', { class: 'payers' }, 'Reason: ', h('b', {}, a.reason)) : null,
        h('div', { class: 'actions' },
          a.provider_phone ? h('a', { class: 'act', href: 'tel:' + a.provider_phone }, '📞 Call') : null,
          canCancel ? h('button', { class: 'act danger', type: 'button', onclick: function () { cancel(a.id); } }, 'Cancel request') : null)));
    });
  }

  function load() {
    api('/appointment-request').then(function (d) { paint(d.appointments || []); })
      .catch(function (err) { clear(list); list.appendChild(h('p', { class: 'msg err' }, err.message)); });
  }
  function cancel(id) {
    if (!window.confirm('Cancel this appointment request?')) return;
    api('/appointment-request', { method: 'PATCH', body: { id: id, status: 'cancelled' } })
      .then(function () { toast('Cancelled.'); load(); })
      .catch(function (err) { toast(err.message, true); });
  }
  load();
  return sheet('Your appointment requests', [list]);
}

/* ---------- sheets -------------------------------------------------------- */
function sheet(title, body) {
  var frag = document.createDocumentFragment();
  frag.appendChild(h('div', { class: 'scrim', onclick: closeSheet }));
  frag.appendChild(h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('h2', {}, title),
      h('button', { class: 'x', type: 'button', 'aria-label': 'Close', onclick: closeSheet }, '✕')),
    body));
  return frag;
}
function closeSheet() { location.hash = ''; }

function specialtiesSheet() {
  var listEl = h('div', { class: 'chips', style: 'display:flex;flex-direction:column;gap:6px' });
  function paint(filter) {
    clear(listEl);
    SPECIALTIES.forEach(function (s, i) {
      if (filter && s[0].toLowerCase().indexOf(filter) === -1) return;
      listEl.appendChild(h('button', { class: 'chip', type: 'button', style: 'width:100%',
        onclick: function () { location.hash = ''; pickSpecialty(i); } }, s[0]));
    });
  }
  paint('');
  return sheet('All specialties', [
    h('div', { class: 'field' },
      h('input', { type: 'search', placeholder: 'Search specialties…', 'aria-label': 'Search specialties',
        oninput: function (e) { paint(e.target.value.trim().toLowerCase()); } })),
    listEl
  ]);
}

function detailSheet(npi) {
  var p = findResult(npi);
  if (!p) return sheet('Provider', [h('p', { style: 'color:var(--muted)' }, 'That provider is no longer in your results.')]);

  var cms = h('div', { style: 'color:var(--muted);font-size:13.5px' }, 'Loading credentials…');
  // Lazy, detail-only: cms-provider hits data.cms.gov and would add seconds to
  // the results render. Both "not found" outcomes arrive as HTTP 200.
  api('/cms-provider?npi=' + encodeURIComponent(p.npi), { auth: false, timeout: 10000 })
    .then(function (d) {
      clear(cms);
      if (d.unavailable) { cms.appendChild(document.createTextNode('Credential lookup is unavailable right now.')); return; }
      if (!d.found) { cms.appendChild(document.createTextNode('No Medicare record found — common for clinics and newer practices.')); return; }
      cms.appendChild(h('dl', { class: 'f' },
        d.credential ? h('dt', {}, 'Credential') : null, d.credential ? h('dd', {}, d.credential) : null,
        d.medical_school ? h('dt', {}, 'Medical school') : null, d.medical_school ? h('dd', {}, d.medical_school) : null,
        d.graduation_year ? h('dt', {}, 'Graduated') : null, d.graduation_year ? h('dd', { class: 'm' }, d.graduation_year) : null,
        h('dt', {}, 'Medicare'), h('dd', {}, d.medicare_participant ? 'Participating' : 'Not participating')));
    })
    .catch(function () { clear(cms); cms.appendChild(document.createTextNode('Credential lookup is unavailable right now.')); });

  // Unclaimed rows carry no phone. NPPES has the practice line, so fetch it
  // when someone actually opens the listing rather than for every result.
  var phoneDd = h('dd', { class: 'm' }, p.phone || 'Looking up…');
  var callSlot = h('span', {}, p.phone ? h('a', { class: 'act primary', href: 'tel:' + p.phone }, '📞 Call') : null);
  if (!p.phone) {
    api('/nppes-lookup?npi=' + encodeURIComponent(p.npi), { auth: false, timeout: 10000 }).then(function (d) {
      var rec = d && d.results && d.results[0];
      var addrs = (rec && rec.addresses) || [];
      var loc = addrs.filter(function (a) { return a.address_purpose === 'LOCATION'; })[0] || addrs[0] || {};
      if (loc.telephone_number) {
        p.phone = loc.telephone_number;
        phoneDd.textContent = p.phone;
        callSlot.appendChild(h('a', { class: 'act primary', href: 'tel:' + p.phone }, '📞 Call'));
      } else phoneDd.textContent = 'Not listed';
    }).catch(function () { phoneDd.textContent = 'Not listed'; });
  }

  return sheet(p.name || 'Provider', [
    h('div', { class: 'badges', style: 'margin-top:0' }, badgesFor(p)),
    p.bio ? h('p', { style: 'margin-top:14px;color:var(--muted);font-size:14px' }, p.bio) : null,
    h('dl', { class: 'f', style: 'margin-top:18px' },
      h('dt', {}, 'Specialty'), h('dd', {}, p.specialty || '—'),
      h('dt', {}, 'NPI'), h('dd', { class: 'm' }, p.npi),
      h('dt', {}, 'Address'), h('dd', {}, [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || '—'),
      p.miles != null ? h('dt', {}, 'Distance') : null, p.miles != null ? h('dd', {}, fmtMiles(p.miles) + ' from ' + state.search.zip) : null,
      h('dt', {}, 'Phone'), phoneDd,
      (p.registered && p.payers && p.payers.length) ? h('dt', {}, 'Accepts') : null,
      (p.registered && p.payers && p.payers.length) ? h('dd', {}, p.payers.join(', ')) : null),
    h('div', { class: 'sec-label' }, 'From Medicare records'), cms,
    h('div', { class: 'actions' },
      p.registered ? h('button', { class: 'act primary', type: 'button',
        onclick: function () { location.hash = '#/book/' + p.npi; } }, '📅 Request appointment') : null,
      callSlot,
      (p.lat && p.lng) ? h('button', { class: 'act', type: 'button', onclick: function () {
        location.hash = ''; setTimeout(function () { focusResult(p.npi, false); }, 0);
      } }, 'Show on map') : null)
  ]);
}

var CONDITIONS = [
  'Diabetes', 'High blood pressure', 'Heart disease', 'Asthma / COPD',
  'Mental health', 'Arthritis', 'Back or joint pain', 'Cancer care',
  'Kidney disease', 'Pregnancy / prenatal', 'Pediatric care', 'Weight management',
  'Sleep disorders', 'Preventive care / checkup'
];
// Insurance plans are loaded from /payers for the patient's own state, because
// Medicaid is rebranded per state and Blue Cross is a federation of state
// licensees. Providers pick from the same endpoint, which is what keeps
// takes_your_insurance an exact match instead of fuzzy string comparison.
var payerCache = {};          // state key -> [{name, local}]
function loadPayers(zip) {
  var key = zip || 'national';
  if (payerCache[key]) return Promise.resolve(payerCache[key]);
  var qs = /^\d{5}$/.test(String(zip || '')) ? '?zip=' + encodeURIComponent(zip) : '';
  return api('/payers' + qs, { auth: false, timeout: 8000 })
    .then(function (d) { payerCache[key] = d.payers || []; return payerCache[key]; })
    .catch(function () { return []; });
}

function accountSheet() {
  var p = state.profile || {};
  var mine = {};
  (p.conditions || []).forEach(function (c) { mine[c] = true; });

  var fFirst = h('input', { value: p.first_name || '', 'aria-label': 'First name' });
  var fLast  = h('input', { value: p.last_name || '', 'aria-label': 'Last name' });
  var fZip   = h('input', { value: p.zip || '', maxlength: '5', inputmode: 'numeric', 'aria-label': 'ZIP code' });
  var fDesc  = h('textarea', { maxlength: '1000', 'aria-label': 'Describe your health concern' });
  fDesc.value = p.concern_description || '';

  var fPayer = h('select', { 'aria-label': 'Insurance plan' },
    h('option', { value: '' }, 'Loading plans…'));
  var fOther = h('input', { value: '', placeholder: 'Name of your plan',
    hidden: true, 'aria-label': 'Name of your plan', style: 'margin-top:8px' });
  fPayer.addEventListener('change', function () { fOther.hidden = fPayer.value !== 'Other'; });

  // Options depend on the patient's ZIP, so they arrive asynchronously. Any
  // stored value the list doesn't contain (a plan since renamed, or free text
  // from before this existed) is preserved via "Other" rather than dropped.
  function paintPayers(list, zipUsed) {
    clear(fPayer);
    fPayer.appendChild(h('option', { value: '' }, 'Select your insurance'));
    var local = list.filter(function (x) { return x.local; });
    var national = list.filter(function (x) { return !x.local; });
    var known = list.some(function (x) { return x.name === p.insurance_payer; });

    function group(label, items) {
      if (!items.length) return;
      var g = h('optgroup', { label: label });
      items.forEach(function (x) {
        g.appendChild(h('option', { value: x.name, selected: x.name === p.insurance_payer }, x.name));
      });
      fPayer.appendChild(g);
    }
    group(zipUsed ? 'Plans in your area' : 'Plans', local);
    group(local.length ? 'National carriers' : 'Plans', national);

    if (!known && p.insurance_payer) {
      fPayer.appendChild(h('option', { value: 'Other', selected: true }, 'Other'));
      fOther.value = p.insurance_payer;
      fOther.hidden = false;
    }
  }
  loadPayers(p.zip).then(function (list) { paintPayers(list, !!p.zip); });
  // Changing ZIP changes which plans are on offer
  fZip.addEventListener('change', function () {
    if (/^\d{5}$/.test(fZip.value.trim())) {
      loadPayers(fZip.value.trim()).then(function (list) { paintPayers(list, true); });
    }
  });

  var boxes = CONDITIONS.map(function (c) {
    var cb = h('input', { type: 'checkbox', value: c, checked: !!mine[c] });
    return h('label', {}, cb, c);
  });
  var msg = h('div', { class: 'msg' });

  function save(btn) {
    btn.disabled = true;
    var payer = fPayer.value === 'Other' ? fOther.value.trim() : fPayer.value;
    var conds = boxes.map(function (l) { return l.firstChild; })
      .filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.value; });
    api('/profile', { method: 'PUT', body: {
      first_name: fFirst.value, last_name: fLast.value, zip: fZip.value,
      insurance_payer: payer, conditions: conds, concern_description: fDesc.value.trim()
    } }).then(function () {
      return api('/profile');           // PUT does not echo the row back
    }).then(function (d) {
      state.profile = d.profile || state.profile;
      msg.className = 'msg ok'; msg.textContent = 'Saved.';
      btn.disabled = false; paintHeader();
    }).catch(function (err) {
      msg.className = 'msg err'; msg.textContent = err.message; btn.disabled = false;
    });
  }
  var saveBtn = h('button', { class: 'btn-full', type: 'button', onclick: function () { save(saveBtn); } }, 'Save changes');

  return sheet('Your account', [
    h('div', { class: 'two' },
      h('div', { class: 'field' }, h('label', {}, 'First name'), fFirst),
      h('div', { class: 'field' }, h('label', {}, 'Last name'), fLast)),
    h('div', { class: 'field' }, h('label', {}, 'ZIP code'), fZip),
    h('div', { class: 'field' }, h('label', {}, 'Insurance plan'), fPayer, fOther),
    h('div', { class: 'sec-label' }, 'Health concerns (optional)'),
    h('div', { class: 'checks' }, boxes),
    h('div', { class: 'field', style: 'margin-top:14px' }, h('label', {}, 'Anything else to note'), fDesc),
    saveBtn, msg,
    h('div', { class: 'sec-label' }, 'Appointments'),
    h('button', { class: 'act', type: 'button', onclick: function () { location.hash = '#/appointments'; } }, '📅 Your appointment requests'),
    h('div', { class: 'sec-label' }, 'Documents'),
    h('button', { class: 'act', type: 'button', onclick: function () { location.hash = '#/documents'; } }, '📄 Manage your documents'),
    h('div', { class: 'sec-label' }, 'Session'),
    h('button', { class: 'act danger', type: 'button', onclick: signOut }, 'Sign out'),
    h('div', { class: 'phi' }, 'Your health information is encrypted, visible only to you, and never sold or shared without your consent.')
  ]);
}

/* ---------- auth gate ----------------------------------------------------- */
// Sign-in and sign-up live on ONE page for both roles (auth.html, served at
// /signin and /join). A second patient-only copy here is what made a provider
// signing in on the patient page a dead end: it could only tell them they were
// on the wrong page. auth.html writes the same session key this app reads, so
// returning from it lands straight in the app.
function gateEl(mode) {
  var joining = mode === 'register';
  var go = joining ? '/join' : '/signin';
  var alt = joining ? '/signin' : '/join';
  return h('div', { class: 'gate' },
    h('div', { class: 'gate-card' },
      h('h2', {}, joining ? 'Create your account' : 'Find care that takes your insurance'),
      h('p', { class: 'sub' }, joining
        ? 'One account covers both sides — you choose patient or provider on the next screen.'
        : 'Sign in to search verified providers near you.'),
      h('a', {
        class: 'btn-full', href: go,
        style: 'display:block;text-align:center;text-decoration:none'
      }, joining ? 'Create account' : 'Sign in'),
      h('p', { class: 'alt' },
        joining ? 'Already registered? ' : 'New here? ',
        h('a', { href: alt }, joining ? 'Sign in' : 'Create an account'))));
}

/* ---------- misc ---------------------------------------------------------- */
function toast(text, isErr) {
  var t = document.getElementById('toast');
  if (!t) {
    t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite',
      style: 'position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:70;padding:10px 16px;' +
             'border-radius:999px;border:1px solid var(--hairline-2);background:var(--ground-2);font-size:13.5px' });
    document.body.appendChild(t);
  }
  t.style.color = isErr ? 'var(--danger)' : 'var(--text)';
  t.textContent = text;
  clearTimeout(t._h);
  t._h = setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 5000);
}

function paintHeader() {
  var p = state.profile || {};
  var initial = (p.first_name || '?').trim().charAt(0).toUpperCase() || '?';
  $('#acctBtn').textContent = initial;
}

function bootstrap() {
  // One call doubles as the session probe and the profile fetch
  return api('/profile').then(function (d) {
    state.profile = d.profile || {};
    return d;
  }).catch(function (err) {
    if (err.status === 401) { state.session = null; }
    return null;
  });
}

// Listed lazily when the documents sheet opens. Failure is silent on purpose:
// the feature may simply be switched off, or the migration not yet run.
function loadDocuments() {
  return api('/doc-list').then(function (d) {
    var next = (d && d.documents) || [];
    var changed = next.length !== state.documents.length;
    state.documents = next;
    if (changed && route().name === 'documents') render();
  }).catch(function () {});
}

/* ---------- router / render ----------------------------------------------- */
function route() {
  var hash = location.hash || '';
  var parts = hash.replace(/^#\/?/, '').split('/');
  return { name: parts[0] || '', arg: parts[1] || '' };
}

// The find view (search bar, results, map) is built once and kept: sheets open
// over it, so opening a listing or the account never rebuilds the map.
var findMounted = false;
function unmountFind() {
  findMounted = false; findEls = null;
  if (findMap.map) { try { findMap.map.remove(); } catch (e) {} }
  findMap = { map: null, layer: null, ring: null, markers: {} };
}

function render() {
  var main = $('#main');
  document.querySelectorAll('.scrim, .sheet').forEach(function (n) { n.remove(); });

  var r = route();
  var authed = !!state.session;
  $('#hdr').hidden = !authed;

  if (!authed) {
    unmountFind();
    clear(main);
    main.appendChild(gateEl(r.name === 'join' ? 'register' : 'login'));
    return;
  }

  paintHeader();
  if (!findMounted) {
    if (!state.search) state.search = newSearch();
    clear(main);
    main.appendChild(findView());
    findMounted = true;
  }

  if (r.name === 'p' && r.arg) document.body.appendChild(detailSheet(r.arg));
  else if (r.name === 'account') document.body.appendChild(accountSheet());
  else if (r.name === 'documents') { document.body.appendChild(documentsSheet()); loadDocuments(); }
  else if (r.name === 'specialties') document.body.appendChild(specialtiesSheet());
  else if (r.name === 'book' && r.arg) document.body.appendChild(bookSheet(r.arg));
  else if (r.name === 'appointments') document.body.appendChild(appointmentsSheet());
  else if (r.name === 'ask') document.body.appendChild(askSheet());
  else if (state.reviewing) document.body.appendChild(reviewEl());
}

/* ---------- wire up ------------------------------------------------------- */
window.addEventListener('hashchange', render);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && location.hash) closeSheet();
});
$('#acctBtn').addEventListener('click', function () { location.hash = '#/account'; });
$('#apptBtn').addEventListener('click', function () { location.hash = '#/appointments'; });

state.session = loadSession();
if (state.session) {
  // A restored session may already be past expiry; refresh first so the patient
  // is not bounced to the sign-in gate for a token we can silently renew.
  var boot = (state.session.expiresAt - 60000 < Date.now())
    ? doRefresh().then(function (ok) { if (!ok) { state.session = null; clearSession(); } })
    : Promise.resolve(scheduleRefresh());
  boot.then(function () { return state.session ? bootstrap() : null; }).then(render);
} else {
  render();
}

})();
