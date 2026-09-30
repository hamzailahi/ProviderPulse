// Tests for v2/netlify/functions/lib/answer-check.js: every figure in an
// assistant answer must trace to a tool result, be derived from two traced
// figures on the same line, or be on a short list of things not worth checking.
//
// node scripts/test-answer-check.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { verifyText, extractNumbers } = require('../v2/netlify/functions/lib/answer-check.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

const SRC = [JSON.stringify({
  zip: '38138', per_1k: 13.904, score: 72, insured_rate: 0.938, adults: 410312, clinicians: 5,
  state_avg: 24.9, local: 5.1, catchment_adults: 4213000, hpsa: 14,
  all: [['Heart / cardiology', 72, 'Prime expansion', 'high', 4], ['Skin / dermatology', 40, 'Saturated', 'medium', 9]]
})];
const v = (text, extraAllowed) => verifyText(text, SRC, extraAllowed || []);
const bad = r => r.unverified.map(u => u.raw);

console.log('1. Figures that trace to a tool result');
check('an exact figure', v('The score is 72.').unverified.length === 0);
check('display rounding: 13.9 for 13.904', v('That is 13.9 listings per 1,000.').unverified.length === 0);
check('coarser rounding: 14 for 13.904', v('About 14 per 1,000.').unverified.length === 0);
check('a fraction shown as a percent: 93.8% for 0.938', v('93.8% are insured.').unverified.length === 0);
check('... and rounded: 94%', v('94% are insured.').unverified.length === 0);
check('a percent that is a whole-number source: 72%', v('It scores 72%.').unverified.length === 0);
check('thousands separators: 410,312', v('There are 410,312 adults.').unverified.length === 0);
check('rounded thousands: 410,000 for 410,312', v('About 410,000 adults.').unverified.length === 0);
check('a suffix: 4.2M for 4,213,000', v('A catchment of 4.2M adults.').unverified.length === 0);
check('a ZIP that appears in a result', v('ZIP 38138 is prime.').unverified.length === 0);
check('counts in the ranked table', v('| Heart / cardiology | 72 | 4 |').unverified.length === 0);

console.log('\n2. Figures that do not');
let r = v('There are 37 cardiologists.');
check('an invented count is flagged', bad(r).join() === '37', JSON.stringify(bad(r)));
check('an invented percent is flagged', bad(v('Demand is up 34% this year.')).join() === '34%');
check('a nearby ZIP is not "close enough"', bad(v('Also look at 38139.')).join() === '38139');
check('rounding cannot reach a different number: 4.4M vs 4,213,000', bad(v('About 4.4M adults.')).join() === '4.4M');
check('small numbers are not matched loosely: 50 is not 48', bad(v('Roughly 50 clinics.')).join() === '50');
check('a dollar figure with no source is flagged', bad(v('Rent is about $4,200 a month.')).join() === '$4,200');
check('a claim of five clinicians is checked (5 is in the data)', v('It has 5 clinicians.').unverified.length === 0);
check('... but 6 is not', bad(v('It has 6 clinicians.')).join() === '6');
check('each bad figure is reported with its line', v('Good: 72.\nBad: 91.').unverified[0].line === 'Bad: 91.');

console.log('\n3. Derived figures need their inputs on the same line');
check('a percent change from two traced figures', v('5.1 per 1,000 against 24.9 is 80% below the state average.').unverified.length === 0);
check('a difference', v('That is 19.8 lower (24.9 vs 5.1).').unverified.length === 0);
check('a ratio written as a multiple', v('24.9 against 5.1 is 4.9x.').unverified.length === 0);
check('the same result with the inputs on other lines is flagged', bad(v('State average 24.9.\nLocal 5.1.\nThat is 80% below.')).join() === '80%');
check('a result with no inputs at all is flagged', bad(v('That is 80% below the average.')).join() === '80%');
check('an untraced input spoils the derivation', bad(v('7.0 against 24.9 is 72% below.')).includes('72%') === false && bad(v('7.0 against 24.9 is 71% below.')).includes('7.0'));

console.log('\n4. Things that are not checked');
check('list numbering', v('1. First point\n2. Second point').unverified.length === 0);
check('"top 3"', v('Here are the top 3.').unverified.length === 0);
check('structure words: "3 reasons"', v('There are 3 reasons.').unverified.length === 0);
check('years', v('As of 2026.').unverified.length === 0);
check('the 0-100 scale', v('72 of 100 and 72/100.').unverified.length === 0);
check('identifiers: NPI-1 and Q3', v('NPI-1 listings in Q3.').unverified.length === 0);
check('exempt figures are counted, not silently dropped', v('1. A\nTop 3 in 2026.').exempt >= 3);

console.log('\n5. Other legitimate text');
check('the assistant\'s own documented method may be quoted', bad(v('Need carries a 30% weight.')).join() === '30%' && v('Need carries a 30% weight.', ['health need (30%)']).unverified.length === 0);
check('numbers the user typed are allowed back', v('For ZIP 38017:', ['zip: 38017']).unverified.length === 0);

console.log('\n6. Extraction');
const t = extractNumbers('Score 72, insured 93.8%, adults 410,312, $4.2M, 2.1x, ZIP 38138.');
check('reads integers, decimals, separators, suffixes and multiples', t.map(x => x.value).join() === '72,93.8,410312,4200000,2.1,38138', t.map(x => x.value).join());
check('reads percent and multiple flags', t[1].percent && t[4].multiple);
check('empty and non-string input is safe', verifyText('', SRC).checked === 0 && verifyText(null, SRC).checked === 0 && verifyText('72', null).unverified.length === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
