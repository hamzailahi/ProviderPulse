// The weekly NPPES refresh (nppes-refresh.yml; rules in
// scripts/lib/nppes-refresh.mjs, geocoding in scripts/lib/geocode-batch.mjs).
//
// File mode reads one NPPES file (a weekly increment, or the monthly full file
// with --full) in two passes. Pass 1 plans: every record against what the
// directory holds, written to a plan file on disk, totals checked against
// LIMITS before anything is written. Pass 2 applies the plan in chunks:
// deletions, then geocoding (Census exact, then Google), then upserts. Every
// step compares with the database first, so a rerun after a failure resumes
// rather than duplicates.
//
// API mode (the fallback when no NPPES file can be downloaded) crawls the NPI
// Registry ZIP by ZIP from a rotating cursor within a time budget, and adds
// and updates what it finds. It cannot see deactivations.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GEOCODING_KEY (optional)
// node scripts/nppes-refresh.mjs --mode file --npidata npidata.csv [--pl pl.csv] [--full]
//   [--dry-run] [--state state.json --week-end YYYY-MM-DD --file-name NAME]
//   [--summary out.md] [--history history.csv] [--budget-min 300]
// node scripts/nppes-refresh.mjs --mode api --state state.json [--budget-min 240] ...
import { createReadStream, createWriteStream, readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { streamCsvRows, batchWrite } from './lib/bulk.mjs';
import { parseNucc } from './lib/taxonomy-map.mjs';
import { PAGE, apiError, crawlZip, makePacer } from './lib/nppes-api-phones.mjs';
import { fileIndex, plIndex, fileRecord, apiRecord, plRecord, planChunk, rowFor, overLimit, tableFor } from './lib/nppes-refresh.mjs';
import { geocodeAll } from './lib/geocode-batch.mjs';

const args = process.argv.slice(2);
const arg = (k, d = null) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const flag = k => args.includes('--' + k);
const mode = arg('mode', 'file');
const dryRun = flag('dry-run');
const full = flag('full');
const started = Date.now();
const budgetMs = Number(arg('budget-min', mode === 'api' ? 240 : 300)) * 60000;
const outOfTime = () => Date.now() - started > budgetMs;

const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'); process.exit(1); }
const GOOGLE = process.env.GOOGLE_GEOCODING_KEY || null;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const NPPES_API = process.env.NPPES_API_BASE || 'https://npiregistry.cms.hhs.gov/api/';
const log = m => console.error(m);
const fmt = n => Number(n || 0).toLocaleString('en-US');
const now = new Date().toISOString();

const nucc = parseNucc(readFileSync(arg('nucc', 'supabase/reference/nucc_taxonomy.csv'), 'utf8'));
const display = new Map(nucc.map(n => [n.code, n.display_name]));

const statePath = arg('state');
const state = statePath && existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {};
const totals = { records: 0, deletes: 0, inserts: 0, updates: 0 };
const stats = {};
const add = (o) => { for (const [k, v] of Object.entries(o || {})) stats[k] = (stats[k] || 0) + v; };

// ---------- database ----------
async function sb(method, path, body, extra = {}) {
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${URL_}/rest/v1/${path}`, { method, headers: { ...H, 'Content-Type': 'application/json', ...extra },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
    } catch (e) { if (attempt < 2) continue; throw new Error(`${method} ${path.slice(0, 60)}: ${e.message}`); }
    if (res.ok) return res.status === 204 ? null : res.json().catch(() => null);
    if (res.status >= 500 && attempt < 2) continue;
    throw new Error(`${method} ${path.slice(0, 60)}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
}
async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); }));
}
const chunks = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const COLS = 'npi,name,address,city,state,zip,phone,primary_taxonomy,taxonomy_code,taxonomy_code_source,latitude,longitude';

async function existingFor(npis) {
  const out = { clinics: new Map(), provider_individuals: new Map() };
  const jobs = [];
  for (const t of Object.keys(out)) for (const c of chunks(npis, 150)) jobs.push([t, c]);
  await pool(jobs, 6, async ([t, c]) => {
    for (const r of await sb('GET', `${t}?npi=in.(${c.join(',')})&select=${COLS}`)) out[t].set(String(r.npi), r);
  });
  return out;
}

// ---------- pass 1: plan ----------
// The plan file holds one JSON line per operation: {op:'del', npi} |
// {op:'put', rec, old} | {op:'site', site, parent}.
const planPath = arg('plan', '/tmp/nppes-refresh-plan.jsonl');

async function planRecords(records, planOut) {
  const ex = await existingFor([...new Set(records.map(r => r.npi))]);
  const p = planChunk(records, ex);
  add(p.stats);
  totals.records += records.length; totals.deletes += p.deletes.length;
  totals.inserts += p.inserts.length; totals.updates += p.updates.length;
  for (const npi of p.deletes) planOut.write(JSON.stringify({ op: 'del', npi }) + '\n');
  for (const rec of p.inserts) planOut.write(JSON.stringify({ op: 'put', rec, old: null }) + '\n');
  for (const { rec, old } of p.updates) planOut.write(JSON.stringify({ op: 'put', rec, old }) + '\n');
  return ex;
}

async function planFile(planOut) {
  let ix = null, buf = [];
  const parents = full ? null : new Map();   // npi -> what a secondary site inherits (weekly only)
  const flush = async () => {
    if (!buf.length) return;
    const ex = await planRecords(buf, planOut);
    if (parents) for (const r of buf) {
      if (r.deactivated) continue;
      const old = ex[tableFor(r)].get(r.npi);
      parents.set(r.npi, { type: r.type, name: r.name || old?.name || null, taxonomy: r.code ? r.taxonomy : old?.primary_taxonomy || null,
        code: r.code || old?.taxonomy_code || null, src: r.code ? r.src : old?.taxonomy_code_source || null });
    }
    buf = [];
  };
  for await (const row of streamCsvRows(createReadStream(arg('npidata')))) {
    if (!ix) { ix = fileIndex(row); continue; }
    const r = fileRecord(row, ix, display);
    if (!r) { stats.unusable_rows = (stats.unusable_rows || 0) + 1; continue; }
    buf.push(r);
    if (buf.length >= 3000) { await flush(); if ((totals.records % 300000) < 3000) log(`  planned ${fmt(totals.records)} records`); }
  }
  await flush();
  if (!ix) throw new Error('NPPES file was empty');
  // Retries carried from a run whose geocoder failed: looked up afresh.
  const retry = (state.retry_npis || []).filter(n => /^\d{10}$/.test(n));
  if (retry.length) {
    log(`  looking up ${retry.length} NPIs held back last run`);
    const recs = [];
    await pool(retry, 4, async npi => {
      try { const d = await apiGet({ number: npi }); for (const x of d.results) { const r = apiRecord(x, display); if (r) recs.push(r); } }
      catch { stats.retry_lookup_failed = (stats.retry_lookup_failed || 0) + 1; }
    });
    if (recs.length) await planRecords(recs, planOut);
    stats.retried = retry.length;
  }
  if (parents && arg('pl')) await planSites(parents, planOut);
}

async function planSites(parents, planOut) {
  let ix = null; const sites = [];
  for await (const row of streamCsvRows(createReadStream(arg('pl')))) {
    if (!ix) { ix = plIndex(row); continue; }
    const s = plRecord(row, ix);
    if (s && parents.has(s.npi)) sites.push(s);
  }
  const have = new Set();
  await pool(chunks([...new Set(sites.map(s => s.npi))], 150), 6, async c => {
    for (const r of await sb('GET', `clinic_secondary_locations?parent_npi=in.(${c.join(',')})&select=parent_npi,address,zip`))
      have.add(`${r.parent_npi}|${String(r.address).toUpperCase()}|${r.zip}`);
  });
  const seen = new Set();
  for (const s of sites) {
    const k = `${s.npi}|${s.address.toUpperCase()}|${s.zip}`;
    if (have.has(k) || seen.has(k)) continue;
    seen.add(k);
    planOut.write(JSON.stringify({ op: 'site', site: s, parent: parents.get(s.npi) }) + '\n');
    stats.new_secondary_sites = (stats.new_secondary_sites || 0) + 1;
  }
}

// ---------- pass 2: apply ----------
const held = [];
async function applyOps(ops) {
  const dels = ops.filter(o => o.op === 'del').map(o => o.npi);
  for (const c of chunks(dels, 150)) {
    if (dryRun) continue;
    const list = c.join(',');
    await sb('DELETE', `clinics?npi=in.(${list})`, null, { Prefer: 'return=minimal' });
    await sb('DELETE', `provider_individuals?npi=in.(${list})`, null, { Prefer: 'return=minimal' });
    await sb('DELETE', `clinic_secondary_locations?parent_npi=in.(${list})`, null, { Prefer: 'return=minimal' });
  }
  stats.removed = (stats.removed || 0) + dels.length;

  const puts = ops.filter(o => o.op === 'put'), sites = ops.filter(o => o.op === 'site');
  const needs = [];
  puts.forEach((o, i) => { if (!o.old || needsGeo(o)) needs.push({ id: 'p' + i, ...o.rec }); });
  sites.forEach((o, i) => needs.push({ id: 's' + i, ...o.site }));
  // A dry run geocodes a sample (300 addresses in all) so its summary shows
  // how many would be placed, and writes nothing.
  let ask = needs;
  if (dryRun) { ask = needs.slice(0, Math.max(0, 300 - (stats.geo_asked || 0))); }
  const g = ask.length ? await geocodeAll(ask, { googleKey: GOOGLE, log }) : { coords: new Map(), failed: new Set(), stats: {} };
  for (const [k, v] of Object.entries(g.stats)) if (k !== 'service_failed') stats['geo_' + k] = (stats['geo_' + k] || 0) + v;
  if (ask.length && g.failed.size / ask.length > 0.05)
    throw new Error(`geocoding failed for ${g.failed.size} of ${ask.length} addresses (Census or Google unreachable); stopping so a rerun retries them`);

  const groups = new Map();   // table|keys -> rows
  const push = (table, row) => { const k = table + '|' + Object.keys(row).sort().join(','); (groups.get(k) || groups.set(k, []).get(k)).push(row); };
  puts.forEach((o, i) => {
    const id = 'p' + i;
    if (g.failed.has(id)) { held.push(o.rec.npi); return; }
    const c = g.coords.get(id);
    push(tableFor(o.rec), rowFor(o.rec, o.old, c ? { lat: c.lat, lng: c.lng } : null, now));
  });
  sites.forEach((o, i) => {
    const id = 's' + i;
    if (g.failed.has(id)) return;
    const c = g.coords.get(id), s = o.site, p = o.parent;
    push('clinic_secondary_locations', { parent_npi: s.npi, entity_type: String(p.type), name: p.name, primary_taxonomy: p.taxonomy,
      address: s.address, address2: s.address2, city: s.city, state: s.state, zip: s.zip,
      latitude: c ? c.lat : null, longitude: c ? c.lng : null, geocode_precision: c ? 'address' : null,
      location_type: 'secondary', source: 'nppes_weekly', refreshed_at: now, taxonomy_code: p.code, taxonomy_code_source: p.src });
  });
  if (dryRun) return;
  for (const [k, rows] of groups) {
    const table = k.split('|')[0];
    await batchWrite(rows, { url: URL_, key: KEY, table, batch: 500, label: table,
      onConflict: table === 'clinic_secondary_locations' ? 'parent_npi,address,zip' : 'npi' });
  }
}
const needsGeo = o => {
  const a = o.old, r = o.rec, u = s => String(s || '').trim().toUpperCase();
  return u(a.address) !== u(r.address) || u(a.city) !== u(r.city) || u(a.state) !== u(r.state) || u(a.zip) !== u(r.zip);
};

async function applyPlan() {
  const rl = createInterface({ input: createReadStream(planPath), crlfDelay: Infinity });
  let batch = [], done = 0;
  for await (const line of rl) {
    if (!line) continue;
    batch.push(JSON.parse(line));
    if (batch.length >= 2000) { await applyOps(batch); done += batch.length; batch = []; log(`  applied ${fmt(done)} operations`); }
  }
  if (batch.length) { await applyOps(batch); done += batch.length; }
}

// ---------- NPI Registry API ----------
const pacer = makePacer({ startRate: 4, rate: 6, log });
async function apiGet(params) {
  const q = new URLSearchParams({ version: '2.1', limit: String(PAGE), ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  let last;
  for (let attempt = 0; attempt < 6 && !pacer.blocked; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 1000 * 2 ** Math.min(attempt, 4)));
    await pacer.slot();
    let res;
    try { res = await fetch(NPPES_API + '?' + q, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }); }
    catch (e) { last = String(e.message || e); continue; }
    if (res.status === 403 || res.status === 429) { last = `HTTP ${res.status}`; pacer.refused(res.status); continue; }
    if (res.status >= 500) { last = `HTTP ${res.status}`; continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json().catch(() => null);
    const err = apiError(data);
    if (err) throw new Error(err);
    pacer.ok();
    return data;
  }
  throw new Error(pacer.blocked ? 'the registry kept refusing requests' : last || 'failed');
}

async function apiZips() {
  const zips = [];
  for (let off = 0; ; off += 1000) {
    const rows = await sb('GET', `cdc_places?measureid=eq.DENTAL&select=zip&order=zip&limit=1000&offset=${off}`);
    rows.forEach(r => /^\d{5}$/.test(r.zip) && zips.push(r.zip));
    if (rows.length < 1000) break;
  }
  if (zips.length < 20000) throw new Error(`only ${zips.length} ZIPs from cdc_places; expected about 30,000`);
  return zips;
}

async function runApi() {
  const zips = await apiZips();
  let cursor = Number(state.api_cursor || 0) % zips.length, done = 0, failed = 0, overflow = 0;
  let recs = [];
  const flush = async () => {
    if (!recs.length) return;
    const out = createWriteStream(planPath);
    await planRecords(recs.filter(r => !r.deactivated), out);
    await new Promise(r => out.end(r));
    const why = overLimit({ ...totals, records: 0 }, 'api');
    if (why) throw new Error('refusing to write: ' + why);
    await applyPlan();
    recs = [];
  };
  while (done < zips.length && !outOfTime() && !pacer.blocked) {
    const zip = zips[cursor];
    try {
      for (const type of ['NPI-2', 'NPI-1']) {
        const r = await crawlZip(zip, p => apiGet({ ...p, enumeration_type: type }));
        if (r.still_full || r.split_failed) overflow++;
        for (const x of r.records) { const rec = apiRecord(x, display); if (rec) recs.push(rec); }
      }
    } catch (e) { failed++; if (failed <= 5) log(`  ${zip}: ${e.message}`); }
    cursor = (cursor + 1) % zips.length; done++;
    if (recs.length >= 5000) await flush();
    if (done >= 100 && failed / done > 0.2) throw new Error(`NPI Registry API failing: ${failed} of ${done} ZIPs`);
    if (done % 500 === 0) log(`  ${fmt(done)} ZIPs crawled`);
  }
  await flush();
  Object.assign(stats, { api_zips_crawled: done, api_zips_failed: failed, api_zips_over_ceiling: overflow, api_zips_total: zips.length });
  state.api_cursor = cursor;
}

// ---------- run ----------
async function claimedAmong(npis) {
  let n = 0;
  for (const c of chunks(npis, 150)) {
    for (const t of ['provider_profiles', 'provider_npis']) {
      try { n += (await sb('GET', `${t}?npi=in.(${c.join(',')})&select=npi`)).length; } catch { /* 044 not applied */ }
    }
  }
  return n;
}

async function main() {
  if (mode === 'file') {
    if (!arg('npidata')) throw new Error('--npidata is required in file mode');
    const out = createWriteStream(planPath);
    await planFile(out);
    await new Promise(r => out.end(r));
    log(`plan: ${fmt(totals.records)} records, ${fmt(totals.inserts)} to add, ${fmt(totals.updates)} to update, ${fmt(totals.deletes)} to remove`);
    const why = overLimit(totals, full ? 'full' : 'weekly');
    if (why) throw new Error('refusing to write: ' + why);
    if (!dryRun) {
      const dels = readFileSync(planPath, 'utf8').split('\n').filter(l => l.startsWith('{"op":"del"')).map(l => JSON.parse(l).npi);
      if (dels.length) stats.removed_claimed = await claimedAmong(dels);
    }
    await applyPlan();
  } else if (mode === 'api') {
    await runApi();
  } else throw new Error('--mode is file or api');

  state.retry_npis = [...new Set(held)].slice(0, 5000);
  if (!dryRun && statePath) {
    if (arg('week-end')) state.last_week_end = arg('week-end');
    state.last_run = now; state.last_mode = mode; state.last_file = arg('file-name') || state.last_file || null;
    writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
  }
  report();
}

function report() {
  const s = k => fmt(stats[k]);
  const lines = [
    `## NPPES refresh, ${now.slice(0, 10)}${dryRun ? ' (dry run: nothing written)' : ''}`, '',
    `- Source: ${mode === 'api' ? 'NPI Registry API (fallback)' : (arg('file-name') || arg('npidata'))}${full ? ' (full monthly file)' : ''}`,
    `- Records read: ${fmt(totals.records)}${stats.unusable_rows ? `; ${s('unusable_rows')} rows without a usable NPI or type` : ''}`,
    `- Added: ${s('new_organizations')} organizations, ${s('new_clinicians')} clinicians, ${s('new_secondary_sites')} secondary sites`,
    `- Updated: ${s('updated_organizations')} organizations, ${s('updated_clinicians')} clinicians (name ${s('changed_name')}, address ${s('changed_address')}, phone ${s('changed_phone')}, taxonomy ${s('changed_taxonomy')}); unchanged ${s('unchanged')}`,
    `- Removed (deactivated): ${s('deactivated_listed')} NPIs from every directory table; ${s('deactivated_not_listed')} other deactivations were not listed${stats.removed_claimed ? `; ${s('removed_claimed')} of the removed NPIs belong to claimed accounts (check them in admin review)` : ''}`,
    `- Geocoded: ${s('geo_asked')} addresses${dryRun ? ' (a dry-run sample)' : ''}: ${s('geo_census_exact')} Census exact, ${s('geo_google')} Google street level, ${s('geo_unplaced')} unplaced (stored without coordinates, not drawn)${stats.geo_google_not_configured ? `; ${s('geo_google_not_configured')} of those would have gone to Google, which is not configured (GOOGLE_GEOCODING_KEY secret)` : ''}`,
    `- Held back for a geocoder outage: ${fmt(held.length)} (looked up again next run)`,
    `- Skipped: ${s('no_practice_address')} with no practice address, ${s('type_changed_skipped')} whose entity type changed`
  ];
  if (mode === 'api') lines.push(`- ZIPs crawled: ${s('api_zips_crawled')} of ${s('api_zips_total')} (failed ${s('api_zips_failed')}, over the API's 1,200-record ceiling ${s('api_zips_over_ceiling')}); next run starts at ZIP index ${fmt(state.api_cursor)}. The API cannot report deactivations.`);
  const md = lines.join('\n') + '\n';
  console.log(md);
  if (arg('summary')) writeFileSync(arg('summary'), md);
  if (arg('history') && !dryRun) {
    if (!existsSync(arg('history'))) writeFileSync(arg('history'), 'date,source,records,added_orgs,added_clinicians,added_sites,updated,removed,geocoded,census_exact,google,unplaced\n');
    appendFileSync(arg('history'), [now.slice(0, 10), mode === 'api' ? 'api' : (arg('file-name') || 'file'), totals.records, stats.new_organizations || 0,
      stats.new_clinicians || 0, stats.new_secondary_sites || 0, (stats.updated_organizations || 0) + (stats.updated_clinicians || 0),
      stats.deactivated_listed || 0, stats.geo_asked || 0, stats.geo_census_exact || 0, stats.geo_google || 0, stats.geo_unplaced || 0].join(',') + '\n');
  }
  if (arg('stats')) writeFileSync(arg('stats'), JSON.stringify({ totals, stats }, null, 2));
}

main().catch(e => { console.error('FAILED: ' + (e.message || e)); try { report(); } catch { /* nothing to report */ } process.exit(1); });
