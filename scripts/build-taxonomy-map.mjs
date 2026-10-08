// Builds the NUCC taxonomy map from the reference files:
//
//   supabase/reference/nucc_taxonomy.csv          official NUCC code set (taxonomy-inventory workflow)
//   supabase/reference/cms_taxonomy_crosswalk.csv CMS Medicare specialty crosswalk (optional)
//   supabase/reference/taxonomy-overrides.csv     reviewed decisions: show_on_map, patient_specialties
//
// and writes
//
//   v2/assets/taxonomy-map.js          the browser + Node lookup (generated, never edited by hand)
//   supabase/reference/taxonomy_map.csv the rows loaded into the taxonomy_map table
//
// Usage: node scripts/build-taxonomy-map.mjs           write both files
//        node scripts/build-taxonomy-map.mjs --check   exit 1 if either is stale (CI)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parseNucc, parseCmsCrosswalk, parseOverrides, buildMap, renderMapCsv, renderMapJs } from './lib/taxonomy-map.mjs';

const REF = 'supabase/reference';
const OUT_JS = 'v2/assets/taxonomy-map.js';
const OUT_CSV = `${REF}/taxonomy_map.csv`;
const check = process.argv.includes('--check');

const nucc = parseNucc(readFileSync(`${REF}/nucc_taxonomy.csv`, 'utf8'));
const version = existsSync(`${REF}/nucc_version.txt`) ? readFileSync(`${REF}/nucc_version.txt`, 'utf8').trim() : 'nucc_taxonomy.csv';
const cmsPath = `${REF}/cms_taxonomy_crosswalk.csv`;
const cms = existsSync(cmsPath) ? parseCmsCrosswalk(readFileSync(cmsPath, 'utf8')) : null;
const overrides = parseOverrides(readFileSync(`${REF}/taxonomy-overrides.csv`, 'utf8'), new Set(nucc.map(n => n.code)));

const entries = buildMap(nucc, cms, overrides);
const js = renderMapJs(entries, version);
const csv = renderMapCsv(entries);

const stale = [[OUT_JS, js], [OUT_CSV, csv]].filter(([p, body]) => !existsSync(p) || readFileSync(p, 'utf8') !== body);
if (check) {
  if (stale.length) {
    console.error(`Stale: ${stale.map(s => s[0]).join(', ')}. Run: node scripts/build-taxonomy-map.mjs`);
    process.exit(1);
  }
  console.log(`taxonomy map up to date (${entries.length} codes, ${version})`);
} else {
  for (const [p, body] of stale) writeFileSync(p, body);
  const groupings = new Set(entries.map(e => e.grouping)).size;
  console.log(`${entries.length} codes, ${groupings} groupings, ${version}; CMS crosswalk: ${cms ? cms.size + ' codes' : 'not present'}; ` +
    `hidden: ${entries.filter(e => !e.show_on_map).length}; wrote ${stale.length ? stale.map(s => s[0]).join(', ') : 'nothing (up to date)'}`);
}
