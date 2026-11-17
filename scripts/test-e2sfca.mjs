// node scripts/test-e2sfca.mjs: the E2SFCA access measure (scripts/lib/e2sfca.mjs).
import { gaussian, e2sfca, crudeRatio, accessFactor, catchmentFor, spearman } from './lib/e2sfca.mjs';
let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log('  PASS  ' + l); } else { fail++; console.log('  FAIL  ' + l + (d ? '\n        ' + d : '')); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;

check('weight is 1 at zero distance', near(gaussian(0, 30), 1));
check('weight is 0 at and past the catchment edge', gaussian(30, 30) < 1e-12 && gaussian(31, 30) === 0);
check('weight falls smoothly with distance', gaussian(10, 30) > gaussian(20, 30) && gaussian(20, 30) > 0);
check('unknown distance weighs nothing', gaussian(null, 30) === 0 && gaussian(NaN, 30) === 0);

// One isolated ZIP: access is supply over its own adults.
{
  const z = [{ zip: 'A', adults: 1000 }];
  const a = e2sfca(z, new Map([['A', 5]]), () => 0, 30);
  check('an isolated ZIP gets supply / adults', near(a.get('A'), 5 / 1000));
}
// Two ZIPs 10 minutes apart sharing one ZIP's clinicians.
{
  const z = [{ zip: 'A', adults: 1000 }, { zip: 'B', adults: 1000 }];
  const t = (x, y) => (x === y ? 0 : 10);
  const a = e2sfca(z, new Map([['A', 10]]), t, 30);
  check('the ZIP with the clinicians has better access than its neighbour', a.get('A') > a.get('B') && a.get('B') > 0);
  // Supply is conserved: sum of A_i * P_i equals total supply (a known E2SFCA property).
  const total = a.get('A') * 1000 + a.get('B') * 1000;
  check('E2SFCA conserves total supply across the population', near(total, 10, 1e-6), String(total));
  const far = e2sfca(z, new Map([['A', 10]]), (x, y) => (x === y ? 0 : 45), 30);
  check('a neighbour past the catchment gets nothing', far.get('B') === 0 && near(far.get('A'), 10 / 1000));
}
// Unroutable ZIP: unknown, never zero.
{
  const z = [{ zip: 'A', adults: 1000 }, { zip: 'I', adults: 500 }];
  const t = (x, y) => (x === y ? 0 : null);
  const a = e2sfca(z, new Map([['A', 3]]), (x, y) => (x === 'I' ? null : t(x, y)), 30);
  check('a ZIP with no road link to any supply is unknown (null), not zero', a.get('I') === null);
}
// Crude ratio: the 10-mile rule.
{
  const z = Array.from({ length: 12 }, (_, i) => ({ zip: 'Z' + i, adults: 100 }));
  const miles = (a, b) => Math.abs(+a.slice(1) - +b.slice(1)) * 3;   // 3 miles apart in a line
  const c = crudeRatio(z, new Map([['Z0', 12]]), miles);
  // Only 4 ZIPs within 10 miles, so it takes the nearest out to 25 miles: 9 here (0 to 24 miles).
  check('crude ratio widens to the nearest ZIPs within 25 miles when 10 miles holds too few', near(c.get('Z0'), 12 / 900), String(c.get('Z0')));
}
check('access factor: none is 100, national rate is 50, double is 0', accessFactor(0, 1) === 100 && accessFactor(1, 1) === 50 && accessFactor(2, 1) === 0);
check('access factor: unknown stays unknown', accessFactor(null, 1) === null && accessFactor(1, null) === null);
check('primary care has a 30-minute catchment, oncology 90, others 60', catchmentFor('Primary care / family doctor') === 30 && catchmentFor('Cancer care / oncology') === 90 && catchmentFor('Urology') === 60);
check('spearman: identical order is 1, reversed is -1', near(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1) && near(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
