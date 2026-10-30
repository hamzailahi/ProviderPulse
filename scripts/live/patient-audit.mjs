#!/usr/bin/env node
// Live audit of the patient app (/), run in GitHub Actions against the
// deployed site (the dev container cannot reach it). Read only and write-free:
// a placeholder patient session with a mocked profile; the searches, payers,
// claimed listings and the detail sheet's NPPES and Medicare lookups are live,
// while everything that would write (demand logging, the ZIP backfill queue)
// and the AI helper (it needs a real account) are answered locally and
// labelled as mocked. Records for each step: time to an answer, what the
// results say, cards with a phone, every request (status, time, size),
// console errors; on the main screens axe-core accessibility violations and
// phone layout checks (overflow, tap targets, small text, input zoom); and
// load performance signed out, on desktop and on a throttled phone.
// Writes audit.md, audit.json and screenshots to the output directory.
//
// Run: node patient-audit.mjs [outdir] [baseUrl]   (axe-core and playwright installed beside it)
import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const OUT = process.argv[2] || 'patient-audit-out';
const BASE = (process.argv[3] || 'https://providerpulse-v2.netlify.app').replace(/\/$/, '');
const AXE = createRequire(join(process.cwd(), 'x.js')).resolve('axe-core/axe.min.js');
mkdirSync(OUT, { recursive: true });

const DESKTOP = { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 };
const PHONE = { ...devices['iPhone 13'], deviceScaleFactor: 2 };   // 390 x 844, touch, mobile UA
const report = { base: BASE, at: new Date().toISOString(), loads: [], searches: [], screens: [], phone: [], keyboard: null, detail: [], notes: [] };
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ['--headless=new'] } : {});

const MOCK_PROFILE = zip => ({ profile: { first_name: 'Test', last_name: 'Patient', zip, insurance_payer: '' } });

async function fresh(device, { signedIn = true, zip = '76117', throttle = false } = {}) {
  const ctx = await browser.newContext(device);
  if (signedIn) {
    await ctx.addInitScript(() => {
      const s = { access_token: 'audit', refresh_token: 'audit', role: 'patient', staff: false, expiresAt: Date.now() + 3600e3 };
      try { sessionStorage.setItem('pp.session.v1', JSON.stringify(s)); } catch (e) {}
    });
  }
  await ctx.addInitScript(() => {
    window.__lcp = 0;
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  });
  const mocked = [];
  const fulfil = (route, body, note) => { mocked.push(note); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) }); };
  await ctx.route('**/.netlify/functions/profile*', r => fulfil(r, MOCK_PROFILE(zip), 'profile'));
  await ctx.route('**/.netlify/functions/zip-enrich-request*', r => fulfil(r, { ok: true }, 'zip-enrich-request (write skipped)'));
  await ctx.route('**/.netlify/functions/appointment-request*', r => fulfil(r, { appointments: [] }, 'appointment-request'));
  await ctx.route('**/.netlify/functions/doc-list*', r => fulfil(r, { documents: [] }, 'doc-list'));
  await ctx.route('**/.netlify/functions/auth-refresh*', r => r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"audit"}' }));
  await ctx.route('**/.netlify/functions/patient-match*', r => {
    let b = {}; try { b = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    if (b.mode === 'log') return fulfil(r, { ok: true }, 'patient-match log (write skipped)');
    return fulfil(r, { reply: '[audit placeholder: the AI helper is mocked in this audit]', taxonomies: ['Dermatology'],
      map_taxonomies: ['Dermatology'], providers: [], zip: b.zip || zip }, 'patient-match AI (mocked)');
  });
  const page = await ctx.newPage();
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    // Lighthouse's mobile profile: slow 4G and a 4x slower CPU.
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  const log = { requests: [], console: [], pageErrors: [], mocked };
  const started = new Map();
  page.on('request', r => started.set(r, Date.now()));
  const keep = u => /supabase\.co|\.netlify\/functions\/|maptiler|unpkg|cdnjs|jsdelivr/.test(u);
  page.on('requestfinished', async r => {
    const u = r.url();
    if (!keep(u)) return;
    const res = await r.response().catch(() => null);
    const st = res ? res.status() : 0;
    let size = 0; try { size = (await r.sizes()).responseBodySize; } catch (e) {}
    let err = '';
    if (st >= 400) { try { err = (await res.text()).slice(0, 160); } catch (e) {} }
    log.requests.push({ t: Date.now(), url: short(u), status: st, ms: Date.now() - (started.get(r) || Date.now()), bytes: size, err });
  });
  page.on('requestfailed', r => { if (keep(r.url())) log.requests.push({ t: Date.now(), url: short(r.url()), status: 'FAILED', ms: Date.now() - (started.get(r) || Date.now()), err: (r.failure() || {}).errorText || '' }); });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.console.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => log.pageErrors.push(String(e.message || e).slice(0, 300)));
  return { ctx, page, log };
}
function short(u) {
  return u.replace(/^https:\/\/[^/]+\.supabase\.co/, 'SB').replace(/^https:\/\/[^/]+\/\.netlify\/functions/, 'FN')
    .replace(/key=[A-Za-z0-9]+/, 'key=…').slice(0, 220);
}
const shot = async (page, name, full = false) => { try { await page.screenshot({ path: join(OUT, name + '.png'), fullPage: full }); } catch (e) {} return name + '.png'; };

async function loadMetrics(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    const all = res.concat([nav]);
    const bytes = all.reduce((a, r) => a + (r.transferSize || 0), 0);
    const byType = {};
    for (const r of res) { const k = r.initiatorType; byType[k] = (byType[k] || 0) + (r.transferSize || 0); }
    const top = res.slice().sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0)).slice(0, 6)
      .map(r => ({ name: r.name.replace(/\?.*/, '').replace(/^https?:\/\/[^/]+/, ''), kb: Math.round((r.transferSize || 0) / 1024), ms: Math.round(r.duration) }));
    return { ttfb: Math.round(nav.responseStart || 0), dcl: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0),
      lcp: Math.round(window.__lcp || 0), requests: res.length + 1, kb: Math.round(bytes / 1024), kbByType: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])), top };
  }).catch(e => ({ error: String(e) }));
}

async function axe(page, label) {
  try {
    await page.addScriptTag({ path: AXE });
    const r = await page.evaluate(async () => {
      const out = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
      return out.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
        examples: v.nodes.slice(0, 3).map(n => ({ target: n.target.join(' ').slice(0, 120), html: n.html.slice(0, 140), why: (n.failureSummary || '').split('\n').slice(1, 2).join(' ').slice(0, 160) })) }));
    });
    return { label, violations: r };
  } catch (e) { return { label, error: String(e.message || e).slice(0, 200) }; }
}

// Phone layout: horizontal overflow, small tap targets, small text, inputs
// that make iOS zoom, and how far down the first result sits.
async function layout(page, label) {
  return page.evaluate(label => {
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const name = el => (el.getAttribute('aria-label') || el.textContent || el.value || el.placeholder || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 50);
    const targets = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [tabindex="0"]')].filter(vis);
    const small = targets.map(el => { const r = el.getBoundingClientRect(); return { n: name(el), w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter(t => t.w < 44 || t.h < 44);
    const tiny = small.filter(t => t.w < 24 || t.h < 24);
    const texts = [...document.querySelectorAll('body *')].filter(el => vis(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
    const smallText = texts.map(el => ({ n: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), px: parseFloat(getComputedStyle(el).fontSize) })).filter(t => t.px < 12);
    const zoomInputs = [...document.querySelectorAll('input, select, textarea')].filter(vis).filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).map(name);
    const first = document.querySelector('#results .res:not(.skel)');
    const go = document.querySelector('.sbar .sgo');
    return { label, viewport: [innerWidth, innerHeight], overflowX: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0,
      targets: targets.length, under44: small.length, under24: tiny.length, under44Examples: small.slice(0, 12),
      smallTextCount: smallText.length, smallTextExamples: [...new Map(smallText.map(t => [t.n, t])).values()].slice(0, 10),
      inputsUnder16px: zoomInputs, firstResultTop: first ? Math.round(first.getBoundingClientRect().top + scrollY) : null,
      searchButtonBottom: go ? Math.round(go.getBoundingClientRect().bottom + scrollY) : null };
  }, label).catch(e => ({ label, error: String(e) }));
}

async function waitResults(page, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const st = await page.evaluate(() => {
      const r = document.getElementById('results');
      const head = r && r.querySelector('.rhead');
      const sheet = document.querySelector('.sheet');
      if (sheet) return 'sheet';
      if (r && r.querySelector('.empty')) return 'empty';
      if (head && !/Searching/.test(head.textContent)) return 'done';
      return '';
    }).catch(() => '');
    if (st) return { state: st, ms: Date.now() - t0 };
    await page.waitForTimeout(200);
  }
  return { state: 'timeout', ms: Date.now() - t0 };
}

async function readResults(page) {
  return page.evaluate(() => {
    const t = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
    const r = document.getElementById('results');
    const cards = [...r.querySelectorAll('.res:not(.skel)')];
    const info = cards.map(c => ({ name: t(c.querySelector('h3')), spec: t(c.querySelector('.res-spec')), dist: t(c.querySelector('.dist')),
      addr: t(c.querySelector('.res-addr')), phone: !!c.querySelector('a[href^="tel:"]'), badges: t(c.querySelector('.badges')) }));
    const specs = {}; info.forEach(c => { specs[c.spec] = (specs[c.spec] || 0) + 1; });
    const sheet = document.querySelector('.sheet');
    return { head: t(r.querySelector('.rhead')), notes: [...r.querySelectorAll('.note')].map(t), empty: t(r.querySelector('.empty')),
      cards: cards.length, withPhone: info.filter(c => c.phone).length,
      // The reviewed hospital campus list (2026-10-25): is Baptist Collierville shown, and where.
      campusAt: cards.findIndex(c => c.dataset.npi === 'campus-bmh-collierville'), first: info.slice(0, 5), specialties: Object.entries(specs).sort((a, b) => b[1] - a[1]).slice(0, 8),
      more: t(r.querySelector('.more')), hash: location.hash, sheet: sheet ? t(sheet).slice(0, 400) : '', whatValue: (document.querySelector('.sbar .what input') || {}).value || '' };
  }).catch(e => ({ error: String(e) }));
}

async function search(page, log, { what, zip, miles, tile, door }) {
  // A sheet left open (the AI helper opens one for words it cannot place)
  // would sit over the search bar.
  if (await page.$('.sheet')) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  // Phones fold the form after a search (2026-10-24): open it first.
  if (await page.isVisible('.find-top.folded .sbar-sum').catch(() => false)) { await page.click('.sbar-sum'); await page.waitForTimeout(200); }
  const mark = Date.now();
  if (door && await page.isVisible('.start .tile.door')) {
    // A care-type door (2026-10-25); the ZIP field counts when a tile is tapped.
    if (zip != null) await page.fill('.sbar .zip input', zip);
    await page.locator('.start .tile.door', { hasText: door }).first().click();
  } else if (door) {
    // After a search the start screen is gone; a door's name typed is the same search.
    if (zip != null) await page.fill('.sbar .zip input', zip);
    await page.fill('.sbar .what input', door);
    await page.click('.sbar .sgo');
  } else if (tile != null) {
    // Specialty tiles sit under the doors.
    await page.locator('.start .spec-chips .spec-chip:not(.more-specs)').nth(tile).click();
  } else {
    if (zip != null) await page.fill('.sbar .zip input', zip);
    if (miles) await page.selectOption('.sbar .miles select', String(miles));   // re-runs only when a search exists
    await page.fill('.sbar .what input', what);
    await page.click('.sbar .sgo');
  }
  // The helper sheet opens on the next hashchange, after the old results are
  // still on screen: give it a moment so they are not read as this answer.
  await page.waitForTimeout(300);
  const w = await waitResults(page);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  const res = await readResults(page);
  const reqs = log.requests.filter(r => r.t >= mark);
  return { ...w, ...res, requests: reqs.length, failedRequests: reqs.filter(r => r.status === 'FAILED' || r.status >= 400).map(r => `${r.status} ${r.ms}ms ${r.url} ${r.err}`),
    slowest: reqs.slice().sort((a, b) => b.ms - a.ms).slice(0, 3).map(r => `${r.ms}ms ${r.status} ${r.url}`),
    kb: Math.round(reqs.reduce((a, r) => a + (r.bytes || 0), 0) / 1024) };
}

async function step(label, fn) {
  try { return await fn(); } catch (e) { report.notes.push(`${label}: ${String(e.message || e).slice(0, 300)}`); return null; }
}

// ---- 1. Signed out: what a visitor sees, and how fast -------------------------
for (const [dev, name, throttle] of [[DESKTOP, 'desktop', false], [PHONE, 'phone-slow4g', true]]) {
  await step('signed-out ' + name, async () => {
    const { ctx, page, log } = await fresh(dev, { signedIn: false, throttle });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(1500);
    const m = await loadMetrics(page);
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 300));
    report.loads.push({ name: 'signed out, ' + name, ...m, text, shot: await shot(page, 'signed-out-' + name), console: log.console, pageErrors: log.pageErrors });
    if (name === 'desktop') report.screens.push(await axe(page, 'Signed-out gate (desktop)'));
    else report.phone.push(await layout(page, 'Signed-out gate (phone)'));
    await ctx.close();
  });
}
await step('join page', async () => {
  const { ctx, page } = await fresh(PHONE, { signedIn: false });
  await page.goto(BASE + '/join', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim().slice(0, 600));
  report.loads.push({ name: 'join page (phone)', text, shot: await shot(page, 'join-phone', true) });
  report.phone.push(await layout(page, 'Join page (phone)'));
  await ctx.close();
});

// ---- 2. Signed in on desktop: the start screen, then real searches ------------
const DESKTOP_SEARCHES = [
  { label: 'Start tile 1 (profile ZIP 76117)', tile: 0 },
  { label: 'Door "Pharmacies", 38017', door: 'Pharmacies', zip: '38017' },
  { label: 'Door "Emergency rooms & hospitals", 38017 (Baptist Collierville campus expected)', door: 'Emergency rooms & hospitals', zip: '38017' },
  { label: 'Street address as the place: "dentist" near 1500 W Poplar Ave, Collierville, TN 38017', what: 'dentist', zip: '1500 W Poplar Ave, Collierville, TN 38017' },
  { label: 'Address not found: "dentist" near "zzzz nowhere street"', what: 'dentist', zip: 'zzzz nowhere street' },
  { label: 'Door "Labs & imaging", 76117', door: 'Labs & imaging', zip: '76117' },
  { label: 'Plain words "low cost clinic", 76117', what: 'low cost clinic', zip: '76117' },
  { label: 'Typed "dentist", 76117', what: 'dentist', zip: '76117' },
  { label: 'Plain words "knee pain", 76117', what: 'knee pain', zip: '76117' },
  { label: 'Plain words "flu shot", 76117', what: 'flu shot', zip: '76117' },
  { label: 'Procedure word "colonoscopy", 76117', what: 'colonoscopy', zip: '76117' },
  { label: 'Organizations: "urgent care", 10001 (Manhattan)', what: 'urgent care', zip: '10001' },
  { label: 'Organizations: "pharmacy", 38017', what: 'pharmacy', zip: '38017' },
  { label: 'Typo "dermotologist", 76117', what: 'dermotologist', zip: '76117' },
  { label: 'Plain words "therapist for my son", 38017', what: 'therapist for my son', zip: '38017' },
  { label: 'Plain words "spanish speaking doctor", 76117', what: 'spanish speaking doctor', zip: '76117' },
  { label: 'Dense area: "primary care", 10001', what: 'primary care', zip: '10001' },
  { label: 'Rural: "cardiology", 59601 (Helena, MT)', what: 'cardiology', zip: '59601' },
  { label: 'Rural at 50 mi: "cardiology", 59601', what: 'cardiology', zip: '59601', miles: 50 },
  { label: 'Bad ZIP "1234"', what: 'dentist', zip: '1234' }
];
await step('desktop searches', async () => {
  const { ctx, page, log } = await fresh(DESKTOP);
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.sbar', { timeout: 30000 });
  report.loads.push({ name: 'signed in, desktop: search bar ready', msToSearchBar: Date.now() - t0, ...(await loadMetrics(page)) });
  await page.waitForTimeout(2500);   // payers, map tiles
  await shot(page, 'start-desktop');
  report.screens.push(await axe(page, 'Start screen (desktop)'));
  for (const s of DESKTOP_SEARCHES) {
    const r = await step(s.label, () => search(page, log, s));
    if (!r) continue;
    r.label = s.label; r.shot = await shot(page, 'search-' + s.label.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 50));
    report.searches.push(r);
    if (r.state === 'sheet') { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    if (s.label.startsWith('Typed "dentist"')) report.screens.push(await axe(page, 'Results (desktop)'));
  }
  // The "Accepting new patients" chip on a real result list.
  await step('filter chip', async () => {
    await search(page, log, { what: 'Primary care / family doctor', zip: '76117' });
    // Since 2026-10-24 the chips show only when the search found claimed listings.
    if (!(await page.locator('.fchip', { hasText: 'Accepting' }).count())) { report.searches.push({ label: 'Filter chips on primary care, 76117', state: 'done', notes: ['chips hidden: no claimed listings in these results'] }); return; }
    await page.locator('.fchip', { hasText: 'Accepting' }).first().click();
    await page.waitForTimeout(500);
    const r = await readResults(page);
    report.searches.push({ label: 'Filter "Accepting new patients" on primary care, 76117', state: 'done', ...r, shot: await shot(page, 'filter-accepting') });
    await page.locator('.fchip', { hasText: 'Accepting' }).first().click();
  });
  // Detail sheets: a clinician and an organization.
  for (const [label, q] of [['Detail: first primary care result (76117)', { what: 'Primary care / family doctor', zip: '76117' }], ['Detail: first urgent care result (76117)', { what: 'urgent care', zip: '76117' }]]) {
    await step(label, async () => {
      await search(page, log, q);
      const t1 = Date.now(), mark = Date.now();
      await page.locator('#results .res:not(.skel) .act', { hasText: 'Details' }).first().click();
      await page.waitForSelector('.sheet', { timeout: 10000 });
      let settled = 0;
      for (let i = 0; i < 120; i++) {
        const busy = await page.evaluate(() => /Checking Medicare records|Looking up/.test((document.querySelector('.sheet') || {}).textContent || ''));
        if (!busy) { settled = Date.now() - t1; break; }
        await page.waitForTimeout(250);
      }
      const text = await page.evaluate(() => (document.querySelector('.sheet') || {}).innerText || '');
      const reqs = log.requests.filter(r => r.t >= mark).map(r => `${r.status} ${r.ms}ms ${r.url}`);
      report.detail.push({ label, msUntilSettled: settled || 'still loading after 30s', text: text.replace(/\n+/g, ' | ').slice(0, 700), requests: reqs, shot: await shot(page, label.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 50)) });
      if (label.includes('primary')) report.screens.push(await axe(page, 'Detail sheet (desktop)'));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    });
  }
  // The AI helper sheet (mocked answer): layout and accessibility only.
  await step('ask sheet', async () => {
    await page.click('.ask-link');
    await page.waitForSelector('.sheet textarea', { timeout: 8000 });
    report.screens.push(await axe(page, 'AI helper sheet (desktop)'));
    await shot(page, 'ask-sheet-desktop');
    await page.keyboard.press('Escape');
  });
  // Keyboard: tab order from the top, whether focus is visible, and whether a
  // focused result card responds to Enter.
  await step('keyboard', async () => {
    await search(page, log, { what: 'dentist', zip: '76117' });
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    const order = [];
    for (let i = 0; i < 22; i++) {
      await page.keyboard.press('Tab');
      order.push(await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return '(body)';
        const s = getComputedStyle(el);
        const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
        return `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} "${(el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40)}"${ring ? '' : ' [no visible focus]'}`;
      }));
    }
    const card = page.locator('#results .res:not(.skel)').first();
    await card.focus();
    const before = await page.evaluate(() => (document.querySelector('#results .res.active') || {}).dataset?.npi || '');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => (document.querySelector('#results .res.active') || {}).dataset?.npi || '');
    report.keyboard = { tabOrder: order, enterOnCardSelects: before !== after || !!after };
  });
  report.desktopConsole = log.console; report.desktopPageErrors = log.pageErrors; report.mocked = [...new Set(log.mocked)];
  await ctx.close();
});

// ---- 3. Phone on slow 4G, signed in: time to the search bar and a first search --
await step('phone slow 4G', async () => {
  const { ctx, page, log } = await fresh(PHONE, { throttle: true });
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.sbar', { timeout: 60000 });
  const bar = Date.now() - t0;
  const m = await loadMetrics(page);
  const r = await search(page, log, { what: 'knee pain', zip: '76117' });
  report.loads.push({ name: 'signed in, phone on slow 4G: search bar ready', msToSearchBar: bar, ...m });
  report.searches.push({ ...r, label: 'Phone, slow 4G: "knee pain", 76117', shot: await shot(page, 'search-phone-slow4g') });
  await ctx.close();
});

// ---- 4. Phone, signed in: the same flow at 390 px --------------------------------
await step('phone', async () => {
  const { ctx, page, log } = await fresh(PHONE);
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.sbar', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await shot(page, 'start-phone');
  report.phone.push(await layout(page, 'Start screen (phone)'));
  report.screens.push(await axe(page, 'Start screen (phone)'));
  for (const s of [{ label: 'Phone: "knee pain", 76117', what: 'knee pain', zip: '76117' }, { label: 'Phone: "urgent care", 10001', what: 'urgent care', zip: '10001' },
    { label: 'Phone: hospitals door by address, 1500 W Poplar Ave, Collierville', door: 'Emergency rooms & hospitals', zip: '1500 W Poplar Ave, Collierville, TN 38017' }]) {
    const r = await step(s.label, () => search(page, log, s));
    if (!r) continue;
    r.label = s.label; r.shot = await shot(page, 'search-' + s.label.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 50));
    report.searches.push(r);
  }
  report.phone.push(await layout(page, 'Results (phone)'));
  await shot(page, 'results-phone-full', true);
  await step('phone map', async () => {
    await page.click('.map-toggle');
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => { const el = document.getElementById('findMap'); const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; });
    report.phone.push({ label: 'Map view (phone)', map: m, shot: await shot(page, 'map-phone') });
    await page.click('.map-toggle');
  });
  await step('phone detail', async () => {
    await page.locator('#results .res:not(.skel) .act', { hasText: 'Details' }).first().click();
    await page.waitForSelector('.sheet', { timeout: 10000 });
    await page.waitForTimeout(6000);
    report.phone.push({ ...(await layout(page, 'Detail sheet (phone)')), shot: await shot(page, 'detail-phone') });
  });
  report.phoneConsole = log.console; report.phonePageErrors = log.pageErrors;
  await ctx.close();
});

await browser.close();
writeFileSync(join(OUT, 'audit.json'), JSON.stringify(report, null, 2));

// ---- Markdown --------------------------------------------------------------
const L = [];
L.push(`# Patient app audit`, '', `${BASE}, ${report.at}. Mocked (never written): ${(report.mocked || []).join(', ') || 'none'}.`, '');
L.push('## Loads', '');
for (const l of report.loads) {
  L.push(`- **${l.name}**: ${l.msToSearchBar != null ? `search bar after ${l.msToSearchBar} ms; ` : ''}${l.ttfb != null ? `TTFB ${l.ttfb} ms, DOMContentLoaded ${l.dcl} ms, load ${l.load} ms, LCP ${l.lcp} ms, ${l.requests} requests, ${l.kb} KB (${Object.entries(l.kbByType || {}).map(([k, v]) => `${k} ${v}`).join(', ')})` : ''}`);
  if (l.top) L.push(`  - largest: ${l.top.map(t => `${t.name} ${t.kb} KB ${t.ms} ms`).join('; ')}`);
  if (l.text) L.push(`  - text: "${l.text}"`);
  if (l.console && l.console.length) L.push(`  - console: ${l.console.slice(0, 5).join(' / ')}`);
}
L.push('', '## Searches', '', '| Search | Answer | ms | Header | Cards (with phone) | Top specialties shown | Requests (KB) | Problems |', '|---|---|---|---|---|---|---|---|');
for (const s of report.searches) {
  const prob = [...(s.notes || []), s.empty && s.state !== 'sheet' ? 'EMPTY: ' + s.empty.slice(0, 120) : '', s.hash ? 'hash ' + s.hash : '', s.sheet ? 'sheet: ' + s.sheet.slice(0, 120) : '', ...(s.failedRequests || [])].filter(Boolean).join('; ');
  L.push(`| ${s.label} | ${s.state} | ${s.ms ?? ''} | ${(s.head || '').slice(0, 70)} | ${s.cards ?? ''} (${s.withPhone ?? ''}) | ${(s.specialties || []).map(([k, v]) => `${k.slice(0, 32)} ${v}`).join('; ').slice(0, 160)} | ${s.requests ?? ''} (${s.kb ?? ''}) | ${prob.replace(/\|/g, '/').slice(0, 300)} |`);
}
L.push('', '### First results per search', '');
for (const s of report.searches) {
  L.push(`- **${s.label}** (box: "${s.whatValue}")${(s.slowest || []).length ? `, slowest: ${s.slowest.join('; ')}` : ''}`);
  for (const c of (s.first || [])) L.push(`  - ${c.name} · ${c.spec} · ${c.dist} · ${c.addr}${c.phone ? ' · phone' : ' · no phone'}${c.badges ? ' · ' + c.badges : ''}`);
}
L.push('', '## Detail sheets', '');
for (const d of report.detail) L.push(`- **${d.label}**: settled after ${d.msUntilSettled} ms. "${d.text}"`, `  - requests: ${d.requests.join('; ')}`);
L.push('', '## Accessibility (axe-core)', '');
for (const a of report.screens) {
  if (a.error) { L.push(`- **${a.label}**: axe failed: ${a.error}`); continue; }
  L.push(`- **${a.label}**: ${a.violations.length} rule(s) violated`);
  for (const v of a.violations) L.push(`  - [${v.impact}] ${v.id} (${v.count}): ${v.help}. e.g. \`${(v.examples[0] || {}).target || ''}\` ${(v.examples[0] || {}).why || ''}`);
}
L.push('', '## Phone layout (390 px)', '');
for (const p of report.phone) {
  if (p.map) { L.push(`- **${p.label}**: map ${p.map.w}x${p.map.h} at y=${p.map.top}`); continue; }
  if (p.error) { L.push(`- **${p.label}**: ${p.error}`); continue; }
  L.push(`- **${p.label}**: horizontal overflow ${p.overflowX ? p.overflowX + ' px wide' : 'none'}; ${p.under44} of ${p.targets} tap targets under 44 px (${p.under24} under 24 px); ${p.smallTextCount} text elements under 12 px; inputs under 16 px (iOS zooms): ${p.inputsUnder16px.join(', ') || 'none'}; search button bottom ${p.searchButtonBottom}, first result top ${p.firstResultTop}`);
  if (p.under44Examples.length) L.push(`  - small targets: ${p.under44Examples.map(t => `"${t.n}" ${t.w}x${t.h}`).join('; ')}`);
  if (p.smallTextExamples.length) L.push(`  - small text: ${p.smallTextExamples.map(t => `"${t.n}" ${t.px}px`).join('; ')}`);
}
if (report.keyboard) L.push('', '## Keyboard', '', `- Enter on a focused result card selects it: ${report.keyboard.enterOnCardSelects}`, `- Tab order from the top: ${report.keyboard.tabOrder.join(' → ')}`);
L.push('', '## Console', '', `- desktop: ${(report.desktopConsole || []).slice(0, 10).join(' / ') || 'none'}; page errors: ${(report.desktopPageErrors || []).join(' / ') || 'none'}`, `- phone: ${(report.phoneConsole || []).slice(0, 10).join(' / ') || 'none'}; page errors: ${(report.phonePageErrors || []).join(' / ') || 'none'}`);
if (report.notes.length) L.push('', '## Steps that failed', '', ...report.notes.map(n => '- ' + n));
writeFileSync(join(OUT, 'audit.md'), L.join('\n') + '\n');
console.log(L.join('\n'));
