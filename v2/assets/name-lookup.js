// Provider name lookup for the provider side (2026-11-19, the user's ask):
// the dashboard and the portal look up a doctor or clinic by name, or a
// 10-digit NPI, anywhere in the directory, optionally within one state.
// Matching rules live in name-search.js (shared with the patient app). Fax
// numbers show here, the provider side only (the user's choice, 2026-11-16),
// a clinician's organization fax labelled with its organization.
// Browser only: NameLookup.mount(el, {url, key, onShow}). Every value reaches
// the page through textContent.
(function (root) {
  var SELECT = 'npi,name,address,city,state,zip,primary_taxonomy,taxonomy_code,latitude,longitude,phone,fax,org_fax,org_fax_name';
  var LIMIT = 60;
  var STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function phone(v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : '';
  }
  function nice(s) {
    if (typeof root.displayName === 'function') return root.displayName(s);
    s = String(s || '');
    return s === s.toUpperCase() ? s.toLowerCase().replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }) : s;
  }
  function typeOf(r) {
    var t = (root.TaxonomyMap && r.taxonomy_code) ? root.TaxonomyMap.get(r.taxonomy_code) : null;
    return (t && t.displayName) || r.primary_taxonomy || '';
  }

  function fetchTable(o, table, filter) {
    return fetch(o.url + '/rest/v1/' + table + '?' + filter + '&select=' + SELECT + '&limit=' + LIMIT,
      { headers: { apikey: o.key, Accept: 'application/json' }, signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!Array.isArray(rows)) { var f = []; f.failed = true; return f; }
        rows.forEach(function (r) { r._kind = table === 'clinics' ? 'Organization' : 'Clinician'; });
        return rows;
      })
      .catch(function () { var f = []; f.failed = true; return f; });
  }

  function mount(host, o) {
    var NS = root.NameSearch;
    var input = el('input', { type: 'search', class: 'nl-input', placeholder: 'Doctor or clinic name, or NPI', 'aria-label': 'Doctor or clinic name, or NPI', autocomplete: 'off' });
    var st = el('select', { class: 'nl-state', 'aria-label': 'State' }, [el('option', { value: '', text: 'Any state' })].concat(STATES.map(function (s) { return el('option', { value: s, text: s }); })));
    if (o.state && STATES.indexOf(o.state) !== -1) st.value = o.state;
    var btn = el('button', { type: 'submit', class: 'nl-go', text: 'Look up' });
    var status = el('div', { class: 'nl-status', role: 'status' });
    var list = el('ol', { class: 'nl-list' });
    var form = el('form', { class: 'nl-form', onsubmit: function (e) { e.preventDefault(); run(); } }, [input, st, btn]);
    host.appendChild(el('div', { class: 'nl' }, [form, status, list]));
    var seq = 0;

    function run() {
      var q = NS.parse(input.value);
      list.textContent = '';
      if (q.error) { status.textContent = q.error; return; }
      var mine = ++seq, f = NS.filter(q) + (st.value && !q.npi ? '&state=eq.' + st.value : '');
      status.textContent = 'Looking up…';
      Promise.all([fetchTable(o, 'provider_individuals', f), fetchTable(o, 'clinics', f)]).then(function (sets) {
        if (mine !== seq) return;
        var rows = [], seen = {};
        sets.forEach(function (s) { s.forEach(function (r) {
          var rank = NS.rank(r.name, q);
          if (rank < 0 || seen[r.npi]) return;
          seen[r.npi] = 1; r._rank = rank; rows.push(r);
        }); });
        rows.sort(function (a, b) { return a._rank - b._rank || String(a.name).localeCompare(String(b.name)); });
        var failed = sets[0].failed || sets[1].failed;
        var capped = sets[0].length >= LIMIT || sets[1].length >= LIMIT;
        if (!rows.length) {
          status.textContent = failed ? 'The directory did not answer. Please try again.' : 'No one listed by that name' + (st.value ? ' in ' + st.value : '') + '.';
          return;
        }
        status.textContent = (failed || capped ? 'At least ' : '') + rows.length + ' match' + (rows.length === 1 ? '' : 'es') +
          (failed ? ' (part of the directory did not answer)' : '') + (capped ? '. Many share this name: add a first name or pick a state.' : '');
        rows.forEach(function (r) { list.appendChild(row(r)); });
      });
    }

    function row(r) {
      var ph = phone(r.phone), fx = phone(r.fax), ofx = !fx && r.org_fax ? phone(r.org_fax) : '';
      var where = [nice(r.address), [r.city ? nice(r.city) : '', r.state, String(r.zip || '').slice(0, 5)].filter(Boolean).join(' ')].filter(Boolean).join(', ');
      var acts = [];
      if (o.onShow && r.latitude != null && r.longitude != null) acts.push(el('button', { type: 'button', class: 'nl-act', text: 'Show on map', onclick: function () { o.onShow(r); } }));
      if (o.onArea && /^\d{5}/.test(String(r.zip || ''))) acts.push(el('button', { type: 'button', class: 'nl-act', text: 'Load ' + String(r.zip).slice(0, 5) + ' market', onclick: function () { o.onArea(String(r.zip).slice(0, 5), r); } }));
      return el('li', { class: 'nl-row' }, [
        el('div', { class: 'nl-name' }, [el('b', { text: nice(r.name) }), el('span', { class: 'nl-kind', text: ' · ' + r._kind })]),
        el('div', { class: 'nl-type', text: typeOf(r) }),
        el('div', { class: 'nl-addr', text: where || 'No address on file' }),
        el('div', { class: 'nl-contact', text: ['NPI ' + r.npi, ph ? 'Phone ' + ph : null, fx ? 'Fax ' + fx : ofx ? 'Fax ' + ofx + ' via ' + nice(r.org_fax_name || 'their organization') : null,
          r.latitude == null ? 'No map location' : null].filter(Boolean).join(' · ') }),
        acts.length ? el('div', { class: 'nl-acts' }, acts) : null
      ]);
    }
    return { run: run, input: input };
  }

  root.NameLookup = { mount: mount };
})(window);
