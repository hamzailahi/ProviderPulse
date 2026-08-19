// appointment-briefing.js
// Builds the physician-facing briefing for a confirmed appointment: what the
// patient told us, plus whatever they've approved from uploaded documents.
//
// ── The safety boundary lives in this file, same posture as doc-extract.js ──
// This ORGANIZES facts the patient already supplied or approved. It never
// diagnoses, never says a value is concerning, never recommends a treatment
// or suggests a condition the patient/documents didn't already name. The
// value is saving the physician five minutes of chart review before they
// walk in, not replacing that review.
//
// WHO CAN CALL THIS: only the patient or the provider on the appointment --
// enforced by re-selecting the appointment_requests row under the CALLER'S
// JWT (migration 018 RLS already restricts that select to the two parties,
// so an empty result covers both "no such appointment" and "not yours").
// Everything downstream of that check runs under the service role, because
// a provider's JWT has no RLS access to patient_profiles or
// patient_document_facts at all -- self-only tables, by design.
//
// BRIEFING_FIELDS is the security boundary the same way PUBLIC_COLUMNS is in
// providers-public.js: this runs under the service role, so every field
// listed here is what a provider's JWT can see about a patient it would
// otherwise have zero access to. Never add anything beyond what a briefing
// needs.
//
// Document facts are included only when DOCUMENT_UPLOAD_ENABLED is true AND
// patient_document_facts exists AND the patient has ACCEPTED the fact
// (status='accepted' -- never 'pending' or 'rejected'). Missing the table or
// the flag degrades to a profile-only briefing rather than failing --
// exactly the "unavailable, not broken" posture provider-locations.js and
// providers-public.js already use.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//      ANTHROPIC_API_KEY (optional), DOCUMENT_UPLOAD_ENABLED (optional)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const AI_TIMEOUT = 12000;
const SUPABASE_TIMEOUT = 6000;

// Security boundary -- see file header. Never widen without re-reading it.
const BRIEFING_FIELDS = ['first_name', 'last_name', 'date_of_birth', 'insurance_payer', 'conditions', 'concern_description'];

const DISCLAIMER = 'organized from what the patient reported and approved, not a diagnosis or clinical assessment';

const SYSTEM = `You write a short pre-visit briefing for a physician, from facts already supplied or approved by the patient. You are part of a healthcare provider directory, not a clinical tool.

RULES, all mandatory:
1. Use ONLY the facts given to you. Never add a condition, medication, or concern that is not in the input.
2. NEVER diagnose. Do not interpret what a fact might mean, say a value is concerning, or suggest what the physician should do about it.
3. Write 3 to 6 short sentences: chief concern first, then relevant history, then anything from documents. Plain clinical English, no filler.
4. If a document fact has source_text, you may reference it but do not embellish beyond it.
5. If there is nothing to report in a category, omit that category rather than inventing filler.
6. End with one sentence making clear this is ${DISCLAIMER}.`;

const BRIEFING_SCHEMA = {
  type: 'object',
  properties: {
    narrative: { type: 'string' }
  },
  required: ['narrative'],
  additionalProperties: false
};

async function audit(env, row) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/audit_log`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(row)
    });
  } catch (e) { /* never block on audit */ }
}

function svc(env) {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
}

/** Deterministic fallback: a plain bullet summary assembled straight from the facts, no model involved. */
function deterministicNarrative(chiefConcern, conditions, facts) {
  const parts = [];
  if (chiefConcern) parts.push(`Chief concern: ${chiefConcern}.`);
  if (conditions.length) parts.push(`Reported conditions: ${conditions.join(', ')}.`);
  if (facts.length) {
    const byType = {};
    for (const f of facts) (byType[f.fact_type] = byType[f.fact_type] || []).push(f.value);
    for (const [type, values] of Object.entries(byType)) {
      parts.push(`From uploaded documents (${type}): ${values.join('; ')}.`);
    }
  }
  if (!parts.length) parts.push('No chief concern, conditions, or approved document facts on file.');
  parts.push(`This briefing is ${DISCLAIMER}.`);
  return parts.join(' ');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  const env = process.env;
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  const role = (user.user_metadata && user.user_metadata.role) || '';

  const appointmentId = event.httpMethod === 'GET'
    ? String((event.queryStringParameters || {}).appointment_id || '').trim()
    : null;

  if (event.httpMethod === 'GET') {
    if (!appointmentId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'appointment_id required' }) };
    const userHeaders = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
    // RLS on appointment_briefings already restricts this to the two parties.
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/appointment_briefings?appointment_id=eq.${encodeURIComponent(appointmentId)}&select=*`,
      { headers: userHeaders }
    );
    const rows = res.ok ? await res.json().catch(() => []) : [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ briefing: (Array.isArray(rows) && rows[0]) || null }) };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET or POST only' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const targetId = String(body.appointment_id || '').trim();
  if (!targetId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'appointment_id required' }) };

  // Authorization check: re-select under the CALLER'S JWT. An empty result
  // means either the appointment doesn't exist or this caller isn't a party
  // to it -- RLS makes those indistinguishable, which is the point.
  const userHeaders = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
  const apptRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/appointment_requests?id=eq.${encodeURIComponent(targetId)}&select=id,patient_id,provider_id,status`,
    { headers: userHeaders }
  );
  const apptRows = apptRes.ok ? await apptRes.json().catch(() => []) : [];
  const appt = Array.isArray(apptRows) && apptRows[0];
  if (!appt) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'No such appointment' }) };

  const svcHeaders = svc(env);

  const profRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_profiles?id=eq.${appt.patient_id}&select=${BRIEFING_FIELDS.join(',')}`,
    { headers: svcHeaders, signal: AbortSignal.timeout(SUPABASE_TIMEOUT) }
  ).catch(() => null);
  const profRows = profRes && profRes.ok ? await profRes.json().catch(() => []) : [];
  const profile = (Array.isArray(profRows) && profRows[0]) || {};

  const chiefConcern = String(profile.concern_description || '').trim();
  const conditions = Array.isArray(profile.conditions) ? profile.conditions.map(String) : [];

  let facts = [];
  let source = 'profile_only';
  if (env.DOCUMENT_UPLOAD_ENABLED === 'true') {
    const factsRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/patient_document_facts?patient_id=eq.${appt.patient_id}&status=eq.accepted&select=fact_type,value,source_text&limit=60`,
      { headers: svcHeaders, signal: AbortSignal.timeout(SUPABASE_TIMEOUT) }
    ).catch(() => null);
    // A missing table (migration 002 not yet applied) or any other failure
    // just means no document facts this time, not a broken briefing.
    if (factsRes && factsRes.ok) {
      const rows = await factsRes.json().catch(() => []);
      if (Array.isArray(rows) && rows.length) {
        facts = rows;
        source = 'profile_and_documents';
      }
    }
  }

  // ---- narrative: model first, deterministic fallback ----------------------
  let narrative = null;
  let narrativeSource = 'deterministic';
  if (env.ANTHROPIC_API_KEY) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_TIMEOUT);
      const input = {
        chief_concern: chiefConcern || null,
        known_conditions: conditions,
        document_facts: facts.map(f => ({ fact_type: f.fact_type, value: f.value, source_text: f.source_text }))
      };
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM,
          output_config: { format: { type: 'json_schema', schema: BRIEFING_SCHEMA } },
          messages: [{ role: 'user', content: JSON.stringify(input) }]
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const text = (aiData.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
        // Guarded parse for the same reason as doc-extract/audit-narrate: a
        // refusal or max_tokens cutoff can still miss BRIEFING_SCHEMA.
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.narrative === 'string' && parsed.narrative.trim()) {
          narrative = parsed.narrative.trim();
          narrativeSource = 'model';
        }
      }
    } catch { /* fall through to deterministic */ }
  }

  // Belt and braces, same as audit-narrate.js: the disclaimer is a contract,
  // not a hope. Append it if the model dropped it.
  if (narrative && !/not a diagnosis|not a clinical assessment/i.test(narrative)) {
    narrative += ` This briefing is ${DISCLAIMER}.`;
  }
  if (!narrative) narrative = deterministicNarrative(chiefConcern, conditions, facts);

  const summary = {
    chief_concern: chiefConcern || null,
    known_conditions: conditions,
    document_facts: facts.map(f => ({ fact_type: f.fact_type, value: f.value, source_text: f.source_text })),
    narrative,
    disclaimer: DISCLAIMER
  };

  const upsertRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/appointment_briefings?on_conflict=appointment_id`,
    {
      method: 'POST',
      headers: { ...svcHeaders, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        appointment_id: targetId,
        generated_at: new Date().toISOString(),
        source,
        narrative_source: narrativeSource,
        summary
      })
    }
  );
  if (!upsertRes.ok) {
    const detail = await upsertRes.text().catch(() => '');
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not save briefing: ' + detail.slice(0, 200) }) };
  }
  const saved = await upsertRes.json();

  // Field names and counts only -- never chief_concern, conditions, or fact
  // values, which are PHI.
  await audit(env, {
    actor: user.id, actor_role: role, action: 'appointment_briefing_generated', target: targetId, ip,
    detail: { source, narrative_source: narrativeSource, fact_count: facts.length, has_conditions: conditions.length > 0 }
  });

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ briefing: (Array.isArray(saved) && saved[0]) || null }) };
};
