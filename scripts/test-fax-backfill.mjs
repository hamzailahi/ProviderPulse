// Fax backfill: parsing the NPPES monthly file for both entity types
// (scripts/nppes-fax.mjs), run against a tiny in-memory fixture instead of
// the real 9M-row file.
//
// node scripts/test-fax-backfill.mjs
import { spawnSync } from 'node:child_process';

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label}\n        got  ${g}\n        want ${w}`); }
};

const HEADER = ['NPI', 'Entity Type Code', 'NPI Deactivation Date', 'Provider Business Practice Location Address Fax Number'];
const csv = rows => [HEADER.join(','), ...rows.map(r => r.join(','))].join('\n') + '\n';

function run(rows) {
  const input = csv(rows);
  const res = spawnSync('node', ['scripts/nppes-fax.mjs'], { input, encoding: 'utf8', env: { ...process.env, NPPES_MIN_ROWS: '0' } });
  if (res.status !== 0) throw new Error('nppes-fax.mjs failed: ' + res.stderr);
  const lines = res.stdout.trim().split('\n');
  const stats = JSON.parse(res.stderr.trim().split('\n').pop());
  return { header: lines[0], rows: lines.slice(1).filter(Boolean), stats };
}

console.log('nppes-fax.mjs: both entity types, one pass');

{
  const { header, rows } = run([
    ['1111111111', '2', '', '2145551234'],   // organization, usable fax
    ['2222222222', '1', '', '2145555678'],   // individual, usable fax
  ]);
  eq('header names both columns', header, 'npi,entity,fax');
  eq('organization and individual both kept, tagged by entity', rows.sort(), ['1111111111,2,2145551234', '2222222222,1,2145555678']);
}

{
  const { rows, stats } = run([
    ['3333333333', '2', '2026-01-01', '2145551234'],  // deactivated: skipped
    ['4444444444', '1', '', ''],                        // blank fax: skipped
    ['5555555555', '2', '', '0000000000'],              // not a plausible number: skipped
    ['6666666666', '3', '', '2145551234'],              // entity type neither 1 nor 2: skipped
  ]);
  eq('deactivated, blank, implausible and other-entity rows are all dropped', rows, []);
  eq('each drop reason is counted, not silently merged', { deactivated: stats.deactivated, bad_fax: stats.bad_fax, with_fax: stats.with_fax },
    { deactivated: 1, bad_fax: 1, with_fax: 0 });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
