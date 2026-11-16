// node scripts/test-fax-via-org.mjs: the "fax via organization" rule.
import { addressKey, matchFaxViaOrg } from './lib/fax-via-org.mjs';
let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  PASS  ' + l); } else { fail++; console.log('  FAIL  ' + l + (d ? '\n        ' + d : '')); } };
const K = addressKey('6019 WALNUT GROVE RD STE 200', 'TN', '38120-2113');
check('suite and ZIP+4 do not change the address', K === addressKey('6019 Walnut Grove Road', 'TN', '38120'), K);
check('a different house number is a different address', K !== addressKey('6025 WALNUT GROVE RD', 'TN', '38120'));
check('no house number gives no key', addressKey('PO BOX 12', 'TN', '38120') === null);
const orgs = new Map([
  ['1000000001', { name: 'BAPTIST MEMORIAL HOSPITAL', key: K, fax: '9012260001' }],
  ['1000000002', { name: 'OTHER CLINIC', key: addressKey('1 MAIN ST', 'TN', '38120'), fax: '9015550002' }],
  ['1000000003', { name: 'SECOND ENROLLMENT', key: K, fax: '9019990003' }]
]);
const pacOrgs = new Map([['P1', new Set(['1000000001'])], ['P2', new Set(['1000000002'])], ['P3', new Set(['1000000001', '1000000003'])]]);
const docs = new Map([['2000000001', K], ['2000000002', K], ['2000000003', K], ['2000000004', K]]);
const reassign = new Map([['2000000001', new Set(['P1'])], ['2000000002', new Set(['P2'])], ['2000000004', new Set(['P3'])]]);
const { matches, counts } = matchFaxViaOrg({ docs, reassign, pacOrgs, orgs });
const by = Object.fromEntries(matches.map(m => [m.npi, m]));
check('reassigned and at the same address: gets the organization fax, named', by['2000000001'] && by['2000000001'].fax === '9012260001' && by['2000000001'].org_name === 'BAPTIST MEMORIAL HOSPITAL');
check('reassigned but at another address: nothing', !by['2000000002']);
check('same address but no Medicare link: nothing', !by['2000000003']);
check('two qualifying organizations with different faxes: nothing', !by['2000000004'] && counts.ambiguous === 1);
check('counts add up', counts.matched === 1 && counts.with_reassignment === 3 && counts.same_address === 2, JSON.stringify(counts));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
