/* procedure-finder.js — "who does this procedure near me" for the patient app.
 *
 * A patient types a procedure ("colonoscopy", "cataract surgery"); the app
 * lists the clinicians and centers near them who billed traditional Medicare
 * for it in 2024, most first, from cms_procedures_full (CMS's
 * by-provider-and-service file; codes under 11 patients are not published).
 * PROCEDURES maps plain words to the HCPCS codes CMS uses (and to the patient
 * specialty that usually does them, for "see all"); every code is
 * checked against supabase/reference/procedure-codes.csv by
 * scripts/test-procedure-finder.mjs, so a typo cannot silently find nothing.
 *
 * match(text) -> a procedure or null (its words as whole words in the text).
 * summarize(rows) -> one entry per NPI: services (times billed), the most
 * patients on any one code (a floor on people seen: patients are counted per
 * code, so adding codes would count one person twice), the codes billed, and
 * the name and place CMS lists. Most services first.
 *
 * Dual-exported: window.ProcedureFinder in the browser, module.exports in Node.
 */
(function (root) {
  'use strict';

  var PROCEDURES = [
    { label: 'Colonoscopy', specialty: 'Digestive / gastroenterology', words: ['colonoscopy', 'colonoscopies', 'colon cancer screening', 'colon screening', 'polyp removal'],
      codes: ['45378', '45380', '45384', '45385', 'G0105', 'G0121'] },
    { label: 'Upper endoscopy (EGD)', specialty: 'Digestive / gastroenterology', words: ['egd', 'upper endoscopy', 'gastroscopy', 'upper gi scope'], codes: ['43235', '43239'] },
    { label: 'Cataract surgery', specialty: 'Eye care', words: ['cataract', 'cataracts', 'cataract surgery'], codes: ['66984', '66982'] },
    { label: 'Knee replacement', specialty: 'Orthopedics & sports injury', words: ['knee replacement', 'total knee'], codes: ['27447'] },
    { label: 'Hip replacement', specialty: 'Orthopedics & sports injury', words: ['hip replacement', 'total hip'], codes: ['27130'] },
    { label: 'Knee arthroscopy', specialty: 'Orthopedics & sports injury', words: ['knee arthroscopy', 'knee scope', 'meniscus', 'torn meniscus'], codes: ['29881'] },
    { label: 'Mammogram', specialty: 'Imaging & lab', words: ['mammogram', 'mammograms', 'mammography', 'breast cancer screening'], codes: ['77067', '77063', '77066', '77065'] },
    { label: 'Bone density scan', specialty: 'Imaging & lab', words: ['bone density', 'dexa', 'dxa', 'osteoporosis screening'], codes: ['77080'] },
    { label: 'Echocardiogram', specialty: 'Heart / cardiology', words: ['echocardiogram', 'echo', 'heart ultrasound'], codes: ['93306'] },
    { label: 'Heart stress test', specialty: 'Heart / cardiology', words: ['stress test', 'cardiac stress test', 'nuclear stress test'], codes: ['93015', '93017', '78452'] },
    { label: 'Heart catheterization and stents', specialty: 'Heart / cardiology', words: ['heart cath', 'cardiac cath', 'cardiac catheterization', 'heart stent', 'stent', 'stents', 'angiogram'],
      codes: ['93458', '92928'] },
    { label: 'Carotid ultrasound', specialty: 'Imaging & lab', words: ['carotid ultrasound', 'carotid'], codes: ['93880'] },
    { label: 'Sleep study', specialty: 'Lung, breathing & sleep', words: ['sleep study', 'sleep test', 'polysomnography', 'polysomnogram'], codes: ['95810', '95811'] },
    { label: 'Allergy testing', specialty: 'Allergy & immunology', words: ['allergy test', 'allergy testing', 'skin prick test'], codes: ['95004'] },
    { label: 'Skin biopsy', specialty: 'Skin / dermatology', words: ['skin biopsy', 'mole biopsy', 'biopsy of a mole'], codes: ['11102', '11104'] },
    { label: 'Mohs surgery', specialty: 'Skin / dermatology', words: ['mohs', 'mohs surgery'], codes: ['17311'] },
    { label: 'Hearing test', specialty: 'Hearing & audiology', words: ['hearing test', 'audiogram', 'hearing exam'], codes: ['92557'] },
    { label: 'Joint injection', specialty: 'Orthopedics & sports injury', words: ['joint injection', 'knee injection', 'cortisone shot', 'cortisone injection', 'steroid shot'], codes: ['20610'] },
    { label: 'Spine injection', specialty: 'Pain management', words: ['epidural', 'epidural injection', 'spinal injection', 'back injection', 'nerve block'], codes: ['62323', '64483'] },
    { label: 'Carpal tunnel surgery', specialty: 'Orthopedics & sports injury', words: ['carpal tunnel'], codes: ['64721'] },
    { label: 'Cystoscopy', specialty: 'Urology', words: ['cystoscopy', 'bladder scope'], codes: ['52000'] },
    { label: 'Prostate biopsy', specialty: 'Urology', words: ['prostate biopsy'], codes: ['55700'] },
    { label: 'Medicare annual wellness visit', specialty: 'Primary care / family doctor', words: ['annual wellness visit', 'wellness visit', 'medicare wellness'], codes: ['G0438', 'G0439'] },
    { label: 'Eye exam', specialty: 'Eye care', words: ['eye exam', 'vision exam', 'eye checkup', 'dilated eye exam'], codes: ['92014', '92004'] },
    { label: 'Eye injections (macular degeneration)', specialty: 'Eye care', words: ['macular degeneration', 'eye injection', 'eye injections', 'wet amd'], codes: ['67028'] },
    { label: 'Botox for migraine', specialty: 'Brain & nerves / neurology', words: ['botox'], codes: ['64615'] },
    { label: 'Earwax removal', specialty: 'Ear, nose & throat', words: ['earwax', 'ear wax', 'earwax removal'], codes: ['69210'] },
    { label: 'Nasal endoscopy', specialty: 'Ear, nose & throat', words: ['nasal endoscopy', 'nose scope'], codes: ['31231'] }
  ];

  function norm(v) { return String(v || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }

  // Longest phrase wins, so "knee replacement" is not read as "knee" anything
  // else, and "stress test" beats a shorter word elsewhere.
  function match(text) {
    var t = ' ' + norm(text) + ' ', best = null, bestLen = 0;
    PROCEDURES.forEach(function (p) {
      p.words.forEach(function (w) {
        var n = norm(w);
        if (n.length > bestLen && t.indexOf(' ' + n + ' ') !== -1) { best = p; bestLen = n.length; }
      });
    });
    return best;
  }

  function num(v) { var n = Number(v); return isFinite(n) ? n : 0; }

  function summarize(rows) {
    var by = {};
    (rows || []).forEach(function (r) {
      if (!r || !r.npi) return;
      var k = String(r.npi);
      var e = by[k] || (by[k] = { npi: k, services: 0, patients: 0, codes: {}, name: '', credentials: '', org: false,
        specialty: '', address: '', city: '', state: '', zip: '' });
      var sv = num(r.tot_srvcs), pt = num(r.tot_benes), code = String(r.hcpcs_cd || '').toUpperCase();
      e.services += sv;
      if (pt > e.patients) e.patients = pt;
      e.codes[code] = (e.codes[code] || 0) + sv;
      if (!e.name) {
        e.org = r.entity_code === 'O';
        e.name = e.org ? String(r.provider_name || '') : [r.first_name, r.provider_name].filter(Boolean).join(' ');
        e.credentials = r.credentials || '';
        e.specialty = r.specialty || '';
        e.address = r.address1 || ''; e.city = r.city || ''; e.state = r.state || ''; e.zip = String(r.zip || '').slice(0, 5);
      }
    });
    return Object.keys(by).map(function (k) { return by[k]; })
      .sort(function (a, b) { return b.services - a.services || (a.npi < b.npi ? -1 : 1); });
  }

  // A provider's own Medicare codes beside the area's (the portal's "Medicare
  // footprint", 2026-10-25). mine: the provider's cms_procedures_full rows;
  // area: rows for the same codes in the ZIPs around them (theirs included).
  // Per code: what they billed (services, the largest place-of-service row's
  // patients, service-weighted average paid), how many clinicians and
  // centers in the area billed it and their services, the provider's share,
  // and the area's average paid split into the doctor's fee (entity I) and
  // the facility's (entity O), because a blended figure mixes them (45380:
  // about $236 blended, about $103 for the doctor). Top `top` codes by the
  // provider's services.
  function footprint(mine, area, npi, top) {
    var codes = {};
    (mine || []).forEach(function (r) {
      var k = String(r.hcpcs_cd || '').toUpperCase();
      if (!k) return;
      var c = codes[k] || (codes[k] = { code: k, description: r.hcpcs_desc || '', services: 0, patients: 0, paidSum: 0 });
      var sv = num(r.tot_srvcs);
      c.services += sv; c.paidSum += sv * num(r.avg_mdcr_pymt_amt);
      if (num(r.tot_benes) > c.patients) c.patients = num(r.tot_benes);
    });
    var list = Object.keys(codes).map(function (k) { return codes[k]; })
      .sort(function (a, b) { return b.services - a.services || (a.code < b.code ? -1 : 1); }).slice(0, top || 8);
    var want = {};
    list.forEach(function (c) { want[c.code] = { npis: {}, services: 0, iSv: 0, iPaid: 0, oSv: 0, oPaid: 0 }; });
    (area || []).forEach(function (r) {
      var a = want[String(r.hcpcs_cd || '').toUpperCase()];
      if (!a || !r.npi) return;
      var sv = num(r.tot_srvcs), paid = num(r.avg_mdcr_pymt_amt);
      a.npis[String(r.npi)] = true; a.services += sv;
      if (r.entity_code === 'O') { a.oSv += sv; a.oPaid += sv * paid; } else { a.iSv += sv; a.iPaid += sv * paid; }
    });
    return list.map(function (c) {
      var a = want[c.code], others = Object.keys(a.npis).filter(function (n) { return n !== String(npi); }).length;
      return {
        code: c.code, description: c.description, services: c.services, patients: c.patients,
        avg_paid: c.services ? c.paidSum / c.services : null,
        area_billers: others, area_services: a.services,
        // Their services can be in the area answer or not (a ZIP the lookup
        // missed); the share is of whichever total is larger, never over 100%.
        share: Math.max(a.services, c.services) ? c.services / Math.max(a.services, c.services) : null,
        doctor_fee: a.iSv ? a.iPaid / a.iSv : null, facility_fee: a.oSv ? a.oPaid / a.oSv : null
      };
    });
  }

  var API = { PROCEDURES: PROCEDURES, match: match, summarize: summarize, footprint: footprint };
  if (root) root.ProcedureFinder = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
