#!/usr/bin/env node
// Live audit of the dashboard's Explore mode, run in GitHub Actions against
// the deployed site (the dev container cannot reach it). Read only: it uses a
// placeholder provider session (the map reads public tables with the
// publishable key; signed-in functions answer 401 and are recorded as such),
// runs each search the way a person would, and records every Supabase and
// function request (status, time, PostgREST error code), console errors, the
// status line, how many listings loaded and drew, and a screenshot.
// Writes audit.md and audit.json to the output directory.
//
// Run: node scripts/live/dashboard-audit.mjs [outdir] [baseUrl]
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2] || 'audit-out';
const BASE = process.argv[3] || 'https://providerpulse-v2.netlify.app';
mkdirSync(OUT, { recursive: true });

const SEARCHES = [
  { name: 'Large state: TX', q: 'TX' },
  { name: 'ZIP 38017', q: '38017' },
  { name: 'City and state: Collierville, TN', q: 'Collierville, TN' },
  { name: 'Example button: Austin, TX', q: 'Austin, TX' },
  { name: 'City only: Memphis', q: 'Memphis' },
  { name: 'State: RI', q: 'RI' },
  { name: 'Several ZIPs: 38017, 38654', q: '38017, 38654' },
  { name: 'ZIP with leading zero: 02114', q: '02114' }
];

const results = [];
const browser = await chromium.launch();

async function fresh() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const s = { access_token: 'audit', refresh_token: 'audit', role: 'provider', staff: false, expiresAt: Date.now() + 3600e3 };
    try { sessionStorage.setItem('pp.session.v1', JSON.stringify(s)); localStorage.setItem('pp.dash.mode', 'explore'); } catch (e) {}
  });
  const page = await ctx.newPage();
  const log = { requests: [], console: [], pageErrors: [] };
  const started = new Map();
  page.on('request', r => started.set(r, Date.now()));
  page.on('requestfinished', async r => {
    const u = r.url();
    if (!/supabase\.co\/rest|\.netlify\/functions\//.test(u)) return;
    const res = await r.response();
    const st = res ? res.status() : 0;
    let code = '';
    if (st >= 400) { try { code = (await res.text()).slice(0, 160); } catch (e) {} }
    log.requests.push({ url: u.replace(/^https:\/\/[^/]+/, ''), status: st, ms: Date.now() - (started.get(r) || Date.now()), err: code });
  });
  page.on('requestfailed', r => {
    const u = r.url();
    if (/supabase\.co\/rest|\.netlify\/functions\//.test(u)) log.requests.push({ url: u.replace(/^https:\/\/[^/]+/, ''), status: 'FAILED', ms: Date.now() - (started.get(r) || Date.now()), err: (r.failure() || {}).errorText || '' });
  });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => log.pageErrors.push(String(e.message || e).slice(0, 300)));
  return { ctx, page, log };
}

async function settle(page, ms = 90000) {
  // Done when the status line reports a result (✅ / ❌) and requests go quiet.
  const t0 = Date.now();
  let last = '';
  while (Date.now() - t0 < ms) {
    const s = await page.evaluate(() => (document.getElementById('dbStatus') || {}).textContent || '').catch(() => '');
    if (/^[✅❌]/.test(s.trim()) && s === last) break;
    last = s;
    await page.waitForTimeout(1500);
  }
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  return Date.now() - t0;
}

async function snapshot(page) {
  return page.evaluate(() => {
    const txt = id => ((document.getElementById(id) || {}).innerText || '').replace(/\s+/g, ' ').trim();
    let grouped = 0, rows = 0;
    try { grouped = Object.keys(groupedData).length; rows = Object.values(groupedData).reduce((a, g) => a + (Array.isArray(g) ? g.length : 0), 0); } catch (e) {}
    let visible = 0; try { visible = currentlyVisiblePractices.length; } catch (e) {}
    let zips = 0; try { zips = Object.keys(zipDemographics || {}).length; } catch (e) {}
    return {
      status: txt('dbStatus'),
      welcomeVisible: getComputedStyle(document.getElementById('welcome-overlay') || document.body).display !== 'none' && (document.getElementById('welcome-overlay') || {}).style?.opacity !== '0',
      groupedKeys: grouped, groupedRows: rows, visible, zipsWithDemographics: zips,
      mapKey: txt('map-legend').slice(0, 400),
      insights: ((document.getElementById('insights-panel') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 500),
      markers: document.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length,
      warning: txt('load-warning')
    };
  }).catch(e => ({ error: String(e) }));
}

for (const s of SEARCHES) {
  const { ctx, page, log } = await fresh();
  const r = { name: s.name, q: s.q };
  try {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => typeof window.omniSearch === 'function' || document.getElementById('addressInput'), null, { timeout: 30000 });
    r.landed = page.url();
    await page.fill('#addressInput', s.q);
    await page.press('#addressInput', 'Enter');
    r.ms = await settle(page);
    r.after = await snapshot(page);
    await page.screenshot({ path: join(OUT, s.name.replace(/[^A-Za-z0-9]+/g, '_') + '.png') });
  } catch (e) { r.error = String(e.message || e).slice(0, 300); }
  r.requests = log.requests; r.console = log.console; r.pageErrors = log.pageErrors;
  results.push(r);
  await ctx.close();
}

// Follow-on interactions on one ZIP: specialty, neighbors, every tab, procedure sources.
{
  const { ctx, page, log } = await fresh();
  const r = { name: 'Interactions on 38017', q: '38017', steps: [] };
  try {
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => document.getElementById('addressInput'), null, { timeout: 30000 });
    await page.fill('#addressInput', '38017'); await page.press('#addressInput', 'Enter');
    await settle(page);
    const step = async (label, fn, wait = 4000) => {
      const before = log.requests.length;
      let err = null;
      try { await fn(); } catch (e) { err = String(e.message || e).slice(0, 200); }
      await page.waitForTimeout(wait);
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      r.steps.push({ label, err, snap: await snapshot(page), newRequests: log.requests.slice(before).map(x => `${x.status} ${x.ms}ms ${x.url.slice(0, 120)}${x.err ? ' ' + x.err : ''}`) });
      await page.screenshot({ path: join(OUT, 'step_' + label.replace(/[^A-Za-z0-9]+/g, '_') + '.png') });
    };
    await step('specialty Primary care', () => page.evaluate(() => { const s = document.getElementById('specialty-select'); s.value = 'Primary care / family doctor'; s.dispatchEvent(new Event('change')); }));
    await step('specialty Cardiology', () => page.evaluate(() => { const s = document.getElementById('specialty-select'); s.value = 'Heart / cardiology'; s.dispatchEvent(new Event('change')); }));
    await step('specialty All', () => page.evaluate(() => { const s = document.getElementById('specialty-select'); s.value = ''; s.dispatchEvent(new Event('change')); }));
    await step('click ZIP 38017 outline', () => page.evaluate(() => {
      let hit = false;
      zipGeoJSONLayer.eachLayer(l => { if (String(l.feature.properties.ZCTA5CE10).padStart(5, '0') === '38017' && !hit) { l.fire('click'); hit = true; } });
      if (!hit) throw new Error('no 38017 outline on the map');
    }), 3000);
    await step('add neighbors', () => page.evaluate(() => loadNeighboringZips()), 30000);
    for (const tab of ['insights', 'dashboard', 'health', 'procedures']) await step('tab ' + tab, () => page.evaluate(t => switchTab(t), tab), 6000);
    for (const src of ['outpatient', 'inpatient', 'medicaid', 'medicare']) await step('procedures ' + src, () => page.click(`#procSourceToggle [data-src="${src}"]`), 8000);
    await step('click a ZIP boundary', async () => {
      const box = await page.locator('#map').boundingBox();
      if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }, 6000);
  } catch (e) { r.error = String(e.message || e).slice(0, 300); }
  r.requests = log.requests; r.console = log.console; r.pageErrors = log.pageErrors;
  results.push(r);
  await ctx.close();
}
await browser.close();

// ---- report ----
const md = ['# Dashboard Explore audit', '', `Site: ${BASE}. Run ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.`, ''];
for (const r of results) {
  const bad = r.requests.filter(x => x.status === 'FAILED' || x.status >= 400);
  const slow = r.requests.filter(x => x.ms > 2500);
  md.push(`## ${r.name}`, '');
  if (r.error) md.push(`**Script error:** ${r.error}`, '');
  if (r.after) md.push(`- status line: \`${r.after.status}\` after ${Math.round((r.ms || 0) / 1000)}s`,
    `- warning shown: ${r.after.warning || 'none'}`,
    `- loaded: ${r.after.groupedRows} rows in ${r.after.groupedKeys} groups; drawn: ${r.after.visible}; ZIPs with demographics: ${r.after.zipsWithDemographics}; welcome still showing: ${r.after.welcomeVisible}`,
    `- map key: ${r.after.mapKey.slice(0, 200)}`, `- insights: ${r.after.insights.slice(0, 300)}`);
  md.push(`- requests: ${r.requests.length}, failed or 4xx/5xx: ${bad.length}, slower than 2.5s: ${slow.length}`);
  bad.slice(0, 15).forEach(x => md.push(`  - **${x.status}** ${x.ms}ms \`${x.url.slice(0, 160)}\` ${x.err.replace(/\s+/g, ' ')}`));
  slow.filter(x => !bad.includes(x)).slice(0, 8).forEach(x => md.push(`  - slow ${x.ms}ms \`${x.url.slice(0, 160)}\``));
  if (r.pageErrors.length) md.push('- page errors:', ...r.pageErrors.slice(0, 10).map(e => '  - ' + e));
  if (r.console.length) md.push('- console:', ...[...new Set(r.console)].slice(0, 12).map(e => '  - ' + e));
  (r.steps || []).forEach(st => {
    md.push(`- step **${st.label}**${st.err ? ' (error: ' + st.err + ')' : ''}: status \`${st.snap.status}\`${st.snap.warning ? ', warning: ' + st.snap.warning : ''}, drawn ${st.snap.visible}, map key ${st.snap.mapKey.slice(0, 120)}`);
    st.newRequests.filter(x => !/^2\d\d/.test(x) || / (2[5-9]\d\d|[3-9]\d{3}|\d{5,})ms /.test(x)).slice(0, 8).forEach(x => md.push('    - ' + x));
  });
  md.push('');
}
writeFileSync(join(OUT, 'audit.md'), md.join('\n') + '\n');
writeFileSync(join(OUT, 'audit.json'), JSON.stringify(results, null, 1));
console.log(md.join('\n'));
