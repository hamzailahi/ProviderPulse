/* ============================================================================
   portal.js — the provider portal (portal.html, served at /portal).

   One app with a sidebar: Overview, Appointments, My listing, Locations,
   Competition, and Market (the /dashboard analytics tool, which carries the
   same nav). Replaces the long single-column account form that used to live
   under the pitch on register-provider.html.

   RULE, same as patient.js: values from the API are placed with h() /
   textContent. innerHTML is only ever given string literals.
   ============================================================================ */
(function () {
'use strict';

var FN = '/.netlify/functions';
var SESSION_KEY = 'pp.session.v1';

/* ---------- DOM helper ---------------------------------------------------- */
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
    else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = !!v;
    else el.setAttribute(k, v);
  }
  (function add(list) {
    for (var i = 0; i < list.length; i++) {
      var kid = list[i];
      if (kid === null || kid === undefined || kid === false) continue;
      if (Array.isArray(kid)) { add(kid); continue; }
      el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    }
  })(Array.prototype.slice.call(arguments, 2));
  return el;
}
function $(id) { return document.getElementById(id); }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

/* ---------- session + API ------------------------------------------------- */
var store = null, session = null;
try {
  store = sessionStorage.getItem(SESSION_KEY) ? sessionStorage : (localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage);
  session = JSON.parse(store.getItem(SESSION_KEY) || 'null');
} catch (e) { session = null; }

function toSignIn() { location.replace('/signin?next=' + encodeURIComponent('/portal' + location.hash)); }

var refreshing = null;
function refresh() {
  if (!session || !session.refresh_token) return Promise.resolve(false);
  if (refreshing) return refreshing;
  refreshing = fetch(FN + '/auth-refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    refreshing = null;
    if (!d || !d.access_token) return false;
    // Supabase rotates the refresh token: always store the new pair.
    session = { access_token: d.access_token, refresh_token: d.refresh_token, role: d.role || session.role,
                expiresAt: Date.now() + (d.expires_in || 3600) * 1000 };
    try { store.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    return true;
  }).catch(function () { refreshing = null; return false; });
  return refreshing;
}

function api(path, opts) {
  opts = opts || {};
  var pre = (session && session.expiresAt && session.expiresAt - 60000 < Date.now()) ? refresh() : Promise.resolve(true);
  return pre.then(function () {
    var headers = { 'Content-Type': 'application/json' };
    if (opts.auth !== false && session) headers.Authorization = 'Bearer ' + session.access_token;
    return fetch(FN + path, {
      method: opts.method || 'GET', headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout ? AbortSignal.timeout(opts.timeout || 26000) : undefined
    });
  }).then(function (res) {
    return res.text().then(function (t) {
      var d = {}; try { d = t ? JSON.parse(t) : {}; } catch (e) { d = { error: t }; }
      if (res.status === 401 && opts.auth !== false) {
        if (!opts._retried) return refresh().then(function (ok) {
          if (!ok) { toSignIn(); throw new Error('Session expired'); }
          opts._retried = true; return api(path, opts);
        });
        toSignIn(); throw new Error('Session expired');
      }
      if (!res.ok) { var e = new Error(d.error || 'Request failed'); e.status = res.status; throw e; }
      return d;
    });
  });
}

function toast(text, isErr) {
  var t = $('toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
  t.className = isErr ? 'err' : '';
  t.textContent = text;
  clearTimeout(t._h);
  t._h = setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
}

/* ---------- state --------------------------------------------------------- */
var S = {
  profile: null, insurance: [], appointments: null, locations: null,
  demand: null, payers: null, comp: null, noListing: false
};
function displayName(p) {
  p = p || S.profile || {};
  return titleCase(p.org_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Your practice');
}
function newRequests() { return (S.appointments || []).filter(function (a) { return a.status === 'requested'; }); }
function upcoming() {
  var now = Date.now() - 3600e3;
  return (S.appointments || []).filter(function (a) {
    return a.status === 'confirmed' && (!a.requested_time || new Date(a.requested_time).getTime() >= now);
  });
}
function fmtWhen(iso) {
  if (!iso) return 'No time requested';
  var d = new Date(iso);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function ago(iso) {
  var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!isFinite(m)) return '';
  if (m < 60) return m <= 1 ? 'just now' : m + ' min ago';
  if (m < 1440) return Math.round(m / 60) + ' h ago';
  return Math.round(m / 1440) + ' d ago';
}

// The provider's specialty as a SPECIALTIES entry, so Competition searches the
// same vocabulary the patient search uses. NPPES descriptions come in two
// orders ("Family Medicine", "Nurse Practitioner, Family"), so both the full
// string and its head are tried; a miss falls back to the description itself.
function mySpecialty() {
  var desc = String((S.profile || {}).taxonomy_desc || '').trim();
  if (!desc) return { label: 'Primary care / family doctor', terms: SPECIALTIES[0][1].split(',') };
  var head = desc.split(',')[0].trim(), tail = (desc.split(',')[1] || '').trim();
  var probes = [desc, head, tail ? tail + ' ' + head : ''].filter(Boolean);
  for (var i = 0; i < SPECIALTIES.length; i++) {
    var terms = SPECIALTIES[i][1].split(',');
    for (var j = 0; j < probes.length; j++) if (taxMatches(probes[j], terms)) return { label: SPECIALTIES[i][0], terms: terms };
  }
  return { label: desc, terms: [head] };
}

/* ---------- shell --------------------------------------------------------- */
var NAV = [
  ['overview', 'Overview', '◎'],
  ['appointments', 'Appointments', '📅'],
  ['listing', 'My listing', '✎'],
  ['locations', 'Locations', '📍'],
  ['competition', 'Competition', '◉'],
  ['market', 'Market', '📈']
];
function paintNav(active) {
  var nav = $('pnav');
  clear(nav);
  NAV.forEach(function (n) {
    var count = n[0] === 'appointments' ? newRequests().length : 0;
    var href = n[0] === 'market' ? '/dashboard' : '#/' + n[0];
    nav.appendChild(h('a', { href: href, class: 'nav-item' + (active === n[0] ? ' on' : ''), 'aria-current': active === n[0] ? 'page' : null },
      h('span', { class: 'ni', 'aria-hidden': 'true' }, n[2]), h('span', { class: 'nl' }, n[1]),
      count ? h('span', { class: 'nbadge', 'aria-label': count + ' new' }, String(count)) : null));
  });
  $('who').textContent = S.profile ? displayName() : '';
}

function route() {
  var r = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  return NAV.some(function (n) { return n[0] === r; }) && r !== 'market' ? r : 'overview';
}

var VIEWS = {};
var mapsToDrop = [];
function render() {
  mapsToDrop.forEach(function (m) { try { m.remove(); } catch (e) {} });
  mapsToDrop = [];
  var r = route();
  paintNav(r);
  var main = $('pmain');
  clear(main);
  if (S.noListing) { main.appendChild(noListingEl()); return; }
  main.appendChild(VIEWS[r]());
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function noListingEl() {
  return h('section', { class: 'view' }, h('div', { class: 'card empty-card' },
    h('h1', {}, 'No provider listing on this account yet'),
    h('p', { class: 'muted' }, 'Listings are created when you register your NPI, which we verify against the federal NPPES registry.'),
    h('a', { class: 'btn primary', href: '/join' }, 'Register your NPI')));
}

function pageHead(title, sub, right) {
  return h('div', { class: 'phead' }, h('div', {}, h('h1', {}, title), sub ? h('p', { class: 'muted' }, sub) : null), right || null);
}

/* ---------- data loading -------------------------------------------------- */
function loadProfile() {
  return api('/profile').then(function (d) {
    if (d.role !== 'provider' || !d.profile) { S.noListing = true; return; }
    S.profile = d.profile; S.insurance = (d.insurance || []).map(function (i) { return i.payer_name; });
  }).catch(function (e) { if (e.status === 403) S.noListing = true; else throw e; });
}
function loadAppointments() {
  return api('/appointment-request').then(function (d) { S.appointments = d.appointments || []; })
    .catch(function () { S.appointments = S.appointments || []; });
}
function loadLocations() {
  return api('/provider-locations').then(function (d) { S.locations = d.locations || []; })
    .catch(function () { S.locations = S.locations || []; });
}
function loadDemand() {
  var zip = (S.profile || {}).zip;
  if (!/^\d{5}$/.test(String(zip || ''))) { S.demand = { available: false }; return Promise.resolve(); }
  return api('/demand-stats?zip=' + encodeURIComponent(zip), { auth: false })
    .then(function (d) { S.demand = d; }).catch(function () { S.demand = { available: false }; });
}

/* ---------- listing strength ---------------------------------------------- */
// Each item is something the patient search actually uses. Items point at the
// section of My listing (or Locations) that fixes them.
function strength() {
  var p = S.profile || {};
  var hours = p.office_hours && Object.keys(p.office_hours).length;
  var pinned = (S.locations || []).some(function (l) { return l.latitude && l.longitude; });
  var items = [
    ['Accepting new patients is set', p.accepting_new_patients === true || p.accepting_new_patients === false, 'Patients filter on this. Unset reads as unknown.', '#/listing/availability'],
    ['Insurance plans listed', S.insurance.length > 0, 'Powers the "Takes my insurance" filter and badge.', '#/listing/insurance'],
    ['Office hours', !!hours, 'Shown on your card in search results.', '#/listing/hours'],
    ['Telehealth is set', p.telehealth === true || p.telehealth === false, 'Patients can filter for telehealth.', '#/listing/availability'],
    ['Phone number', !!p.phone, 'Lets patients call from your card.', '#/listing/about'],
    ['About your practice', String(p.bio || '').trim().length >= 40, 'A few sentences shown on your details page.', '#/listing/about'],
    ['Pinned on the map', pinned, 'Without a geocoded location you cannot appear in distance search.', '#/locations']
  ];
  var done = items.filter(function (i) { return i[1]; }).length;
  return { items: items, pct: Math.round(done / items.length * 100) };
}

/* ======================================================================== */
/*  OVERVIEW                                                                */
/* ======================================================================== */
VIEWS.overview = function () {
  var p = S.profile || {};
  var st = strength();
  var news = newRequests(), ups = upcoming();
  var hour = new Date().getHours();
  var hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  var demandTotal = S.demand && S.demand.available ? S.demand.total_searches : null;
  var view = h('section', { class: 'view' },
    pageHead(hello + ', ' + displayName(), null,
      h('div', { class: 'chips' },
        p.npi_verified ? h('span', { class: 'chip ok' }, '✓ NPI verified') : null,
        p.review_status === 'pending' ? h('span', { class: 'chip warn' }, 'Listing under review') : null)),
    p.review_status === 'pending' ? h('div', { class: 'banner warn' },
      'Your listing is held for a short verification review before patients can see it. You can finish setting it up meanwhile.') : null,
    h('div', { class: 'stats' },
      stat(String(news.length), 'New requests', news.length ? 'Waiting on you' : 'All caught up', '#/appointments', news.length ? 'hot' : ''),
      stat(String(ups.length), 'Upcoming visits', 'Confirmed', '#/appointments/upcoming'),
      stat(st.pct + '%', 'Listing strength', st.pct === 100 ? 'Complete' : (st.items.length - st.items.filter(function (i) { return i[1]; }).length) + ' to finish', '#/listing'),
      stat(demandTotal == null ? '—' : demandTotal.toLocaleString(), 'Patient searches', 'In ' + (p.zip || 'your ZIP') + ', last 90 days', '#/competition')));

  var grid = h('div', { class: 'grid2' });
  view.appendChild(grid);

  // requests
  var reqCard = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h2', {}, 'New appointment requests'), h('a', { href: '#/appointments' }, 'View all →')));
  if (!news.length) reqCard.appendChild(h('p', { class: 'muted pad' }, 'No new requests. Patients can request a time from your card once your listing is live.'));
  news.slice(0, 3).forEach(function (a) { reqCard.appendChild(apptRow(a, true)); });
  grid.appendChild(reqCard);

  // strength checklist
  var sCard = h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h2', {}, 'Listing strength'), h('span', { class: 'pct' }, st.pct + '%')),
    h('div', { class: 'bar' }, h('i', { style: 'width:' + st.pct + '%' })),
    h('ul', { class: 'checklist' }, st.items.map(function (i) {
      return h('li', { class: i[1] ? 'done' : '' },
        h('span', { class: 'tick', 'aria-hidden': 'true' }, i[1] ? '✓' : ''),
        h('div', {}, h('b', {}, i[0]), h('div', { class: 'muted small' }, i[2])),
        i[1] ? null : h('a', { class: 'fix', href: i[3] }, 'Fix'));
    })));
  grid.appendChild(sCard);

  // area mini-map
  var mapEl = h('div', { class: 'minimap' });
  var areaNote = h('p', { class: 'muted small pad' }, 'Loading your area…');
  grid.appendChild(h('div', { class: 'card' },
    h('div', { class: 'card-h' }, h('h2', {}, 'Your area'), h('a', { href: '#/competition' }, 'Competition →')),
    mapEl, areaNote));
  loadCompetition(10).then(function (c) {
    if (!c) { areaNote.textContent = 'Add a practice ZIP in My listing to see your area.'; return; }
    var ver = c.list.filter(function (x) { return x.registered; }).length;
    areaNote.textContent = c.list.length + ' other ' + c.spec.label.toLowerCase() + ' provider' + (c.list.length === 1 ? '' : 's') +
      ' within 10 mi · ' + ver + ' verified on ProviderPulse';
    drawCompMap(mapEl, c, { interactive: false });
  });

  // demand
  grid.appendChild(demandCard());
  return view;
};

function stat(big, label, sub, href, cls) {
  return h('a', { class: 'stat ' + (cls || ''), href: href },
    h('div', { class: 'big' }, big), h('div', { class: 'lbl' }, label), h('div', { class: 'sub' }, sub));
}

function demandCard() {
  var d = S.demand || {};
  var card = h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h2', {}, 'What patients search for near you')));
  var groups = (d.groups || []).filter(function (g) { return !g.suppressed; }).slice(0, 6);
  if (!d.available || !groups.length) {
    card.appendChild(h('p', { class: 'muted pad' }, 'Not enough searches in ' + ((S.profile || {}).zip || 'your ZIP') +
      ' yet to show without identifying anyone. Counts appear once a specialty has at least ' + (d.min_group || 5) + ' searches.'));
    return card;
  }
  var max = Math.max.apply(null, groups.map(function (g) { return g.count; }));
  card.appendChild(h('div', { class: 'bars' }, groups.map(function (g) {
    return h('div', { class: 'brow' },
      h('span', { class: 'bl' }, g.taxonomy),
      h('span', { class: 'bt' }, h('i', { style: 'width:' + Math.max(4, Math.round(g.count / max * 100)) + '%' })),
      h('span', { class: 'bn' }, g.count.toLocaleString()));
  })));
  card.appendChild(h('p', { class: 'muted small pad' }, 'Last ' + (d.window_days || 90) + ' days in ' + d.zip +
    '. Small counts are hidden so no patient can be identified.'));
  return card;
}

/* ======================================================================== */
/*  APPOINTMENTS                                                            */
/* ======================================================================== */
var APPT_LABEL = { requested: 'New request', confirmed: 'Confirmed', declined: 'Declined',
                   cancelled: 'Cancelled by patient', completed: 'Completed' };

VIEWS.appointments = function () {
  var tab = (location.hash.split('/')[2] || 'new');
  var all = S.appointments || [];
  var ups = upcoming();
  var lists = {
    'new': newRequests(),
    upcoming: ups.slice().sort(function (a, b) { return new Date(a.requested_time || 0) - new Date(b.requested_time || 0); }),
    past: all.filter(function (a) { return a.status !== 'requested' && ups.indexOf(a) === -1; })
  };
  var tabs = h('div', { class: 'tabs', role: 'tablist' }, [['new', 'New'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(function (t) {
    return h('a', { href: '#/appointments/' + t[0], role: 'tab', class: 'tab' + (tab === t[0] ? ' on' : ''), 'aria-selected': tab === t[0] ? 'true' : 'false' },
      t[1], h('span', { class: 'tcount' }, String(lists[t[0]].length)));
  }));
  var list = h('div', { class: 'card flush' });
  var items = lists[tab] || [];
  if (!items.length) list.appendChild(h('p', { class: 'muted pad' },
    tab === 'new' ? 'No new requests right now.' : tab === 'upcoming' ? 'No confirmed visits coming up.' : 'Nothing here yet.'));
  items.forEach(function (a) { list.appendChild(apptRow(a, false)); });
  return h('section', { class: 'view' },
    pageHead('Appointments', 'Requests from patients who found you on ProviderPulse. Confirming unlocks a short pre-visit briefing.',
      h('button', { class: 'btn', type: 'button', onclick: function () { loadAppointments().then(render); } }, '↻ Refresh')),
    tabs, list);
};

function apptRow(a, compact) {
  var brief = h('div', { class: 'brief', hidden: true });
  var resched = h('div', { class: 'resched', hidden: true });
  var acts = h('div', { class: 'row-acts' });
  if (a.status === 'requested') {
    acts.appendChild(h('button', { class: 'btn primary sm', type: 'button', onclick: function () { move(a, 'confirmed'); } },
      a.requested_time ? 'Confirm ' + fmtWhen(a.requested_time) : 'Confirm'));
    if (!compact) {
      acts.appendChild(h('button', { class: 'btn sm', type: 'button', onclick: function () { resched.hidden = !resched.hidden; } }, 'Confirm another time'));
      var when = h('input', { type: 'datetime-local', 'aria-label': 'New time' });
      resched.appendChild(when);
      resched.appendChild(h('button', { class: 'btn primary sm', type: 'button', onclick: function () {
        if (!when.value) { when.focus(); return; }
        move(a, 'confirmed', new Date(when.value).toISOString());
      } }, 'Confirm at this time'));
    }
    acts.appendChild(h('button', { class: 'btn sm danger', type: 'button', onclick: function () { move(a, 'declined'); } }, 'Decline'));
  } else if (a.status === 'confirmed') {
    acts.appendChild(h('button', { class: 'btn sm', type: 'button', onclick: function () { showBrief(a, brief); } }, 'Pre-visit briefing'));
    acts.appendChild(h('button', { class: 'btn sm', type: 'button', onclick: function () { move(a, 'completed'); } }, 'Mark completed'));
    acts.appendChild(h('button', { class: 'btn sm danger', type: 'button', onclick: function () { move(a, 'declined'); } }, 'Cancel visit'));
  } else if (a.status === 'completed') {
    acts.appendChild(h('button', { class: 'btn sm', type: 'button', onclick: function () { showBrief(a, brief); } }, 'Pre-visit briefing'));
  }
  return h('div', { class: 'appt' },
    h('div', { class: 'av', style: '--h:' + hueFor(a.id) }, initials(a.patient_name)),
    h('div', { class: 'appt-main' },
      h('div', { class: 'appt-top' }, h('b', {}, a.patient_name || 'Patient'),
        h('span', { class: 'status s-' + a.status }, APPT_LABEL[a.status] || a.status)),
      h('div', { class: 'muted small' }, fmtWhen(a.requested_time), a.created_at ? ' · requested ' + ago(a.created_at) : ''),
      a.reason ? h('div', { class: 'reason' }, a.reason) : null,
      acts, resched, brief));
}

function move(a, status, time) {
  var body = { id: a.id, status: status };
  if (time) body.requested_time = time;
  api('/appointment-request', { method: 'PATCH', body: body }).then(function () {
    toast(status === 'confirmed' ? 'Confirmed. The patient will see it in their appointments.' : status === 'completed' ? 'Marked completed.' : 'Updated.');
    return loadAppointments();
  }).then(render).catch(function (e) { toast(e.message, true); });
}

function showBrief(a, out) {
  out.hidden = false;
  clear(out);
  out.appendChild(h('span', { class: 'muted' }, 'Preparing the briefing…'));
  api('/appointment-briefing', { method: 'POST', body: { appointment_id: a.id } }).then(function (d) {
    var s = d.briefing && d.briefing.summary;
    clear(out);
    if (!s) { out.appendChild(h('span', { class: 'muted' }, 'The briefing is unavailable right now.')); return; }
    out.appendChild(h('div', { class: 'brief-h' }, 'Pre-visit briefing'));
    out.appendChild(h('p', {}, s.narrative));
    if (s.known_conditions && s.known_conditions.length) out.appendChild(h('div', { class: 'small' }, h('b', {}, 'Reported conditions: '), s.known_conditions.join(', ')));
    out.appendChild(h('div', { class: 'muted small' }, 'Organized from what the patient reported and approved. Not a diagnosis.'));
  }).catch(function (e) { clear(out); out.appendChild(h('span', { class: 'err' }, e.message)); });
}

/* ======================================================================== */
/*  MY LISTING                                                              */
/* ======================================================================== */
var DAYS = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];

VIEWS.listing = function () {
  var p = S.profile || {};
  var preview = h('div', { class: 'preview' });
  function paintPreview() { clear(preview); preview.appendChild(previewCard()); }

  // Saves one section. The profile endpoint accepts any subset of fields, so a
  // save never touches fields from another section.
  function saver(btn, collect) {
    return function () {
      var body = collect();
      if (!body) return;
      btn.disabled = true;
      api('/profile', { method: 'PUT', body: body }).then(function () {
        Object.keys(body).forEach(function (k) { if (k !== 'insurances') S.profile[k] = body[k]; });
        if (body.insurances) S.insurance = body.insurances.slice();
        btn.disabled = false; btn.textContent = 'Saved ✓';
        setTimeout(function () { btn.textContent = 'Save'; }, 1800);
        paintPreview(); paintNav('listing');
      }).catch(function (e) { btn.disabled = false; toast(e.message, true); });
    };
  }

  /* availability */
  function seg(name, value, labels) {
    var wrap = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': name });
    [[true, labels[0]], [false, labels[1]]].forEach(function (o) {
      wrap.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': value === o[0] ? 'true' : 'false',
        class: value === o[0] ? 'on' : '', onclick: function () {
          value = o[0]; wrap.querySelectorAll('button').forEach(function (b) { b.className = ''; b.setAttribute('aria-checked', 'false'); });
          this.className = 'on'; this.setAttribute('aria-checked', 'true'); wrap._v = value;
        } }, o[1]));
    });
    wrap._v = value;
    return wrap;
  }
  var fAccept = seg('Accepting new patients', p.accepting_new_patients, ['Yes, accepting', 'Not right now']);
  var fTele = seg('Telehealth', p.telehealth, ['Offer telehealth', 'In person only']);
  var availSave = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  availSave.onclick = saver(availSave, function () {
    var b = {};
    if (fAccept._v === true || fAccept._v === false) b.accepting_new_patients = fAccept._v;
    if (fTele._v === true || fTele._v === false) b.telehealth = fTele._v;
    if (!Object.keys(b).length) { toast('Choose an option first.', true); return null; }
    return b;
  });

  /* about */
  var fPhone = h('input', { value: p.phone || '', inputmode: 'tel', placeholder: '(901) 555-0100' });
  var fBio = h('textarea', { maxlength: '600', rows: '4', placeholder: 'Who you see, what you focus on, languages spoken, what a first visit is like.' });
  fBio.value = p.bio || '';
  var bioCount = h('span', { class: 'muted small' }, (fBio.value.length) + ' / 600');
  fBio.addEventListener('input', function () { bioCount.textContent = fBio.value.length + ' / 600'; });
  var aboutSave = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  aboutSave.onclick = saver(aboutSave, function () { return { phone: fPhone.value.trim(), bio: fBio.value.trim() }; });

  /* address */
  var fAddr = h('input', { value: p.address_line || '' }), fCity = h('input', { value: p.city || '' });
  var fState = h('input', { value: p.state || '', maxlength: '2' }), fZip = h('input', { value: p.zip || '', maxlength: '5', inputmode: 'numeric' });
  var addrSave = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  addrSave.onclick = saver(addrSave, function () {
    if (fZip.value.trim() && !/^\d{5}$/.test(fZip.value.trim())) { toast('ZIP must be 5 digits.', true); return null; }
    return { address_line: fAddr.value.trim(), city: fCity.value.trim(), state: fState.value.trim().toUpperCase(), zip: fZip.value.trim() };
  });

  /* hours */
  var hrs = (p.office_hours && typeof p.office_hours === 'object') ? p.office_hours : {};
  var rows = DAYS.map(function (d) {
    var v = hrs[d[0]] || {};
    var open = h('input', { type: 'time', value: v.open || '', 'aria-label': d[1] + ' opens' });
    var close = h('input', { type: 'time', value: v.close || '', 'aria-label': d[1] + ' closes' });
    var closed = h('input', { type: 'checkbox', checked: !v.open, 'aria-label': d[1] + ' closed' });
    function sync() { open.disabled = close.disabled = closed.checked; }
    closed.addEventListener('change', sync); sync();
    return { key: d[0], el: h('div', { class: 'hrow' }, h('span', { class: 'day' }, d[1]), open, h('span', { class: 'muted' }, 'to'), close,
      h('label', { class: 'closed' }, closed, ' Closed')), open: open, close: close, closed: closed };
  });
  var copyBtn = h('button', { class: 'btn sm', type: 'button', onclick: function () {
    var m = rows[0];
    rows.slice(1, 5).forEach(function (r) { r.open.value = m.open.value; r.close.value = m.close.value; r.closed.checked = m.closed.checked; r.open.disabled = r.close.disabled = m.closed.checked; });
  } }, 'Copy Monday to Tue–Fri');
  var fNote = h('input', { value: p.hours_note || '', placeholder: 'e.g. Closed 12–1 for lunch' });
  var hoursSave = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  hoursSave.onclick = saver(hoursSave, function () {
    var out = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.closed.checked) continue;
      if (!r.open.value || !r.close.value) { toast('Add both times for ' + DAYS[i][1] + ', or mark it closed.', true); return null; }
      out[r.key] = { open: r.open.value, close: r.close.value };
    }
    return { office_hours: Object.keys(out).length ? out : null, hours_note: fNote.value.trim() };
  });

  /* insurance */
  var chosen = S.insurance.slice();
  var chosenEl = h('div', { class: 'chosen' });
  var insSub = h('p', { class: 'muted small' });
  var optsEl = h('div', { class: 'opts' });
  var q = h('input', { type: 'search', placeholder: 'Search plans, e.g. Blue Cross, Medicaid, Aetna', 'aria-label': 'Search insurance plans' });
  var other = h('input', { placeholder: 'Plan not listed? Type it and press Add' });
  function paintIns() {
    insSub.textContent = chosen.length + ' plan' + (chosen.length === 1 ? '' : 's') + ' selected. Patients see "Takes your plan" when theirs matches exactly.';
    clear(chosenEl);
    if (!chosen.length) chosenEl.appendChild(h('span', { class: 'muted small' }, 'No plans selected yet.'));
    chosen.forEach(function (n) {
      chosenEl.appendChild(h('span', { class: 'pchip' }, n, h('button', { type: 'button', 'aria-label': 'Remove ' + n,
        onclick: function () { chosen.splice(chosen.indexOf(n), 1); paintIns(); } }, '×')));
    });
    clear(optsEl);
    var f = q.value.trim().toLowerCase();
    var list = (S.payers || []).filter(function (x) { return !f || x.name.toLowerCase().indexOf(f) !== -1; });
    if (!S.payers) optsEl.appendChild(h('span', { class: 'muted small' }, 'Loading plans…'));
    else if (!list.length) optsEl.appendChild(h('span', { class: 'muted small' }, 'No plans match. Add it below.'));
    list.forEach(function (x) {
      var on = chosen.indexOf(x.name) !== -1;
      optsEl.appendChild(h('button', { type: 'button', class: 'opt' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: function () {
        if (on) chosen.splice(chosen.indexOf(x.name), 1); else chosen.push(x.name);
        paintIns();
      } }, on ? '✓ ' : '+ ', x.name, x.local ? h('span', { class: 'loc' }, ' · ' + (p.state || 'local')) : null));
    });
  }
  q.addEventListener('input', paintIns);
  if (!S.payers) {
    api('/payers' + (/^\d{5}$/.test(String(p.zip || '')) ? '?zip=' + encodeURIComponent(p.zip) : ''), { auth: false })
      .then(function (d) { S.payers = d.payers || []; paintIns(); }).catch(function () { S.payers = []; paintIns(); });
  }
  paintIns();
  var insSave = h('button', { class: 'btn primary', type: 'button' }, 'Save');
  insSave.onclick = saver(insSave, function () { return { insurances: chosen.slice() }; });

  function section(id, title, sub, body, btn) {
    return h('div', { class: 'card sec', id: 'sec-' + id },
      h('div', { class: 'card-h' }, h('div', {}, h('h2', {}, title), sub ? (typeof sub === 'string' ? h('p', { class: 'muted small' }, sub) : sub) : null), btn),
      body);
  }

  var view = h('section', { class: 'view' },
    pageHead('My listing', 'What patients see when they search. Each section saves on its own and goes live immediately.'),
    h('div', { class: 'split' },
      h('div', { class: 'secs' },
        section('availability', 'Availability', 'The two things patients filter on most.',
          h('div', { class: 'form' }, h('label', {}, 'Accepting new patients'), fAccept, h('label', {}, 'Telehealth'), fTele), availSave),
        section('insurance', 'Insurance accepted', insSub,
          h('div', { class: 'form' }, chosenEl, q, optsEl,
            h('div', { class: 'inline' }, other, h('button', { class: 'btn sm', type: 'button', onclick: function () {
              var v = other.value.trim().slice(0, 120);
              if (v && chosen.indexOf(v) === -1) { chosen.push(v); other.value = ''; paintIns(); }
            } }, 'Add'))), insSave),
        section('hours', 'Office hours', 'Shown on your card in search results.',
          h('div', { class: 'form' }, rows.map(function (r) { return r.el; }), h('div', { class: 'inline' }, copyBtn),
            h('label', {}, 'Hours note (optional)'), fNote), hoursSave),
        section('about', 'Contact & about', null,
          h('div', { class: 'form' }, h('label', {}, 'Phone'), fPhone, h('label', {}, 'About your practice ', bioCount), fBio), aboutSave),
        section('address', 'Registered practice address', 'Your address of record. Map pins come from Locations.',
          h('div', { class: 'form' }, h('label', {}, 'Street address'), fAddr,
            h('div', { class: 'row3' }, h('div', {}, h('label', {}, 'City'), fCity), h('div', {}, h('label', {}, 'State'), fState), h('div', {}, h('label', {}, 'ZIP'), fZip))), addrSave),
        h('div', { class: 'card sec readonly' }, h('div', { class: 'card-h' }, h('h2', {}, 'From the NPPES registry')),
          h('dl', { class: 'kv' }, h('dt', {}, 'NPI'), h('dd', {}, p.npi || '—'), h('dt', {}, 'Name'), h('dd', {}, displayName()),
            h('dt', {}, 'Specialty'), h('dd', {}, p.taxonomy_desc || '—')),
          h('p', { class: 'muted small' }, 'These come from the federal registry. Update them at nppes.cms.hhs.gov.'))),
      h('aside', { class: 'side' }, h('div', { class: 'sticky' }, h('div', { class: 'side-h' }, 'How patients see you'), preview,
        h('p', { class: 'muted small' }, 'Your card in patient search. Badges appear as you fill in the sections.')))));
  paintPreview();
  var sub = location.hash.split('/')[2];
  if (sub) setTimeout(function () { var t = $('sec-' + sub); if (t) { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); t.classList.add('flash'); } }, 50);
  return view;
};

// Mirrors the patient app's result card (assets/find.css .res), so the preview
// is what a patient actually sees.
function previewCard() {
  var p = S.profile || {};
  var name = displayName();
  var badges = [h('span', { class: 'badge verified' }, '✓ Verified')];
  if (p.accepting_new_patients === true) badges.push(h('span', { class: 'badge good' }, 'Accepting new patients'));
  if (p.accepting_new_patients === false) badges.push(h('span', { class: 'badge unknown' }, 'Not taking new patients'));
  if (S.insurance.length) badges.push(h('span', { class: 'badge good' }, 'Takes ' + S.insurance[0]));
  if (p.telehealth === true) badges.push(h('span', { class: 'badge tele' }, 'Telehealth'));
  return h('article', { class: 'res' },
    h('div', { class: 'res-av', style: '--h:' + hueFor(p.npi) }, initials(name)),
    h('div', { class: 'res-main' },
      h('div', { class: 'res-top' }, h('h3', {}, name), h('span', { class: 'dist' }, '1.2 mi')),
      h('div', { class: 'res-spec' }, p.taxonomy_desc || 'Your specialty'),
      h('div', { class: 'res-addr' }, [titleCase(p.address_line || ''), titleCase(p.city || '')].filter(Boolean).join(', ') || 'Add your address'),
      h('div', { class: 'badges' }, badges),
      p.office_hours && Object.keys(p.office_hours).length ? h('div', { class: 'res-hours' }, 'Hours: ', summariseHours(p.office_hours)) : null,
      h('div', { class: 'actions' },
        h('span', { class: 'act primary' }, 'Request appointment'),
        p.phone ? h('span', { class: 'act' }, 'Call ' + p.phone) : null,
        h('span', { class: 'act' }, 'Details'))));
}

/* ======================================================================== */
/*  LOCATIONS                                                               */
/* ======================================================================== */
VIEWS.locations = function () {
  var list = h('div', { class: 'locs' });
  var mapEl = h('div', { class: 'minimap tall' });
  function paint() {
    clear(list);
    var L0 = S.locations || [];
    if (!L0.length) list.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted pad' }, 'No locations yet. Add the address patients should visit so you can appear in distance search.')));
    L0.forEach(function (l) { list.appendChild(locCard(l)); });
    drawLocMap(mapEl, L0);
  }
  function locCard(l) {
    var f = {
      label: h('input', { value: l.label || '', placeholder: 'Label, e.g. Main office' }),
      address_line: h('input', { value: l.address_line || '', placeholder: 'Street address' }),
      city: h('input', { value: l.city || '', placeholder: 'City' }),
      state: h('input', { value: l.state || '', maxlength: '2', placeholder: 'ST' }),
      zip: h('input', { value: l.zip || '', maxlength: '5', placeholder: 'ZIP', inputmode: 'numeric' })
    };
    var primary = h('input', { type: 'checkbox', checked: !!l.is_primary });
    var saveBtn = h('button', { class: 'btn primary sm', type: 'button' }, l.id ? 'Save' : 'Add location');
    saveBtn.onclick = function () {
      var body = { label: f.label.value.trim(), address_line: f.address_line.value.trim(), city: f.city.value.trim(),
                   state: f.state.value.trim().toUpperCase(), zip: f.zip.value.trim(), is_primary: primary.checked };
      if (!body.address_line) { toast('A street address is required.', true); return; }
      saveBtn.disabled = true;
      var req = l.id ? api('/provider-locations', { method: 'PUT', body: Object.assign({ id: l.id }, body) })
                     : api('/provider-locations', { method: 'POST', body: body });
      req.then(function (d) {
        var loc = d.location || {};
        toast(loc.geocoded === false ? 'Saved, but we could not place that address on the map. Check the street and ZIP.' : 'Location saved.');
        return loadLocations();
      }).then(render).catch(function (e) { saveBtn.disabled = false; toast(e.message, true); });
    };
    var del = l.id ? h('button', { class: 'btn sm danger', type: 'button', onclick: function () {
      if (!window.confirm('Remove this location?')) return;
      api('/provider-locations?id=' + encodeURIComponent(l.id), { method: 'DELETE' })
        .then(loadLocations).then(render).catch(function (e) { toast(e.message, true); });
    } }, 'Remove') : null;
    var badge = !l.id ? null : l.verified ? h('span', { class: 'chip ok' }, '✓ NPPES verified')
      : h('span', { class: 'chip' }, 'Self-reported');
    var pin = !l.id ? null : (l.latitude && l.longitude) ? h('span', { class: 'chip ok' }, '📍 On the map')
      : h('span', { class: 'chip warn' }, 'Not on the map yet');
    return h('div', { class: 'card sec' },
      h('div', { class: 'card-h' }, h('div', { class: 'chips' }, badge, pin, l.is_primary ? h('span', { class: 'chip' }, 'Primary') : null)),
      h('div', { class: 'form' }, f.label, f.address_line, h('div', { class: 'row3' }, f.city, f.state, f.zip),
        h('label', { class: 'check' }, primary, ' Primary location')),
      h('div', { class: 'row-acts' }, saveBtn, del));
  }
  var addBtn = h('button', { class: 'btn', type: 'button', onclick: function () {
    list.appendChild(locCard({}));
    list.lastChild.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } }, '+ Add a location');
  var view = h('section', { class: 'view' },
    pageHead('Locations', 'Each location gets its own pin in patient search. Only the address in the federal registry is marked verified.', addBtn),
    h('div', { class: 'split' }, h('div', {}, list), h('aside', { class: 'side' }, h('div', { class: 'sticky card' }, mapEl))));
  if (S.locations) paint(); else loadLocations().then(paint);
  return view;
};

/* ---------- maps ---------------------------------------------------------- */
function baseMap(el, opts) {
  var map = L.map(el, { zoomControl: opts.interactive !== false, attributionControl: true, preferCanvas: true,
    dragging: opts.interactive !== false, scrollWheelZoom: false, doubleClickZoom: opts.interactive !== false });
  L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=' + MAPTILER_KEY, {
    tileSize: 512, zoomOffset: -1, maxZoom: 19, attribution: '&copy; MapTiler &copy; OpenStreetMap contributors'
  }).addTo(map);
  mapsToDrop.push(map);
  return map;
}
function youMarker(lat, lng) {
  return L.marker([lat, lng], { icon: L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15],
    html: '<div class="you-pin">✚</div>' }), zIndexOffset: 1000 });
}

function drawLocMap(el, locs) {
  loadLeaflet().then(function (ok) {
    if (!ok || !el.isConnected) return;
    var pts = locs.filter(function (l) { return l.latitude && l.longitude; });
    var map = baseMap(el, {});
    if (!pts.length) { map.setView([39.5, -98.35], 4); return; }
    var b = [];
    pts.forEach(function (l) {
      L.circleMarker([l.latitude, l.longitude], { radius: 9, color: '#fff', weight: 3, fillColor: l.verified ? '#0d9488' : '#6366f1', fillOpacity: 1 })
        .bindTooltip((l.label || 'Location') + (l.verified ? ' · verified' : ' · self-reported')).addTo(map);
      b.push([l.latitude, l.longitude]);
    });
    if (b.length === 1) map.setView(b[0], 14); else map.fitBounds(b, { padding: [30, 30], maxZoom: 14 });
  });
}

/* ======================================================================== */
/*  COMPETITION                                                             */
/* ======================================================================== */
// Same data path as the patient search (assets/directory.js): same-specialty
// listings within the radius, with claimed listings overlaid from
// providers-public. Your own NPI is left out.
var registered = null;
function loadRegistered() {
  if (registered) return Promise.resolve(registered);
  return api('/providers-public?all=1', { auth: false }).then(function (d) { registered = d.providers || {}; return registered; })
    .catch(function () { registered = {}; return registered; });
}

function myCenter() {
  var locs = S.locations || [];
  var prim = locs.filter(function (l) { return l.is_primary && l.latitude; })[0] || locs.filter(function (l) { return l.latitude; })[0];
  if (prim) return Promise.resolve({ lat: +prim.latitude, lng: +prim.longitude });
  var zip = (S.profile || {}).zip;
  return /^\d{5}$/.test(String(zip || '')) ? locateZip(String(zip)) : Promise.resolve(null);
}

var compCache = {};
function loadCompetition(miles, specOverride) {
  var spec = specOverride || mySpecialty();
  var key = miles + '|' + spec.label;
  if (compCache[key]) return Promise.resolve(compCache[key]);
  var locP = S.locations ? Promise.resolve() : loadLocations();
  return locP.then(myCenter).then(function (c) {
    if (!c) return null;
    var dLat = miles / 69, dLng = miles / (69 * Math.max(0.2, Math.cos(c.lat * Math.PI / 180)));
    var box = 'latitude=gte.' + (c.lat - dLat).toFixed(5) + '&latitude=lte.' + (c.lat + dLat).toFixed(5) +
              '&longitude=gte.' + (c.lng - dLng).toFixed(5) + '&longitude=lte.' + (c.lng + dLng).toFixed(5);
    return Promise.all([providerRowsQuery(box + taxonomyPrefilter(spec.terms)), loadRegistered()]).then(function (res) {
      var mine = String((S.profile || {}).npi || '');
      var byNpi = {};
      res[0].forEach(function (r) {
        if (!r.npi || String(r.npi) === mine || !r.latitude || !taxMatches(r.primary_taxonomy, spec.terms)) return;
        var d = milesBetween(c.lat, c.lng, +r.latitude, +r.longitude);
        if (d > miles) return;
        var cur = byNpi[r.npi];
        if (cur && cur.miles <= d) return;
        var reg = r._src !== 'secondary' ? res[1][String(r.npi)] : null;
        byNpi[r.npi] = { npi: String(r.npi), name: titleCase(reg && reg.name || r.name), specialty: r.primary_taxonomy,
          lat: +r.latitude, lng: +r.longitude, miles: d, registered: !!reg,
          accepting: reg ? reg.accepting_new_patients : undefined, telehealth: reg ? reg.telehealth : undefined };
      });
      var list = Object.keys(byNpi).map(function (k) { return byNpi[k]; }).sort(function (a, b) { return a.miles - b.miles; });
      var out = { center: c, miles: miles, spec: spec, list: list, truncated: !!res[0].truncated };
      compCache[key] = out;
      return out;
    });
  });
}

function drawCompMap(el, c, opts) {
  loadLeaflet().then(function (ok) {
    if (!ok || !el.isConnected) return;
    var map = baseMap(el, opts || {});
    L.circle([c.center.lat, c.center.lng], { radius: c.miles * 1609.34, color: '#4f46e5', weight: 1.5, dashArray: '6 6', fillOpacity: 0.03, interactive: false }).addTo(map);
    c.list.forEach(function (x) {
      L.circleMarker([x.lat, x.lng], { radius: x.registered ? 7 : 5, color: '#fff', weight: 2, fillColor: x.registered ? '#0d9488' : '#2563eb', fillOpacity: 0.9 })
        .bindTooltip(x.name + ' · ' + x.miles.toFixed(1) + ' mi').addTo(map);
    });
    youMarker(c.center.lat, c.center.lng).bindTooltip('You').addTo(map);
    var dLat = c.miles / 69, dLng = c.miles / (69 * Math.cos(c.center.lat * Math.PI / 180));
    map.fitBounds([[c.center.lat - dLat, c.center.lng - dLng], [c.center.lat + dLat, c.center.lng + dLng]], { padding: [10, 10] });
  });
}

VIEWS.competition = function () {
  var miles = S.compMiles || 10;
  var spec = S.compSpec || mySpecialty();
  var body = h('div', {}, h('div', { class: 'card' }, h('p', { class: 'muted pad' }, 'Loading your competition…')));
  var fMiles = h('select', { 'aria-label': 'Distance', onchange: function () { S.compMiles = +this.value; render(); } },
    [5, 10, 25].map(function (m) { return h('option', { value: String(m), selected: m === miles }, 'Within ' + m + ' mi'); }));
  var specOpts = SPECIALTIES.map(function (s) { return h('option', { value: s[0], selected: s[0] === spec.label }, s[0]); });
  if (!SPECIALTIES.some(function (s) { return s[0] === spec.label; })) specOpts.unshift(h('option', { value: spec.label, selected: true }, spec.label));
  var fSpec = h('select', { 'aria-label': 'Specialty', onchange: function () {
    var s = null;
    for (var i = 0; i < SPECIALTIES.length; i++) if (SPECIALTIES[i][0] === this.value) s = SPECIALTIES[i];
    S.compSpec = s ? { label: s[0], terms: s[1].split(',') } : mySpecialty();
    render();
  } }, specOpts);

  var view = h('section', { class: 'view' },
    pageHead('Competition', 'Same-specialty providers near you, as patients see them in search.', h('div', { class: 'inline' }, fSpec, fMiles)),
    body);

  Promise.all([loadCompetition(miles, spec), S.demand ? null : loadDemand()]).then(function (res) {
    var c = res[0];
    clear(body);
    if (!c) { body.appendChild(h('div', { class: 'card' }, h('p', { class: 'muted pad' }, 'Add a location or a practice ZIP in My listing to see your competition.'))); return; }
    var ver = c.list.filter(function (x) { return x.registered; });
    var acc = ver.filter(function (x) { return x.accepting === true; });
    var near = c.list[0];
    // Demand for THIS specialty in your ZIP, when it clears the privacy threshold.
    var d = S.demand || {}, dem = null;
    (d.groups || []).forEach(function (g) {
      if (!g.suppressed && (taxMatches(g.taxonomy, c.spec.terms) || String(g.taxonomy).toLowerCase() === c.spec.label.toLowerCase())) dem = (dem || 0) + g.count;
    });
    body.appendChild(h('div', { class: 'stats' },
      stat(String(c.list.length), 'Same-specialty providers', 'Within ' + c.miles + ' mi', '#/competition'),
      stat(String(ver.length), 'Verified on ProviderPulse', ver.length ? acc.length + ' accepting new patients' : 'You can stand out', '#/competition', ver.length ? '' : 'hot'),
      stat(near ? near.miles.toFixed(1) + ' mi' : '—', 'Nearest competitor', near ? near.name : 'None in range', '#/competition'),
      stat(dem == null ? '—' : dem.toLocaleString(), 'Patient searches', dem == null ? 'Too few to show yet' : 'For this specialty in ' + d.zip, '#/competition')));
    if (c.truncated) body.appendChild(h('div', { class: 'banner warn' }, 'This area has more listings than we can load at once, so counts are a floor. Try a shorter distance.'));
    var mapEl = h('div', { class: 'minimap tall' });
    var rows = h('div', { class: 'comp-list' });
    c.list.slice(0, 60).forEach(function (x) {
      rows.appendChild(h('div', { class: 'crow' },
        h('div', { class: 'av sm', style: '--h:' + hueFor(x.npi) }, initials(x.name)),
        h('div', { class: 'cmain' }, h('b', {}, x.name), h('div', { class: 'muted small' }, x.specialty)),
        h('div', { class: 'cbadges' },
          x.registered ? h('span', { class: 'chip ok' }, '✓ Verified') : null,
          x.accepting === true ? h('span', { class: 'chip' }, 'Accepting') : null),
        h('span', { class: 'cdist' }, x.miles.toFixed(1) + ' mi')));
    });
    if (c.list.length > 60) rows.appendChild(h('p', { class: 'muted small pad' }, '+ ' + (c.list.length - 60) + ' more farther out'));
    if (!c.list.length) rows.appendChild(h('p', { class: 'muted pad' }, 'No other ' + c.spec.label.toLowerCase() + ' providers within ' + c.miles + ' miles.'));
    body.appendChild(h('div', { class: 'split even' },
      h('div', { class: 'card flush' }, h('div', { class: 'card-h pad' }, h('h2', {}, 'Nearest first')), rows),
      h('div', { class: 'card flush' }, mapEl,
        h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'lg you' }), 'You'), h('span', {}, h('i', { class: 'lg ver' }), 'Verified'), h('span', {}, h('i', { class: 'lg oth' }), 'Other listings')))));
    drawCompMap(mapEl, c, {});
  });
  return view;
};

/* ---------- boot ---------------------------------------------------------- */
$('signOut').addEventListener('click', function () {
  var t = session && session.access_token;
  (t ? fetch(FN + '/auth-logout', { method: 'POST', headers: { Authorization: 'Bearer ' + t } }).catch(function () {}) : Promise.resolve())
    .then(function () {
      try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) {}
      location.replace('/signin');
    });
});
window.addEventListener('hashchange', render);

if (!session || !session.access_token) { toSignIn(); return; }
$('pmain').appendChild(h('div', { class: 'view' }, h('p', { class: 'muted' }, 'Loading your portal…')));
loadProfile().then(function () {
  if (S.noListing) return render();
  return Promise.all([loadAppointments(), loadLocations(), loadDemand()]).then(render);
}).catch(function (e) {
  clear($('pmain'));
  $('pmain').appendChild(h('div', { class: 'view' }, h('div', { class: 'card' }, h('p', { class: 'pad' }, 'Could not load your portal: ' + e.message))));
});
// New requests arrive while the portal is open: refresh the count every 2 min.
setInterval(function () {
  if (document.hidden || S.noListing) return;
  var before = newRequests().length;
  loadAppointments().then(function () {
    if (newRequests().length === before) return;
    // Never rebuild a page with a form on it: that would drop unsaved edits.
    var r = route();
    if (r === 'overview' || r === 'appointments') render(); else paintNav(r);
  });
}, 120000);

})();
