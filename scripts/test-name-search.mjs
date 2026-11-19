// node scripts/test-name-search.mjs: name search parsing and ranking (v2/assets/name-search.js).
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const N = require('../v2/assets/name-search.js');
let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  PASS  ' + l); } else { fail++; console.log('  FAIL  ' + l + (d ? '\n        ' + d : '')); } };

check('a 10-digit NPI is an NPI lookup', N.parse('1578527172').npi === '1578527172' && N.filter(N.parse('1578 527 172')) === 'npi=eq.1578527172');
check('titles and credentials are dropped', JSON.stringify(N.parse('Dr. John Smith, MD').tokens) === '["JOHN","SMITH"]');
check('words match in any order: one ilike per word', N.filter(N.parse('smith john')) === 'and=(name.ilike.*SMITH*,name.ilike.*JOHN*)');
check('one word uses a plain filter', N.filter(N.parse('baptist')) === 'name=ilike.*BAPTIST*');
check('a middle initial is kept for ranking but not sent', JSON.stringify(N.parse('John A Smith').server) === '["JOHN","SMITH"]' && N.parse('John A Smith').tokens.includes('A'));
check('only short words is an error, not a full-table scan', !!N.parse('Jo Li').error && !!N.parse('Dr. MD').error && !!N.parse('').error);
check('punctuation and apostrophes never reach the filter', N.filter(N.parse("O'Brien & Sons (Clinic)")) === 'and=(name.ilike.*OBRIEN*,name.ilike.*SONS*,name.ilike.*CLINIC*)');
const q = N.parse('john smith');
check('rank: whole words first', N.rank('JOHN SMITH', q) === 0 && N.rank('JOHN A SMITH', q) === 0);
check('rank: a word that starts a name word next', N.rank('JOHNNY SMITHERS', q) === 1);
check('rank: a word inside another last', N.rank('JOHN GOLDSMITH', q) === 2);
check('rank: a short word the database could not check filters here', N.rank('JOHN B SMITH', N.parse('John A Smith')) === -1 && N.rank('JOHN ADAM SMITH', N.parse('John A Smith')) === 1);
check('rank: clinic names match regardless of suffix', N.rank('BAPTIST MEMORIAL HOSPITAL-COLLIERVILLE', N.parse('baptist collierville')) === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
