#!/usr/bin/env node
// Read-only check of the dashboard's Medicare procedures panel for one city,
// run in GitHub Actions (the dev container cannot reach Supabase). It finds
// the ZIPs the dashboard would load for the city, replays the panel's own
// cms_procedures_full requests (ten ZIPs per request, 1,000-row pages, at most
// 50 pages per batch) and records every page's status and time, then asks
// directly for one specialty's rows and a list of codes, so what the panel
// loaded can be compared with what the table holds.
//
// Run: node scripts/live/procedures-check.mjs "Fort Worth" TX "Obstetrics & Gynecology" 59400,59510,76805
const U = 'https://khkmdultmrggpfvkbfzj.supabase.co/rest/v1';
const K = 'sb_publishable_20jR_VjWJuUyj2_oiaHeZg_8VWHlJbQ';
const [CITY = 'Fort Worth', STATE = 'TX', SPEC = 'Obstetrics & Gynecology', CODES = ''] = process.argv.slice(2);
const codes = CODES.split(',').map(s => s.trim()).filter(Boolean);
const out = [];
const log = s => { out.push(s); console.log(s); };

async function get(path) {
  const t0 = Date.now();
  try {
    const r = await fetch(U + '/' + path, { headers: { apikey: K, Accept: 'application/json' } });
    const text = await r.text();
    let body = null; try { body = JSON.parse(text); } catch (e) {}
    return { status: r.status, ms: Date.now() - t0, body, text: text.slice(0, 200) };
  } catch (e) { return { status: 'FAILED', ms: Date.now() - t0, body: null, text: String(e).slice(0, 200) }; }
}

// 1. The ZIPs: the same city/state filter the dashboard search sends.
const variants = [...new Set([CITY.toUpperCase(), CITY, CITY.replace(/\b\w/g, c => c.toUpperCase())])];
const cityOr = 'or=(' + variants.map(v => 'city.eq.' + encodeURIComponent(v)).join(',') + ')';
const zips = new Set();
for (const t of ['clinics', 'provider_individuals']) {
  for (let off = 0; off < 60000; off += 1000) {
    const r = await get(`${t}?${cityOr}&state=eq.${STATE}&select=zip&limit=1000&offset=${off}`);
    if (!Array.isArray(r.body)) { log(`- ZIP lookup on ${t} failed at offset ${off}: ${r.status} ${r.text}`); break; }
    r.body.forEach(x => { const z = String(x.zip || '').slice(0, 5).padStart(5, '0'); if (/^\d{5}$/.test(z) && z !== '00000') zips.add(z); });
    if (r.body.length < 1000) break;
  }
}
const Z = [...zips].sort();
log(`# Procedures check: ${CITY}, ${STATE}`, '');
log(`ZIPs the dashboard would load: ${Z.length} (${Z.join(', ')})`, '');

// 2. Replay the panel's loader.
const sel = 'specialty,hcpcs_cd,hcpcs_desc,tot_benes,tot_srvcs,avg_sbmtd_chrg,avg_mdcr_alowd_amt,avg_mdcr_pymt_amt';
const order = 'specialty,tot_benes.desc,npi,hcpcs_cd,place_of_service';
const batches = []; for (let i = 0; i < Z.length; i += 10) batches.push(Z.slice(i, i + 10));
const rows = []; const report = [];
async function runBatch(list, bi) {
  let got = 0, pages = 0, end = 'complete', slow = 0;
  for (let offset = 0; pages < 50; offset += 1000, pages++) {
    const r = await get(`cms_procedures_full?zip=in.(${list.join(',')})&select=${sel}&order=${order}&limit=1000&offset=${offset}`);
    if (r.ms > 2500) slow++;
    if (r.status !== 200 || !Array.isArray(r.body)) { end = `stopped at offset ${offset}: ${r.status} ${r.text} (${r.ms}ms)`; break; }
    rows.push(...r.body); got += r.body.length;
    if (r.body.length < 1000) break;
    if (pages === 49) end = 'hit the 50-page cap';
  }
  report[bi] = `- batch ${bi + 1} (${list[0]}..${list[list.length - 1]}): ${got} rows in ${pages + 1} pages, ${slow} slow; ${end}`;
}
const t0 = Date.now();
for (let i = 0; i < batches.length; i += 4) await Promise.all(batches.slice(i, i + 4).map((b, j) => runBatch(b, i + j)));
log(`## What the panel loads (${Math.round((Date.now() - t0) / 1000)}s)`, '');
report.forEach(l => log(l));
const bySpec = {};
rows.forEach(r => { bySpec[r.specialty] = (bySpec[r.specialty] || 0) + 1; });
log('', `Rows loaded: ${rows.length}. Specialties: ${Object.keys(bySpec).length}.`);
const near = Object.keys(bySpec).filter(s => /obst|gyn|matern|midwi|women/i.test(s));
log(`Specialty names like "${SPEC}" in what loaded: ${near.length ? near.map(s => `${s} (${bySpec[s]} rows)`).join('; ') : 'none'}`, '');

// 3. Ask the table directly for the specialty, per batch (no ordering beyond the key).
log(`## Direct: ${SPEC} rows in these ZIPs`, '');
let direct = [], directFail = 0;
for (const list of batches) {
  for (let off = 0; off < 20000; off += 1000) {
    const r = await get(`cms_procedures_full?zip=in.(${list.join(',')})&specialty=eq.${encodeURIComponent(SPEC)}&select=zip,npi,hcpcs_cd,hcpcs_desc,tot_benes,place_of_service&limit=1000&offset=${off}`);
    if (!Array.isArray(r.body)) { directFail++; log(`- ${list[0]}..: ${r.status} ${r.text} (${r.ms}ms)`); break; }
    direct.push(...r.body);
    if (r.body.length < 1000) break;
  }
}
const npis = new Set(direct.map(r => r.npi));
log(`${direct.length} rows from ${npis.size} clinicians${directFail ? `, ${directFail} batches failed` : ''}. Panel loaded ${bySpec[SPEC] || 0} rows for it.`);
const byCode = {};
direct.forEach(r => { const c = byCode[r.hcpcs_cd] || (byCode[r.hcpcs_cd] = { d: r.hcpcs_desc, n: 0, b: 0 }); c.n++; c.b += Number(r.tot_benes) || 0; });
log('', 'Top codes by patients:');
Object.entries(byCode).sort((a, b) => b[1].b - a[1].b).slice(0, 25).forEach(([c, v]) => log(`- ${c} ${String(v.d || '').slice(0, 60)}: ${v.n} rows, ${Math.round(v.b)} patients`));

// 4. Specific codes, any specialty, in these ZIPs.
if (codes.length) {
  log('', `## Codes asked about, any specialty, in these ZIPs`, '');
  for (const code of codes) {
    let n = 0, b = 0, specs = {}, fail = 0;
    for (const list of batches) {
      const r = await get(`cms_procedures_full?zip=in.(${list.join(',')})&hcpcs_cd=eq.${code}&select=specialty,tot_benes&limit=1000`);
      if (!Array.isArray(r.body)) { fail++; continue; }
      r.body.forEach(x => { n++; b += Number(x.tot_benes) || 0; specs[x.specialty] = (specs[x.specialty] || 0) + 1; });
    }
    const loaded = rows.filter(r => r.hcpcs_cd === code).length;
    log(`- ${code}: table ${n} rows, ${Math.round(b)} patients (${Object.entries(specs).map(([s, k]) => s + ' ' + k).join(', ') || 'none'})${fail ? `, ${fail} batches failed` : ''}; panel loaded ${loaded}`);
  }
}

// 5. Across the whole state, does the specialty appear at all? (one page)
const st = await get(`cms_procedures_full?specialty=eq.${encodeURIComponent(SPEC)}&select=zip,hcpcs_cd&limit=5`);
log('', `Sample of ${SPEC} anywhere: ${st.status} ${Array.isArray(st.body) ? JSON.stringify(st.body) : st.text}`);
const cols = await get('cms_procedures_full?limit=1');
log(`Columns: ${Array.isArray(cols.body) && cols.body[0] ? Object.keys(cols.body[0]).join(', ') : cols.text}`);

// 6. The other sources the panel can switch to: Medicaid (T-MSIS, HHS).
if (codes.length) {
  log('', '## Medicaid (the panel\'s Medicaid source) for the same codes', '');
  for (const code of codes) {
    let n = 0, claims = 0, fail = 0;
    for (const list of batches) {
      const r = await get(`medicaid_procedures?zip=in.(${list.join(',')})&code=eq.${code}&select=specialty,claims&limit=1000`);
      if (!Array.isArray(r.body)) { fail++; continue; }
      r.body.forEach(x => { n++; claims += Number(x.claims) || 0; });
    }
    log(`- ${code}: ${n} rows, ${Math.round(claims)} claims${fail ? `, ${fail} batches failed` : ''}`);
  }
}

// 7. CMS's own file, through its data API: for a sample of the specialty's
// clinicians, how many rows does CMS publish per year, against our table?
try {
  const cat = await (await fetch('https://data.cms.gov/data.json')).json();
  const sets = cat.dataset || [];
  const ds = sets.find(d => /^Medicare Physician & Other Practitioners - by Provider and Service/i.test(d.title || ''));
  const dists = (ds && ds.distribution || []).filter(d => /data-api\/v1\/dataset\//.test(d.accessURL || ''));
  // The data year is the year the "temporal" range ends, else the newest year in the title.
  const yearOf = d => { const t = String(d.temporal || '').match(/(20\d\d)/g) || String(d.title || '').match(/(20\d\d)/g) || []; return t.length ? Number(t[t.length - 1]) : 0; };
  const apis = dists.map(d => ({ url: d.accessURL, year: yearOf(d), title: d.title, temporal: d.temporal })).sort((a, b) => b.year - a.year);
  log('', `## CMS source (${ds ? ds.title : 'dataset not found'})`, '');
  apis.slice(0, 4).forEach(a => log(`- distribution: ${a.title} | temporal ${a.temporal || '-'} | ${a.url}`));
  const ours = {}; direct.forEach(r => { ours[r.npi] = (ours[r.npi] || 0) + 1; });
  const sample = Object.keys(ours).slice(0, 8);
  for (const a of apis.slice(0, 3)) {
    const parts = [];
    for (const npi of sample) {
      const r = await fetch(a.url + '?' + new URLSearchParams({ 'filter[Rndrng_NPI]': npi, size: '5000' }));
      const rowsC = r.ok ? await r.json() : null;
      parts.push(`${npi}: CMS ${Array.isArray(rowsC) ? rowsC.length : 'HTTP ' + r.status} / ours ${ours[npi]}`);
    }
    log(`- year ${a.year}: ${parts.join('; ')}`);
  }
} catch (e) { log('', `CMS source check failed: ${String(e).slice(0, 200)}`); }

if (process.env.GITHUB_STEP_SUMMARY) (await import('node:fs')).appendFileSync(process.env.GITHUB_STEP_SUMMARY, out.join('\n') + '\n');
