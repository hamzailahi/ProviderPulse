// doc-extract.js
// Reads an uploaded medical document and extracts ONLY what it literally states,
// so the patient can review the findings and choose what goes on their profile.
//
// ── The safety boundary lives in this file ──────────────────────────────────
// This EXTRACTS, it does not INTERPRET. It may report that a document names a
// condition or contains a referral to cardiology. It must never explain what a
// result means, say whether a value is concerning, suggest a diagnosis, or
// recommend treatment. Medical advice is between the patient and their doctor.
//
// The product value is the referral the doctor ALREADY wrote: turning "refer to
// cardiology" into "here are three cardiologists near you who take your plan" is
// executing the physician's advice, not substituting for it.
//
// Nothing here writes to patient_profiles. Extracted facts land in
// patient_document_facts with status='pending' and reach the patient's actual
// record only through doc-confirm.js, after they approve each one.
//
// ⚠️ PHI leaves our infrastructure when the document is sent to the model. Requires
// a BAA on the Anthropic API account. Gated behind DOCUMENT_UPLOAD_ENABLED.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
//      ANTHROPIC_API_KEY, DOCUMENT_UPLOAD_ENABLED

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const BUCKET = 'patient-docs';
// Base64 inflates by ~33%; keep the request comfortably inside the model's limit
// and inside the 26s function budget.
const MAX_EXTRACT_BYTES = 10 * 1024 * 1024;

const FACT_TYPES = ['condition', 'referral', 'medication', 'allergy', 'provider', 'date'];
const DOC_KINDS = ['lab result', 'discharge summary', 'referral', 'visit summary', 'imaging report', 'prescription', 'other', 'unreadable'];

// Schema-constrained output (Structured Outputs) replaces the old "return JSON
// only, strip the code fence" prompting -- the API guarantees this shape, so
// the model can no longer wrap the answer in prose or a fence.
const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    document_kind: { type: 'string', enum: DOC_KINDS },
    facts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fact_type: { type: 'string', enum: FACT_TYPES },
          value: { type: 'string' },
          source_text: { type: 'string' }
        },
        required: ['fact_type', 'value', 'source_text'],
        additionalProperties: false
      }
    }
  },
  required: ['document_kind', 'facts'],
  additionalProperties: false
};

const SYSTEM = `You extract structured information from a patient's own medical document so they can add it to their provider-search profile. You are part of a healthcare provider directory, not a clinical tool.

Rules, in order of importance:

1. EXTRACT ONLY WHAT THE DOCUMENT LITERALLY STATES. Every fact must be supported by text you can quote verbatim in source_text. If you cannot quote it, do not report it.
2. NEVER INTERPRET. Do not say whether a value is high, low, normal, or concerning. Do not explain what a test measures. Do not infer a diagnosis from results. Do not suggest treatment, medication changes, or urgency. If the document shows a lab value but names no condition, extract no condition.
3. "referral" means the document explicitly directs the patient to a specialty or specialist — "refer to cardiology", "follow up with endocrinology". Use the specialty name as the value. This is the most useful fact type; capture it whenever present.
4. "condition" means a condition the document names as the patient's, in its own words. Not something you deduce.
5. "medication" and "allergy" are copied as listed. Do not add dosing guidance.
6. "provider" is a clinician or practice named in the document. "date" is the document or visit date, as ISO YYYY-MM-DD if it is unambiguous.
7. Keep each value under 80 characters and each source_text under 200 characters.
8. If the document is unreadable, not a medical document, or contains none of the above, return an empty facts list. An empty list is a correct answer.
9. Never address the patient. Never add commentary, reassurance, or warnings.`;

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };

  const env = process.env;
  if (env.DOCUMENT_UPLOAD_ENABLED !== 'true') {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Document upload is not available yet' }) };
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }
  const documentId = String(body.document_id || '').trim();
  if (!documentId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'document_id required' }) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  if (((user.user_metadata || {}).role) !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Patient accounts only' }) };
  }

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  // Ownership is enforced here explicitly: the service role bypasses RLS, so the
  // patient_id filter is the only thing standing between one patient's token and
  // another patient's medical records.
  const docRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${encodeURIComponent(documentId)}&patient_id=eq.${user.id}&select=*`,
    { headers: svc }
  );
  const docs = docRes.ok ? await docRes.json() : [];
  const doc = Array.isArray(docs) && docs[0];
  if (!doc) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Document not found' }) };

  if (doc.size_bytes > MAX_EXTRACT_BYTES) {
    return { statusCode: 413, headers: CORS, body: JSON.stringify({ error: 'That file is too large to read. Try a single page or a smaller scan.' }) };
  }

  const setStatus = (patch) => fetch(`${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${doc.id}`, {
    method: 'PATCH', headers: svc, body: JSON.stringify(patch)
  }).catch(() => {});

  await setStatus({ status: 'extracting', error: null });

  const fail = async (msg, code) => {
    await setStatus({ status: 'failed', error: String(msg).slice(0, 300) });
    return { statusCode: code || 502, headers: CORS, body: JSON.stringify({ error: msg }) };
  };

  // Fetch the object with the service role rather than a signed URL round-trip
  let b64, mediaType;
  try {
    const objRes = await fetch(
      `${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${doc.storage_path}`,
      { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }, signal: AbortSignal.timeout(8000) }
    );
    if (!objRes.ok) return await fail('Could not read the uploaded file.', 502);
    b64 = Buffer.from(await objRes.arrayBuffer()).toString('base64');
    mediaType = doc.mime_type || 'application/pdf';
  } catch {
    return await fail('Could not read the uploaded file.', 502);
  }

  const block = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } };

  let parsed;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        system: SYSTEM,
        output_config: { format: { type: 'json_schema', schema: EXTRACT_SCHEMA } },
        messages: [{
          role: 'user',
          content: [block, { type: 'text', text: 'Extract from this document.' }]
        }]
      }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!aiRes.ok) {
      const detail = await aiRes.text().catch(() => '');
      return await fail('The reader is unavailable right now. Your file was saved — try again in a moment.', 502);
    }
    const aiData = await aiRes.json();
    // A refusal or a max_tokens cutoff can still leave content that doesn't
    // match EXTRACT_SCHEMA -- the schema constrains a *completed* response,
    // not these two stop reasons -- so this stays a guarded parse rather than
    // an unconditional one.
    const text = (aiData.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
    parsed = JSON.parse(text);
  } catch (e) {
    return await fail('Could not read that document. It may be blurry, password-protected, or not a medical record.', 502);
  }

  // Validate hard. The model is not trusted to have followed the schema, and a
  // fact with no verbatim source_text is exactly the kind of invention this
  // feature must never put in front of a patient.
  const raw = Array.isArray(parsed.facts) ? parsed.facts : [];
  const facts = raw
    .filter(f => f && FACT_TYPES.includes(f.fact_type) && String(f.value || '').trim())
    .map(f => ({
      document_id: doc.id,
      patient_id: user.id,
      fact_type: f.fact_type,
      value: String(f.value).trim().slice(0, 80),
      source_text: String(f.source_text || '').trim().slice(0, 200) || null,
      status: 'pending'
    }))
    .filter(f => f.source_text)
    .slice(0, 40);

  // Re-extraction replaces the previous pass rather than duplicating it
  await fetch(`${env.SUPABASE_URL}/rest/v1/patient_document_facts?document_id=eq.${doc.id}&status=eq.pending`, {
    method: 'DELETE', headers: svc
  }).catch(() => {});

  if (facts.length) {
    const insRes = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_document_facts`, {
      method: 'POST', headers: { ...svc, Prefer: 'return=representation' }, body: JSON.stringify(facts)
    });
    if (insRes.ok) {
      const rows = await insRes.json();
      for (let i = 0; i < facts.length && i < rows.length; i++) facts[i].id = rows[i].id;
    }
  }

  const kind = String(parsed.document_kind || 'other').slice(0, 40);
  await setStatus({ status: 'extracted', extracted_at: new Date().toISOString(), error: null });

  // Audit the event and counts only — never the extracted values, which are PHI
  await audit(env, {
    actor: user.id, actor_role: 'patient', action: 'document_extracted', target: doc.id, ip,
    detail: { document_kind: kind, fact_count: facts.length }
  });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      document_id: doc.id,
      document_kind: kind,
      // Everything here is pending. It is a proposal for the patient to approve,
      // not a change to their record.
      facts: facts.map(f => ({ id: f.id || null, fact_type: f.fact_type, value: f.value, source_text: f.source_text })),
      message: facts.length
        ? 'Review what we found and choose what to add to your profile.'
        : 'We could not find anything to add from this document.'
    })
  };
};
