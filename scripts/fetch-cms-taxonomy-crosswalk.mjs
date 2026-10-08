// Downloads the CMS "Medicare Provider and Supplier Taxonomy Crosswalk" to
// supabase/reference/cms_taxonomy_crosswalk.csv, for the cms_specialty_code /
// cms_specialty_name columns of taxonomy_map. The dataset URL is resolved from
// the CMS catalog at run time (CMS re-mints dataset ids), like the other imports.
// Usage: node scripts/fetch-cms-taxonomy-crosswalk.mjs [--url <csv>]
import { writeFileSync } from 'node:fs';
import { resolve } from './lib/cms-catalog.mjs';
import { parseCmsCrosswalk } from './lib/taxonomy-map.mjs';

const i = process.argv.indexOf('--url');
const url = i > 0 ? process.argv[i + 1] : (await resolve(/provider and supplier taxonomy crosswalk/i, 'crosswalk')).url;
const res = await fetch(url, { headers: { 'User-Agent': 'ProviderPulse-import' } });
if (!res.ok) throw new Error(`crosswalk: HTTP ${res.status} from ${url}`);
const text = await res.text();
const parsed = parseCmsCrosswalk(text); // throws with the header if the columns moved
if (parsed.size < 300) throw new Error(`crosswalk: only ${parsed.size} taxonomy codes; expected several hundred`);
writeFileSync('supabase/reference/cms_taxonomy_crosswalk.csv', text);
console.log(`crosswalk: ${parsed.size} taxonomy codes from ${url}`);
