// Small safety tests for code that had none (2026-11-25):
// 1. the PHI document endpoints stay closed unless DOCUMENT_UPLOAD_ENABLED is
//    exactly "true", while doc-list and doc-delete stay reachable;
// 2. the printed directory audit report escapes every stored value;
// 3. the ZIP backfill queue skips a ZIP already queued or enriched in the last
//    30 days, and a failure never throws into the search that asked.
// No network. Run: node scripts/test-gates-and-reports.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };

Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'svc' });
let fetched = [];
globalThis.fetch = async (url) => { fetched.push(String(url)); return { ok: false, status: 401, json: async () => ({}), text: async () => '' }; };
const ev = (method, body) => ({ httpMethod: method, headers: { authorization: 'Bearer t' }, body: body ? JSON.stringify(body) : undefined, queryStringParameters: {} });

// 1. Document gate
for (const [name, method] of [['doc-upload-url', 'POST'], ['doc-extract', 'POST'], ['doc-confirm', 'POST']]) {
  const fn = require(`../v2/netlify/functions/${name}.js`);
  for (const v of [undefined, 'yes', 'TRUE', '1']) {
    if (v === undefined) delete process.env.DOCUMENT_UPLOAD_ENABLED; else process.env.DOCUMENT_UPLOAD_ENABLED = v;
    fetched = [];
    const r = await fn.handler(ev(method, { document_id: '00000000-0000-0000-0000-000000000000', filename: 'a.pdf' }));
    ok(r.statusCode === 503, `${name} is closed when the flag is ${JSON.stringify(v)}`);
    ok(fetched.length === 0, `${name} touches nothing while closed (${JSON.stringify(v)})`);
  }
}
delete process.env.DOCUMENT_UPLOAD_ENABLED;
for (const name of ['doc-list', 'doc-delete']) {
  const fn = require(`../v2/netlify/functions/${name}.js`);
  fetched = [];
  const r = await fn.handler(ev(name === 'doc-list' ? 'GET' : 'DELETE', { document_id: '00000000-0000-0000-0000-000000000000' }));
  ok(r.statusCode !== 503 && fetched.some(u => u.endsWith('/auth/v1/user')), `${name} stays reachable with uploads off (it checks the session)`);
}

// 2. Audit report escaping
{
  const { renderAuditReport, summarise } = require('../v2/netlify/functions/lib/audit-report.js');
  const evil = '<script>alert(1)</script>';
  const html = renderAuditReport({ state: evil, created_at: '2026-11-25T00:00:00Z' }, [
    { npi: '1234567893', provider_name: evil, verdict: 'likely_stale', confidence: 0.4, narrative: evil, address_checked: evil,
      signals: [{ name: evil, value: evil, detail: evil, direction: 'negative' }] },
    { npi: '1234567894', provider_name: 'B', verdict: 'made_up_verdict', confidence: null, signals: [] }
  ]);
  ok(!html.includes('<script>alert'), 'no stored value reaches the report unescaped');
  ok(html.includes('&lt;script&gt;'), 'values are shown, escaped');
  ok(html.includes('badge unk">made_up_verdict<'), 'an unknown verdict still renders, escaped');
  const s = summarise([{ verdict: 'likely_accurate', confidence: 0.9 }, { verdict: 'likely_stale', confidence: 0.3 }]);
  ok(s.total === 2 && s.needsWork === 1, 'summary counts records needing work');
  let threw = false; try { renderAuditReport({}, [{ npi: '1', verdict: 'likely_accurate', confidence: '0.80', signals: [] }]); } catch { threw = true; }
  ok(!threw, 'a confidence stored as text does not break the report');
}

// 3. ZIP backfill queue
{
  const { requestZipEnrichment, FRESHNESS_DAYS } = require('../v2/netlify/functions/lib/zip-enrichment.js');
  const env = process.env;
  let row = null, posted = 0;
  globalThis.fetch = async (url, o = {}) => { if (o.method === 'POST') { posted++; return { ok: true }; } return { ok: true, json: async () => (row ? [row] : []) }; };
  ok((await requestZipEnrichment(env, '3801')).reason === 'invalid_zip', 'a short ZIP is refused');
  ok((await requestZipEnrichment(env, '38017')).queued === true && posted === 1, 'a new ZIP is queued');
  row = { status: 'pending' }; ok((await requestZipEnrichment(env, '38017')).reason === 'already_queued', 'a queued ZIP is not queued twice');
  row = { status: 'done', last_enriched_at: new Date(Date.now() - 5 * 86400000).toISOString() };
  ok((await requestZipEnrichment(env, '38017')).reason === 'fresh', 'a ZIP enriched 5 days ago is fresh');
  row = { status: 'done', last_enriched_at: new Date(Date.now() - (FRESHNESS_DAYS + 1) * 86400000).toISOString() };
  ok((await requestZipEnrichment(env, '38017-1234')).queued === true, 'an old enrichment is requeued (ZIP+4 trimmed)');
  globalThis.fetch = async () => { throw new Error('down'); };
  ok((await requestZipEnrichment(env, '38017')).reason === 'error', 'a failure is reported, never thrown');
}

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
