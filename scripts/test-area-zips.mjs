// Tests for v2/assets/area-zips.js: which ZIPs a city search leaves out.
// A ZIP is stray only with under 1% of the listings AND more than 25 miles
// from every ZIP that carries 1% or more.
//
// node scripts/test-area-zips.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { strayZips } = require('../v2/assets/area-zips.js');

let pass = 0, fail = 0;
const check = (l, c, d) => { if (c) { pass++; console.log(`  PASS  ${l}`); } else { fail++; console.log(`  FAIL  ${l}${d ? '\n        ' + d : ''}`); } };
const at = (zip, n, lat, lon) => Array.from({ length: n }, () => ({ zip, latitude: lat, longitude: lon }));

// Fort Worth as the live audit saw it: a big core, small edge ZIPs nearby, and
// a handful of mis-addressed listings in Austin, West Virginia and Stephenville.
const fw = [
  ...at('76104', 3000, 32.73, -97.32), ...at('76132', 900, 32.67, -97.41), ...at('76107', 800, 32.74, -97.38),
  ...at('76177', 400, 32.95, -97.32), ...at('76244', 500, 32.93, -97.25),
  ...at('76199', 3, 32.74, -97.33),        // a PO-box ZIP inside the city: tiny but close
  ...at('76179', 30, 32.88, -97.43),       // an edge ZIP under 1% but 10 miles out: kept
  ...at('78705', 2, 30.29, -97.74),        // Austin
  ...at('26109', 1, 39.0, -80.9),          // West Virginia
  ...at('76401', 4, 32.22, -98.20),        // Stephenville, ~60 miles
  ...at('76100', 2, '', '')                // no coordinates: distance unknown, kept
];
let r = strayZips(fw);
check('far-off ZIPs with a few listings are left out', r.stray.join() === '26109,76401,78705', r.stray.join());
check('their listings are counted', r.listings === 7);
check('a tiny ZIP inside the city stays', !r.stray.includes('76199'));
check('an edge ZIP under 1% but near the core stays', !r.stray.includes('76179'));
check('a ZIP with no coordinates stays (unknown is not far)', !r.stray.includes('76100'));

// Two cities far apart ("Dallas, Austin"): both cores and their small ZIPs stay.
const two = [...at('75201', 2000, 32.78, -96.80), ...at('75204', 10, 32.80, -96.79), ...at('78701', 2000, 30.27, -97.74), ...at('78704', 10, 30.24, -97.76), ...at('79901', 2, 31.76, -106.49)];
r = strayZips(two);
check('multi-city: small ZIPs near either city stay; a far one goes', r.stray.join() === '79901', r.stray.join());

// A sprawling city: edge ZIPs 20 miles out with under 1% each are near some core ZIP.
const sprawl = [...at('77002', 3000, 29.75, -95.36), ...at('77024', 1500, 29.77, -95.51), ...at('77339', 40, 30.05, -95.18)];
check('a sprawling city keeps its edge ZIPs near any core ZIP', strayZips(sprawl).stray.length === 0);

// A ZIP with 1% or more is never stray, however far.
const big = [...at('38103', 900, 35.14, -90.05), ...at('37066', 100, 36.39, -86.45)];
check('a ZIP with at least 1% of listings is kept even far away', strayZips(big).stray.length === 0);

check('no rows, no strays', strayZips([]).stray.length === 0 && strayZips(null).stray.length === 0);
check('nothing with coordinates: nothing can be judged far', strayZips([...at('76104', 10, '', ''), ...at('78705', 1, '', '')]).stray.length === 0);
check('ZIP+4 is read as its five-digit ZIP', strayZips([...at('76104-1234', 500, 32.73, -97.32), ...at('78705-0001', 1, 30.29, -97.74)]).stray.join() === '78705');
check('coordinates of 0,0 count as missing', !strayZips([...at('76104', 500, 32.73, -97.32), ...at('78705', 1, 0, 0)]).stray.length);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
