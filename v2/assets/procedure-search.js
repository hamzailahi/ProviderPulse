/* procedure-search.js — the Procedures panel's search box (index.html).
 *
 * CMS describes codes in plain language of its own ("Biopsy of large bowel
 * using a flexible endoscope"), so the words a clinician types ("colonoscopy",
 * "EGD") often appear in no description at all: a doctor searching Fort Worth
 * gastroenterology by name found almost nothing while 45380 and 45385 held
 * thousands of patients (2026-10-20). ALIASES maps common words to the phrases
 * CMS actually uses; every phrase is checked against the real descriptions in
 * supabase/reference/procedure-codes.csv by scripts/test-procedure-search.mjs.
 *
 * match(query) returns a test over a row's text fields: true when any field
 * contains the query itself or a phrase of an alias the query names (an alias
 * key matches as whole words anywhere in the query). Codes match as typed, so
 * "45380" still finds 45380.
 *
 * Dual-exported: window.ProcedureSearch in the browser, module.exports in Node.
 */
(function (root) {
  'use strict';

  var ALIASES = {
    // Gastroenterology
    'colonoscopy': ['large bowel using', 'colonoscopy'],
    'colonoscopies': ['large bowel using', 'colonoscopy'],
    'colon': ['large bowel', 'colon'],
    'polyp': ['polyp'],
    'polypectomy': ['removal of polyps'],
    'sigmoidoscopy': ['sigmoid', 'lower large bowel'],
    'egd': ['esophagus, stomach'],
    'upper endoscopy': ['esophagus, stomach'],
    'upper gi': ['esophagus, stomach'],
    'gastroscopy': ['esophagus, stomach'],
    'endoscopy': ['endoscope'],
    'ercp': ['bile or pancreatic duct', 'pancreatic duct'],
    'capsule endoscopy': ['capsule'],
    // Women's health and pregnancy (mostly Medicaid; see the panel's note)
    'pap': ['papanicolaou', 'cervical or vaginal cancer screening'],
    'pap smear': ['papanicolaou'],
    'pelvic exam': ['pelvic', 'cervical or vaginal cancer screening'],
    'mammogram': ['mammograph'],
    'mammography': ['mammograph'],
    'pregnancy': ['pregnant', 'fetal', 'fetus', 'obstetric', 'antepartum', 'postpartum', 'vaginal delivery', 'cesarean delivery'],
    'prenatal': ['pregnant', 'fetal', 'fetus', 'obstetric', 'antepartum'],
    'obstetric': ['pregnant', 'fetal', 'fetus', 'obstetric', 'antepartum', 'postpartum', 'vaginal delivery', 'cesarean delivery'],
    'ob': ['pregnant', 'fetal', 'fetus', 'obstetric', 'antepartum', 'postpartum', 'vaginal delivery', 'cesarean delivery'],
    'delivery': ['vaginal delivery', 'cesarean delivery'],
    'c section': ['cesarean'],
    'c-section': ['cesarean'],
    'cesarean': ['cesarean'],
    'hysterectomy': ['removal of uterus'],
    'iud': ['intrauterine'],
    // Imaging and tests
    'ultrasound': ['ultrasound'],
    'sonogram': ['ultrasound'],
    'mri': ['mri'],
    'ct': ['ct scan', 'ct of'],
    'cat scan': ['ct scan', 'ct of'],
    'x-ray': ['x-ray'],
    'xray': ['x-ray'],
    'ekg': ['electrocardiogram', 'ekg'],
    'ecg': ['electrocardiogram', 'ekg'],
    'echo': ['echocardiograph', 'ultrasound of heart'],
    'echocardiogram': ['echocardiograph', 'ultrasound of heart'],
    'stress test': ['stress test'],
    'bone density': ['bone density'],
    'dexa': ['bone density', 'dxa'],
    'blood test': ['blood test'],
    'labs': ['blood test'],
    'urinalysis': ['urinalysis'],
    // Visits and common services
    'office visit': ['office or other outpatient visit'],
    'new patient': ['new patient'],
    'established patient': ['established patient'],
    'telehealth': ['telehealth', 'virtual'],
    'flu': ['influenza'],
    'flu shot': ['influenza'],
    'flu vaccine': ['influenza'],
    'vaccine': ['vaccine'],
    'covid': ['covid', 'sars-cov-2'],
    'physical therapy': ['therapy procedure using exercise', 'physical therapy'],
    'chemo': ['chemotherapy'],
    'chemotherapy': ['chemotherapy'],
    'dialysis': ['dialysis'],
    'cataract': ['cataract'],
    'injection': ['injection'],
    'biopsy': ['biopsy'],
    'mohs': ['removal and microscopic exam'],
    'knee replacement': ['replacement of knee'],
    'hip replacement': ['hip joint with prosthesis', 'replacement of thigh bone and hip'],
    'cardiac cath': ['heart chamber', 'coronary artery'],
    'heart cath': ['heart chamber', 'coronary artery'],
    'stent': ['stent']
  };

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim(); }

  // Every alias key the query names, as whole words ("screening colonoscopy"
  // names "colonoscopy"; "colonic" does not name "colon").
  function aliasesIn(query) {
    var q = ' ' + norm(query).replace(/[^a-z0-9-]+/g, ' ') + ' ';
    return Object.keys(ALIASES).filter(function (k) { return q.indexOf(' ' + k + ' ') !== -1; });
  }

  function needles(query) {
    var q = norm(query);
    if (!q) return [];
    var out = [q];
    aliasesIn(q).forEach(function (k) { ALIASES[k].forEach(function (p) { if (out.indexOf(p) === -1) out.push(p); }); });
    return out;
  }

  // A test over any number of text fields.
  function match(query) {
    var n = needles(query);
    if (!n.length) return function () { return true; };
    return function () {
      for (var i = 0; i < arguments.length; i++) {
        var t = norm(arguments[i]);
        if (!t) continue;
        for (var j = 0; j < n.length; j++) if (t.indexOf(n[j]) !== -1) return true;
      }
      return false;
    };
  }

  var api = { ALIASES: ALIASES, aliasesIn: aliasesIn, needles: needles, match: match };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ProcedureSearch = api;
})(typeof window !== 'undefined' ? window : this);
