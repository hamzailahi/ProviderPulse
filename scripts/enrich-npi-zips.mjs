// Background NPI backfill: for each pending ZIP in zip_enrichment_queue
// (migration 013), pulls NPPES registry records for that ZIP -- both NPI-1
// individuals and NPI-2 organisations -- diffs them against what's already
// stored, and inserts whatever's missing.
//
// WHY THIS IS A SEPARATE JOB, NOT INLINE IN A NETLIFY FUNCTION
// An exhaustive per-ZIP NPPES pull, both enumeration types, paginated, does
// not reliably fit inside a search request's ~15s budget (see CLAUDE.md's
// Timeouts section) -- patient-match.js already lives close to that ceiling
// chaining NPPES + geocoding + Anthropic. zip-enrich-request.js only queues a
// ZIP; this script, run outside any request via GitHub Actions, does the
// actual pull with no timeout pressure.
//
// TWO DESTINATION TABLES, NOT ONE. NPI-2 rows go to `clinics` -- the existing
// table is entirely NPI-2 organisational records today (verified 20/20
// sampled, see CLAUDE.md's "NPI-1 vs NPI-2" section), and every downstream
// consumer (market-score, taxonomy-groups, the audit engine) assumes that.
// NPI-1 rows go to the new `provider_individuals` table instead of mixing
// into `clinics`, which is exactly the mixing that would break those
// assumptions.
//
// DEACTIVATED NPIs ARE SKIPPED, not inserted. Backfilling a directory with a
// deactivated NPI (auth-register-provider.js already rejects these at
// registration) would work against the whole point of the product.
//
// NO GEOCODING HERE. Rows are inserted with latitude/longitude null. Backfill
// volume can be large (up to MAX_PAGES_PER_TYPE * PAGE_LIMIT per type per
// ZIP) and geocoding each one would turn a cheap batch job into a slow,
// rate-limited one. A row with no coordinates is simply never drawn on the
// map -- the same convention provider-locations.js already uses for a failed
// geocode. Add geocoding as a separate pass if backfilled rows need to render.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/enrich-npi-zips.mjs [options]
//
//   --dry-run       fetch and report, write nothing, don't touch the queue
//   --limit <n>     max ZIPs to process this run (default 15)
//   --zip <zip>     process this one ZIP directly, bypassing the queue

import { batchWrite } from './lib/bulk.mjs';

const NPPES_BASE = 'https://npiregistry.cms.hhs.gov/api/';
// NPPES's documented per-request max. Paging beyond a few thousand results
// for one ZIP would mean something is wrong with the query, not real data.
const PAGE_LIMIT = 200;
const MAX_PAGES_PER_TYPE = 5;
const MAX_ATTEMPTS = 3;

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d = null) => (args.indexOf(n) !== -1 ? args[args.indexOf(n) + 1] : d);

const dryRun = flag('--dry-run');
const runLimit = Math.max(1, parseInt(opt('--limit', '15'), 10) || 15);
const singleZip = opt('--zip', null);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const svcHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: svcHeaders });
  if (!res.ok) throw new Error(`GET ${path} failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function sbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...svcHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${path} failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
}

async function fetchNppesZip(zip, enumerationType) {
  const out = [];
  for (let page = 0; page < MAX_PAGES_PER_TYPE; page++) {
    const skip = page * PAGE_LIMIT;
    const url = `${NPPES_BASE}?version=2.1&postal_code=${zip}&enumeration_type=${enumerationType}&limit=${PAGE_LIMIT}&skip=${skip}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`NPPES ${enumerationType} ${zip} page ${page}: HTTP ${res.status}`);
    const data = await res.json();
    const results = (data.results || []).filter(r => (r.basic || {}).status !== 'D');
    out.push(...results);
    if ((data.results || []).length < PAGE_LIMIT) break;
  }
  return out;
}

function primaryTaxonomyDesc(rec) {
  const taxes = rec.taxonomies || [];
  const primary = taxes.find(t => t.primary) || taxes[0] || {};
  return primary.desc || null;
}

function locationAddress(rec) {
  return (rec.addresses || []).find(a => a.address_purpose === 'LOCATION') || (rec.addresses || [])[0] || {};
}

function compactOrg(rec) {
  const basic = rec.basic || {};
  const addr = locationAddress(rec);
  return {
    npi: rec.number,
    name: basic.organization_name || null,
    address: addr.address_1 || null,
    city: addr.city || null,
    state: addr.state || null,
    zip: (addr.postal_code || '').slice(0, 5) || null,
    primary_taxonomy: primaryTaxonomyDesc(rec),
    latitude: null,
    longitude: null
  };
}

function compactIndividual(rec) {
  const basic = rec.basic || {};
  const addr = locationAddress(rec);
  return {
    npi: rec.number,
    name: [basic.first_name, basic.last_name].filter(Boolean).join(' ') || null,
    address: addr.address_1 || null,
    city: addr.city || null,
    state: addr.state || null,
    zip: (addr.postal_code || '').slice(0, 5) || null,
    primary_taxonomy: primaryTaxonomyDesc(rec),
    phone: addr.telephone_number || null,
    latitude: null,
    longitude: null,
    enumeration_type: 'NPI-1',
    source: 'nppes_zip_enrichment',
    refreshed_at: new Date().toISOString()
  };
}

async function existingNpis(table, npis) {
  if (!npis.length) return new Set();
  const rows = await sbGet(`${table}?npi=in.(${npis.join(',')})&select=npi`);
  return new Set(rows.map(r => r.npi));
}

async function enrichOneZip(zip) {
  const [orgRecords, individualRecords] = await Promise.all([
    fetchNppesZip(zip, 'NPI-2'),
    fetchNppesZip(zip, 'NPI-1')
  ]);

  const orgRows = orgRecords.map(compactOrg).filter(r => r.npi);
  const individualRows = individualRecords.map(compactIndividual).filter(r => r.npi);

  const existingOrgNpis = await existingNpis('clinics', orgRows.map(r => r.npi));
  const existingIndividualNpis = await existingNpis('provider_individuals', individualRows.map(r => r.npi));

  const missingOrgs = orgRows.filter(r => !existingOrgNpis.has(r.npi));
  const missingIndividuals = individualRows.filter(r => !existingIndividualNpis.has(r.npi));

  if (!dryRun) {
    if (missingOrgs.length) {
      await batchWrite(missingOrgs, { url: SUPABASE_URL, key: SERVICE_KEY, table: 'clinics', label: `${zip} orgs` });
    }
    if (missingIndividuals.length) {
      await batchWrite(missingIndividuals, {
        url: SUPABASE_URL, key: SERVICE_KEY, table: 'provider_individuals',
        onConflict: 'npi', label: `${zip} individuals`
      });
    }
  }

  return {
    orgsFound: orgRows.length, orgsInserted: missingOrgs.length,
    individualsFound: individualRows.length, individualsInserted: missingIndividuals.length
  };
}

async function main() {
  let queueRows;
  if (singleZip) {
    if (!/^\d{5}$/.test(singleZip)) { console.error('--zip must be 5 digits'); process.exit(1); }
    queueRows = [{ zip: singleZip, attempts: 0 }];
  } else {
    queueRows = await sbGet(
      `zip_enrichment_queue?status=eq.pending&order=requested_at.asc&limit=${runLimit}&select=zip,attempts`
    );
  }

  if (!queueRows.length) { console.log('No pending ZIPs.'); return; }
  console.log(`Processing ${queueRows.length} ZIP(s)${dryRun ? ' (dry run)' : ''}...`);

  if (!dryRun && !singleZip) {
    await sbPatch(`zip_enrichment_queue?zip=in.(${queueRows.map(r => r.zip).join(',')})`, { status: 'processing' });
  }

  for (const row of queueRows) {
    const zip = row.zip;
    try {
      const result = await enrichOneZip(zip);
      console.log(
        `  ${zip}: orgs ${result.orgsInserted}/${result.orgsFound} new, ` +
        `individuals ${result.individualsInserted}/${result.individualsFound} new`
      );
      if (!dryRun && !singleZip) {
        await sbPatch(`zip_enrichment_queue?zip=eq.${zip}`, {
          status: 'done', last_enriched_at: new Date().toISOString(),
          attempts: row.attempts + 1, last_error: null
        });
      }
    } catch (e) {
      console.error(`  ${zip}: FAILED -- ${e.message}`);
      if (!dryRun && !singleZip) {
        const attempts = row.attempts + 1;
        await sbPatch(`zip_enrichment_queue?zip=eq.${zip}`, {
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          attempts, last_error: String(e.message).slice(0, 500)
        });
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
