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
var SESSION_KEY = 'pp.patient.v1';   // namespaced: not the old pp_token, not map_session
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
  messages: [],       // exactly what we POST as `messages`
  results: [],
  lastSearch: null,   // {zip, mapTerms, specialty, label}
  pending: false,
  replay: null,       // action to re-run after a mid-session re-auth
  documents: [],
  reviewing: null,    // {document_id, document_kind, facts[]}
  persist: false,     // "stay signed in" -> localStorage instead of sessionStorage
  ctrl: null          // in-flight AbortController
};

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
  try { raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY); } catch (e) {}
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
  try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) {}
}
// Revoke server-side first, then clear locally. The local clear runs regardless
// of whether the revoke succeeded — a user must always be able to sign out.
function signOut() {
  var had = state.session;
  if (had) api('/auth-logout', { method: 'POST' }).catch(function () {});
  clearSession();
  state.session = null; state.profile = null; state.messages = [];
  state.results = []; state.documents = []; state.reviewing = null;
  payerCache = {};
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

/* ---------- map deep link -------------------------------------------------
   Frozen here on purpose. index.html's handler is strict:
   - `tax` MUST come from map_taxonomies (clinics.primary_taxonomy vocabulary).
     Using `taxonomies` matches nothing and the map falls back to every clinic.
   - `pins` entries are lat,lng,npi,name joined by "|", and the handler splits
     each on "," taking the rest as the name — so a "|" in a name breaks it.
   - a non-5-digit zip makes the handler bail silently.
   -------------------------------------------------------------------------- */
function mapDeepLink(zip, mapTerms, providers) {
  if (!/^\d{5}$/.test(String(zip || ''))) return null;
  var terms = (mapTerms || []).filter(Boolean).join(',');
  var url = 'index.html#zip=' + encodeURIComponent(zip) + '&tax=' + encodeURIComponent(terms);
  var list = providers || [];
  var rec = list.map(function (p) { return p.npi; }).filter(Boolean).join(',');
  if (rec) url += '&rec=' + encodeURIComponent(rec);
  var pins = list.filter(function (p) { return p.lat && p.lng; }).map(function (p) {
    return [p.lat, p.lng, p.npi || '', String(p.name || '').replace(/[|,]/g, ' ')].join(',');
  }).join('|');
  if (pins) url += '&pins=' + encodeURIComponent(pins);
  return url;
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

// Other clinics in the same ZIP matching the searched specialties. Queried
// straight from PostgREST — no function needed, so this still works when the
// navigator itself is down.
function nearbyClinics(zip, terms) {
  if (!/^\d{5}$/.test(String(zip || '')) || !terms.length) return Promise.resolve([]);
  var stripped = String(parseInt(zip, 10));
  var url = SB_URL + '/rest/v1/clinics?or=(zip.eq.' + zip + ',zip.eq.' + stripped + ')' +
    '&select=npi,name,address,city,state,zip,primary_taxonomy,latitude,longitude&limit=1000';
  return fetch(url, { headers: { apikey: SB_KEY, Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      return (rows || []).filter(function (c) {
        return c.latitude && c.longitude && taxMatches(c.primary_taxonomy, terms);
      });
    })
    .catch(function () { return []; });
}

var mapState = { map: null, focusNpi: null };

function showOnMap(npi) {
  mapState.focusNpi = npi || null;
  // If the persistent pane is already showing, just fly to the pin rather than
  // stacking a sheet on top of a map the patient can already see.
  if (mapState.map && document.querySelector('.split-map #mapCanvas')) {
    var p = state.results.filter(function (x) { return String(x.npi) === String(npi); })[0];
    if (p && p.lat && p.lng) { mapState.map.setView([p.lat, p.lng], 15); return; }
  }
  location.hash = '#/map';
}

function mapSheet() {
  var s = state.lastSearch || {};
  var canvas = h('div', { id: 'mapCanvas' });
  var note = h('div', { class: 'maphint' }, 'Loading map…');

  var body = [
    canvas,
    h('div', { class: 'legend-row' },
      h('span', {}, h('i', { class: 'pin rec' }), 'Recommended for you'),
      h('span', {}, h('i', { class: 'pin ver' }), 'Verified listing'),
      h('span', {}, h('i', { class: 'pin oth' }), 'Other clinics nearby')),
    note
  ];

  // Secondary escape hatch to the full analysis dashboard. Keeps the deep-link
  // contract exercised; everything a patient needs is in this sheet.
  var deep = mapDeepLink(s.zip, s.mapTerms || [], state.results);
  if (deep) body.push(h('div', { class: 'actions' },
    h('a', { class: 'act', href: deep, target: '_blank', rel: 'noopener' }, 'Open the full analysis map ↗')));

  // Render the sheet first so Leaflet has a sized container to attach to
  var frag = sheet(s.zip ? 'Providers near ' + s.zip : 'Providers near you', body);
  setTimeout(function () { initMap(canvas, note); }, 0);
  return frag;
}

function initMap(canvas, note) {
  loadLeaflet().then(function (ok) {
    if (!ok) {
      note.textContent = 'The map could not load. Your results are listed above.';
      return;
    }
    var s = state.lastSearch || {};
    var recs = state.results.filter(function (p) { return p.lat && p.lng; });
    var center = recs.length ? [recs[0].lat, recs[0].lng] : [39.5, -98.35];

    var map = L.map(canvas, { zoomControl: true, attributionControl: true }).setView(center, recs.length ? 12 : 4);
    mapState.map = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
    }).addTo(map);

    var bounds = [];
    function pin(lat, lng, kind, size) {
      return L.marker([lat, lng], {
        icon: L.divIcon({
          className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2],
          html: '<div class="mk ' + kind + '" style="width:' + size + 'px;height:' + size + 'px"></div>'
        })
      });
    }

    recs.forEach(function (p) {
      var m = pin(p.lat, p.lng, 'rec', 22).addTo(map);
      m.bindPopup(popupHtml(p, true));
      bounds.push([p.lat, p.lng]);
      if (mapState.focusNpi && String(p.npi) === String(mapState.focusNpi)) {
        setTimeout(function () { map.setView([p.lat, p.lng], 15); m.openPopup(); }, 250);
      }
    });

    if (bounds.length > 1 && !mapState.focusNpi) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });

    note.textContent = recs.length
      ? 'Showing your ' + recs.length + ' recommended provider' + (recs.length === 1 ? '' : 's') + '. Looking for more nearby…'
      : 'No mapped coordinates for these results.';

    // Layer in the rest of the area's matching clinics
    nearbyClinics(s.zip, s.mapTerms || []).then(function (list) {
      var recNpis = {};
      recs.forEach(function (p) { recNpis[String(p.npi)] = true; });
      var added = 0;
      list.forEach(function (c) {
        if (recNpis[String(c.npi)]) return;          // already pinned as a recommendation
        var reg = registeredNpis[String(c.npi)];
        pin(c.latitude, c.longitude, reg ? 'ver' : 'oth', reg ? 15 : 12)
          .addTo(map)
          .bindPopup(popupHtml({
            npi: c.npi, name: c.name, specialty: c.primary_taxonomy,
            address: c.address, city: c.city, state: c.state, zip: c.zip,
            registered: !!reg
          }, false));
        added++;
      });
      note.textContent = recs.length
        ? 'Showing your ' + recs.length + ' recommended provider' + (recs.length === 1 ? '' : 's') +
          (added ? ' and ' + added + ' other matching clinic' + (added === 1 ? '' : 's') + ' in this ZIP.' : '. No other matching clinics in this ZIP.')
        : (added ? 'Showing ' + added + ' matching clinics in this ZIP.' : 'No matching clinics found in this ZIP.');
    });
  });
}

// Popup markup is a string because Leaflet wants HTML; every interpolated value
// is escaped first, since these come from the API and the database.
function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function popupHtml(p, isRec) {
  var line = [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ');
  return '<div class="mpop">' +
    (isRec ? '<span class="tag rec">★ Recommended for you</span>' : '') +
    (p.registered && !isRec ? '<span class="tag ver">✓ Verified listing</span>' : '') +
    '<strong>' + esc(p.name || 'Provider') + '</strong>' +
    (p.specialty ? '<span class="sp">' + esc(p.specialty) + '</span>' : '') +
    (line ? '<span class="ad">' + esc(line) + '</span>' : '') +
    (p.phone ? '<a class="tel" href="tel:' + esc(p.phone) + '">📞 ' + esc(p.phone) + '</a>' : '') +
    '</div>';
}

// NPI -> registered listing, loaded once when the map first opens
var registeredNpis = {};
function loadRegistered() {
  return api('/providers-public?all=1', { auth: false })
    .then(function (d) { registeredNpis = (d && d.providers) || {}; })
    .catch(function () {});
}

/* ---------- provider card ------------------------------------------------- */
function badgesFor(p) {
  var out = [];
  var payer = (state.profile && state.profile.insurance_payer) || 'your insurance';
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

function providerCard(p, i) {
  var acts = [];
  // Actions are hidden when the data is missing rather than shown disabled:
  // phone is '' when NPPES had none, and both geocoders can fail.
  if (p.phone) acts.push(h('a', { class: 'act primary', href: 'tel:' + p.phone }, '📞 Call'));
  // No Directions button: it handed the patient off to Google Maps, which leaves
  // the app. Restore it once the Directions API is integrated in-app.
  if (p.lat && p.lng) acts.push(h('button', { class: 'act', type: 'button',
    onclick: function () { showOnMap(p.npi); } }, 'Show on map'));
  acts.push(h('button', { class: 'act', type: 'button', onclick: function () { location.hash = '#/p/' + p.npi; } }, 'Details'));

  return h('article', { class: 'card', style: '--i:' + i },
    h('div', { class: 'card-top' },
      h('span', { class: 'rank' }, String(i + 1)),
      h('div', {}, h('h3', {}, p.name || 'Provider'), h('div', { class: 'spec' }, p.specialty || ''))
    ),
    h('div', { class: 'badges' }, badgesFor(p)),
    (p.registered && p.payers && p.payers.length)
      ? h('div', { class: 'payers' }, 'Accepts: ', h('b', {}, p.payers.slice(0, 8).join(', ')),
          p.payers.length > 8 ? ' +' + (p.payers.length - 8) + ' more' : null)
      : null,
    h('div', { class: 'addr' },
      p.address ? p.address + ', ' : '',
      [p.city, p.state].filter(Boolean).join(', '), ' ',
      p.zip ? h('span', { class: 'z' }, p.zip) : null,
      p.phone ? null : ' · no phone on file'),
    h('div', { class: 'actions' }, acts)
  );
}

/* ---------- transcript ---------------------------------------------------- */
function transcriptEl() {
  var wrap = h('div', { class: 'col transcript', id: 'transcript' });
  state.messages.forEach(function (m) {
    if (m.role === 'user') wrap.appendChild(h('div', { class: 'turn-user' }, m.content));
    else wrap.appendChild(h('div', { class: 'turn-bot' },
      h('div', { class: 'bot-mark' }, '✚'),
      h('div', { class: 'bot-body' }, h('p', {}, m.content),
        m.providers ? h('div', { class: 'cards' }, m.providers.map(providerCard)) : null,
        m.providers && m.providers.length
          ? h('div', { class: 'actions' }, h('button', { class: 'act', type: 'button', onclick: function () { showOnMap(null); } }, '🗺 See these on the map'))
          : null)));
  });
  if (state.pending) wrap.appendChild(pendingEl());
  if (state.reviewing) wrap.appendChild(reviewEl());
  return wrap;
}

var STAGES = [
  [900,   'Searching the national registry'],
  [3500,  'Checking who takes your insurance'],
  [7000,  'Pinning locations'],
  [11000, 'Still working — this search is taking longer than usual'],
  [18000, 'Almost there']
];
var stageTimers = [];

function pendingEl() {
  var txt = h('span', { id: 'stageText' }, 'Reading your profile');
  var stopBtn = h('button', { class: 'stop', type: 'button', hidden: true, id: 'stopBtn',
    onclick: function () { if (state.ctrl) state.ctrl.abort(); } }, 'Stop');

  stageTimers.forEach(clearTimeout); stageTimers = [];
  STAGES.forEach(function (s) {
    stageTimers.push(setTimeout(function () {
      var el = document.getElementById('stageText');
      if (el) el.textContent = s[1];
    }, s[0]));
  });
  stageTimers.push(setTimeout(function () {
    var b = document.getElementById('stopBtn'); if (b) b.hidden = false;
  }, 4000));

  return h('div', { class: 'turn-bot' },
    h('div', { class: 'bot-mark' }, '✚'),
    h('div', { class: 'bot-body' },
      h('div', { class: 'status', role: 'status', 'aria-live': 'polite' }, h('span', { class: 'dot' }), txt, stopBtn),
      h('div', { class: 'cards' }, [0, 1, 2].map(function () {
        return h('div', { class: 'skel' },
          h('div', { class: 'sk', style: 'width:56%' }),
          h('div', { class: 'sk', style: 'width:34%' }),
          h('div', { class: 'sk', style: 'width:72%' }));
      })))
  );
}

/* ---------- search -------------------------------------------------------- */
function currentZip() {
  return (state.lastSearch && state.lastSearch.zip) || (state.profile && state.profile.zip) || '';
}

function runSearch(opts) {
  opts = opts || {};
  var zip = opts.zip || currentZip();
  state.lastSearch = {
    zip: zip,
    mapTerms: opts.mapTerms || (state.lastSearch && state.lastSearch.mapTerms) || [],
    specialty: opts.specialty || '',
    label: opts.label || ''
  };
  state.pending = true;
  render();

  api('/patient-match', {
    method: 'POST', track: true,
    body: { messages: state.messages, specialty: opts.specialty || '', zip: zip }
  }).then(function (data) {
    state.pending = false;
    state.results = data.providers || [];
    // Chip searches carry a hand-verified superset of map terms; union can only
    // widen the map filter, never mis-target it.
    var server = data.map_taxonomies || data.taxonomies || [];
    var merged = (state.lastSearch.mapTerms || []).concat(server).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    state.lastSearch.mapTerms = merged;
    if (data.zip) state.lastSearch.zip = data.zip;
    state.messages.push({ role: 'assistant', content: data.reply || '', providers: state.results });
    render();
  }).catch(function (err) {
    state.pending = false;
    if (err.status === 401) { state.replay = function () { runSearch(opts); }; render(); return; }
    state.messages.push({ role: 'assistant', content: '', error: err });
    render();
    showSearchError(err, opts);
  });
}

function showSearchError(err, opts) {
  state.messages.pop();  // drop the placeholder turn
  var msg, hint;
  if (err.status === 403) { msg = 'This is a provider account'; hint = 'Sign in with a patient account to search for care.'; }
  else if (err.status === 503) { msg = 'Search is temporarily unavailable'; hint = 'Please try again shortly.'; }
  else if (err.body && err.body.aborted) { msg = 'That search was stopped'; hint = 'You can run it again, or browse the map instead.'; }
  else if (err.status === 0) { msg = 'Couldn\'t reach the navigator'; hint = 'Check your connection and try again.'; }
  else { msg = 'The assistant didn\'t respond in time'; hint = 'Your search wasn\'t lost. Try again, or browse the map — that works even when the assistant is down.'; }

  var acts = [h('button', { class: 'act primary', type: 'button', onclick: function () { runSearch(opts); } }, 'Try again')];
  // The deterministic fallback: needs no AI and no backend at all.
  // The in-app map reads Supabase directly, so it still works when the navigator
  // is unavailable — which is precisely when this fallback is offered.
  if (/^\d{5}$/.test(currentZip()) && (state.lastSearch && (state.lastSearch.mapTerms || []).length)) {
    acts.push(h('button', { class: 'act', type: 'button', onclick: function () { showOnMap(null); } },
      'Browse ' + (state.lastSearch.label || 'providers') + ' on the map'));
  }

  var t = document.getElementById('transcript');
  if (!t) return;
  t.appendChild(h('div', { class: 'turn-bot' },
    h('div', { class: 'bot-mark' }, '✚'),
    h('div', { class: 'bot-body' },
      h('div', { class: 'notice' }, h('h4', {}, msg), h('p', {}, hint)),
      h('div', { class: 'actions' }, acts))));
  t.scrollIntoView({ block: 'end' });
}

function ask(text, opts) {
  if (!text) return;
  state.messages.push({ role: 'user', content: text });
  runSearch(opts || {});
}

/* ---------- home ---------------------------------------------------------- */
var TOP_CHIPS = [0, 4, 3, 1, 5, 27, 10, 7];   // indexes into SPECIALTIES

function homeEl() {
  var ta = h('textarea', { rows: '1', placeholder: 'e.g. a primary care doctor who takes my insurance…',
    'aria-label': 'Describe the care you need',
    onkeydown: function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    },
    oninput: function (e) { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; }
  });
  function submit() {
    var v = ta.value.trim();
    if (v) ask(v, {});
  }

  var chips = TOP_CHIPS.map(function (i) {
    var s = SPECIALTIES[i];
    if (!s) return null;
    return h('button', { class: 'chip', type: 'button', onclick: function () { pickSpecialty(i); } }, s[0]);
  });
  chips.push(h('button', { class: 'chip more', type: 'button', onclick: function () { location.hash = '#/specialties'; } },
    'All ' + SPECIALTIES.length + ' specialties →'));

  var name = (state.profile && state.profile.first_name) ? String(state.profile.first_name).trim().split(' ')[0] : '';

  return h('div', { class: 'home' }, h('div', { class: 'col' },
    h('h1', {}, name ? 'What kind of care ' : 'What kind of care ', h('em', {}, 'do you need?')),
    h('p', { class: 'sub' }, 'Describe it in your own words, or pick a specialty. You never have to share symptoms to search.'),
    h('div', { class: 'composer' }, ta,
      h('button', { class: 'icon-btn', type: 'button', title: 'Upload a medical document',
        'aria-label': 'Upload a medical document', onclick: function () { location.hash = '#/documents'; } }, '📎'),
      h('button', { class: 'send', type: 'button', 'aria-label': 'Search', onclick: submit }, '↑')),
    h('div', { class: 'chips-label' }, 'Common searches'),
    h('div', { class: 'chips' }, chips)
  ));
}

function pickSpecialty(i) {
  var s = SPECIALTIES[i];
  if (!s) return;
  var zip = currentZip();
  ask('I\'m looking for ' + s[0].toLowerCase() + (zip ? ' near ' + zip : '') + '.', {
    specialty: s[2],
    mapTerms: s[1].split(','),
    label: s[0],
    zip: zip
  });
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
        state.messages.push({ role: 'assistant', content: data.message || 'Added to your profile.' });
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
          var t = document.getElementById('transcript');
          if (t) t.appendChild(h('div', { class: 'col' }, h('div', { class: 'actions' },
            h('button', { class: 'act primary', type: 'button', onclick: function () {
              if (match !== null) pickSpecialty(match);
              else ask('I need to see ' + term + '.', { specialty: term, label: term });
            } }, 'Find ' + term + ' near me'))));
        }
      })
      .catch(function (err) { toast(err.message, true); });
  }

  return h('div', { class: 'turn-bot' },
    h('div', { class: 'bot-mark' }, '✚'),
    h('div', { class: 'bot-body' },
      h('p', {}, r.facts.length
        ? 'Here\'s what I found in that ' + (r.document_kind || 'document') + '. Choose what to add to your profile — I only read what the document says, I don\'t interpret results.'
        : 'I couldn\'t find anything to add from that document.'),
      r.facts.length ? h('div', { class: 'facts' }, list) : null,
      h('div', { class: 'actions' },
        r.facts.length ? h('button', { class: 'act primary', type: 'button', onclick: apply }, 'Add selected to my profile') : null,
        h('button', { class: 'act', type: 'button', onclick: function () { state.reviewing = null; render(); } },
          r.facts.length ? 'Not now' : 'OK')))
  );
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
    var t = document.getElementById('transcript');
    if (t) t.scrollIntoView({ block: 'end' });
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
  var p = null;
  for (var i = 0; i < state.results.length; i++) if (String(state.results[i].npi) === String(npi)) p = state.results[i];
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

  return sheet(p.name || 'Provider', [
    h('div', { class: 'badges', style: 'margin-top:0' }, badgesFor(p)),
    p.bio ? h('p', { style: 'margin-top:14px;color:var(--muted);font-size:14px' }, p.bio) : null,
    h('dl', { class: 'f', style: 'margin-top:18px' },
      h('dt', {}, 'Specialty'), h('dd', {}, p.specialty || '—'),
      h('dt', {}, 'NPI'), h('dd', { class: 'm' }, p.npi),
      h('dt', {}, 'Address'), h('dd', {}, [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || '—'),
      h('dt', {}, 'Phone'), h('dd', { class: 'm' }, p.phone || '—'),
      (p.registered && p.payers && p.payers.length) ? h('dt', {}, 'Accepts') : null,
      (p.registered && p.payers && p.payers.length) ? h('dd', {}, p.payers.join(', ')) : null),
    h('div', { class: 'sec-label' }, 'From Medicare records'), cms,
    h('div', { class: 'actions' },
      p.phone ? h('a', { class: 'act primary', href: 'tel:' + p.phone }, '📞 Call') : null,
      (p.lat && p.lng) ? h('button', { class: 'act', type: 'button', onclick: function () { showOnMap(p.npi); } }, 'Show on map') : null)
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
    h('div', { class: 'sec-label' }, 'Documents'),
    h('button', { class: 'act', type: 'button', onclick: function () { location.hash = '#/documents'; } }, '📄 Manage your documents'),
    h('div', { class: 'sec-label' }, 'Session'),
    h('button', { class: 'act danger', type: 'button', onclick: signOut }, 'Sign out'),
    h('div', { class: 'phi' }, 'Your health information is encrypted, visible only to you, and never sold or shared without your consent.')
  ]);
}

/* ---------- auth gate ----------------------------------------------------- */
function gateEl(mode) {
  var isReg = mode === 'register';
  var email = h('input', { type: 'email', autocomplete: 'email', 'aria-label': 'Email' });
  var pass = h('input', { type: 'password', autocomplete: isReg ? 'new-password' : 'current-password', 'aria-label': 'Password' });
  var first = h('input', { autocomplete: 'given-name', 'aria-label': 'First name' });
  var last = h('input', { autocomplete: 'family-name', 'aria-label': 'Last name' });
  var zip = h('input', { maxlength: '5', inputmode: 'numeric', autocomplete: 'postal-code', 'aria-label': 'ZIP code' });
  var stay = h('input', { type: 'checkbox' });
  var msg = h('div', { class: 'msg' });
  var btn = h('button', { class: 'btn-full', type: 'submit' }, isReg ? 'Create account' : 'Sign in');

  function fail(t) { msg.className = 'msg err'; msg.textContent = t; btn.disabled = false; }

  function onSubmit(e) {
    e.preventDefault();
    btn.disabled = true; msg.className = 'msg'; msg.textContent = '';
    if (isReg) {
      api('/auth-register-patient', { auth: false, method: 'POST', body: {
        email: email.value, password: pass.value, first_name: first.value, last_name: last.value,
        zip: zip.value, insurance_payer: '', conditions: [], concern_description: ''
      } }).then(function (d) {
        // Registration deliberately does NOT sign you in — confirm email first.
        msg.className = 'msg ok';
        msg.textContent = d.message || 'Check your email to confirm your account, then sign in.';
        btn.disabled = false;
      }).catch(function (err) {
        fail(err.status === 503 ? 'Sign-up is temporarily closed. If you already have an account, sign in.' : err.message);
      });
      return;
    }
    api('/auth-login', { auth: false, method: 'POST', body: { email: email.value, password: pass.value } })
      .then(function (d) {
        if (d.role !== 'patient') { fail('That\'s a provider account — use the provider page to sign in.'); return; }
        state.session = {
          access_token: d.access_token,
          refresh_token: d.refresh_token,
          role: d.role,
          expiresAt: Date.now() + (d.expires_in || 3600) * 1000
        };
        state.persist = !!stay.checked;
        saveSession(state.session, state.persist);
        scheduleRefresh();
        return bootstrap().then(function () {
          var replay = state.replay; state.replay = null;
          render();
          if (replay) replay();
        });
      }).catch(function (err) { fail(err.message); });
  }

  var form = h('form', { class: 'gate-card', onsubmit: onSubmit },
    h('h2', {}, isReg ? 'Create your account' : 'Find care that takes your insurance'),
    h('p', { class: 'sub' }, isReg ? 'You can add health details later — or never.' : 'Sign in to search verified providers near you.'),
    isReg ? h('div', { class: 'two' },
      h('div', { class: 'field' }, h('label', {}, 'First name'), first),
      h('div', { class: 'field' }, h('label', {}, 'Last name'), last)) : null,
    isReg ? h('div', { class: 'field' }, h('label', {}, 'ZIP code'), zip) : null,
    h('div', { class: 'field' }, h('label', {}, 'Email'), email),
    h('div', { class: 'field' }, h('label', {}, 'Password'), pass),
    isReg ? h('div', { class: 'sub', style: 'font-size:12.5px;margin:-6px 0 12px' }, 'At least 12 characters.') : null,
    !isReg ? h('label', { class: 'stay' }, stay, 'Stay signed in on this device') : null,
    btn, msg,
    h('p', { class: 'alt' }, isReg ? 'Already registered? ' : 'New here? ',
      h('a', { role: 'button', tabindex: '0', onclick: function () { location.hash = isReg ? '' : '#/join'; } },
        isReg ? 'Sign in' : 'Create an account')),
    h('p', { class: 'alt', style: 'margin-top:8px' }, 'Are you a healthcare provider? ',
      h('a', { href: 'register-provider.html' }, 'Claim your listing'))
  );
  return h('div', { class: 'gate' }, form);
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
  var z = currentZip();
  $('#zipVal').textContent = z || 'set ZIP';
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

function render() {
  var main = $('#main');
  clear(main);
  document.querySelectorAll('.scrim, .sheet').forEach(function (n) { n.remove(); });

  var r = route();
  var authed = !!state.session;
  $('#hdr').hidden = !authed;

  if (!authed) {
    main.appendChild(gateEl(r.name === 'join' ? 'register' : 'login'));
    return;
  }

  paintHeader();

  // Wide screens get a persistent map beside the conversation, so results and
  // geography are visible together. Narrow screens keep the #/map sheet, which
  // is the only sensible shape on a phone.
  var wide = window.matchMedia && window.matchMedia('(min-width: 1100px)').matches;
  var col = main;
  if (wide && state.results.length) {
    var split = h('div', { class: 'split' });
    col = h('div', { class: 'split-conv' });
    var pane = h('div', { class: 'split-map' }, h('div', { id: 'mapCanvas' }),
      h('div', { class: 'map-legend' },
        h('span', {}, h('i', { class: 'pin rec' }), 'Recommended'),
        h('span', {}, h('i', { class: 'pin ver' }), 'Verified'),
        h('span', {}, h('i', { class: 'pin oth' }), 'Other clinics')));
    split.appendChild(col); split.appendChild(pane);
    main.appendChild(split);
    setTimeout(function () { loadRegistered().then(function () { initMap(pane.querySelector('#mapCanvas'), h('span', {})); }); }, 0);
  }
  col.appendChild(state.messages.length || state.pending || state.reviewing ? transcriptEl() : homeEl());

  if (r.name === 'p' && r.arg) document.body.appendChild(detailSheet(r.arg));
  else if (r.name === 'account') document.body.appendChild(accountSheet());
  else if (r.name === 'documents') { document.body.appendChild(documentsSheet()); loadDocuments(); }
  else if (r.name === 'specialties') document.body.appendChild(specialtiesSheet());
  else if (r.name === 'map') { loadRegistered(); document.body.appendChild(mapSheet()); }

  var t = document.getElementById('transcript');
  if (t && (state.pending || state.messages.length)) t.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

/* ---------- wire up ------------------------------------------------------- */
window.addEventListener('hashchange', render);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && location.hash) closeSheet();
});
$('#acctBtn').addEventListener('click', function () { location.hash = '#/account'; });
$('#zipPill').addEventListener('click', function () {
  var z = window.prompt('Search near which ZIP code?', currentZip());
  if (z === null) return;
  z = z.trim();
  if (!/^\d{5}$/.test(z)) { toast('Enter a 5-digit ZIP code.', true); return; }
  state.lastSearch = state.lastSearch || {};
  state.lastSearch.zip = z;
  paintHeader();
});

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
