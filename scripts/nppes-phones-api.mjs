// Organization phones from the NPI Registry API, for every ZIP our clinics
// table lists (scripts/lib/nppes-api-phones.mjs has the rules). Writes the
// same npi,phone file as nppes-phones.mjs, so org-phone-assign.mjs and the
// apply step do not care which source ran. Used by org-phone-backfill.sh when
// SOURCE=api.
//
// node scripts/nppes-phones-api.mjs --clinics clinics.csv --out nppes-phones.csv \
//   --stats stats.json --summary api.md [--zip-limit 200] [--budget-min 300] [--concurrency 6] [--rate 4]
import { readFileSync, writeFileSync } from 'node:fs';
import { PAGE, apiError, collectPhones, makePacer } from './lib/nppes-api-phones.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const need = k => { const v = arg(k); if (!v) throw new Error('missing --' + k); return v; };
const BASE = process.env.NPPES_API_BASE || 'https://npiregistry.cms.hhs.gov/api/';   // override for tests
const started = Date.now();
const budgetMin = Number(arg('budget-min', 300));
const zipLimit = Number(arg('zip-limit', 0)) || 0;

// clinics.csv: npi,phone,zip (header first). Biggest ZIPs first, so a sample
// exercises the overflow path and a budget stop costs only small ZIPs.
const byZip = new Map();
for (const line of readFileSync(need('clinics'), 'utf8').split('\n').slice(1)) {
  const [npi, , zip] = line.split(',');
  if (!/^\d{10}$/.test(npi || '') || !/^\d{5}$/.test(zip || '')) continue;
  if (!byZip.has(zip)) byZip.set(zip, []);
  byZip.get(zip).push(npi);
}
let zips = [...byZip].sort((a, b) => b[1].length - a[1].length || (a[0] < b[0] ? -1 : 1));
if (zipLimit) zips = zips.slice(0, zipLimit);
console.error(`${zips.length.toLocaleString('en-US')} ZIPs to query (of ${byZip.size.toLocaleString('en-US')})`);

let purpose = 'PRIMARY';
let requests = 0, retries = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rate = Number(arg('rate', 4));
const pacer = makePacer({ startRate: rate, rate: rate * 1.5, log: m => console.error(m) });
async function get(params) {
  const q = new URLSearchParams({ version: '2.1', limit: String(PAGE), ...params });
  if (params.postal_code) { q.set('enumeration_type', 'NPI-2'); q.set('address_purpose', purpose); }
  q.set('skip', String(params.skip || 0));
  let last, backoff = false;
  for (let attempt = 0; attempt < 8 && !pacer.blocked; attempt++) {
    if (attempt) retries++;
    if (backoff) await sleep(1000 * 2 ** Math.min(attempt, 4));
    backoff = false;
    await pacer.slot();
    requests++;
    let res;
    try { res = await fetch(BASE + '?' + q, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }); }
    catch (e) { last = e.name === 'TimeoutError' ? 'timeout' : String(e.message || e); backoff = true; continue; }
    // 403 and 429 are the registry refusing the pace (it never answers bad
    // input that way): everyone pauses, then this request is tried again.
    if (res.status === 403 || res.status === 429) { last = `HTTP ${res.status}`; pacer.refused(res.status); continue; }
    if (res.status >= 500) { last = `HTTP ${res.status}`; backoff = true; continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let data;
    try { data = await res.json(); } catch { last = 'not JSON'; backoff = true; continue; }
    const err = apiError(data);
    if (err) throw new Error(err);
    pacer.ok();
    return data;
  }
  throw new Error(pacer.blocked ? 'stopped: the registry kept refusing requests' : (last || 'failed'));
}
// One probe before the run: PRIMARY limits matches to the primary practice
// address; if this API version refuses it, LOCATION (any practice address).
if (zips.length) {
  try { await get({ postal_code: zips[0][0] }); }
  catch (e) {
    console.error(`address_purpose=PRIMARY refused (${e.message}); using LOCATION`);
    purpose = 'LOCATION';
    await get({ postal_code: zips[0][0] });   // throws, and ends the run, if the API is down
  }
}

const { phones, stats, failed, overflow } = await collectPhones(zips, get, {
  concurrency: Number(arg('concurrency', 6)),
  deadline: started + budgetMin * 60000,
  stop: () => pacer.blocked,
  log: m => console.error(m)
});
const minutes = Math.round((Date.now() - started) / 6000) / 10;
Object.assign(stats, { requests, retries, minutes, address_purpose: purpose, zip_limit: zipLimit || null,
  refusals: pacer.refusals, pauses: pacer.pauses, blocked: pacer.blocked, final_rate: Math.round(pacer.rate * 100) / 100 });

writeFileSync(need('out'), 'npi,phone\n' + [...phones].map(p => p.join(',')).join('\n') + (phones.size ? '\n' : ''));
writeFileSync(need('stats'), JSON.stringify(stats) + '\n');
const f = v => Number(v || 0).toLocaleString('en-US');
const incomplete = stats.zips_failed || stats.zips_not_reached || stats.single_failed || stats.single_not_reached || stats.single_skipped_cap || stats.still_full_zips;
writeFileSync(need('summary'), [
  '## NPI Registry API', '',
  `- ZIPs queried: ${f(stats.zips_done)} of ${f(stats.zips)}${zipLimit ? ` (a sample of the ${f(zipLimit)} largest)` : ''}; failed ${f(stats.zips_failed)}, not reached in the time budget ${f(stats.zips_not_reached)}`,
  `- requests: ${f(requests)} (${f(retries)} retries), ${minutes} minutes, address_purpose ${purpose}; refused ${f(pacer.refusals)} times (${f(pacer.pauses)} pauses), pace at the end ${stats.final_rate} a second`,
  pacer.blocked ? '- **Stopped early**: the registry kept refusing requests, so the ZIPs not reached keep their current phone.' : null,
  `- organizations returned: ${f(stats.records)}; with a usable phone ${f(stats.with_phone)}, none listed ${f(stats.no_phone)}, unusable ${f(stats.bad_phone)}, deactivated ${f(stats.deactivated)}`,
  `- ZIPs over the 1,200-record ceiling: ${f(stats.overflow_zips)} (ZIP+4 split refused in ${f(stats.split_failed_zips)}, still over in ${f(stats.still_full_zips)}); looked up one by one: ${f(stats.single_lookups)}, failed ${f(stats.single_failed)}, over the cap ${f(stats.single_skipped_cap)}`,
  overflow.length ? `- overflowing ZIPs: ${overflow.slice(0, 30).join(', ')}${overflow.length > 30 ? ', ...' : ''}` : null,
  failed.length ? `- failed ZIPs: ${failed.slice(0, 20).map(([z, e]) => `${z} (${e})`).join('; ')}${failed.length > 20 ? '; ...' : ''}` : null,
  incomplete ? '- **Incomplete**: organizations in the ZIPs above keep their current phone (none). A rerun repeats the whole pass.' : '- Complete: every ZIP answered.',
  ''].filter(l => l !== null).join('\n'));
console.error(JSON.stringify(stats));

const MIN = Number(process.env.NPPES_API_MIN_PHONES || 500000);
if (!zipLimit && !stats.zips_not_reached && stats.with_phone < MIN) {
  console.error(`Only ${stats.with_phone} phones from a full pass; expected at least ${MIN}. Refusing.`);
  process.exit(1);
}
