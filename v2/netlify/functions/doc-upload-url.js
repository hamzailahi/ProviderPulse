// doc-upload-url.js
// Issues a short-lived signed URL so the browser uploads a medical document
// DIRECTLY to Supabase Storage, and registers a patient_documents row for it.
//
// The file never passes through this function on purpose: Netlify caps request
// bodies around 6 MB and kills the function at 26s, and a phone photo of a
// discharge summary defeats both. Signed upload keeps the bytes off our compute.
//
// ⚠️ Uploaded documents are the most sensitive PHI in this system. This endpoint
// stays disabled unless DOCUMENT_UPLOAD_ENABLED=true, which must not be set until
// BAAs are in place with Supabase AND with Anthropic (see doc-extract.js).
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_UPLOAD_ENABLED

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const BUCKET = 'patient-docs';
const MAX_BYTES = 15 * 1024 * 1024;
// Deliberately no HEIC: the vision API cannot read it, so accepting one here
// would only fail after the patient had already waited through the upload.
// iOS converts HEIC to JPEG when a photo is picked through a file input.
const ALLOWED = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
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

  const mime = String(body.mime_type || '').toLowerCase().trim();
  const size = Number(body.size_bytes || 0);
  const filename = String(body.filename || 'document').trim().slice(0, 200);

  if (!ALLOWED[mime]) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Upload a PDF or a photo (JPEG, PNG, HEIC or WebP).' }) };
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Files must be under 15 MB.' }) };
  }

  // Identify the caller and require a patient account
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

  // Register the document first so a failed upload leaves a traceable row rather
  // than an orphaned object in the bucket.
  const docRes = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_documents`, {
    method: 'POST',
    headers: { ...svc, Prefer: 'return=representation' },
    body: JSON.stringify({
      patient_id: user.id,
      storage_path: 'pending',
      filename,
      mime_type: mime,
      size_bytes: size,
      status: 'uploaded'
    })
  });
  if (!docRes.ok) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not start the upload. Try again.' }) };
  }
  const doc = (await docRes.json())[0];

  // Owner-prefixed path: the storage RLS policies key off the first path segment
  const path = `${user.id}/${doc.id}.${ALLOWED[mime]}`;

  const signRes = await fetch(
    `${env.SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${path}`,
    { method: 'POST', headers: svc, body: JSON.stringify({ upsert: false }) }
  );
  if (!signRes.ok) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${doc.id}`, {
      method: 'PATCH', headers: svc, body: JSON.stringify({ status: 'failed', error: 'could not sign upload' })
    });
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Storage is unavailable right now. Try again shortly.' }) };
  }
  const signed = await signRes.json();

  await fetch(`${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${doc.id}`, {
    method: 'PATCH', headers: svc, body: JSON.stringify({ storage_path: path })
  });

  // Audit records the event only. Never the filename — patients name files things
  // like "biopsy-results-oncology.pdf", which is itself clinical information.
  await audit(env, { actor: user.id, actor_role: 'patient', action: 'document_upload_started', target: doc.id, ip });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      document_id: doc.id,
      // PUT the raw file to this URL with the same Content-Type
      upload_url: `${env.SUPABASE_URL}/storage/v1${signed.url || ''}`,
      token: signed.token || null,
      path
    })
  };
};
