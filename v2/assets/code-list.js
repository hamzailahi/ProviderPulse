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
        // A claim line can carry several units, so a Medicaid amount per
        // claim line far above Medicare's average per service is not a rate
        // (2026-10-22: ECG 93000 at $205.76 per claim line vs about $10).
        mcdCheck: c.mcdClaims && c.services && (c.mcdPaid / c.mcdClaims) > 3 * (c.paid / c.services)
          ? 'Unreliable as a rate: ' + Math.round((c.mcdPaid / c.mcdClaims) / (c.paid / c.services)) + ' times Medicare\'s average per service here; claim lines likely carry several units' : null,
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

  // ---- Hospital groups by topic (2026-10-21, the user's choice) ----------
  // Hospitals report payment groups (APC outpatient, DRG inpatient), never
  // CPT codes, so a code list reaches them through topics: each code's CPT
  // range (or, for letter codes, its description) names a topic, and a
  // hospital group belongs to the list when its description matches one of
  // those topics. Approximate by nature; the notes say so. Anesthesia has no
  // hospital group (it is packaged into the procedure's group).
  var TOPICS = [
    { id: 'gi', label: 'Digestive (GI)', ranges: [[40490, 49999], [91010, 91299]],
      desc: /esophag|stomach|duoden|bowel|colon|rect(al|um)|\banal\b|gastr|biliar|pancrea|hepat|digest/i,
      hosp: /\bG\.?I\.?\b|digest|esophag|stomach|bowel|gastr|duoden|rect(al|um)|\banal\b|colon|pancrea|biliar|hepat|\bliver\b/i },
    { id: 'pathology', label: 'Pathology', ranges: [[88000, 88399]], desc: /patholog|specimen/i, hosp: /patholog/i },
    { id: 'lab', label: 'Laboratory', ranges: [[80047, 87999], [89049, 89398]], desc: /laborator|blood test/i, hosp: /laborator/i },
    { id: 'cardiac', label: 'Heart', ranges: [[33010, 33999], [92920, 93799]], desc: /cardi|heart|electrocardio|\becg\b|echocardio/i,
      hosp: /cardi|heart|electrocardio|echocardio|pacemaker|\bICD\b|electrophysiolog/i },
    { id: 'imaging', label: 'Imaging', ranges: [[70010, 79999]], desc: /ultrasound|x-ray|\bct\b|\bmri\b|imaging|radiolog/i,
      hosp: /imaging|ultrasound|radiolog|\bCT\b|\bMRI\b|echograph/i },
    { id: 'urology', label: 'Urology', ranges: [[50010, 55899]], desc: /bladder|urin|kidney|prostat|ureter|urethr/i, hosp: /urolog|urinary|bladder|kidney|prostat|renal/i },
    { id: 'nervous', label: 'Nerves and brain', ranges: [[61000, 64999], [95700, 96020]], desc: /nerve|neuro|brain|spin/i, hosp: /nerve|neuro|spin|brain|craniot/i },
    { id: 'musculoskeletal', label: 'Bones and joints', ranges: [[20100, 29999]], desc: /joint|bone|knee|hip|shoulder|fracture/i, hosp: /musculoskeletal|joint|spin|fracture/i },
    { id: 'skin', label: 'Skin and breast', ranges: [[10004, 19499]], desc: /skin|breast|wound|lesion/i, hosp: /skin|breast|wound|excision|debridement/i },
    { id: 'vascular', label: 'Vascular', ranges: [[34001, 37799]], desc: /vein|arter|vascular/i, hosp: /vascular|vein|arter|endovascular/i },
    { id: 'eye', label: 'Eye', ranges: [[65091, 68899]], desc: /eye|retina|cataract|lens/i, hosp: /intraocular|eye|ophthal|retina/i },
    { id: 'ent', label: 'Ear, nose and throat', ranges: [[30000, 32999], [69000, 69990]], desc: /nasal|sinus|ear\b|throat|larynx/i, hosp: /\bENT\b|airway|nasal|sinus|ear\b/i },
    { id: 'gyn', label: 'Gynecology', ranges: [[56405, 58999]], desc: /uter|vagin|ovar|cervi/i, hosp: /gynecolog|uter/i },
    { id: 'obstetric', label: 'Pregnancy and delivery', ranges: [[59000, 59899]], desc: /deliver|pregnan|obstetric|cesarean/i, hosp: /obstetric|deliver|pregnan|vaginal|cesarean|neonat/i },
    { id: 'visits', label: 'Visits and observation', ranges: [[99202, 99499]], desc: /visit|consult/i, hosp: /visit|clinic|emergency|observation/i },
    { id: 'anesthesia', label: 'Anesthesia', ranges: [[100, 1999]], desc: /^anesthesia/i, hosp: null }
  ];

  // The topic of one code: its CPT range when it is all digits, else its
  // description. null when neither says.
  function topicFor(code, description) {
    code = String(code || '').toUpperCase();
    if (/^\d{5}$/.test(code)) {
      var n = parseInt(code, 10);
      for (var i = 0; i < TOPICS.length; i++) {
        if (TOPICS[i].ranges.some(function (r) { return n >= r[0] && n <= r[1]; })) return TOPICS[i];
      }
    }
    if (description) for (var j = 0; j < TOPICS.length; j++) if (TOPICS[j].desc.test(description)) return TOPICS[j];
    return null;
  }
  // { byCode: {code: topic label or null}, topics: [topic] } for a list.
  function topicsFor(codes, desc) {
    var byCode = {}, seen = {}, topics = [];
    (codes || []).forEach(function (c) {
      var t = topicFor(c, (desc || {})[c]);
      byCode[c] = t ? t.label : null;
      if (t && !seen[t.id]) { seen[t.id] = 1; topics.push(t); }
    });
    return { byCode: byCode, topics: topics };
  }
  // The topic labels a hospital group's description belongs to, among `topics`.
  function hospitalTopics(description, topics) {
    return (topics || []).filter(function (t) { return t.hosp && t.hosp.test(description || ''); }).map(function (t) { return t.label; });
  }

  // ---- The Download all workbook: one array of rows per sheet -------------
  // spec: { place, zips, year, codes, summary, med, mcd, outpatient, inpatient }
  // where outpatient / inpatient are { rows: [{hospital, ccn, miles, code,
  // description, patients, services, avg_charge, avg_allowed, avg_paid}],
  // failed } or null (not loaded). Pure, so the test reads the same sheets.
  function workbook(spec) {
    var s = spec.summary, desc = {};
    s.codes.forEach(function (c) { desc[c.code] = c.description; });
    var tp = topicsFor(spec.codes, desc);
    var r2 = function (v) { return v == null || !isFinite(v) ? null : Math.round(v * 100) / 100; };
    var sheets = [];
    var hosp = function (h, label) {
      if (!h) return [['Not loaded: this area was not searched for ' + label + '.']];
      if (h.failed) return [['The ' + label + ' data did not load, so this sheet is empty because of a failed request, not because hospitals billed none. Try again.']];
      // Inpatient rows are stays (DRG discharges) with no service count, so
      // their estimate is stays x average Medicare paid.
      var inpatient = label.indexOf('inpatient') >= 0, rows = [];
      var mi = function (r) { return r.miles == null ? null : Math.round(r.miles * 10) / 10; };
      h.rows.forEach(function (r) {
        var t = hospitalTopics(r.description, tp.topics);
        if (!t.length) return;
        rows.push(inpatient
          ? [t.join('; '), r.code, r.description, r.hospital, r.ccn, mi(r), r.patients, r2(r.avg_charge), r2(r.avg_allowed), r2(r.avg_paid), r.patients != null && r.avg_paid != null ? Math.round(r.patients * r.avg_paid) : null]
          : [t.join('; '), r.code, r.description, r.hospital, r.ccn, mi(r), r.patients, r.services, r2(r.avg_charge), r2(r.avg_allowed), r2(r.avg_paid), r.services != null && r.avg_paid != null ? Math.round(r.services * r.avg_paid) : null]);
      });
      rows.sort(function (a, b) { return (b[b.length - 1] || 0) - (a[a.length - 1] || 0); });
      var head = inpatient
        ? ['Topic', 'DRG', 'Description', 'Hospital', 'CCN', 'Miles', 'Stays', 'Avg billed', 'Avg total paid', 'Avg Medicare paid', 'Est. Medicare paid (stays x avg paid)']
        : ['Topic', 'APC group', 'Description', 'Hospital', 'CCN', 'Miles', 'Medicare patients', 'Services', 'Avg billed', 'Avg allowed', 'Avg Medicare paid', 'Est. Medicare paid (services x avg paid)'];
      return [head].concat(rows.length ? rows : [['No group at the nearby hospitals matches these codes\' topics.']]);
    };
    var noteRows = [
      ['Procedure codes: ' + (spec.place || 'the area on the map')],
      ['Area: ' + spec.zips + ' ZIP' + (spec.zips === 1 ? '' : 's') + ' on the map. Hospital sheets: the 15 nearest hospitals that bill Medicare (within 25 miles of the area, else 50).'],
      ['Codes: ' + spec.codes.join(', ')],
      ['Data year: ' + (spec.year || 2024) + '. Every figure is published by CMS or HHS.'],
      [spec.incomplete ? 'INCOMPLETE: some requests failed or hit a page limit, so these totals are floors.' : 'All requests answered.'],
      [''],
      ['Medicare clinicians: traditional Medicare only (65+ and some disabled). CMS leaves out any code a clinician billed for fewer than 11 patients. Patients are summed across billers; one procedure can appear under the physician, the surgery center, anesthesia and pathology, so do not add services across codes. Est. Medicare paid = services x average paid.'],
      ['Medicaid: the state\'s Medicaid and CHIP claims at the provider\'s ZIP, without clinician names. HHS withholds any provider, code and month under 12 patients, so counts are floors. A claim line can carry several units of a service, so paid per claim line is not a price per service and is not comparable with Medicare\'s average; the Check column flags codes where it runs more than three times Medicare\'s average here.'],
      ['Hospitals: payment groups (APC outpatient, DRG inpatient), not CPT codes, matched to your codes by topic. Approximate: a group can cover procedures outside your list. Anesthesia has no hospital group (it is packaged into the procedure\'s group). CMS withholds hospital counts under 11.'],
      [''],
      ['Code', 'Topic used for hospital groups']
    ].concat(spec.codes.map(function (c) { return [c, tp.byCode[c] || (c === 'C9777' || /^[A-Z]/.test(c) ? 'none (a facility or HCPCS code with no topic found)' : 'none found')]; }));
    if (s.missing.length) noteRows.push([''], ['Codes with no Medicare or Medicaid rows in this area: ' + s.missing.join(', ')]);
    sheets.push({ name: 'Notes', rows: noteRows });
    sheets.push({ name: 'Medicare by code', rows: [['Code', 'Description', 'Billers', 'Patients (summed)', 'Services', 'Office services', 'Facility services', 'Services by individuals', 'Services by organizations', 'Avg allowed', 'Avg paid', 'Est. Medicare paid']]
      .concat(s.codes.map(function (c) { return [c.code, c.description, c.billers, c.patients, c.services, c.office, c.facility, c.individual, c.organization, r2(c.avgAllowed), r2(c.avgPaid), Math.round(c.paid)]; })) });
    sheets.push({ name: 'Medicare by clinician', rows: [['NPI', 'Name', 'Credentials', 'Organization', 'CMS specialty', 'City', 'ZIP', 'Codes billed', 'Top code', 'Patients (summed)', 'Services', 'Est. Medicare paid']]
      .concat(s.clinicians.map(function (c) { return [c.npi, c.name, c.credentials, c.organization ? 'yes' : 'no', c.specialty, c.city, c.zip, c.codes, c.topCode, c.patients, c.services, Math.round(c.paid)]; })) });
    sheets.push({ name: 'Medicare rows', rows: [['Code', 'Description', 'NPI', 'Last or organization name', 'First name', 'Credentials', 'Entity', 'CMS specialty', 'City', 'ZIP', 'Place of service', 'Patients', 'Services', 'Avg allowed', 'Avg paid', 'Est. Medicare paid']]
      .concat((spec.med || []).map(function (r) { var sv = Number(r.tot_srvcs) || 0; return [r.hcpcs_cd, r.hcpcs_desc, r.npi, r.provider_name, r.first_name, r.credentials, r.entity_code, r.specialty, r.city, r.zip, r.place_of_service === 'F' ? 'facility' : r.place_of_service === 'O' ? 'office' : r.place_of_service, Number(r.tot_benes) || 0, sv, r2(Number(r.avg_mdcr_alowd_amt)), r2(Number(r.avg_mdcr_pymt_amt)), Math.round(sv * (Number(r.avg_mdcr_pymt_amt) || 0))]; })) });
    sheets.push({ name: 'Medicaid by code', rows: [['Code', 'Description', 'Claim lines', 'Total paid', 'Paid per claim line', 'Providers (summed)', 'Check']]
      .concat(s.codes.filter(function (c) { return c.inMedicaid; }).map(function (c) { return [c.code, c.description, c.mcdClaims, Math.round(c.mcdPaid), r2(c.mcdPerClaim), c.mcdProviders, c.mcdCheck || '']; })) });
    sheets.push({ name: 'Medicaid rows', rows: [['Code', 'Description', 'ZIP', 'Billing specialty', 'Claim lines', 'Total paid', 'Providers']]
      .concat((spec.mcd || []).map(function (r) { return [r.code, desc[String(r.code).toUpperCase()] || null, r.zip, r.specialty, Number(r.claims) || 0, r2(Number(r.paid)), Number(r.providers) || 0]; })) });
    sheets.push({ name: 'By ZIP', rows: [['ZIP', 'Medicare billers', 'Medicare services', 'Est. Medicare paid', 'Medicaid claim lines', 'Medicaid paid']]
      .concat(s.zips.map(function (z) { return [z.zip, z.billers, z.services, Math.round(z.paid), z.mcdClaims, Math.round(z.mcdPaid)]; })) });
    sheets.push({ name: 'Hospital outpatient', rows: hosp(spec.outpatient, 'Medicare hospital outpatient') });
    sheets.push({ name: 'Hospital inpatient', rows: hosp(spec.inpatient, 'Medicare hospital inpatient') });
    return sheets;
  }

  // One CSV of a view, for copying into a spreadsheet.
  function toCsv(rows, cols) {
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    return [cols.map(function (c) { return q(c[0]); }).join(',')].concat(rows.map(function (r) {
      return cols.map(function (c) { var v = r[c[1]]; return q(typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v); }).join(',');
    })).join('\n');
  }

  var api = { parse: parse, summarize: summarize, toCsv: toCsv, topicFor: topicFor, topicsFor: topicsFor, hospitalTopics: hospitalTopics,
    workbook: workbook, TOPICS: TOPICS, MAX_CODES: MAX_CODES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CodeList = api;
})(typeof window !== 'undefined' ? window : this);
