/* ============================================================================
   dashboard-v3.js — the market dashboard's insight layer (index.html, served
   at /dashboard, the provider portal's Market tab).

   Loaded after index.html's main script and built on its globals (map,
   taxonomies, selectedTaxonomies, groupedData, zipDemographics, renderMap,
   switchTab, buildVgroups, applyNavigatorTaxonomyFilter, authHeaders ...).
   It adds, rather than rewrites:

     - Two modes. "My market" (providers): opens on the provider's own ZIP and
       specialty and reads every finding against them. "Explore" (providers
       and STAFF_EMAILS accounts, for client demos): any area, any specialty.
     - An Insights tab that leads the panel: the opportunity score, plain-
       English findings, the per-specialty breakdown and, in My market, where
       the provider stands. The raw charts stay in the other tabs.
     - A readable map: a legend for the 6 specialty-group colours, a specialty
       picker instead of hundreds of raw taxonomy codes (which remain under
       "Exact taxonomies"), filters that collapse off the map, zoom controls
       that no longer sit on top of the filter panel.

   Values from the API are placed with textContent, never innerHTML.
   ============================================================================ */
(function () {
'use strict';

function el(tag, attrs) {
  var n = document.createElement(tag), k, v;
  attrs = attrs || {};
  for (k in attrs) {
    v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  (function add(list) {
    list.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) return add(c);
      n.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    });
  })(Array.prototype.slice.call(arguments, 2));
  return n;
}
function $(id) { return document.getElementById(id); }

// Same word-boundary rule as everywhere else in the product.
function taxNorm(s) { return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
function taxMatches(stored, terms) {
  var nt = ' ' + taxNorm(stored);
  for (var i = 0; i < terms.length; i++) if (nt.indexOf(' ' + taxNorm(terms[i])) !== -1) return true;
  return false;
}
function fmtN(n) { return n == null ? '—' : Number(n).toLocaleString(); }

/* ---------- session + mode ------------------------------------------------ */
var session = null;
try { session = JSON.parse(sessionStorage.getItem('pp.session.v1') || localStorage.getItem('pp.session.v1') || 'null'); } catch (e) {}
var isProviderAcct = !!(session && session.role === 'provider');
var MODE_KEY = 'pp.dash.mode';
var mode = 'explore';
try { mode = isProviderAcct ? (localStorage.getItem(MODE_KEY) || 'mine') : 'explore'; } catch (e) { mode = isProviderAcct ? 'mine' : 'explore'; }
var profile = null;           // provider_profiles row, My market only
var mySpec = null;            // {label, terms}

function specFor(desc) {
  desc = String(desc || '').trim();
  if (!desc) return null;
  var head = desc.split(',')[0].trim(), tail = (desc.split(',')[1] || '').trim();
  var probes = [desc, head, tail ? tail + ' ' + head : ''].filter(Boolean);
  for (var i = 0; i < SPECIALTIES.length; i++) {
    var terms = SPECIALTIES[i][1].split(',');
    for (var j = 0; j < probes.length; j++) if (taxMatches(probes[j], terms)) return { label: SPECIALTIES[i][0], terms: terms };
  }
  return { label: desc, terms: [head] };
}

/* ---------- 1. top bar: mode switch --------------------------------------- */
(function modeSwitch() {
  var bar = $('topbar-v2');
  if (!bar) return;
  var nav = $('surface-switch');
  var sw = el('div', { id: 'mode-switch', role: 'tablist', 'aria-label': 'Dashboard mode' });
  function btn(key, label, title) {
    return el('button', { type: 'button', role: 'tab', class: mode === key ? 'on' : '', 'aria-selected': mode === key ? 'true' : 'false', title: title,
      onclick: function () {
        if (mode === key) return;
        try { localStorage.setItem(MODE_KEY, key); } catch (e) {}
        // A clean reload is the honest way to switch: every panel, filter and
        // layer is rebuilt for the new question instead of half-carried over.
        location.href = '/dashboard';
      } }, label);
  }
  if (isProviderAcct) sw.appendChild(btn('mine', 'My market', 'Your ZIP and specialty, read against you'));
  sw.appendChild(btn('explore', 'Explore', 'Any area, any specialty'));
  if (nav && nav.parentNode) nav.parentNode.insertBefore(sw, nav.nextSibling);
  // Staff demo accounts have no portal to go back to.
  if (!isProviderAcct && nav) nav.style.display = 'none';
})();

/* ---------- 2. filters: collapsible, specialty-first ----------------------- */
(function filters() {
  var rail = $('filter-rail'), mapBox = $('map-container');
  if (!rail || !mapBox) return;
  var iconRail = $('icon-rail');
  if (iconRail) iconRail.style.display = 'none';     // its three buttons duplicate the tabs
  rail.classList.remove('open');

  var toggle = el('button', { type: 'button', id: 'filters-toggle', 'aria-expanded': 'false', onclick: function () {
    var open = rail.classList.toggle('open');
    document.body.classList.toggle('filters-open', open);    // the map key moves aside
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.classList.toggle('on', open);
    setTimeout(function () { if (typeof map !== 'undefined') map.invalidateSize(); }, 250);
  } }, el('span', { 'aria-hidden': 'true' }, '⚙'), ' Filters', el('span', { id: 'filters-count', class: 'fcount', hidden: 'hidden' }));
  mapBox.appendChild(toggle);
  // `map` is a script-level `let` in index.html, so it is not on window.
  if (typeof map !== 'undefined' && map.zoomControl) map.zoomControl.setPosition('bottomright');

  // Specialty picker: 33 plain-language specialties instead of hundreds of
  // NPPES codes. It drives the same selectedTaxonomies the raw list does.
  var sel = el('select', { id: 'specialty-select', 'aria-label': 'Specialty' },
    el('option', { value: '' }, 'All specialties'),
    SPECIALTIES.map(function (s) { return el('option', { value: s[0] }, s[0]); }));
  sel.addEventListener('change', function () { applySpecialty(sel.value); });
  var group = el('div', { class: 'filter-group', id: 'specialty-group' },
    el('label', { class: 'group-label', for: 'specialty-select' }, 'Specialty'), sel,
    el('p', { class: 'fhint' }, 'Groups the federal taxonomy codes the way patients search. Exact codes are under "Exact taxonomies".'));
  var h3 = rail.querySelector('h3');
  rail.insertBefore(group, h3 ? h3.nextSibling : rail.firstChild);

  // Rename the raw list and demote the duplicate search box.
  rail.querySelectorAll('.group-label').forEach(function (l) {
    if (/filter taxonomy/i.test(l.textContent)) l.textContent = 'Exact taxonomies (advanced)';
    if (/database search/i.test(l.textContent)) l.parentNode.classList.add('v3-hidden');
  });
  // The load status ("Loaded 216 clinics") becomes a small notice at the top of
  // the map: visible where the result appears, without crowding the top bar.
  var status = $('dbStatus');
  if (status) { status.classList.add('omni-status'); mapBox.appendChild(status); }
})();

function applySpecialty(label) {
  var sel = $('specialty-select');
  if (sel && sel.value !== label) sel.value = label;
  var count = $('filters-count');
  if (count) { count.hidden = !label; count.textContent = label ? '1' : ''; }
  if (typeof taxonomies === 'undefined' || !taxonomies.size) return;     // nothing loaded yet
  if (!label) {
    selectedTaxonomies = new Set(taxonomies);
    document.querySelectorAll('.tax-chk').forEach(function (c) { c.checked = true; });
    var all = $('chk-all'); if (all) all.checked = true;
    if (typeof updateDropdownLabel === 'function') updateDropdownLabel();
    if (typeof updateLegend === 'function') updateLegend();
    renderMap();
    var st = $('dbStatus');
    if (st) st.textContent = '✅ Showing all ' + visibleCount().toLocaleString() + ' providers in this area';
    return;
  }
  var s = null;
  for (var i = 0; i < SPECIALTIES.length; i++) if (SPECIALTIES[i][0] === label) s = SPECIALTIES[i];
  var terms = s ? s[1].split(',') : [label];
  applyNavigatorTaxonomyFilter(terms);
  paintInsights();
}

/* ---------- 3. legend ----------------------------------------------------- */
(function legend() {
  var mapBox = $('map-container');
  if (!mapBox || !window.TaxonomyGroups) return;
  var body = el('div', { class: 'lg-body' },
    TaxonomyGroups.list.map(function (g) {
      return el('div', { class: 'lg-row' }, el('i', { class: 'lg-dot', style: 'background:' + g.color }), g.name);
    }),
    el('div', { class: 'lg-sep' }),
    el('div', { class: 'lg-row' }, el('i', { class: 'lg-cluster' }, '12'), 'Cluster: number of providers, zoom in to split'),
    el('div', { class: 'lg-row' }, el('i', { class: 'lg-dot ring' }), 'Verified on ProviderPulse'),
    el('div', { class: 'lg-row' }, el('i', { class: 'lg-line zip' }), 'ZIP boundary'),
    el('div', { class: 'lg-row' }, el('i', { class: 'lg-line county' }), 'County line'));
  var box = el('div', { id: 'map-legend', class: 'open' },
    el('button', { type: 'button', class: 'lg-head', 'aria-expanded': 'true', onclick: function () {
      var open = box.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    } }, 'Map key', el('span', { class: 'lg-caret', 'aria-hidden': 'true' }, '▾')),
    body);
  mapBox.appendChild(box);
})();

/* ---------- 4. welcome ---------------------------------------------------- */
(function welcome() {
  var w = $('welcome-overlay');
  if (!w) return;
  while (w.firstChild) w.removeChild(w.firstChild);
  if (mode === 'mine') {
    w.appendChild(el('h1', {}, 'Loading your market…'));
    w.appendChild(el('p', {}, 'Your ZIP, your specialty, and how the area around you is served.'));
    return;
  }
  w.appendChild(el('h1', {}, 'Explore any market in the country'));
  w.appendChild(el('p', {}, 'Search a ZIP, city or state. You get every provider on the map, an opportunity score, and the demographics, health and Medicare data behind it.'));
  var ex = el('div', { class: 'examples' });
  ['Collierville, TN', 'Austin, TX', '10001', 'Boise, ID'].forEach(function (q) {
    ex.appendChild(el('button', { type: 'button', onclick: function () {
      var i = $('addressInput'); if (i) i.value = q;
      if (typeof omniSearch === 'function') omniSearch(q);
    } }, q));
  });
  w.appendChild(ex);
})();

/* ---------- 5. insights tab ------------------------------------------------ */
var insightsPanel = null, lastScore = null, lastZip = null, anchorNote = '';
(function insightsTab() {
  var bar = $('tab-bar-v2'), side = $('sidebar'), dash = $('dashboard-panel');
  if (!bar || !side || !dash) return;
  bar.insertBefore(el('button', { class: 'tab-btn-v2', 'data-tab': 'insights', type: 'button', onclick: function () { switchTab('insights'); } }, 'Insights'), bar.firstChild);
  insightsPanel = el('div', { id: 'insights-panel' });
  dash.parentNode.insertBefore(insightsPanel, dash);
  var old = $('verdict-card');
  if (old) old.classList.add('v3-hidden');              // superseded by the Insights tab

  var base = window.switchTab;
  window.switchTab = function (tab) {
    insightsPanel.style.display = tab === 'insights' ? 'block' : 'none';
    if (tab === 'insights') {
      ['dashboard-panel', 'health-panel', 'procedures-panel', 'reports-panel', 'ai-panel'].forEach(function (id) { var p = $(id); if (p) p.style.display = 'none'; });
      document.querySelectorAll('.tab-btn-v2').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === 'insights'); });
      return;
    }
    base(tab);
  };
  var select = $('dashboard-select');
  if (select) select.insertBefore(el('option', { value: 'insights' }, '✦ Insights'), select.firstChild);
  switchTab('insights');
  paintInsights();
})();

// renderDashboard() calls renderVerdict(zip) whenever the panel's area
// changes. For a single ZIP that is the ZIP; for a city or county it is not a
// real ZIP at all, so anchor the score on the most populous ZIP loaded and
// say so, rather than showing no verdict (which is what happened before).
window.renderVerdict = function (zip) {
  zip = String(zip || '');
  anchorNote = '';
  var demo = (typeof zipDemographics !== 'undefined' && zipDemographics) || {};
  var have = function (z) { return demo[z] || demo[String(parseInt(z, 10))]; };
  if (!/^\d{5}$/.test(zip) || zip === '00000' || !have(zip)) {
    var best = null, bestPop = -1;
    Object.keys(demo).forEach(function (z) {
      var pop = Number((demo[z] || {})['Total Population']) || 0;
      if (pop > bestPop) { bestPop = pop; best = String(z).padStart(5, '0'); }
    });
    if (!best) { lastScore = null; lastZip = null; paintInsights(); return; }
    anchorNote = 'Scored on ' + best + ', the most populous ZIP in this area. Click any ZIP on the map to score it instead.';
    zip = best;
  }
  if (zip === lastZip && lastScore) { paintInsights(); return; }
  lastZip = zip; lastScore = 'loading';
  paintInsights();
  fetch('/.netlify/functions/market-score?zip=' + encodeURIComponent(zip))
    .then(function (r) { return r.json(); })
    .then(function (d) { if (lastZip === zip) { lastScore = d; paintInsights(); } })
    .catch(function () { if (lastZip === zip) { lastScore = { available: false, reason: 'Scoring is unavailable right now' }; paintInsights(); } });
};

function visibleCount() { return (typeof currentlyVisiblePractices !== 'undefined' && currentlyVisiblePractices) ? currentlyVisiblePractices.length : 0; }

// Providers loaded in the area whose group matches, for "where you stand".
function competitors(groupKey) {
  var out = { total: 0, verified: 0 };
  if (typeof groupedData === 'undefined') return out;
  var seen = {};
  Object.keys(groupedData).forEach(function (k) {
    (groupedData[k].practices || []).forEach(function (p) {
      var npi = String(p['NPI'] || '');
      if (!npi || seen[npi] || (profile && npi === String(profile.npi))) return;
      if (TaxonomyGroups.keyFor(p['Primary Taxonomy']) !== groupKey) return;
      seen[npi] = true; out.total++;
      if (typeof registeredProviders !== 'undefined' && registeredProviders[npi] && p._src !== 'secondary') out.verified++;
    });
  });
  return out;
}

function tone(v) { return v === 'good' ? 'good' : v === 'bad' ? 'bad' : 'neutral'; }

function paintInsights() {
  var p = insightsPanel;
  if (!p) return;
  while (p.firstChild) p.removeChild(p.firstChild);
  var d = lastScore;

  if (!d) {
    p.appendChild(el('div', { class: 'ins-empty' },
      el('h3', {}, mode === 'mine' ? 'Loading your market' : 'Pick a market to analyze'),
      el('p', {}, mode === 'mine' ? 'We are opening your practice ZIP.' : 'Search a ZIP, city or state above. Insights appear here: an opportunity score, what it means, and which specialties are underserved.')));
    return;
  }
  if (d === 'loading') {
    p.appendChild(el('div', { class: 'ins-empty' }, el('span', { class: 'ins-spin' }), ' Scoring ' + lastZip + '…'));
    return;
  }
  if (!d.available) {
    p.appendChild(el('div', { class: 'ins-empty' }, el('h3', {}, 'No score for ' + lastZip), el('p', {}, d.reason || 'Not enough data for this ZIP.')));
    return;
  }

  var m = d.metrics || {};
  var cls = d.score >= 70 ? 'under' : d.score >= 50 ? 'balanced' : 'served';
  var meaning = cls === 'under' ? 'Fewer providers than the population and shortage data suggest it needs. A strong place to open or expand.'
    : cls === 'balanced' ? 'Supply roughly matches need. Growth depends on standing out: insurance, availability, specialty focus.'
    : 'Already well supplied. Expect competition; look at the specialty breakdown for gaps.';

  // Score card
  p.appendChild(el('div', { class: 'ins-score ' + cls },
    el('div', { class: 'ins-ring', style: '--p:' + Math.max(0, Math.min(100, d.score)) },
      el('b', {}, String(d.score)), el('span', {}, 'of 100')),
    el('div', { class: 'ins-verdict' },
      el('div', { class: 'ins-eyebrow' }, 'Opportunity · ZIP ' + d.zip + (d.state ? ', ' + d.state : '')),
      el('h3', {}, titleWord(d.label)),
      el('p', {}, meaning))));
  if (anchorNote) p.appendChild(el('p', { class: 'ins-note' }, anchorNote));

  // Where you stand (My market)
  if (mode === 'mine' && profile) {
    var gk = TaxonomyGroups.keyFor(profile.taxonomy_desc);
    var g = d.groups && d.groups[gk];
    var comp = competitors(gk);
    var you = el('div', { class: 'ins-card you' },
      el('div', { class: 'ins-eyebrow' }, 'Where you stand · ' + (TaxonomyGroups.get(gk) || {}).name));
    if (g && g.available) {
      you.appendChild(el('div', { class: 'ins-big' }, el('span', { class: 'chip ' + (g.score >= 70 ? 'under' : g.score >= 50 ? 'balanced' : 'served') }, titleWord(g.label) + ' · ' + g.score)));
      you.appendChild(el('p', {}, fmtN(g.clinicians) + ' ' + (TaxonomyGroups.get(gk) || {}).name.toLowerCase() + ' providers within ' +
        ((d.catchment && d.catchment.radius_miles) || 25) + ' miles serve about ' + fmtN(d.catchment && d.catchment.adults_18plus) + ' adults' +
        (g.per_1k_adults != null && g.national_per_1k_adults != null
          ? ' (' + g.per_1k_adults.toFixed(2) + ' per 1,000 vs ' + Number(g.national_per_1k_adults).toFixed(2) + ' nationally).' : '.')));
    } else if (g) {
      you.appendChild(el('p', {}, g.reason || 'No specialty breakdown for this area.'));
    }
    you.appendChild(el('p', {}, 'On the map right now: ', el('b', {}, fmtN(comp.total)), ' others in your group, ',
      el('b', {}, fmtN(comp.verified)), ' verified on ProviderPulse.' + (comp.total && !comp.verified ? ' Being verified with insurance and hours listed sets you apart.' : '')));
    you.appendChild(el('div', { class: 'ins-actions' },
      el('a', { class: 'ins-btn', href: '/portal#/competition' }, 'See competitors'),
      el('a', { class: 'ins-btn', href: '/portal#/listing' }, 'Improve your listing')));
    p.appendChild(you);
  }

  // Findings in plain English
  var F = [];
  if (m.providers_per_1k != null && m.benchmark_per_1k) {
    var r = m.providers_per_1k / m.benchmark_per_1k;
    F.push([r < 0.9 ? 'good' : r > 1.1 ? 'bad' : 'neutral', 'Provider supply',
      m.providers_per_1k.toFixed(1) + ' listings per 1,000 residents, ' +
      (r < 0.9 ? Math.round((1 - r) * 100) + '% below' : r > 1.1 ? Math.round((r - 1) * 100) + '% above' : 'in line with') +
      ' the national ' + m.benchmark_per_1k + '. ' + fmtN(m.organizations) + ' organizations and ' + fmtN(m.individual_physicians) + ' individual clinicians.']);
  }
  if (m.insured_rate != null && m.state_insured_rate != null) {
    var dpts = (m.insured_rate - m.state_insured_rate) * 100;
    F.push([dpts > 1 ? 'good' : dpts < -1 ? 'bad' : 'neutral', 'Payer mix',
      (m.insured_rate * 100).toFixed(1) + '% insured, ' + (dpts >= 0 ? '+' : '') + dpts.toFixed(1) + ' points vs the ' + d.state + ' median. ' +
      fmtN((m.population || 0) - (m.insured_population || 0)) + ' residents uninsured.']);
  }
  if (m.hpsa_score != null) {
    F.push([m.hpsa_score >= 14 ? 'good' : 'neutral', 'Federal shortage designation',
      'State median HPSA score ' + Math.round(m.hpsa_score) + ' of ~25 (higher means a more severe designated shortage, which can bring bonus Medicare payments and loan repayment).']);
  }
  if (d.medicare && d.medicare.available) {
    F.push(['neutral', 'Medicare',
      fmtN(d.medicare.total_beneficiaries) + ' beneficiaries ' + (d.medicare.level === 'zip' ? 'in this ZIP' : 'statewide') + ', ' +
      d.medicare.medicare_advantage_pct + '% on Medicare Advantage (' + d.medicare.as_of + '). A high MA share means network contracts matter.']);
  }
  var groups = d.groups && d.groups.available !== false ? d.groups : null;
  if (groups) {
    var ranked = Object.keys(groups).filter(function (k) { return groups[k] && groups[k].available; })
      .sort(function (a, b) { return groups[b].score - groups[a].score; });
    var unserved = Object.keys(groups).filter(function (k) { return groups[k] && groups[k].verdict === 'unserved'; });
    if (ranked.length) {
      var top = ranked[0];
      F.push([groups[top].score >= 70 ? 'good' : 'neutral', 'Biggest opening',
        (TaxonomyGroups.get(top) || { name: top }).name + ' scores ' + groups[top].score + ' (' + titleWord(groups[top].label).toLowerCase() + ') within ' +
        ((d.catchment && d.catchment.radius_miles) || 25) + ' miles' +
        (ranked.length > 1 ? '; next is ' + (TaxonomyGroups.get(ranked[1]) || { name: ranked[1] }).name + ' at ' + groups[ranked[1]].score : '') + '.']);
    }
    if (unserved.length) {
      F.push(['good', 'No providers at all', unserved.map(function (k) { return (TaxonomyGroups.get(k) || { name: k }).name; }).join(', ') +
        ' has no listings within ' + ((d.catchment && d.catchment.radius_miles) || 25) + ' miles.']);
    }
  }
  p.appendChild(el('div', { class: 'ins-card' },
    el('div', { class: 'ins-eyebrow' }, 'What stands out'),
    el('ul', { class: 'ins-findings' }, F.map(function (f) {
      return el('li', { class: tone(f[0]) }, el('i', { 'aria-hidden': 'true' }), el('div', {}, el('b', {}, f[1]), el('p', {}, f[2])));
    }))));

  // Per-specialty breakdown (existing builder in index.html)
  if (typeof buildVgroups === 'function' && d.groups) {
    var vg = buildVgroups(d.groups, d.catchment, d.zip);
    if (vg) p.appendChild(el('div', { class: 'ins-card' }, el('div', { class: 'ins-eyebrow' }, 'Opportunity by specialty group'), vg));
  }

  p.appendChild(el('div', { class: 'ins-card' },
    el('div', { class: 'ins-eyebrow' }, 'Go deeper'),
    el('div', { class: 'ins-actions' },
      el('button', { type: 'button', class: 'ins-btn primary', onclick: function () { switchTab('ai'); } }, '✦ Ask AI about this market'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('reports'); } }, 'Generate a report'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('demographics'); } }, 'Demographics'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('health'); } }, 'Health data')),
    el('p', { class: 'ins-src' }, visibleCount() ? fmtN(visibleCount()) + ' providers visible on the map. ' : '', 'Sources: ', (d.sources || []).join(' · '))));
}

function titleWord(s) { return String(s || '').toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }

/* ---------- 6. My market: open on the provider's own area ------------------ */
if (mode === 'mine') {
  fetch('/.netlify/functions/profile', { headers: authHeadersSync() })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      profile = d && d.role === 'provider' ? d.profile : null;
      if (!profile) return;
      mySpec = specFor(profile.taxonomy_desc);
      paintInsights();
      var zip = String(profile.zip || '');
      if (!location.hash && /^\d{5}$/.test(zip)) {
        var i = $('addressInput'); if (i) i.value = zip;
        location.hash = '#zip=' + zip + (mySpec ? '&tax=' + encodeURIComponent(mySpec.terms.join(',')) : '');
      }
      var sel = $('specialty-select');
      if (sel && mySpec && Array.prototype.some.call(sel.options, function (o) { return o.value === mySpec.label; })) {
        sel.value = mySpec.label;
        var c = $('filters-count'); if (c) { c.hidden = false; c.textContent = '1'; }
      }
    })
    .catch(function () {});
}

function authHeadersSync() {
  return session && session.access_token ? { Authorization: 'Bearer ' + session.access_token } : {};
}

})();
