/* code-list.js: the Procedures tab's code-list search (2026-10-21).
 *
 * A doctor pastes the codes their practice bills ("43235, 43239, 45385..."
 * straight from a spreadsheet column) into the Procedures search box. Two or
 * more codes and nothing else switch the panel from word search to a code
 * list: Medicare clinicians and Medicaid for exactly those codes across the
 * ZIPs on the map, by code, by clinician and by ZIP.
 *
 * parse() decides whether the box holds a code list; summarize() turns the
 * rows the panel loaded into the three views. Pure functions, no DOM and no
 * network, so scripts/test-code-list.mjs runs them under Node.
 * Dual-exported: window.CodeList in the browser, module.exports under Node.
 */
(function (root) {
  'use strict';

  var MAX_CODES = 100;
  // CPT (43239, 0001U), HCPCS Level II (C9777, G0121) and anesthesia (00731):
  // five letters or digits with at least one digit.
  var CODE = /^[A-Z0-9]{5}$/;

  // { isList, codes, ignored }. A list needs two or more distinct codes and
  // every token a code, so "45385 colonoscopy" stays a word search.
  function parse(text) {
    var tokens = String(text || '').toUpperCase().split(/[\s,;|]+/).filter(Boolean);
    var codes = [], seen = {}, other = 0;
    tokens.forEach(function (t) {
      t = t.replace(/^["'(]+|["'.)]+$/g, '');
      if (!t) return;
      if (CODE.test(t) && /\d/.test(t)) { if (!seen[t]) { seen[t] = 1; codes.push(t); } }
      else other++;
    });
    var ignored = Math.max(0, codes.length - MAX_CODES);
    return { isList: codes.length >= 2 && other === 0, codes: codes.slice(0, MAX_CODES), ignored: ignored };
  }

  var num = function (v) { var n = Number(v); return isFinite(n) ? n : 0; };

  // med rows: cms_procedures_full (npi, provider_name, first_name, credentials,
  // entity_code, city, zip, specialty, hcpcs_cd, hcpcs_desc, place_of_service,
  // tot_benes, tot_srvcs, avg_mdcr_alowd_amt, avg_mdcr_pymt_amt).
  // mcd rows: medicaid_procedures (zip, specialty, code, claims, paid, providers).
  // desc: { code: description } from procedure_codes.
  function summarize(codes, med, mcd, desc) {
    med = med || []; mcd = mcd || []; desc = desc || {};
    var byCode = {}, byNpi = {}, byZip = {};
    codes.forEach(function (c) {
      byCode[c] = { code: c, description: desc[c] || null, billers: {}, patients: 0, services: 0, office: 0, facility: 0,
        individual: 0, organization: 0, allowed: 0, paid: 0, mcdClaims: 0, mcdPaid: 0, mcdProviders: 0, mcdRows: 0 };
    });
    med.forEach(function (r) {
      var c = byCode[String(r.hcpcs_cd || '').toUpperCase()];
      if (!c) return;
      var s = num(r.tot_srvcs), b = num(r.tot_benes), paid = num(r.avg_mdcr_pymt_amt) * s, npi = String(r.npi || '');
      if (!c.description && r.hcpcs_desc) c.description = r.hcpcs_desc;
      c.billers[npi] = 1; c.patients += b; c.services += s;
      c.allowed += num(r.avg_mdcr_alowd_amt) * s; c.paid += paid;
      if (r.place_of_service === 'O') c.office += s; else if (r.place_of_service === 'F') c.facility += s;
      if (r.entity_code === 'O') c.organization += s; else c.individual += s;
      var p = byNpi[npi] || (byNpi[npi] = { npi: npi, name: r.provider_name || '', first: r.first_name || '', credentials: r.credentials || '',
        organization: r.entity_code === 'O', specialty: r.specialty || '', city: r.city || '', zip: r.zip || '',
        codes: {}, patients: 0, services: 0, paid: 0 });
      p.codes[c.code] = (p.codes[c.code] || 0) + s; p.patients += b; p.services += s; p.paid += paid;
      var z = byZip[r.zip] || (byZip[r.zip] = { zip: r.zip, billers: {}, services: 0, paid: 0, mcdClaims: 0, mcdPaid: 0 });
      z.billers[npi] = 1; z.services += s; z.paid += paid;
    });
    mcd.forEach(function (r) {
      var c = byCode[String(r.code || '').toUpperCase()];
      if (!c) return;
      c.mcdClaims += num(r.claims); c.mcdPaid += num(r.paid); c.mcdProviders += num(r.providers); c.mcdRows++;
      var z = byZip[r.zip] || (byZip[r.zip] = { zip: r.zip, billers: {}, services: 0, paid: 0, mcdClaims: 0, mcdPaid: 0 });
      z.mcdClaims += num(r.claims); z.mcdPaid += num(r.paid);
    });

    var codesOut = codes.map(function (k) {
      var c = byCode[k], n = Object.keys(c.billers).length;
      return { code: c.code, description: c.description, billers: n, patients: Math.round(c.patients), services: Math.round(c.services),
        office: Math.round(c.office), facility: Math.round(c.facility), individual: Math.round(c.individual), organization: Math.round(c.organization),
        avgAllowed: c.services ? c.allowed / c.services : null, avgPaid: c.services ? c.paid / c.services : null, paid: c.paid,
        mcdClaims: Math.round(c.mcdClaims), mcdPaid: c.mcdPaid, mcdPerClaim: c.mcdClaims ? c.mcdPaid / c.mcdClaims : null,
        mcdProviders: Math.round(c.mcdProviders), inMedicare: n > 0, inMedicaid: c.mcdRows > 0 };
    }).sort(function (a, b) { return b.services - a.services || b.mcdClaims - a.mcdClaims || (a.code < b.code ? -1 : 1); });

    var clinicians = Object.keys(byNpi).map(function (k) {
      var p = byNpi[k], top = null;
      Object.keys(p.codes).forEach(function (c) { if (top === null || p.codes[c] > p.codes[top]) top = c; });
      return { npi: p.npi, name: p.organization ? p.name : [p.first, p.name].filter(Boolean).join(' '), credentials: p.credentials,
        organization: p.organization, specialty: p.specialty, city: p.city, zip: p.zip, codes: Object.keys(p.codes).length,
        topCode: top, patients: Math.round(p.patients), services: Math.round(p.services), paid: p.paid };
    }).sort(function (a, b) { return b.paid - a.paid || b.services - a.services; });

    var zips = Object.keys(byZip).map(function (k) {
      var z = byZip[k];
      return { zip: z.zip, billers: Object.keys(z.billers).length, services: Math.round(z.services), paid: z.paid,
        mcdClaims: Math.round(z.mcdClaims), mcdPaid: z.mcdPaid };
    }).sort(function (a, b) { return b.paid - a.paid || b.mcdPaid - a.mcdPaid; });

    var all = {};
    codesOut.forEach(function (c) { Object.keys(byCode[c.code].billers).forEach(function (n) { all[n] = 1; }); });
    return {
      codes: codesOut, clinicians: clinicians, zips: zips,
      missing: codesOut.filter(function (c) { return !c.inMedicare && !c.inMedicaid; }).map(function (c) { return c.code; }),
      totals: { billers: Object.keys(all).length, services: codesOut.reduce(function (a, c) { return a + c.services; }, 0),
        paid: codesOut.reduce(function (a, c) { return a + c.paid; }, 0), mcdClaims: codesOut.reduce(function (a, c) { return a + c.mcdClaims; }, 0),
        mcdPaid: codesOut.reduce(function (a, c) { return a + c.mcdPaid; }, 0) }
    };
  }

  // One CSV of a view, for copying into a spreadsheet.
  function toCsv(rows, cols) {
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [cols.map(function (c) { return q(c[0]); }).join(',')].concat(rows.map(function (r) {
      return cols.map(function (c) { var v = r[c[1]]; return q(typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v); }).join(',');
    })).join('\n');
  }

  var api = { parse: parse, summarize: summarize, toCsv: toCsv, MAX_CODES: MAX_CODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CodeList = api;
})(typeof window !== 'undefined' ? window : this);
