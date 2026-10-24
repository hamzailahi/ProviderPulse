// Organization phones from the NPI Registry API, ZIP by ZIP. The fallback for
// when CMS's monthly file is unavailable: on 2026-10-24 its download site was
// "down for maintenance until further notice" and every file returned 404.
//
// One query reaches at most 1,200 records (limit 200, skip up to 1,000). A
// ZIP that fills that ceiling is split by ZIP+4 ranges ("761170*", then
// "7611701*"), and whatever our directory still lists there is looked up NPI
// by NPI. A failed request is a failed ZIP, never an empty one.
import { cleanPhone } from './phones.mjs';

export const PAGE = 200;
export const MAX_SKIP = 1000;

// The API answers bad input with HTTP 200 and {Errors: [...]}; that is a
// failure, not "no organizations here".
export function apiError(data) {
  if (!data || typeof data !== 'object') return 'not JSON';
  if (Array.isArray(data.Errors) && data.Errors.length) return data.Errors.map(e => e.description || e.field || 'error').join('; ');
  if (!Array.isArray(data.results)) return 'no results array';
  return null;
}

// Every page of one postal_code value. full = the query hit the ceiling, so
// records beyond it exist and were not returned.
export async function queryAll(postal, get) {
  const records = [];
  for (let skip = 0; skip <= MAX_SKIP; skip += PAGE) {
    const rs = (await get({ postal_code: postal, skip })).results;
    records.push(...rs);
    if (rs.length < PAGE) return { records, full: false, queries: skip / PAGE + 1 };
  }
  return { records, full: true, queries: MAX_SKIP / PAGE + 1 };
}

// One ZIP: the whole ZIP, then ZIP+4 ranges when it overflows. A range query
// that errors (the API may refuse the wildcard) is not fatal: the per-NPI
// pass picks up what it missed. Returns the records and what happened.
export async function crawlZip(zip, get) {
  const top = await queryAll(zip, get);
  const out = { records: top.records, full: top.full, queries: top.queries, split_failed: false, still_full: false };
  if (!top.full) return out;
  const range = async prefix => {
    try {
      const r = await queryAll(prefix + '*', get);
      out.records.push(...r.records); out.queries += r.queries;
      return r.full;
    } catch { out.split_failed = true; return false; }
  };
  for (let d = 0; d <= 9; d++) {
    if (!(await range(`${zip}${d}`))) continue;
    for (let e = 0; e <= 9; e++) if (await range(`${zip}${d}${e}`)) out.still_full = true;
  }
  return out;
}

// The practice phone of one API record, or null (and why).
export function recordPhone(rec) {
  if (!rec || rec.enumeration_type !== 'NPI-2') return { npi: null, why: 'not_org' };
  const npi = String(rec.number || '');
  if (!/^\d{10}$/.test(npi)) return { npi: null, why: 'bad_npi' };
  if ((rec.basic || {}).status === 'D') return { npi, why: 'deactivated' };
  const loc = (rec.addresses || []).find(a => a.address_purpose === 'LOCATION');
  const raw = loc && loc.telephone_number;
  if (!raw) return { npi, why: 'no_phone' };
  const phone = cleanPhone(raw);
  return phone ? { npi, phone } : { npi, why: 'bad_phone' };
}

// The whole run. zips: [[zip, [npi, ...]]] (our directory's organizations per
// ZIP); get(params) resolves to a checked API response or throws. Returns the
// phones found (Map npi -> phone), counts, and the ZIPs that need a look.
export async function collectPhones(zips, get, opt = {}) {
  const concurrency = opt.concurrency || 6;
  const maxSingle = opt.maxSingle ?? 40000;
  const deadline = opt.deadline ?? Infinity;
  const now = opt.now || Date.now;
  const log = opt.log || (() => {});
  const phones = new Map();
  const seen = new Set();
  const n = { zips: zips.length, zips_done: 0, zips_failed: 0, zips_not_reached: 0, overflow_zips: 0,
    split_failed_zips: 0, still_full_zips: 0, queries: 0, single_lookups: 0, single_failed: 0,
    single_skipped_cap: 0, records: 0, with_phone: 0, no_phone: 0, bad_phone: 0, deactivated: 0 };
  const failed = [], overflow = [];
  const take = rec => {
    const r = recordPhone(rec);
    if (!r.npi || seen.has(r.npi)) return;
    seen.add(r.npi); n.records++;
    if (r.phone) { phones.set(r.npi, r.phone); n.with_phone++; } else n[r.why] = (n[r.why] || 0) + 1;
  };
  const leftovers = [];
  let next = 0;
  const worker = async () => {
    while (next < zips.length) {
      if (now() > deadline) return;
      const [zip, npis] = zips[next++];
      try {
        const r = await crawlZip(zip, get);
        n.queries += r.queries;
        r.records.forEach(take);
        if (r.full) {
          n.overflow_zips++; overflow.push(zip);
          if (r.split_failed) n.split_failed_zips++;
          if (r.still_full) n.still_full_zips++;
          for (const npi of npis) leftovers.push(npi);
        }
        n.zips_done++;
      } catch (e) {
        n.zips_failed++; failed.push([zip, String(e.message || e).slice(0, 120)]);
      }
      const done = n.zips_done + n.zips_failed;
      if (done % 1000 === 0) log(`  ${done.toLocaleString('en-US')} of ${zips.length.toLocaleString('en-US')} ZIPs, ${n.with_phone.toLocaleString('en-US')} phones`);
      // Stop early when the API is down rather than burn hours on errors.
      if (done >= 200 && n.zips_failed / done > 0.2) throw new Error(`NPI Registry API failing: ${n.zips_failed} of ${done} ZIPs (first: ${failed[0][0]} ${failed[0][1]})`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  n.zips_not_reached = zips.length - n.zips_done - n.zips_failed;

  // Overflowing ZIPs: what the directory lists there and the ranges missed.
  const todo = [...new Set(leftovers)].filter(npi => !seen.has(npi));
  n.single_skipped_cap = Math.max(0, todo.length - maxSingle);
  const queue = todo.slice(0, maxSingle);
  let qi = 0;
  const single = async () => {
    while (qi < queue.length) {
      if (now() > deadline) return;
      const npi = queue[qi++];
      try { (await get({ number: npi })).results.forEach(take); n.single_lookups++; }
      catch { n.single_failed++; }
    }
  };
  if (queue.length) log(`  looking up ${queue.length.toLocaleString('en-US')} organizations one by one (ZIPs over the 1,200 ceiling)`);
  await Promise.all(Array.from({ length: concurrency }, single));
  n.single_not_reached = queue.length - n.single_lookups - n.single_failed;
  return { phones, stats: n, failed, overflow };
}
