// Tests for appointment-briefing.js: a briefing only for a confirmed or
// completed visit the caller is party to; the profile read asks only for
// BRIEFING_FIELDS; the model sees no name or date of birth; document facts
// only when DOCUMENT_UPLOAD_ENABLED is exactly "true"; the disclaimer is
// always there; the audit row carries no PHI. No network.
// Run: node scripts/test-appointment-briefing.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pass = 0, fail = 0;
const ok = (c, n) => { if (c) pass++; else { fail++; console.log('FAIL', n); } };

Object.assign(process.env, { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'svc', ANTHROPIC_API_KEY: 'k' });
const PROFILE = { first_name: 'JANE', last_name: 'DOE', date_of_birth: '1960-01-02', insurance_payer: 'Aetna', conditions: ['Diabetes'], concern_description: 'Chest pain on stairs' };
let appt = { id: 'a1', patient_id: 'p1', provider_id: 'v1', status: 'confirmed' }, modelText = '{"narrative":"Chest pain on stairs; diabetes."}', calls = [];
globalThis.fetch = async (url, o = {}) => {
  url = String(url); calls.push({ url, m: o.method || 'GET', body: o.body });
  const j = v => ({ ok: true, status: 200, json: async () => v, text: async () => JSON.stringify(v) });
  if (url.endsWith('/auth/v1/user')) return j({ id: 'v1', user_metadata: { role: 'provider' } });
  if (url.includes('/appointment_requests?')) return j(appt ? [appt] : []);
  if (url.includes('/patient_profiles?')) return j([PROFILE]);
  if (url.includes('/patient_document_facts?')) return j([{ fact_type: 'lab', value: 'A1c 8.1', source_text: 'A1c 8.1%' }]);
  if (url.includes('api.anthropic.com')) return j({ content: [{ type: 'text', text: modelText }] });
  if (url.includes('/appointment_briefings')) return j([{ appointment_id: 'a1', summary: JSON.parse(o.body).summary }]);
  return j([]);
};
const fn = require('../v2/netlify/functions/appointment-briefing.js');
const post = async () => { calls = []; const r = await fn.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify({ appointment_id: 'a1' }) }); return { status: r.statusCode, body: JSON.parse(r.body) }; };

for (const s of ['requested', 'declined', 'cancelled']) { appt.status = s; ok((await post()).status === 409, `no briefing while ${s}`); }
appt = null; ok((await post()).status === 404, 'not a party (RLS hides it): 404');
appt = { id: 'a1', patient_id: 'p1', provider_id: 'v1', status: 'confirmed' };
{
  const r = await post();
  ok(r.status === 200, 'a confirmed visit gets a briefing');
  const prof = calls.find(c => c.url.includes('/patient_profiles?'));
  ok(prof.url.includes('select=first_name,last_name,date_of_birth,insurance_payer,conditions,concern_description'), 'the profile read asks for BRIEFING_FIELDS only');
  const ai = JSON.parse(calls.find(c => c.url.includes('anthropic')).body);
  const sent = JSON.stringify(ai.messages);
  ok(!sent.includes('JANE') && !sent.includes('1960') && !sent.includes('Aetna'), 'the model sees no name, date of birth or insurer');
  ok(sent.includes('Chest pain') && sent.includes('Diabetes'), 'the model sees the concern and conditions');
  ok(!calls.some(c => c.url.includes('patient_document_facts')), 'no document facts unless uploads are switched on');
  ok(/not a diagnosis/.test(r.body.briefing.summary.narrative), 'the model dropped the disclaimer, so it is appended');
  const auditRow = calls.find(c => c.url.includes('/audit_log'));
  ok(auditRow && !/Chest|Diabetes|JANE|1960/.test(auditRow.body), 'the audit row carries no PHI');
}
process.env.DOCUMENT_UPLOAD_ENABLED = 'yes';
{ await post(); ok(!calls.some(c => c.url.includes('patient_document_facts')), '"yes" is not "true": documents stay off'); }
process.env.DOCUMENT_UPLOAD_ENABLED = 'true';
{ const r = await post(); const f = calls.find(c => c.url.includes('patient_document_facts')); ok(f && f.url.includes('status=eq.accepted'), 'with uploads on, only accepted facts'); ok(r.body.briefing.summary.document_facts.length === 1, 'facts carried into the summary'); }
delete process.env.DOCUMENT_UPLOAD_ENABLED;
modelText = 'not json';
{ const r = await post(); const n = r.body.briefing.summary.narrative; ok(n.startsWith('Chief concern: Chest pain on stairs.') && /not a diagnosis/.test(n), 'a bad model answer falls back to the plain summary, disclaimer included'); }

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
