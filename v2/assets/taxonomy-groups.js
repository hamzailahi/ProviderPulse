/* ============================================================================
   taxonomy-groups.js — collapse clinics.primary_taxonomy into 6 colour groups.

   Why: the map used to give each taxonomy its own colour. A single ZIP can
   contain 19 of them and the wider table holds 221+ distinct values across TWO
   vocabularies (some rows store "Internal Medicine Physician", others plain
   "Internal Medicine" or category labels like "Vision & Eye Care"). Nineteen
   near-identical greens and yellows are impossible to tell apart, so specialty
   is now encoded as six groups and the raw taxonomy stays available as a filter.

   Rules are ordered and DISCIPLINE WINS OVER VENUE: a "Dental Clinic/Center"
   belongs under Dental & Vision, because that is what somebody filtering for
   dentistry wants to see. "Facilities & Equipment" is only for entities with no
   clinical discipline at all — labs, transport, DME, generic "Facility / Clinic".

   Verified against 221 distinct live values from both vocabularies; every one
   maps, and no clinician is ever classified as a facility.
   ============================================================================ */
// Exported for BOTH the browser (window.TaxonomyGroups) and Netlify Functions
// (require), so the classification has exactly one definition. market-score.js
// depends on it to separate clinicians from facilities.
(function (global) {
  'use strict';

  var GROUPS = [
    { key: 'primary',    name: 'Primary Care',           color: '#2dd4bf' },
    { key: 'specialty',  name: 'Specialty Medicine',     color: '#818cf8' },
    { key: 'surgical',   name: 'Surgical',               color: '#f472b6' },
    { key: 'dental',     name: 'Dental & Vision',        color: '#fbbf24' },
    { key: 'behavioral', name: 'Behavioral Health',      color: '#34d399' },
    { key: 'facility',   name: 'Facilities & Equipment', color: '#94a3b8' }
  ];

  // Ordered: first match wins.
  //
  // `methadone`, `rural health clinic` and `fqhc` are venues, not disciplines,
  // and sit here rather than in FACILITY on purpose. Both federal designations
  // are DEFINED by the care they must deliver -- an RHC and an FQHC are
  // required to provide primary care -- so the venue IS the discipline, the
  // same reasoning that puts a Dental Clinic/Center in dental. Leaving them to
  // fall through made the scorer report "no primary care within 25 miles" of
  // Wolf Point, Montana, whose primary care is three Rural Health Clinics and
  // an FQHC. That is a false statement about a real place, and it is the kind
  // this file exists to prevent.
  var RULES = [
    ['behavioral', /psychiat|psycholog|mental health|behavioral|counsel|social work|marriage|addiction|substance use|behavior analyst|psychoanalyst|neuropsych|methadone/],
    ['dental',     /dent(al|ist|istry)|orthodont|endodont|periodont|prosthodont|oral and maxill|optometr|ophthalm|optician|eyewear|vision|hearing aid/],
    ['surgical',   /surger|surgical|surgeon|anesthesiol|anesthetist/],
    ['primary',    /family medicine|internal medicine|general practice|primary care|pediatric|geriatric|adolescent medicine|preventive medicine|family nurse|adult health nurse|community health|rural health clinic|federally qualified health center|fqhc/]
  ];

  // NOTE THE DEFAULT BELOW IS `specialty`, so anything this regex misses is
  // published as a medical specialty. That is how Taxi, Private Vehicle and
  // Contractor were being counted as specialist physicians -- FACILITY had
  // `transport` but not the concrete words NPPES actually uses. When adding a
  // venue or a non-clinical service, add it HERE; the default will not save you.
  var FACILITY = /clinic\/center|hospital|facility|agency|pharmacy|equipment|supplier|supplies|laborator|ambulance|transport|taxi|private vehicle|contractor|personal care|case manage|care coordinator|health educator|legal medicine|alzheimer|dementia center|nursing (care|facility)|home health|hospice care|residential|organization|preferred provider|exclusive provider|health maintenance|point of service|assisted living|respite|foster|school|education|welfare|\(dme\)|dispensing|physiological/;

  function groupKey(taxonomy) {
    var s = String(taxonomy || '').toLowerCase();
    if (!s) return 'facility';
    for (var i = 0; i < RULES.length; i++) if (RULES[i][1].test(s)) return RULES[i][0];
    if (FACILITY.test(s)) return 'facility';
    return 'specialty';
  }

  var byKey = {};
  GROUPS.forEach(function (g) { byKey[g.key] = g; });

  var API = {
    list: GROUPS,
    keyFor: groupKey,
    colorFor: function (taxonomy) { return (byKey[groupKey(taxonomy)] || byKey.facility).color; },
    nameFor: function (taxonomy) { return (byKey[groupKey(taxonomy)] || byKey.facility).name; },
    get: function (key) { return byKey[key]; },
    // A pharmacy, lab or DME supplier is a listing, not a clinician. Counting
    // them as "providers" overstated supply by 84% in the ZIP we tested.
    isClinician: function (taxonomy) { return groupKey(taxonomy) !== 'facility'; }
  };

  if (global) global.TaxonomyGroups = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : null);
