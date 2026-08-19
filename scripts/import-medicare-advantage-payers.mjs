// Import Medicare Advantage carrier names into insurance_payers, keyed per
// state, from two official CMS files joined together:
//
//   1. "State/County/Contract Enrollment" -- which MA contracts actually
//      enrol beneficiaries in which state (Organization Type, State,
//      Contract ID, Enrolled).
//   2. "MA Contract Directory" -- Contract Number -> Organization Marketing
//      Name, the consumer-facing brand CMS requires a plan to use, distinct
//      from its legal entity name.
//
// WHY THE JOIN, NOT EITHER FILE ALONE. File 1's own "Organization Name"
// column is the legal contracting entity ("HEALTHSPRING LIFE & HEALTH
// INSURANCE COMPANY, INC.", "BCBS OF MICHIGAN MUTUAL INSURANCE COMPANY" for
// a Tennessee row), not a name a patient would recognize off their insurance
// card -- confirmed live: Tennessee alone has 28 distinct legal-entity names,
// most unrecognizable. Joining to file 2's marketing name turns that into
// "HealthSpring", "Highmark Blue Cross Blue Shield", etc. This mirrors the
// exact two-vocabulary trap documented in CLAUDE.md's taxonomy section: an
// official identifier and a consumer-facing label are not interchangeable,
// and guessing the mapping by hand for 468+ distinct brands across 50+
// jurisdictions is exactly the kind of unverified vocabulary bridge that
// codebase has been burned by before. This script uses CMS's own verified
// mapping instead of guessing one.
//
// WHY FILTERED TO Local CCP / Regional CCP. Confirmed live: these two
// Organization Types cover 96%+ of enrollment and are what "Medicare
// Advantage" means in consumer terms (HMO/PPO plans) -- every example a
// human gave when this was scoped was one of these. The excluded types are
// real CMS contract categories but not what a payer picker should list next
// to "Humana" as a comparable choice: National PACE (an eligibility-gated
// all-inclusive elder-care program, not an insurance selection), LI NET
// Sponsor (a temporary drug-only transition program), 1876/HCPP-1833 Cost
// (legacy cost-reimbursement contracts), MSA (rare medical-savings-account
// plans).
//
// WHY NO NATIONAL-VS-STATE DEDUP. Every (state, marketing_name) pair
// inserted is one CMS actually reported enrollment for in that state --
// deliberately not collapsed into a null-state "national" row for
// ubiquitous brands (UnitedHealthcare and Aetna Medicare are in 53 of 53
// jurisdictions; Devoted Health in 29) because that threshold is an
// arbitrary judgment call this script has no principled way to make, and
// the existing generic 'Medicare'/'Medicare Advantage' national rows
// already cover the "I don't know my specific carrier" case. A few dozen
// near-duplicate state-scoped rows for the biggest carriers costs nothing;
// silently overclaiming a carrier operates in a state it does not would be
// the worse failure mode here, matching the "a WRONG name looks worse than
// a missing one" warning in migration 003's own header.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run: node scripts/import-medicare-advantage-payers.mjs [options]
//
//   --dry-run   parse and report totals without writing to Supabase
//   --discover  print the resolved enrollment + directory file URLs and exit
//
// ---------------------------------------------------------------------------
// WHY THE FILE URLS ARE RESOLVED AT RUNTIME
//
// Neither file lives in the CMS DCAT catalog (data.cms.gov/data.json) that
// import-medicare-activity.mjs / import-medicare-enrollment.mjs resolve
// against -- confirmed live, no matching dataset title. Both are static
// pages under cms.gov instead, and the enrollment file's URL embeds the
// month name and year in its slug (e.g.
// ".../ma-enrollment-state-county-contract-august-2026-...zip"), a new one
// published every month. So this script parses the CMS index page's HTML at
// run time for the newest dated sub-page, then that sub-page for its zip
// link -- the same "resolve by parsing a live source, never pin a URL"
// principle as every other importer here, just against HTML instead of a
// JSON catalog.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileCsvRows, batchWrite } from './lib/bulk.mjs';

const UA = { headers: { 'User-Agent': 'ProviderPulse-import' } };
const ENROLL_INDEX = 'https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/monthly-ma-enrollment-state/county/contract';
const DIRECTORY_INDEX = 'https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-advantagepart-d-contract-and-enrollment-data/ma-plan-directory';

// Local CCP + Regional CCP only -- see the file header for why.
const INCLUDED_ORG_TYPES = new Set(['Local CCP', 'Regional CCP']);

const CATEGORY = 'medicare';
const SORT_ORDER = 70;
const TABLE = 'insurance_payers';

// A real month covers every state + DC + PR + territories (53 in the
// confirmed live run) with 700+ distinct (state, brand) pairs after the
// Local/Regional CCP filter. Floors, not targets.
const MIN_STATES = 40;
const MIN_PAIRS = 300;

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const dryRun = flag('--dry-run');
const discover = flag('--discover');

async function fetchText(url) {
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

/** All absolute-path hrefs on a CMS page, resolved to full URLs. */
function hrefs(html, base) {
  const out = [];
  const re = /href="([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) out.push(new URL(m[1], base).href);
  return out;
}

async function resolveEnrollmentZipUrl() {
  const indexHtml = await fetchText(ENROLL_INDEX);
  const monthPages = hrefs(indexHtml, ENROLL_INDEX)
    .filter(u => /\/ma-enrollment-scc-(\d{4})-(\d{2})$/.test(u));
  if (!monthPages.length) throw new Error('enrollment: no dated sub-pages found on the CMS index -- page layout may have changed');
  monthPages.sort((a, b) => {
    const ka = a.match(/(\d{4})-(\d{2})$/), kb = b.match(/(\d{4})-(\d{2})$/);
    return (kb[1] + kb[2]) - (ka[1] + ka[2]);
  });
  const newest = monthPages[0];
  console.log(`enrollment: newest month page -> ${newest}`);
  const pageHtml = await fetchText(newest);
  const zips = hrefs(pageHtml, newest).filter(u => /\.zip$/i.test(u));
  if (!zips.length) throw new Error(`enrollment: no .zip links found on ${newest}`);
  const abridged = zips.find(u => /abridged/i.test(u));
  return abridged || zips[0];
}

async function resolveDirectoryZipUrl() {
  const html = await fetchText(DIRECTORY_INDEX);
  const zips = hrefs(html, DIRECTORY_INDEX).filter(u => /\.zip$/i.test(u));
  if (!zips.length) throw new Error(`directory: no .zip links found on ${DIRECTORY_INDEX}`);
  return zips[0];
}

async function downloadAndExtract(url, destDir, label) {
  console.log(`${label}: downloading ${url}`);
  const res = await fetch(url, UA);
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} downloading ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const zipPath = join(destDir, `${label}.zip`);
  writeFileSync(zipPath, buf);
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', destDir]);
  const csv = findCsv(destDir);
  if (!csv) throw new Error(`${label}: no .csv found after extracting ${url}`);
  console.log(`${label}: extracted ${csv}`);
  return csv;
}

function findCsv(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findCsv(p);
      if (found) return found;
    } else if (/\.csv$/i.test(entry.name) && !/alt_readme|read_me/i.test(entry.name)) {
      return p;
    }
  }
  return null;
}

async function main() {
  if (discover) {
    console.log('enrollment zip:', await resolveEnrollmentZipUrl());
    console.log('directory zip:', await resolveDirectoryZipUrl());
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const [enrollUrl, directoryUrl] = await Promise.all([
    resolveEnrollmentZipUrl(),
    resolveDirectoryZipUrl()
  ]);

  const workDir = mkdtempSync(join(tmpdir(), 'ma-payers-'));
  try {
    mkdirSync(join(workDir, 'enroll'), { recursive: true });
    mkdirSync(join(workDir, 'directory'), { recursive: true });
    // Sequential, not parallel: both files are small (under 1MB), and unzip
    // shells out to a subprocess per call -- no benefit to overlapping them.
    const enrollCsv = await downloadAndExtract(enrollUrl, join(workDir, 'enroll'), 'enrollment');
    const directoryCsv = await downloadAndExtract(directoryUrl, join(workDir, 'directory'), 'directory');

    // ---- directory: Contract Number -> marketing name ----------------
    const marketingByContract = new Map();
    let dHeader = null, dAt = null;
    for await (const row of fileCsvRows(directoryCsv)) {
      if (!dHeader) {
        dHeader = row;
        dAt = col(dHeader, ['Contract Number', 'Organization Marketing Name'], 'directory');
        continue;
      }
      if (row.length < dHeader.length) continue;
      const contract = clean(row[dAt('Contract Number')]);
      const marketing = clean(row[dAt('Organization Marketing Name')]);
      if (contract && marketing) marketingByContract.set(contract, marketing);
    }
    console.log(`directory: ${marketingByContract.size.toLocaleString()} contracts mapped to a marketing name`);

    // ---- enrollment: State + Contract ID + Organization Type ----------
    const pairs = new Map(); // "STATE|Brand Name" -> { state, name }
    const statesSeen = new Set();
    let eHeader = null, eAt = null, scanned = 0;
    for await (const row of fileCsvRows(enrollCsv)) {
      if (!eHeader) {
        eHeader = row;
        eAt = col(eHeader, ['State', 'Contract ID', 'Organization Type'], 'enrollment');
        continue;
      }
      if (row.length < eHeader.length) continue;
      const state = clean(row[eAt('State')]);
      const orgType = clean(row[eAt('Organization Type')]);
      if (!state || !INCLUDED_ORG_TYPES.has(orgType)) continue;
      const brand = marketingByContract.get(clean(row[eAt('Contract ID')]));
      if (!brand) continue;
      statesSeen.add(state);
      pairs.set(`${state}|${brand}`, { state, name: brand });
      scanned++;
      if (scanned % 10000 === 0) process.stdout.write(`\r  scanned ${scanned.toLocaleString()} rows`);
    }
    if (scanned) process.stdout.write(`\r  scanned ${scanned.toLocaleString()} rows total\n`);

    console.log(`\nresult: ${pairs.size.toLocaleString()} (state, brand) pairs across ${statesSeen.size} states/jurisdictions`);

    if (statesSeen.size < MIN_STATES || pairs.size < MIN_PAIRS) {
      throw new Error(
        `medicare-advantage-payers: only ${statesSeen.size} states / ${pairs.size} pairs, ` +
        `below the ${MIN_STATES}-state / ${MIN_PAIRS}-pair floor. Refusing to write -- ` +
        `this usually means the join or the org-type filter matched almost nothing.`
      );
    }

    if (dryRun) {
      const sample = [...pairs.values()].filter(p => p.state === 'TN' || p.state === 'KS' || p.state === 'NY');
      console.log('\nsample (TN/KS/NY):');
      sample.sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name))
        .forEach(p => console.log(`  ${p.state}  ${p.name}`));
      console.log('\n--dry-run: nothing written');
      return;
    }

    const records = [...pairs.values()].map(p => ({
      name: p.name,
      state: p.state,
      category: CATEGORY,
      sort_order: SORT_ORDER,
      active: true
    }));

    console.log('');
    await batchWrite(records, {
      url: SUPABASE_URL,
      key: SUPABASE_SERVICE_ROLE_KEY,
      table: TABLE,
      batch: 1000,
      onConflict: 'name,state',
      label: 'upsert'
    });
    console.log('Medicare Advantage payers import complete');
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function clean(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}

/** Same case/whitespace-insensitive column lookup as lib/bulk.mjs's columnIndex,
 * duplicated here because this file joins two independently-headered CSVs and
 * needs two separate `at()` resolvers alive at once. */
function col(header, required, label) {
  const norm = s => String(s ?? '').trim().toUpperCase().replace(/^﻿/, '');
  const cols = header.map(norm);
  const at = name => cols.indexOf(norm(name));
  const missing = required.filter(n => at(n) === -1);
  if (missing.length) {
    throw new Error(
      `${label}: expected column(s) not found: ${missing.join(', ')}\n` +
      `  columns actually present (${cols.length}): ${cols.join(', ')}`
    );
  }
  return at;
}

main().catch(e => { console.error('\nMedicare Advantage payers import failed:', e.message); process.exit(1); });
