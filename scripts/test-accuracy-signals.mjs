// Tests for the Directory Accuracy scoring module.
// Plain node, no framework: node scripts/test-accuracy-signals.mjs
//
// The reference year is passed explicitly in every case (asOfYear) so these
// do not start failing in January.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  scoreProvider, ACCURATE_AT, UNKNOWN_CAP, ADDRESS_TOLERANCE_KM
} = require('../v2/netlify/functions/lib/accuracy-signals.js');

const YEAR = 2026;
let pass = 0, fail = 0;

function check(label, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? '\n        ' + detail : ''}`); }
}
const sig = (r, name) => r.signals.find(s => s.name === name);
const names = r => r.signals.map(s => s.name).join(', ');

// A provider with everything working, used as the baseline to vary from.
const clean = {
  asOfYear: YEAR,
  nppes: { status: 'A', address: '1500 W Poplar Ave' },
  leie: { npi_match: false, name_state_match: false },
  activity: { last_medicare_activity_year: YEAR - 1, medicare_services_count: 1200, pecos_enrolled: true },
  ndf: { present: true },
  geocode: { directory_geocoded: true, distance_km: 0.2 },
  claimed: { claimed: true, verified_location: true, address_matches: true }
};

console.log('1. LEIE NPI match short-circuits');
{
  const r = scoreProvider({ ...clean, leie: { npi_match: true } });
  check('verdict is excluded', r.verdict === 'excluded', `got ${r.verdict}`);
  check('confidence forced to 0', r.confidence === 0, `got ${r.confidence}`);
  check('short-circuits before other signals are computed', r.signals.length === 1, `got ${r.signals.length}: ${names(r)}`);
  check('every positive signal is discarded', !r.signals.some(s => s.direction === 'positive'));
}

console.log('\n2. Clean, fully-corroborated provider');
{
  const r = scoreProvider(clean);
  check('verdict is likely_accurate', r.verdict === 'likely_accurate', `got ${r.verdict}`);
  check(`confidence >= ${ACCURATE_AT}`, r.confidence >= ACCURATE_AT, `got ${r.confidence}`);
  check('no unknown signals', !r.signals.some(s => s.value === 'unknown'), names(r));
}

console.log('\n3. Unknown inputs are listed, weigh nothing, and cap the score');
{
  const r = scoreProvider({ asOfYear: YEAR });   // nothing known at all
  const unknowns = r.signals.filter(s => s.value === 'unknown');
  check('unknown signals are disclosed, not omitted', unknowns.length >= 6, `got ${unknowns.length}`);
  check('every unknown carries zero weight', unknowns.every(s => s.weight === 0));
  check('every unknown is directionless', unknowns.every(s => s.direction === 'none'));
  check(`confidence capped at ${UNKNOWN_CAP}`, r.confidence <= UNKNOWN_CAP, `got ${r.confidence}`);
  check('verdict is unverifiable', r.verdict === 'unverifiable', `got ${r.verdict}`);
  check('unknown never scores as clean', r.verdict !== 'likely_accurate');
}

console.log('\n4. The cap applies even when address checks all pass');
{
  // Good address, zero behavioural evidence. Without the cap the address
  // positives alone would push this toward "accurate".
  const r = scoreProvider({
    asOfYear: YEAR,
    nppes: { status: 'A' },
    leie: { npi_match: false, name_state_match: false },
    geocode: { directory_geocoded: true, distance_km: 0.1 },
    ndf: { present: true },
    claimed: { claimed: false }
  });
  check(`capped to ${UNKNOWN_CAP}`, r.confidence <= UNKNOWN_CAP, `got ${r.confidence}`);
  check('verdict is unverifiable, not likely_accurate', r.verdict === 'unverifiable', `got ${r.verdict}`);
  check('the cap itself is disclosed as a signal', !!sig(r, 'unverifiable_cap'), names(r));
}

console.log('\n5. Deactivated NPPES status');
{
  const r = scoreProvider({ ...clean, nppes: { status: 'D' } });
  const s = sig(r, 'nppes_status');
  check('recorded as deactivated', s.value === 'deactivated', `got ${s.value}`);
  check('strong negative', s.direction === 'negative' && s.weight >= 0.3, JSON.stringify(s));
  check('drags confidence below a clean provider', r.confidence < scoreProvider(clean).confidence);
}

console.log('\n6. Stale activity grades by age');
{
  const recent = scoreProvider({ ...clean, activity: { last_medicare_activity_year: YEAR - 2, pecos_enrolled: true } });
  const mid    = scoreProvider({ ...clean, activity: { last_medicare_activity_year: YEAR - 4, pecos_enrolled: true } });
  const old    = scoreProvider({ ...clean, activity: { last_medicare_activity_year: YEAR - 9, pecos_enrolled: true } });
  check('<=2 years is positive', sig(recent, 'medicare_activity').direction === 'positive');
  check('3-4 years is a mild negative', sig(mid, 'medicare_activity').direction === 'negative' && sig(mid, 'medicare_activity').weight < 0.15);
  check('older is a strong negative', sig(old, 'medicare_activity').direction === 'negative' && sig(old, 'medicare_activity').weight >= 0.3);
  check('confidence decreases monotonically with age',
    recent.confidence > mid.confidence && mid.confidence > old.confidence,
    `${recent.confidence} / ${mid.confidence} / ${old.confidence}`);
  check('stale activity reads as likely_inactive', old.verdict === 'likely_inactive', `got ${old.verdict}`);
}

console.log('\n7. Address problems produce likely_stale, not likely_inactive');
{
  const far = scoreProvider({ ...clean, geocode: { directory_geocoded: true, distance_km: 25 },
    claimed: { claimed: false } });
  check('distance divergence is negative', sig(far, 'address_agreement').direction === 'negative');
  check('distance appears in the detail', /25\.0 km/.test(sig(far, 'address_agreement').detail), sig(far, 'address_agreement').detail);
  check('active provider + bad address = likely_stale', far.verdict === 'likely_stale', `got ${far.verdict}`);

  const nogeo = scoreProvider({ ...clean, geocode: { directory_geocoded: false, distance_km: null },
    claimed: { claimed: false } });
  check('un-geocodable address is negative', sig(nogeo, 'directory_address').direction === 'negative');
  check('un-geocodable address = likely_stale', nogeo.verdict === 'likely_stale', `got ${nogeo.verdict}`);

  const near = scoreProvider({ ...clean, geocode: { directory_geocoded: true, distance_km: ADDRESS_TOLERANCE_KM - 0.1 } });
  check('inside tolerance is positive', sig(near, 'address_agreement').direction === 'positive');
}

console.log('\n8. Inactive outranks stale when both are true');
{
  const r = scoreProvider({
    ...clean,
    activity: { last_medicare_activity_year: YEAR - 9, pecos_enrolled: false },
    geocode: { directory_geocoded: false, distance_km: null },
    claimed: { claimed: false }
  });
  check('verdict is likely_inactive', r.verdict === 'likely_inactive', `got ${r.verdict}`);
}

console.log('\n9. A claimed verified listing is the strongest corroboration');
{
  const base = { asOfYear: YEAR, nppes: { status: 'A' }, leie: { npi_match: false, name_state_match: false },
    geocode: { directory_geocoded: true, distance_km: 0.1 } };
  const unclaimed = scoreProvider({ ...base, claimed: { claimed: false } });
  const verified  = scoreProvider({ ...base, claimed: { claimed: true, verified_location: true, address_matches: true } });
  check('verified claim lifts confidence', verified.confidence > unclaimed.confidence,
    `${verified.confidence} vs ${unclaimed.confidence}`);
  check('verified claim alone lifts the unknown cap', verified.verdict !== 'unverifiable', `got ${verified.verdict}`);
  check('our attestation is named in the detail', /attested/i.test(sig(verified, 'claimed_listing').detail));

  const elsewhere = scoreProvider({ ...base, claimed: { claimed: true, verified_location: true, address_matches: false } });
  check('claimed at a different address is negative', sig(elsewhere, 'claimed_listing').direction === 'negative');
}

console.log('\n10. LEIE name+state flags without condemning');
{
  const r = scoreProvider({ ...clean, leie: { npi_match: false, name_state_match: true } });
  check('not excluded', r.verdict !== 'excluded', `got ${r.verdict}`);
  check('negative but weaker than an NPI match', sig(r, 'oig_exclusion').weight < 0.3);
  check('collision risk is disclosed', /collide/i.test(sig(r, 'oig_exclusion').detail));
}

console.log('\n11. A deactivated NPI can never read as accurate');
{
  // Regression: the arithmetic alone scored this 0.75 / likely_accurate,
  // because so much other evidence looked healthy. Telling a payer a dead
  // NPI is "likely accurate" is the worst output this report could produce.
  const r = scoreProvider({ ...clean, nppes: { status: 'D' } });
  check('verdict is likely_inactive', r.verdict === 'likely_inactive', `got ${r.verdict}`);
  check('never likely_accurate', r.verdict !== 'likely_accurate');
  check(`confidence capped at ${UNKNOWN_CAP}`, r.confidence <= UNKNOWN_CAP, `got ${r.confidence}`);
  check('the cap is disclosed', !!sig(r, 'deactivated_cap'), names(r));
  check('positive evidence cannot argue it away',
    scoreProvider({ ...clean, nppes: { status: 'D' } }).verdict ===
    scoreProvider({ asOfYear: YEAR, nppes: { status: 'D' }, leie: { npi_match: false } }).verdict);
}

console.log('\n12. An open exclusion flag is never reported as accurate');
{
  // Regression: scored 0.79 / likely_accurate. The whole point of the
  // name+state flag is to surface a candidate for human review.
  const r = scoreProvider({ ...clean, leie: { npi_match: false, name_state_match: true } });
  check('verdict is unverifiable', r.verdict === 'unverifiable', `got ${r.verdict}`);
  check('never likely_accurate', r.verdict !== 'likely_accurate');
  check('confidence held at or below the midpoint', r.confidence <= 0.5, `got ${r.confidence}`);
  check('the review cap is disclosed', !!sig(r, 'exclusion_review_cap'), names(r));
  check('still not "excluded" - the NPI did not match', r.verdict !== 'excluded');
}

console.log('\n13. Output contract');
{
  const r = scoreProvider(clean);
  check('confidence within 0-1', r.confidence >= 0 && r.confidence <= 1, `got ${r.confidence}`);
  check('verdict is from the enum the schema allows',
    ['likely_accurate','likely_stale','likely_inactive','excluded','unverifiable'].includes(r.verdict), r.verdict);
  check('every signal is fully decomposed',
    r.signals.every(s => 'name' in s && 'value' in s && 'weight' in s && 'direction' in s && 'detail' in s));
  check('every direction is valid', r.signals.every(s => ['positive','negative','none'].includes(s.direction)));
  check('deterministic for identical inputs',
    JSON.stringify(scoreProvider(clean)) === JSON.stringify(scoreProvider(clean)));
  check('tolerates an empty object', (() => { try { scoreProvider({}); return true; } catch { return false; } })());
  check('tolerates undefined', (() => { try { scoreProvider(); return true; } catch { return false; } })());
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
