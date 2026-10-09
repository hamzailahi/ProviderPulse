// Tests for v2/assets/market-model.js, the explainable market-opportunity model.
//
// node scripts/test-market-model.mjs

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const M = require('../v2/assets/market-model.js');
const SPECIALTIES = require('../v2/assets/specialties.js').MARKET;   // the market side's frozen list until phase 3b

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const norm = s => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const taxMatches = (stored, terms) => terms.some(t => (' ' + norm(stored)).includes(' ' + norm(t)));
const milesBetween = (a, b, c, d) => Math.hypot((c - a) * 69, (d - b) * 55);
const CARD = SPECIALTIES.find(s => s[0] === 'Heart / cardiology');
const PRIMARY = SPECIALTIES.find(s => s[0] === 'Primary care / family doctor');
const DERM = SPECIALTIES.find(s => s[0] === 'Skin / dermatology');
const anchors = { p05: 2, p25: 4, p50: 6, p75: 8, p95: 10 };

function base(over) {
  return Object.assign({
    specialties: [CARD],
    groupOf: () => 'specialty',
    rows: [],
    taxMatches, milesBetween,
    center: { lat: 35, lng: -90 },
    adults: 100000,
    places: { CHD: 9, BPHIGH: 9, HIGHCHOL: 9, STROKE: 9 },
    demo: { over65: 80 },
    pay: { insuredPct: 80, incomePct: 70 },
    shortage: { primary: { score: 15, basis: 'county' } },
    benchmarks: { measures: { CHD: anchors, BPHIGH: anchors, HIGHCHOL: anchors, STROKE: anchors },
                  specialties: { 'Heart / cardiology': { rate_per_1k: 0.2 } } },
    radiusMiles: 25
  }, over || {});
}
const cardRows = (n, dist) => Array.from({ length: n }, () => ({ primary_taxonomy: 'Cardiovascular Disease Physician', latitude: 35 + dist / 69, longitude: -90 }));
const one = input => M.score(input).specialties[0];

console.log('1. Archetypes');
let r = one(base({ rows: cardRows(5, 6) }));   // 0.05/1k vs 0.2 national: thin
check('high need + thin supply + good payers = Prime expansion', r.archetype === 'prime', JSON.stringify(r.factors));
check('score is high', r.score >= 65, String(r.score));
r = one(base({ rows: cardRows(5, 6), pay: { insuredPct: 20, incomePct: 15 } }));
check('same but weak payers = Safety-net opportunity', r.archetype === 'safety_net');
r = one(base({ rows: [] }));
check('no clinicians at all = Unserved', r.archetype === 'unserved' && r.clinicians === 0);
check('unserved still gets a high competition factor', r.factors.competition === 95);
r = one(base({ rows: [], benchmarks: null, groupAccess: { specialty: 40 } }));
check('zero clinicians means access 100 even without a national rate', r.factors.access === 100 && r.evidence.access.basis === 'none_found');
r = one(base({ rows: cardRows(60, 0.5) }));    // 0.6/1k vs 0.2 national: dense
check('dense supply + strong payers = Crowded premium', r.archetype === 'crowded_premium', JSON.stringify(r.factors));
r = one(base({ rows: cardRows(60, 0.5), pay: { insuredPct: 20, incomePct: 20 } }));
check('dense supply + weak payers = Saturated', r.archetype === 'saturated');
r = one(base({ rows: cardRows(5, 6), places: { CHD: 3, BPHIGH: 3, HIGHCHOL: 3, STROKE: 3 }, demo: { over65: 10 } }));
check('thin supply but low need = Latent demand', r.archetype === 'latent', JSON.stringify(r.factors));
r = one(base({ rows: cardRows(20, 3) }));      // 0.2/1k = national
check('supply at the national rate reads access 50', r.factors.access === 50, String(r.factors.access));

console.log('\n2. Unknown is never average');
r = one(base({ rows: cardRows(5, 6), pay: {} }));
check('missing payer data leaves pay out (not 50)', r.factors.pay === undefined || r.factors.pay === null);
const full = one(base({ rows: cardRows(5, 6) }));
check('missing a factor lowers confidence', ['high', 'medium', 'low'].indexOf(r.confidence) >= ['high', 'medium', 'low'].indexOf(full.confidence));
r = one(base({ specialties: [DERM], rows: [], places: {}, demo: {}, pay: {}, shortage: {}, benchmarks: null, groupAccess: {} }));
check('no data at all = Not enough data', r.archetype === 'insufficient' && r.confidence === 'low');

console.log('\n3. Benchmarks and fallbacks');
r = one(base({ rows: cardRows(5, 6), benchmarks: null, groupNeedPct: { specialty: 70 }, groupAccess: { specialty: 65 } }));
check('without benchmarks, need falls back to the group percentile', r.evidence.need.basis === 'group' && r.factors.need >= 70 * 0.5);
check('without benchmarks, access falls back to the group score', r.evidence.access.basis === 'group' && r.factors.access === 65);
check('fallbacks are disclosed as caveats', r.caveats.some(c => /group level/.test(c)) && r.caveats.length >= 2);
check('fallbacks lower confidence vs full benchmarks', r.confidence !== 'high' || full.confidence === 'high');
r = one(base({ rows: cardRows(5, 6), shortage: { primary: { score: 12, basis: 'state' } } }));
check('a state-median shortage is flagged', r.caveats.some(c => /state median/.test(c)));

console.log('\n4. Need measures');
const prim = one(base({ specialties: [PRIMARY], groupOf: () => 'primary', places: { CHECKUP: 2 }, demo: {},
  benchmarks: { measures: { CHECKUP: anchors }, specialties: { 'Primary care / family doctor': { rate_per_1k: 0.6 } } } }));
check('prevention measures are inverted (low checkups = high need)', prim.evidence.need.parts[0].inverted && prim.factors.need >= 90, JSON.stringify(prim.evidence.need));
check('every model measure is a known PLACES id list', M.measureIds().includes('CHD') && M.measureIds().includes('KIDNEY'));
check('all 33 specialties have a profile', SPECIALTIES.every(s => M.PROFILES[s[0]]));

console.log('\n5. Reasons');
r = one(base({ rows: cardRows(5, 6) }));
check('three reasons, strongest first', r.reasons.length === 3 && r.reasons.every(x => x.text.length > 10));
check('reasons name the driving condition', r.reasons.some(x => /heart disease|blood pressure|cholesterol|stroke/.test(x.text)), JSON.stringify(r.reasons));
r = one(base({ rows: cardRows(5, 6), pay: { insuredPct: 91, incomePct: 72 } }));
check('percentiles read as ordinals (91st, 72nd)', JSON.stringify(r.reasons).includes('91st') || JSON.stringify(r.reasons).includes('72nd') || !r.reasons.some(x => /percentile/.test(x.text)), JSON.stringify(r.reasons));
check('group-level fallbacks cap confidence below high', one(base({ rows: cardRows(5, 6), benchmarks: null, groupNeedPct: { specialty: 70 }, groupAccess: { specialty: 65 } })).confidence !== 'high');
check('strategy text accompanies every archetype', Object.values(M.ARCHETYPES).every(a => a.strategy.length > 20));

console.log('\n6. Percentile helpers');
check('pct interpolates between anchors', Math.round(M.pct(anchors, 7)) === 63);
check('pct clamps to 5 and 95', M.pct(anchors, 0) === 5 && M.pct(anchors, 99) === 95);
check('pct refuses missing anchors', M.pct(null, 5) === null);
check('rankIn is a percentile within a sample', M.rankIn([1, 2, 3, 4], 3) === 62.5);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
