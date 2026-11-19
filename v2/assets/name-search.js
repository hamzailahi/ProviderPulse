// Name search (2026-11-19, the user's ask): look up a specific doctor or
// clinic by name, or by its 10-digit NPI, on the patient app, the portal and
// the dashboard. Pure helpers, browser + require.
//
// The directory stores names in capitals, clinicians as "FIRST LAST" (some
// with a middle name or initial). A typed name is split into words and each
// word must appear somewhere in the name, in any order, so "Smith John",
// "Dr. John Smith, MD" and "john a smith" all find JOHN A SMITH. Only words of
// three letters or more go to the database (migration 050's trigram indexes
// cannot narrow a one- or two-letter pattern); shorter ones (a middle
// initial) are checked here on the rows that come back.
(function (root) {
  // Titles and credentials people type that are not part of a stored name.
  var DROP = {};
  ('DR DOCTOR MD DO NP PA PAC DDS DMD OD DPM DC PHD PSYD LCSW LPC RN APRN FNP CRNP MR MRS MS MISS ' +
   'JR SR II III THE OF AND AT').split(' ').forEach(function (w) { DROP[w] = 1; });

  function words(text) {
    return String(text || '').toUpperCase().replace(/[’']/g, '').replace(/[^A-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  }

  // {npi} for a 10-digit number, {tokens, server} for a name, or {error}.
  function parse(text) {
    var raw = String(text || '').trim();
    if (/^\d{10}$/.test(raw.replace(/[\s-]/g, ''))) return { npi: raw.replace(/[\s-]/g, '') };
    var seen = {}, tokens = [];
    words(raw).forEach(function (w) { if (!DROP[w] && !seen[w]) { seen[w] = 1; tokens.push(w); } });
    tokens = tokens.slice(0, 6);
    var server = tokens.filter(function (w) { return w.length >= 3; });
    if (!server.length) return { error: tokens.length ? 'Type at least three letters of a name.' : 'Type a doctor\'s or clinic\'s name, or a 10-digit NPI.' };
    return { tokens: tokens, server: server };
  }

  // The PostgREST filter for one table (letters and digits only reach it).
  function filter(q) {
    if (q.npi) return 'npi=eq.' + q.npi;
    var parts = q.server.map(function (w) { return 'name.ilike.*' + w + '*'; });
    return parts.length === 1 ? 'name=ilike.*' + q.server[0] + '*' : 'and=(' + parts.join(',') + ')';
  }

  // How well a stored name fits: 0 every word whole, 1 every word starts a
  // name word, 2 every word inside one (GOLDSMITH for SMITH), -1 no match
  // (a short word the database could not check).
  function rank(name, q) {
    if (q.npi) return 0;
    var nw = words(name), worst = 0;
    for (var i = 0; i < q.tokens.length; i++) {
      var t = q.tokens[i], best = 3;
      for (var j = 0; j < nw.length; j++) {
        if (nw[j] === t) { best = 0; break; }
        if (nw[j].indexOf(t) === 0) best = Math.min(best, 1);
        else if (t.length >= 3 && nw[j].indexOf(t) > 0) best = Math.min(best, 2);
      }
      if (best === 3) return -1;
      worst = Math.max(worst, best);
    }
    return worst;
  }

  var api = { parse: parse, filter: filter, rank: rank, words: words };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NameSearch = api;
})(typeof window !== 'undefined' ? window : this);
