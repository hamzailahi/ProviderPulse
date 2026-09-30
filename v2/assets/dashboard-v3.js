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
  focusSpec = label || null;       // the Insights headline follows the filter
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
  var q = '?zip=' + encodeURIComponent(zip) +
    (profile && /^\d{10}$/.test(String(profile.npi || '')) ? '&npi=' + profile.npi : '') +
    (mySpec ? '&specialty=' + encodeURIComponent(mySpec.label) : '');
  focusSpec = null; showAllSpecs = false;
  fetch('/.netlify/functions/market-score' + q)
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

  var M = d.model && d.model.specialties && d.model.specialties.length ? d.model : null;
  if (M) paintModel(p, d, M);
  // Legacy all-specialty card, when the model is unavailable
  else p.appendChild(el('div', { class: 'ins-score ' + cls },
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
  if (M) {
    F.push([cls === 'under' ? 'good' : 'neutral', 'Whole-area score',
      'All specialties together score ' + d.score + ' (' + titleWord(d.label).toLowerCase() + ') for ZIP ' + d.zip + '. ' + meaning]);
  }
  if (m.providers_per_1k != null && m.benchmark_per_1k) {
    var r = m.providers_per_1k / m.benchmark_per_1k;
    var scope = 'the ' + (m.benchmark_state || 'state') + ' average';
    F.push([r < 0.9 ? 'good' : r > 1.1 ? 'bad' : 'neutral', 'Provider supply',
      m.providers_per_1k.toFixed(1) + ' listings per 1,000 residents, ' +
      (r < 0.9 ? Math.round((1 - r) * 100) + '% below' : r > 1.1 ? Math.round((r - 1) * 100) + '% above' : 'in line with') +
      ' ' + scope + ' of ' + m.benchmark_per_1k + '. ' + fmtN(m.organizations) + ' organizations and ' + fmtN(m.individual_physicians) + ' individual clinicians.']);
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
  if (m.providers_per_1k != null && !m.benchmark_per_1k) {
    F.push(['neutral', 'Provider supply',
      m.providers_per_1k.toFixed(1) + ' listings per 1,000 residents. ' + fmtN(m.organizations) + ' organizations and ' + fmtN(m.individual_physicians) +
      ' individual clinicians. Not compared: the ' + (d.state || 'state') + ' benchmark has not been built yet, so this area\'s score rests on payer mix and shortage only.']);
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
      el('button', { type: 'button', class: 'ins-btn primary', onclick: function () {
        switchTab('ai');
        if (window.PPAssistant) window.PPAssistant.ask('Walk me through this market: what drives the score, and what would you do here?');
      } }, '✦ Ask AI about this market'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('reports'); } }, 'Generate a report'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('demographics'); } }, 'Demographics'),
      el('button', { type: 'button', class: 'ins-btn', onclick: function () { switchTab('health'); } }, 'Health data')),
    el('p', { class: 'ins-src' }, visibleCount() ? fmtN(visibleCount()) + ' providers visible on the map. ' : '', 'Sources: ', (d.sources || []).join(' · '))));
}

/* ---------- 5b. Market model: archetype, factors, ranked specialties ------ */
var focusSpec = null, showAllSpecs = false;
var ARCH_TONE = { prime: 'good', unserved: 'good', safety_net: 'warm', latent: 'warm', balanced: 'neutral',
  crowded_premium: 'cool', saturated: 'bad', insufficient: 'muted' };
var FACTORS = [
  ['need', 'Health need', 'How common the conditions this specialty treats are here, vs US ZIPs'],
  ['access', 'Access gap', 'Higher when there are fewer clinicians per adult than nationally'],
  ['pay', 'Ability to pay', 'Insured rate and household income, ranked within the state'],
  ['shortage', 'Federal shortage', 'HRSA shortage-area score for the matching discipline'],
  ['competition', 'Room from competitors', 'Higher when the nearest same-specialty listing is far away']
];
function ordinal(v) {
  var n = Math.round(v), t = n % 100, u = n % 10;
  return n + (t >= 11 && t <= 13 ? 'th' : u === 1 ? 'st' : u === 2 ? 'nd' : u === 3 ? 'rd' : 'th');
}
function evidenceLine(k, e) {
  if (!e) return 'No data for this area';
  if (k === 'need') {
    return (e.parts || []).slice().sort(function (a, b) { return b.percentile - a.percentile; }).slice(0, 3)
      .map(function (x) { return (x.inverted ? 'low ' : '') + (x.label || x.measure) + ' ' + ordinal(x.percentile); }).join(' · ');
  }
  if (k === 'access' && !e.clinicians) return 'None within the catchment' + (e.national_per_1k ? ' (' + e.national_per_1k + ' per 1,000 nationally)' : '');
  if (k === 'access') return fmtN(e.clinicians) + ' within the catchment' + (e.per_1k != null ? ', ' + e.per_1k + ' per 1,000 adults' : '') +
    (e.national_per_1k ? ' vs ' + e.national_per_1k + ' nationally' : ' (compared at group level)');
  if (k === 'pay') return 'Insured ' + ordinal(e.insured_pct) + (e.income_pct != null ? ' · $75k+ households ' + ordinal(e.income_pct) : '') + ' percentile in state';
  if (k === 'shortage') return 'HPSA ' + e.hpsa + ' of ~25, ' + e.discipline + ' care, ' + (e.basis === 'county' ? 'this county' : 'state median');
  if (k === 'competition') return e.nearest_miles == null ? 'None within the catchment' : 'Nearest ' + e.nearest_miles + ' mi away';
  return '';
}
function pickHeadline(M) {
  var by = {}; M.specialties.forEach(function (x) { by[x.specialty] = x; });
  var sel = $('specialty-select');
  var want = focusSpec || (mode === 'mine' && mySpec && mySpec.label) || (sel && sel.value) || null;
  if (want && by[want]) return by[want];
  return rankSpecs(M)[0];
}
function rankSpecs(M) {
  return M.specialties.slice().sort(function (a, b) {
    var ia = a.archetype === 'insufficient' || a.score == null, ib = b.archetype === 'insufficient' || b.score == null;
    return ia !== ib ? (ia ? 1 : -1) : (b.score || 0) - (a.score || 0);
  });
}

function paintModel(p, d, M) {
  var h = pickHeadline(M);
  var tn = ARCH_TONE[h.archetype] || 'neutral';
  var sw = el('select', { class: 'ins-spec', 'aria-label': 'Specialty to score' },
    rankSpecs(M).map(function (x) { return el('option', { value: x.specialty }, x.specialty); }));
  sw.value = h.specialty;
  sw.addEventListener('change', function () { focusSpec = sw.value; paintInsights(); });

  p.appendChild(el('div', { class: 'ins-model t-' + tn },
    el('div', { class: 'ins-eyebrow' }, 'Opportunity · ZIP ' + d.zip + (d.state ? ', ' + d.state : '')),
    sw,
    el('div', { class: 'ins-mtop' },
      el('div', { class: 'ins-ring', style: '--p:' + Math.max(0, Math.min(100, h.score || 0)) },
        el('b', {}, h.score == null ? '—' : String(h.score)), el('span', {}, 'of 100')),
      el('div', { class: 'ins-verdict' },
        el('h3', {}, h.archetype_name),
        el('span', { class: 'ins-conf c-' + h.confidence, title: 'How much of the model is backed by local data' },
          h.confidence.charAt(0).toUpperCase() + h.confidence.slice(1) + ' confidence'))),
    el('p', { class: 'ins-strategy' }, h.strategy),
    h.reasons.length ? el('ul', { class: 'ins-reasons' }, h.reasons.map(function (r) {
      return el('li', { class: r.direction === 'up' ? 'up' : 'down' }, el('i', { 'aria-hidden': 'true' }, r.direction === 'up' ? '▲' : '▼'), el('span', {}, r.text));
    })) : null));
  if (anchorNote) p.appendChild(el('p', { class: 'ins-note' }, anchorNote));

  // Factor breakdown: every input, its weight, and the evidence behind it
  var W = M.weights || {};
  p.appendChild(el('div', { class: 'ins-card' },
    el('div', { class: 'ins-eyebrow' }, 'How the score is built'),
    el('div', { class: 'ins-factors' }, FACTORS.map(function (f) {
      var v = h.factors[f[0]];
      var missing = v == null;
      return el('div', { class: 'ins-factor' + (missing ? ' missing' : ''), title: f[2] },
        el('div', { class: 'ins-fhead' },
          el('b', {}, f[1]),
          el('span', { class: 'ins-fw' }, Math.round((W[f[0]] || 0) * 100) + '% weight'),
          el('span', { class: 'ins-fv' }, missing ? 'n/a' : String(v))),
        el('div', { class: 'ins-bar' }, el('i', { style: 'width:' + (missing ? 0 : v) + '%' })),
        el('div', { class: 'ins-fev' }, evidenceLine(f[0], h.evidence[f[0]])));
    })),
    h.caveats.length ? el('details', { class: 'ins-caveats' },
      el('summary', {}, 'Data notes (' + h.caveats.length + ')'),
      el('ul', {}, h.caveats.map(function (c) { return el('li', {}, c); }))) : null));

  // Every specialty, ranked: the view to walk a prospect through
  var ranked = rankSpecs(M);
  var shown = showAllSpecs ? ranked : ranked.slice(0, 8);
  p.appendChild(el('div', { class: 'ins-card' },
    el('div', { class: 'ins-eyebrow' }, 'Opportunities by specialty · within ' + ((d.catchment && d.catchment.radius_miles) || 25) + ' miles'),
    el('ol', { class: 'ins-rank' }, shown.map(function (x) {
      return el('li', {}, el('button', { type: 'button', class: x.specialty === h.specialty ? 'on' : '',
        onclick: function () { focusSpec = x.specialty; paintInsights(); insightsPanel.scrollTop = 0; } },
        el('span', { class: 'ins-rname' }, x.specialty),
        el('span', { class: 'ins-achip t-' + (ARCH_TONE[x.archetype] || 'neutral') }, x.archetype_name),
        el('b', {}, x.score == null ? '—' : String(x.score))));
    })),
    ranked.length > 8 ? el('button', { type: 'button', class: 'ins-more', onclick: function () { showAllSpecs = !showAllSpecs; paintInsights(); } },
      showAllSpecs ? 'Show top 8' : 'Show all ' + ranked.length) : null,
    el('p', { class: 'ins-src' }, 'Model ' + M.version + '. ' + (M.benchmarks === 'specialty'
      ? 'Benchmarked against national rates per specialty.' : 'National per-specialty benchmarks not built yet; compared at specialty-group level.'))));
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

/* ---------- 7. Ask AI: the market assistant ---------------------------------
   Replaces the old single-shot chat (which only saw clinics loaded in the
   browser and sent its own system prompt). Talks to market-assistant.js,
   which runs in steps: a response with done:false is continued until done.
   The API conversation (`api`) is stored and echoed exactly as the server
   returned it; `ui` is what we draw. Model output is rendered by building DOM
   nodes from a small markdown subset, never through innerHTML. */
(function assistant() {
  var panel = $('ai-panel');
  if (!panel) return;
  var KEY = 'pp.dash.chat.v1';
  var chat = { api: [], ui: [] };
  try { var saved = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (saved && Array.isArray(saved.api)) chat = saved; } catch (e) {}
  // A reload mid-answer leaves nothing running; don't draw a spinner for it.
  chat.ui.forEach(function (m) {
    if (m.pending) { m.pending = false; if (!m.text) { m.text = 'Interrupted. Ask again to continue.'; m.error = true; } }
  });
  var busy = false;

  while (panel.firstChild) panel.removeChild(panel.firstChild);
  var list = el('div', { class: 'as-list', id: 'ai-messages', role: 'log', 'aria-live': 'polite' });
  var input = el('textarea', { id: 'ai-input', class: 'as-input', rows: '1', placeholder: 'Ask about this market…', 'aria-label': 'Ask the market assistant' });
  var send = el('button', { type: 'button', class: 'as-send', 'aria-label': 'Send', onclick: function () { ask(input.value); } }, '↑');
  panel.appendChild(el('div', { class: 'as-head' },
    el('div', {}, el('b', {}, '✦ Market assistant'), el('span', { class: 'as-sub', id: 'as-sub' })),
    el('button', { type: 'button', class: 'as-new', onclick: function () { if (busy) return; chat = { api: [], ui: [] }; save(); draw(); } }, 'New chat')));
  panel.appendChild(list);
  panel.appendChild(el('div', { class: 'as-compose' }, input, send));
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 140) + 'px'; });

  var listeners = [];
  function save() {
    try { sessionStorage.setItem(KEY, JSON.stringify(chat)); } catch (e) {}
    listeners.forEach(function (f) { try { f(); } catch (e) {} });
  }

  function currentSpec() {
    if (focusSpec) return focusSpec;
    if (mode === 'mine' && mySpec) return mySpec.label;
    var s = $('specialty-select');
    return (s && s.value) || null;
  }
  function context() {
    var a = $('addressInput');
    return { mode: mode, zip: lastZip || null, specialty: currentSpec(), place: a ? a.value : '' };
  }

  function suggestions() {
    var z = lastZip, sp = currentSpec() || 'primary care', spl = String(sp).toLowerCase();
    if (!z) return ['Which specialties are underserved around 38017?', 'Compare 38017 and 38138 for dermatology', 'How many cardiologists are in Tennessee?'];
    var arch = null;
    if (lastScore && lastScore.model && lastScore.model.specialties) {
      var hit = lastScore.model.specialties.filter(function (x) { return x.specialty === currentSpec(); })[0];
      if (hit) arch = hit.archetype_name;
    }
    return [
      arch ? 'Why is ' + spl + ' "' + arch + '" in ' + z + '?' : 'What does the ' + spl + ' market look like in ' + z + '?',
      'Which specialties have the biggest opening around ' + z + '?',
      'Show me ' + spl + ' providers within 10 miles of ' + z,
      'Write a one-pager on opening a ' + spl + ' practice near ' + z
    ];
  }

  // ---- drawing --------------------------------------------------------------
  function updateSub() {
    var sub = $('as-sub');
    if (sub) sub.textContent = lastZip ? 'Looking at ' + lastZip + (currentSpec() ? ' · ' + currentSpec() : '') : 'Search a market to ground answers';
  }
  function draw() {
    while (list.firstChild) list.removeChild(list.firstChild);
    updateSub();
    if (!chat.ui.length) {
      list.appendChild(el('div', { class: 'as-empty' },
        el('h3', {}, 'Ask about any market'),
        el('p', {}, 'Answers come from the same data as Insights: the market model, federal provider listings, Census and CDC data. It can move the map, compare ZIPs, and write memos you can share.'),
        el('div', { class: 'as-chips' }, suggestions().map(function (q) {
          return el('button', { type: 'button', class: 'as-chip', onclick: function () { ask(q); } }, q);
        }))));
      return;
    }
    chat.ui.forEach(function (m) { list.appendChild(bubble(m)); });
    list.scrollTop = list.scrollHeight;
  }

  function bubble(m) {
    if (m.role === 'user') return el('div', { class: 'as-msg user' }, m.text);
    var box = el('div', { class: 'as-msg bot' + (m.error ? ' err' : '') });
    if (m.steps && m.steps.length) {
      box.appendChild(el('ul', { class: 'as-steps' }, m.steps.map(function (s, i) {
        var live = m.pending && i === m.steps.length - 1;
        return el('li', { class: live ? 'live' : '' }, el('i', { 'aria-hidden': 'true' }, live ? '' : '✓'), s);
      })));
    }
    if (m.pending) box.appendChild(el('div', { class: 'as-typing' }, el('span'), el('span'), el('span')));
    if (m.text) box.appendChild(renderMarkdown(m.text));
    (m.actions || []).forEach(function (a) {
      box.appendChild(el('div', { class: 'as-action' }, '◎ Map: ' + [a.zip, a.specialty].filter(Boolean).join(' · ')));
    });
    (m.docs || []).forEach(function (d) { box.appendChild(docCard(d)); });
    if (m.error && m.retry) box.appendChild(el('button', { type: 'button', class: 'as-retry', onclick: m.retry }, 'Try again'));
    return box;
  }

  // Markdown subset: headings, bullets, numbered lists, tables, bold, code.
  function inline(text, parent) {
    String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).forEach(function (part) {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) parent.appendChild(el('strong', {}, part.slice(2, -2)));
      else if (/^`[^`]+`$/.test(part)) parent.appendChild(el('code', {}, part.slice(1, -1)));
      else parent.appendChild(document.createTextNode(part));
    });
    return parent;
  }
  function renderMarkdown(md) {
    var root = el('div', { class: 'as-md' });
    var lines = String(md).replace(/\r/g, '').split('\n');
    var i = 0;
    while (i < lines.length) {
      var ln = lines[i];
      if (!ln.trim()) { i++; continue; }
      var h = ln.match(/^(#{1,4})\s+(.*)$/);
      if (h) { root.appendChild(inline(h[2], el(h[1].length <= 2 ? 'h4' : 'h5'))); i++; continue; }
      if (/^\s*\|/.test(ln)) {
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        var table = el('table');
        var head = true;
        rows.forEach(function (r) {
          if (/^\s*\|[\s:\-|]+\|\s*$/.test(r)) { head = false; return; }
          var cells = r.trim().replace(/^\||\|$/g, '').split('|');
          table.appendChild(el('tr', {}, cells.map(function (c) { return inline(c.trim(), el(head ? 'th' : 'td')); })));
          if (head && rows.length === 1) head = false;
        });
        root.appendChild(el('div', { class: 'as-table' }, table));
        continue;
      }
      if (/^\s*([-*]|\d+[.)])\s+/.test(ln)) {
        var ordered = /^\s*\d/.test(ln);
        var listEl = el(ordered ? 'ol' : 'ul');
        while (i < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i])) {
          listEl.appendChild(inline(lines[i].replace(/^\s*([-*]|\d+[.)])\s+/, ''), el('li')));
          i++;
        }
        root.appendChild(listEl);
        continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+[.)])\s+)/.test(lines[i])) { para.push(lines[i].trim()); i++; }
      root.appendChild(inline(para.join(' '), el('p')));
    }
    return root;
  }

  var KIND = { market_memo: 'Market memo', expansion_one_pager: 'Expansion one-pager', client_pitch: 'Client pitch' };
  function docCard(d) {
    var body = renderMarkdown(d.body);
    var card = el('div', { class: 'as-doc collapsed' },
      el('div', { class: 'as-doc-head' }, el('span', { class: 'as-doc-kind' }, KIND[d.kind] || 'Document'), el('b', {}, d.title)),
      body);
    var toggle = el('button', { type: 'button', class: 'as-doc-btn', onclick: function () {
      card.classList.toggle('collapsed'); toggle.textContent = card.classList.contains('collapsed') ? 'Expand' : 'Collapse';
    } }, 'Expand');
    card.appendChild(el('div', { class: 'as-doc-actions' },
      toggle,
      el('button', { type: 'button', class: 'as-doc-btn', onclick: function (e) {
        var b = e.currentTarget;
        (navigator.clipboard ? navigator.clipboard.writeText(d.body) : Promise.reject()).then(function () { b.textContent = 'Copied'; }, function () { b.textContent = 'Copy failed'; });
      } }, 'Copy'),
      el('button', { type: 'button', class: 'as-doc-btn', onclick: function () {
        var a = el('a', { href: URL.createObjectURL(new Blob([d.body], { type: 'text/markdown' })), download: (d.title || 'memo').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.md' });
        document.body.appendChild(a); a.click(); a.remove();
      } }, 'Download'),
      el('button', { type: 'button', class: 'as-doc-btn', onclick: function () { printDoc(d); } }, 'Print / PDF')));
    return card;
  }
  // The rendered node is text-only DOM, so serializing it is safe.
  function printDoc(d) {
    var w = window.open('', '_blank');
    if (!w) return;
    var holder = el('div', {}, el('h1', {}, d.title), renderMarkdown(d.body),
      el('p', { class: 'src' }, 'Prepared with ProviderPulse · ' + new Date().toLocaleDateString()));
    w.document.write('<!doctype html><meta charset="utf-8"><title></title><style>' +
      'body{font:14px/1.55 -apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:720px;margin:40px auto;padding:0 24px}' +
      'h1{font-size:24px;letter-spacing:-.02em}h4{font-size:16px;margin:20px 0 6px}h5{font-size:14px;margin:16px 0 4px}' +
      'table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;font-size:13px}' +
      '.src{color:#64748b;font-size:12px;margin-top:28px}</style>' + holder.innerHTML);
    w.document.title = d.title;
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 250);
  }

  // ---- the stepped request loop ---------------------------------------------
  async function post(body) {
    var h = typeof authHeaders === 'function' ? await authHeaders() : authHeadersSync();
    var r = await fetch('/.netlify/functions/market-assistant', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, h),
      body: JSON.stringify(body)
    });
    var d = {};
    try { d = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(d.error || 'The assistant is unavailable right now.');
    return d;
  }

  function applyActions(actions) {
    (actions || []).forEach(function (a) {
      if (a.type !== 'update_map') return;
      var terms = null;
      if (a.specialty) {
        var s = SPECIALTIES.filter(function (x) { return x[0] === a.specialty; })[0];
        if (s) terms = s[1].split(',');
      }
      if (a.zip) {
        var i = $('addressInput'); if (i) i.value = a.zip;
        location.hash = '#zip=' + a.zip + (terms ? '&tax=' + encodeURIComponent(terms.join(',')) : '');
        if (a.specialty) setTimeout(function () { applySpecialty(a.specialty); }, 0);
      } else if (a.specialty) {
        applySpecialty(a.specialty);
      }
    });
  }

  async function run(first) {
    var slot = { role: 'assistant', pending: true, steps: [], actions: [], docs: [] };
    chat.ui.push(slot); draw();
    busy = true; send.disabled = true;
    var body = first, resumable = false;
    try {
      for (var hop = 0; hop < 6; hop++) {
        var d = await post(body);
        chat.api = d.messages || chat.api;
        resumable = !d.done;
        (d.steps || []).forEach(function (s) { slot.steps.push(s.label); });
        (d.actions || []).forEach(function (a) { slot.actions.push(a); });
        (d.deliverables || []).forEach(function (x) { slot.docs.push(x); });
        applyActions(d.actions);
        save(); draw();
        if (d.done) { slot.text = d.reply || ''; break; }
        body = { continue: true, messages: chat.api, npi: profile && profile.npi };
      }
      if (!slot.text && !slot.docs.length) slot.text = 'That took longer than expected. Ask again to pick it up.';
    } catch (e) {
      slot.error = true;
      slot.text = e.message;
      // Resume from whatever the server last confirmed: mid-answer, continue;
      // before any step landed, ask the same question again.
      var resume = resumable;
      slot.retry = function () {
        if (busy) return;
        chat.ui.splice(chat.ui.indexOf(slot), 1);
        run(resume ? { continue: true, messages: chat.api, npi: profile && profile.npi } : first);
      };
    }
    slot.pending = false;
    busy = false; send.disabled = false;
    save(); draw();
    input.focus();
  }

  // `shown` is what the chat bubble says when the prompt itself is long
  // (the Reports tab sends a full brief but shows a one-line request).
  function ask(q, shown) {
    q = String(q || '').trim();
    if (!q || busy) return false;
    input.value = ''; input.style.height = 'auto';
    chat.ui.push({ role: 'user', text: shown || q });
    run({ question: q, messages: chat.api, context: context(), npi: profile && profile.npi });
    return true;
  }

  // Redraw the empty state's suggestions when the market changes.
  var origVerdict = window.renderVerdict;
  window.renderVerdict = function (z) { origVerdict(z); if (!chat.ui.length) draw(); else updateSub(); };
  draw();
  window.PPAssistant = {
    ask: ask,
    isBusy: function () { return busy; },
    currentSpec: currentSpec,
    documents: function () {
      var out = [];
      chat.ui.forEach(function (m) { (m.docs || []).forEach(function (d) { out.unshift(d); }); });
      return out;
    },
    docCard: docCard,
    onChange: function (f) { listeners.push(f); }
  };
})();

/* ---------- 8. Reports: a builder on top of the assistant -------------------
   One engine, two doors. The Reports tab gathers a brief (document type,
   specialty, comparison ZIPs, audience, focus), hands it to the assistant,
   and keeps a library of every document written this session. */
(function reports() {
  var panel = $('reports-panel');
  var A = window.PPAssistant;
  if (!panel || !A) return;
  while (panel.firstChild) panel.removeChild(panel.firstChild);

  var TYPES = [
    ['market_memo', 'Market memo', 'A one-page read on the market: the score, what drives it, and the risks.'],
    ['expansion_one_pager', 'Expansion one-pager', 'Should we open here? The case, the competition and the numbers behind it.'],
    ['client_pitch', 'Client pitch', 'A summary for a prospective client, framed around their practice.']
  ];
  var kind = 'market_memo';

  var typeRow = el('div', { class: 'rp-types', role: 'radiogroup', 'aria-label': 'Document type' });
  function drawTypes() {
    while (typeRow.firstChild) typeRow.removeChild(typeRow.firstChild);
    TYPES.forEach(function (t) {
      typeRow.appendChild(el('button', { type: 'button', role: 'radio', 'aria-checked': String(kind === t[0]), class: 'rp-type' + (kind === t[0] ? ' on' : ''),
        onclick: function () { kind = t[0]; drawTypes(); forWho.hidden = kind !== 'client_pitch'; } },
        el('b', {}, t[1]), el('span', {}, t[2])));
    });
  }
  var spec = el('select', { class: 'rp-input', 'aria-label': 'Specialty' },
    SPECIALTIES.map(function (s) { return el('option', { value: s[0] }, s[0]); }));
  var compare = el('input', { class: 'rp-input', placeholder: 'e.g. 38138, 38139', 'aria-label': 'ZIPs to compare with' });
  var who = el('input', { class: 'rp-input', placeholder: 'e.g. Dr. Rivera, Midsouth Dermatology', 'aria-label': 'Prepared for' });
  var forWho = el('label', { class: 'rp-field', hidden: true }, el('span', {}, 'Prepared for'), who);
  var focus = el('textarea', { class: 'rp-input', rows: '2', placeholder: 'Anything it must answer? e.g. "Is there room for a second location?"', 'aria-label': 'Focus question' });
  var market = el('div', { class: 'rp-market' });
  var note = el('p', { class: 'rp-note', role: 'status' });
  var go = el('button', { type: 'button', class: 'ins-btn primary rp-go', onclick: generate }, '✦ Write it');
  var library = el('div', { class: 'rp-library' });

  panel.appendChild(el('div', { class: 'rp-wrap' },
    el('div', { class: 'ins-card' },
      el('div', { class: 'ins-eyebrow' }, 'Report builder'),
      el('p', {}, 'Written by the market assistant from the same data as Insights, with every figure traceable to its source.'),
      market,
      typeRow,
      el('label', { class: 'rp-field' }, el('span', {}, 'Specialty'), spec),
      el('label', { class: 'rp-field' }, el('span', {}, 'Compare with (optional)'), compare),
      forWho,
      el('label', { class: 'rp-field' }, el('span', {}, 'Focus (optional)'), focus),
      go, note),
    el('div', { class: 'ins-card' }, el('div', { class: 'ins-eyebrow' }, 'Documents this session'), library)));
  drawTypes();

  function refresh() {
    var z = lastZip;
    while (market.firstChild) market.removeChild(market.firstChild);
    market.appendChild(document.createTextNode(z ? 'Market: ZIP ' + z + ' and the area within 25 miles' : 'Search a ZIP, city or state first; the report is written about the market on the map.'));
    if (!spec.dataset.touched) spec.value = A.currentSpec() || 'Primary care / family doctor';
    go.disabled = !z || A.isBusy();
    while (library.firstChild) library.removeChild(library.firstChild);
    var docs = A.documents();
    if (!docs.length) library.appendChild(el('p', { class: 'rp-empty' }, 'Reports you create, here or in Ask AI, collect here for copying, downloading or printing.'));
    docs.forEach(function (d) { library.appendChild(A.docCard(d)); });
  }
  spec.addEventListener('change', function () { spec.dataset.touched = '1'; });

  function generate() {
    var z = lastZip;
    if (!z) return;
    if (A.isBusy()) { note.textContent = 'The assistant is finishing another answer. Try again in a moment.'; return; }
    var label = TYPES.filter(function (t) { return t[0] === kind; })[0][1];
    var others = (compare.value.match(/\b\d{5}\b/g) || []).filter(function (x) { return x !== z; }).slice(0, 3);
    var brief = 'Write a ' + label.toLowerCase() + ' about opening or growing a ' + spec.value + ' practice around ZIP ' + z + '.';
    if (others.length) brief += ' Compare it with ZIP' + (others.length > 1 ? 's ' : ' ') + others.join(', ') + '.';
    if (kind === 'client_pitch' && who.value.trim()) brief += ' It is prepared for ' + who.value.trim().slice(0, 120) + '.';
    if (focus.value.trim()) brief += ' Make sure it answers: ' + focus.value.trim().slice(0, 400);
    brief += '\nGather the numbers with your tools first, then deliver it with create_deliverable (kind "' + kind + '").';
    var shown = label + ': ' + spec.value + ' around ' + z + (others.length ? ' vs ' + others.join(', ') : '') + (focus.value.trim() ? '. ' + focus.value.trim() : '');
    note.textContent = '';
    switchTab('ai');
    A.ask(brief, shown);
  }

  A.onChange(refresh);
  var prev = window.renderVerdict;
  window.renderVerdict = function (zv) { prev(zv); refresh(); };
  refresh();
})();

function authHeadersSync() {
  return session && session.access_token ? { Authorization: 'Bearer ' + session.access_token } : {};
}

})();
