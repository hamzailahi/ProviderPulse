// lib/npi-verify.js
// The NPI checks shared by provider registration (auth-register-provider.js)
// and adding an NPI to an existing account (provider-npis.js), so both verify
// the same way: a Luhn-valid number, an active NPPES record, the registry's
// person (the clinician for NPI-1, the authorized official for NPI-2), and
// OIG exclusion screening (an NPI match blocks; a name and state match only
// flags for review, because names collide).

const norm = s => (s || '').trim().toLowerCase().replace(/[^a-z]/g, '');

// NPI Luhn check (with 80840 prefix constant of 24)
function validNpi(npi) {
  if (!/^\d{10}$/.test(npi)) return false;
  let sum = 24;
  const digits = npi.slice(0, 9).split('').reverse();
  for (let i = 0; i < 9; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === parseInt(npi[9], 10);
}

// The NPPES record, null when the registry has none, or throws when NPPES
// could not be reached (unreachable is never "not found").
async function nppesRecord(npi) {
  const r = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('NPPES HTTP ' + r.status);
  const data = await r.json();
  return (data.results && data.results[0]) || null;
}

// What registration and the listing need from a record.
function describeRecord(record) {
  const basic = record.basic || {};
  const entityType = record.enumeration_type === 'NPI-2' ? 2 : 1;
  const addr = (record.addresses || []).find(a => a.address_purpose === 'LOCATION') || (record.addresses || [])[0] || {};
  const tax = (record.taxonomies || []).find(t => t.primary) || (record.taxonomies || [])[0] || {};
  return {
    entityType,
    deactivated: String(basic.status || 'A').toUpperCase() === 'D',
    personFirst: entityType === 2 ? basic.authorized_official_first_name : basic.first_name,
    personLast: entityType === 2 ? basic.authorized_official_last_name : basic.last_name,
    orgName: entityType === 2 ? (basic.organization_name || null) : null,
    phone: addr.telephone_number || null,
    address_line: addr.address_1 || null,
    city: addr.city || null,
    state: (addr.state || '').slice(0, 2) || null,
    zip: (addr.postal_code || '').slice(0, 5) || null,
    taxonomy_code: tax.code || null,
    taxonomy_desc: tax.desc || null
  };
}

// Last names must match; a first name, when given on both sides, must too.
function namesMatch(aFirst, aLast, bFirst, bLast) {
  if (!norm(aLast) || norm(aLast) !== norm(bLast)) return false;
  return !norm(aFirst) || !norm(bFirst) || norm(aFirst) === norm(bFirst);
}

function svc(env) {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
}

// OIG exclusion check (HHS Office of Inspector General, LEIE list).
// NPPES only proves an NPI exists; it says nothing about whether that provider has
// been excluded from federal healthcare programs. Listing an excluded provider to
// patients is a materially worse failure than listing an unverified one.
//
// Reads an optional `leie_exclusions` table. If that table has not been imported
// yet the check is skipped rather than blocking every registration — so an empty
// or missing table must be read as "unknown", never as "cleared".
//
// Caveat worth knowing: the published LEIE file leaves NPI blank for many
// individual exclusions, so an NPI match is a high-confidence positive but not
// exhaustive. Name/DOB matching is OIG's own recommended verification step.
async function isExcluded(env, npi) {
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/leie_exclusions?npi=eq.${npi}&select=npi&limit=1`, {
      headers: svc(env), signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) return false; // table absent or unreachable -> unknown, do not block
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

// Name-based exclusion screening, the other 90% of the LEIE.
//
// Only ~10% of exclusion records carry an NPI, so an NPI match alone misses most
// excluded providers. Names are the fallback, but they are NOT proof: last+first+
// state collides for over a thousand real combinations (five different MARIA
// HERNANDEZ in FL). A hit therefore flags the account for review rather than
// blocking it — wrongly locking out a legitimate provider is its own harm.
//
// LEIE stores names uppercase and writes the literal string "NULL" where a name is
// unknown, which must never be treated as a surname.
async function exclusionNameHits(env, { entityType, lastName, firstName, orgName, state }) {
  const up = s => String(s || '').trim().toUpperCase();
  const st = up(state).slice(0, 2);
  if (!st) return 0;

  let query;
  if (entityType === 2) {
    const org = up(orgName);
    if (!org || org === 'NULL') return 0;
    query = `business_name=eq.${encodeURIComponent(org)}&state=eq.${encodeURIComponent(st)}`;
  } else {
    const ln = up(lastName), fn = up(firstName);
    if (!ln || ln === 'NULL' || !fn) return 0;
    query = `last_name=eq.${encodeURIComponent(ln)}&first_name=eq.${encodeURIComponent(fn)}&state=eq.${encodeURIComponent(st)}`;
  }

  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/leie_exclusions?${query}&select=npi&limit=5`, {
      headers: svc(env), signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) return 0; // table absent -> unknown, not cleared
    const rows = await r.json();
    return Array.isArray(rows) ? rows.length : 0;
  } catch {
    return 0;
  }
}

// Whether any account already holds this NPI, as its own (provider_profiles)
// or as an added one (provider_npis, migration 044). A failed read throws: an
// unknown answer must never let an NPI be claimed twice. A missing
// provider_npis table (044 not applied) counts as no added NPIs.
async function npiClaimed(env, npi) {
  const H = { ...svc(env) };
  const a = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_profiles?npi=eq.${npi}&select=id`, { headers: H, signal: AbortSignal.timeout(5000) });
  if (!a.ok) throw new Error('profile lookup failed');
  const ra = await a.json();
  if (Array.isArray(ra) && ra.length) return 'account';
  const b = await fetch(`${env.SUPABASE_URL}/rest/v1/provider_npis?npi=eq.${npi}&select=id`, { headers: H, signal: AbortSignal.timeout(5000) });
  if (b.status === 404) return null;
  if (!b.ok) throw new Error('added-NPI lookup failed');
  const rb = await b.json();
  return Array.isArray(rb) && rb.length ? 'added' : null;
}

async function audit(env, row) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
      method: 'POST',
      headers: { ...svc(env), 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    });
  } catch (e) { /* audit failure must not block the request */ }
}

module.exports = { norm, validNpi, nppesRecord, describeRecord, namesMatch, isExcluded, exclusionNameHits, npiClaimed, audit, svc };
