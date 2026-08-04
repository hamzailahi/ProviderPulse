// A claimed listing must not be recommended for a specialty it does not practise.
// Regression: the one registered Family Medicine practice was injected into
// every search in its ZIP, including cardiology and dermatology.
//
// node scripts/test-claimed-relevance.mjs

const taxNorm = s => String(s || '')
  .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

function practisesAny(specialty, terms) {
  const s = taxNorm(specialty);
  if (!s) return false;
  for (const t of (terms || [])) {
    const term = taxNorm(t);
    if (!term) continue;
    if ((' ' + s).includes(' ' + term) || (' ' + term).includes(' ' + s)) return true;
  }
  return false;
}

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };

console.log('1. THE REPORTED BUG: a Family Medicine practice must not answer unrelated searches');
const FM = 'Family Medicine';
for (const searched of [
  ['Cardiovascular Disease'], ['Dermatology'], ['Orthopaedic Surgery'],
  ['Psychiatry'], ['Ophthalmology'], ['Oncology'], ['Podiatry'],
  ['Gastroenterology'], ['Neurology'], ['Urology'], ['Dentistry']
]) {
  check(`not injected for ${searched[0]}`, !practisesAny(FM, searched));
}

console.log('\n2. But it MUST still answer the searches it does practise');
for (const searched of [['Family Medicine'], ['Family Medicine', 'Internal Medicine']]) {
  check(`injected for ${searched.join(' / ')}`, practisesAny(FM, searched));
}
check('long registered form matches a short search term',
  practisesAny('Family Medicine Physician', ['Family Medicine']));
check('short registered form matches a long search term',
  practisesAny('Family Medicine', ['Family Medicine Physician']));
check('matches when it is one of several searched terms',
  practisesAny('Family Medicine', ['Cardiovascular Disease', 'Family Medicine']));

console.log('\n3. Coincidental substrings must not match');
check('Urology search does not pull in Neurology', !practisesAny('Neurology', ['Urology']));
check('Neurology search does not pull in Urology', !practisesAny('Urology', ['Neurology']));
check('Cardiology is not matched by Radiology', !practisesAny('Radiology', ['Cardiology']));
check('Internal Medicine is not matched by Medicine alone being a word',
  !practisesAny('Sports Medicine', ['Internal Medicine']));

console.log('\n4. Unknown specialty is never a match (fail closed)');
for (const empty of [null, undefined, '', '   ', 0, false]) {
  check(`rejects ${JSON.stringify(empty)}`, !practisesAny(empty, ['Family Medicine']));
}
check('no search terms means no injection', !practisesAny('Family Medicine', []));
check('null terms is safe', !practisesAny('Family Medicine', null));
check('terms containing empty strings are skipped', !practisesAny('Family Medicine', ['', '  ']));

console.log('\n5. Normalisation');
check('case insensitive', practisesAny('FAMILY MEDICINE', ['family medicine']));
check('punctuation absorbed', practisesAny('Obstetrics & Gynecology', ['Obstetrics and Gynecology']));
check('hyphens absorbed', practisesAny('Otolaryngology-Head and Neck', ['Otolaryngology']));
check('extra whitespace absorbed', practisesAny('  Family   Medicine  ', ['Family Medicine']));

console.log('\n6. Realistic end-to-end shape');
{
  // One claimed listing in the ZIP, as we actually have.
  const claimed = [{ npi: '1669794574', specialty: 'Family Medicine', name: 'Collierville Family Medicine PC' }];
  const inject = terms => claimed.filter(c => practisesAny(c.specialty, terms)).map(c => c.npi);
  check('cardiology search injects nothing', inject(['Cardiovascular Disease']).length === 0);
  check('dermatology search injects nothing', inject(['Dermatology']).length === 0);
  check('family medicine search injects it', inject(['Family Medicine']).length === 1);
  check('a multi-term search including FM injects it',
    inject(['Pediatrics', 'Family Medicine']).length === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
