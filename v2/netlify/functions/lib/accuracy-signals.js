// accuracy-signals.js
// The scoring core of the Directory Accuracy Engine.
//
// Dependency-free and pure: no fetch, no Supabase, no clock of its own. Every
// input is passed in, including the year to reckon staleness against, so the
// same inputs always produce the same score and the whole thing is testable
// without a network. audit-run.js does the I/O and calls this.
//
// ---------------------------------------------------------------------------
// THE RULE THAT SHAPES EVERYTHING HERE: UNKNOWN IS NOT CLEAN.
//
// This is the fail-closed rule from the OIG screening work, applied to scoring.
// A provider we know nothing about must not score like a provider we have
// checked and found current. So a missing input contributes ZERO weight -- it
// never pushes the score up -- and it is still listed in `signals` with
// value 'unknown' so the narrative can disclose it rather than quietly omit it.
//
// And the output is a SCREENING SIGNAL, not a compliance determination. Only
// ~10.5% of LEIE records carry a usable NPI, Medicare claims say nothing about
// a paediatric or OB practice, and an address can be stale in the source
// directory while the provider is perfectly active. Everything here surfaces
// candidates for a human to check.
// ---------------------------------------------------------------------------

'use strict';

// Hand-weighted and explainable on purpose. An ML layer would score better on
// paper and be unarguable in a payer meeting, which is the wrong trade at v1 --
// every number here has to survive "why did you flag my provider?".
const W = { strong: 0.30, moderate: 0.15, mild: 0.08, weak: 0.05, none: 0 };

// The prior for a provider we know nothing about. Deliberately mid-scale: with
// no evidence the honest answer is "unverifiable", not "probably fine".
// This is the logistic midpoint -- net evidence of 0 scores exactly here.
const BASE = 0.5;

// Evidence is combined through a logistic rather than a clamped sum.
//
// The first version summed signed weights and clamped to [0,1]. A
// fully-corroborated provider summed to 1.72, so roughly 0.7 of positive
// evidence was being thrown away at the clamp -- and any negative that landed
// on such a provider was absorbed by that headroom and clamped straight back
// to 1.0. A deactivated NPI literally did not lower the score, and three
// different staleness grades all produced 1.0. The tests caught it.
//
// A logistic keeps the score strictly monotonic in the net evidence: every
// negative always moves the number down, however much positive evidence sits
// alongside it, and the curve flattens rather than hitting a wall.
const STEEPNESS = 1.5;
const logistic = net => 1 / (1 + Math.exp(-STEEPNESS * net));

// Beyond this, the directory address and the registry address are describing
// different places. ~2km tolerates geocoder imprecision and big campuses
// without waving through a listing that points at the wrong town.
const ADDRESS_TOLERANCE_KM = 2;

// Above this a provider is treated as confirmed-current; below the floor there
// is too little to stand behind.
const ACCURATE_AT = 0.70;
const UNKNOWN_CAP = 0.35;

// Medicare claims data does not meaningfully predate this, so anything earlier
// is a bad import rather than a very old provider.
const MIN_PLAUSIBLE_YEAR = 1990;

const clamp01 = n => Math.max(0, Math.min(1, n));
const round2 = n => Math.round(n * 100) / 100;

/**
 * @param {object} inputs
 * @param {object|null} inputs.nppes    { status, enumeration_date, last_updated, address }
 * @param {object|null} inputs.leie     { npi_match: bool, name_state_match: bool }
 * @param {object|null} inputs.activity npi_activity row
 * @param {object|null} inputs.ndf      { present: bool, address }
 * @param {object|null} inputs.geocode  { directory_geocoded: bool, distance_km: number|null }
 * @param {object|null} inputs.claimed  { claimed: bool, verified_location: bool, address_matches: bool }
 * @param {number} [inputs.asOfYear]    year to reckon staleness against; pass it in tests
 * @returns {{confidence:number, verdict:string, signals:Array}}
 */
function scoreProvider(inputs) {
  const i = inputs || {};
  const asOf = Number.isFinite(i.asOfYear) ? i.asOfYear : new Date().getUTCFullYear();

  const signals = [];
  const add = (name, value, weight, direction, detail) =>
    signals.push({ name, value, weight, direction, detail });
  const unknown = (name, detail) => add(name, 'unknown', W.none, 'none', detail);

  // Two findings that must OVERRIDE the arithmetic, not merely nudge it.
  // Without these, a provider with enough positive evidence scored high enough
  // to be reported as "likely accurate" while carrying a dead NPI or an open
  // exclusion flag -- the single worst thing this report could tell a payer.
  let registryDead = false;   // NPPES says the NPI is deactivated
  let needsReview = false;    // OIG name+state hit awaiting human confirmation

  // ---- 1. OIG exclusion --------------------------------------------------
  // An NPI match short-circuits everything. Nothing a provider does elsewhere
  // makes an active federal exclusion less disqualifying, so there is no sum
  // to compute and no way for other signals to dilute it.
  if (i.leie && i.leie.npi_match) {
    add('oig_exclusion', 'npi_match', W.strong, 'negative',
      'NPI matches an active OIG LEIE exclusion record. High confidence: NPI matching has few false positives.');
    return { confidence: 0, verdict: 'excluded', signals };
  }
  if (!i.leie) {
    unknown('oig_exclusion', 'No exclusion data supplied; exclusion status unknown, not cleared.');
  } else if (i.leie.name_state_match) {
    // Deliberately weaker than an NPI match. last+first+state collides for
    // 1,120 real combinations, so this flags for review; it never condemns.
    add('oig_exclusion', 'name_state_match', W.moderate, 'negative',
      'Name and state match an OIG exclusion record, but not the NPI. Name matches collide often and need human confirmation.');
    needsReview = true;
  } else {
    add('oig_exclusion', 'no_match', W.weak, 'positive',
      'No OIG exclusion match. Note only ~10.5% of LEIE records carry an NPI, so this is weak evidence.');
  }

  // ---- 2. NPPES registry status ------------------------------------------
  if (!i.nppes || !i.nppes.status) {
    unknown('nppes_status', 'Provider not found in NPPES, or status not supplied.');
  } else if (String(i.nppes.status).toUpperCase() === 'D') {
    // Deactivated NPIs stay in the registry forever, so existence is not
    // validity -- the same rule auth-register-provider.js enforces at signup.
    add('nppes_status', 'deactivated', W.strong, 'negative',
      'NPPES lists this NPI as deactivated. Deactivated NPIs remain in the registry indefinitely.');
    registryDead = true;
  } else {
    add('nppes_status', 'active', W.weak, 'positive',
      'NPPES lists this NPI as active. Registry presence alone says nothing about whether the provider still practises here.');
  }

  // ---- 3. Behavioural activity -------------------------------------------
  const act = i.activity || null;

  // Sanity-check the year before reasoning about it. A stored 0 (or any other
  // implausible value) previously computed an age of 2026 years, graded a
  // strong negative, and produced a confident `likely_inactive` verdict on a
  // provider who was PECOS-enrolled and NPPES-active -- a false positive that
  // reached a payer-facing report. A value we cannot believe is UNKNOWN, which
  // is the fail-closed answer, not evidence of inactivity.
  const rawYear = act ? Number(act.last_medicare_activity_year) : NaN;
  const plausibleYear = Number.isFinite(rawYear) &&
    rawYear >= MIN_PLAUSIBLE_YEAR && rawYear <= asOf + 1;
  const lastYear = plausibleYear ? rawYear : null;
  const yearWasGarbage = act != null &&
    act.last_medicare_activity_year != null && !plausibleYear;
  const pecos = act && typeof act.pecos_enrolled === 'boolean' ? act.pecos_enrolled : null;

  let activityNegative = false;
  if (lastYear === null) {
    unknown('medicare_activity',
      yearWasGarbage
        ? `Activity row records an implausible service year (${act.last_medicare_activity_year}); treated as unknown rather than as evidence of inactivity. The import for this NPI needs re-checking.`
        : act
          ? 'Activity row exists but records no Medicare service year. Many providers legitimately bill no Medicare (paediatrics, OB).'
          : 'No Medicare activity data for this NPI. Absence is not evidence of inactivity.');
  } else {
    const age = asOf - lastYear;
    if (age <= 2) {
      add('medicare_activity', `last_${lastYear}`, W.strong, 'positive',
        `Billed Medicare services in ${lastYear}, within the last two data years.`);
    } else if (age <= 4) {
      add('medicare_activity', `last_${lastYear}`, W.mild, 'negative',
        `Last Medicare activity was ${lastYear}, ${age} years before the reference year.`);
      activityNegative = true;
    } else {
      add('medicare_activity', `last_${lastYear}`, W.strong, 'negative',
        `Last Medicare activity was ${lastYear}, ${age} years before the reference year.`);
      activityNegative = true;
    }
  }

  if (pecos === null) {
    unknown('pecos_enrolment', 'PECOS enrolment not supplied for this NPI.');
  } else if (pecos) {
    add('pecos_enrolment', 'enrolled', W.moderate, 'positive',
      'Present in the PECOS Order & Referring file, i.e. currently enrolled and eligible to order or refer.');
  } else {
    // Not in the file is weak evidence: plenty of enrolled providers never
    // order or refer. Listed, but it does not pull the score down on its own.
    add('pecos_enrolment', 'not_listed', W.none, 'none',
      'Not in the PECOS Order & Referring file. Weak signal: many enrolled providers never order or refer.');
  }

  // ---- 4. Claimed ProviderPulse listing -----------------------------------
  // Our own attestation layer is itself a signal, and worth saying so plainly:
  // a provider who signed in, verified their NPI and confirmed this address is
  // the strongest evidence available that the entry is current.
  const cl = i.claimed || null;
  let claimedConfirms = false;
  if (!cl) {
    unknown('claimed_listing', 'Claimed-listing status not supplied.');
  } else if (cl.claimed && cl.verified_location && cl.address_matches) {
    claimedConfirms = true;
    add('claimed_listing', 'verified_match', W.strong, 'positive',
      'A verified ProviderPulse listing confirms this address. The provider attested to it directly against an NPPES-verified location.');
  } else if (cl.claimed && cl.address_matches) {
    add('claimed_listing', 'self_reported_match', W.moderate, 'positive',
      'A claimed ProviderPulse listing reports this address, but it is self-reported rather than NPPES-verified.');
  } else if (cl.claimed) {
    add('claimed_listing', 'claimed_other_address', W.moderate, 'negative',
      'The provider has a claimed listing, but none of their locations match the audited address.');
  } else {
    add('claimed_listing', 'unclaimed', W.none, 'none',
      'No claimed ProviderPulse listing. Most providers have not registered, so this carries no weight.');
  }

  // ---- 5. Address checks ---------------------------------------------------
  const g = i.geocode || null;
  let addressNegative = false;
  if (!g || typeof g.directory_geocoded !== 'boolean') {
    unknown('directory_address', 'Directory address was not geocode-checked.');
  } else if (!g.directory_geocoded) {
    add('directory_address', 'not_found', W.moderate, 'negative',
      'The directory address could not be geocoded, which usually means it is malformed or no longer exists.');
    addressNegative = true;
  } else {
    add('directory_address', 'geocoded', W.weak, 'positive',
      'The directory address resolves to a real location.');
  }

  const dist = g && Number.isFinite(Number(g.distance_km)) ? Number(g.distance_km) : null;
  if (dist === null) {
    unknown('address_agreement', 'Distance to the NPPES address not available; one or both addresses did not geocode.');
  } else if (dist > ADDRESS_TOLERANCE_KM) {
    add('address_agreement', 'diverges', W.moderate, 'negative',
      `Directory address is ${dist.toFixed(1)} km from the NPPES practice address (tolerance ${ADDRESS_TOLERANCE_KM} km).`);
    addressNegative = true;
  } else {
    add('address_agreement', 'agrees', W.moderate, 'positive',
      `Directory address is ${dist.toFixed(1)} km from the NPPES practice address, within tolerance.`);
  }

  // ---- 6. CMS National Downloadable File ----------------------------------
  const ndf = i.ndf || null;
  if (!ndf || typeof ndf.present !== 'boolean') {
    unknown('cms_ndf', 'CMS National Downloadable File not consulted for this NPI.');
  } else if (ndf.present) {
    add('cms_ndf', 'present', W.weak, 'positive',
      'Listed in the CMS National Downloadable File.');
  } else {
    add('cms_ndf', 'absent', W.weak, 'negative',
      'Not found in the CMS National Downloadable File.');
  }

  // ---- Combine -------------------------------------------------------------
  let net = 0;
  for (const s of signals) {
    if (s.direction === 'positive') net += s.weight;
    else if (s.direction === 'negative') net -= s.weight;
  }
  let confidence = clamp01(logistic(net));

  // Caps. Each is a ceiling that other evidence cannot argue away, and each is
  // recorded as its own signal so the report can show exactly what limited the
  // score rather than leaving an unexplained number.
  const cap = (limit, name, detail) => {
    const capped = Math.min(confidence, limit);
    if (capped < confidence) {
      add(name, 'applied', round2(confidence - capped), 'negative', detail);
      confidence = capped;
    }
  };

  // Nothing behavioural corroborates this provider at all, so whatever the
  // address signals say, we cannot call the entry accurate.
  const noBehaviouralEvidence = lastYear === null && pecos !== true && !claimedConfirms;
  if (noBehaviouralEvidence) {
    cap(UNKNOWN_CAP, 'unverifiable_cap',
      `No Medicare activity, no PECOS enrolment and no verified claimed listing: confidence capped at ${UNKNOWN_CAP}.`);
  }
  // A deactivated NPI is not a matter of degree. Whatever else looks healthy,
  // the registration behind this entry is dead.
  if (registryDead) {
    cap(UNKNOWN_CAP, 'deactivated_cap',
      `NPI is deactivated in NPPES: confidence capped at ${UNKNOWN_CAP} regardless of other evidence.`);
  }
  // An open exclusion flag is unresolved, not benign. It must not be reported
  // as accurate before a human has cleared or confirmed the name match.
  if (needsReview) {
    cap(BASE, 'exclusion_review_cap',
      `Unresolved OIG name/state match: confidence capped at ${BASE} pending human review.`);
  }
  confidence = round2(confidence);

  // ---- Verdict -------------------------------------------------------------
  // Strictly ordered, most severe first. The two overrides come before the
  // arithmetic because they are categorical findings, not weighed evidence:
  // no amount of positive corroboration makes a dead NPI current, and none
  // clears an outstanding exclusion flag.
  let verdict;
  if (registryDead) verdict = 'likely_inactive';
  else if (activityNegative) verdict = 'likely_inactive';
  else if (needsReview) verdict = 'unverifiable';
  else if (noBehaviouralEvidence) verdict = 'unverifiable';
  else if (addressNegative) verdict = 'likely_stale';
  else if (confidence >= ACCURATE_AT) verdict = 'likely_accurate';
  else verdict = 'unverifiable';

  return { confidence, verdict, signals };
}

module.exports = {
  scoreProvider,
  // Exported for the tests and for the report's methodology appendix, so the
  // thresholds are quoted from one place rather than restated.
  WEIGHTS: W,
  BASE,
  ADDRESS_TOLERANCE_KM,
  ACCURATE_AT,
  UNKNOWN_CAP
};
