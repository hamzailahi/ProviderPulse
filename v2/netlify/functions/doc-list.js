// doc-list.js
// A patient's own uploaded documents, for the manage/delete view.
//
// Returns metadata only — never the file, never the extracted clinical facts.
// Filenames ARE returned, because the patient chose them and needs to recognise
// their own documents; note they are often clinically revealing ("biopsy.pdf"),
// which is why they are never written to the audit log.
//
// Not gated on DOCUMENT_UPLOAD_ENABLED: if the feature is switched off while
// documents exist, patients must still be able to see and delete them.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };

  const env = process.env;
  const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Missing bearer token' }) };

  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!userRes.ok) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  const user = await userRes.json();
  if (((user.user_metadata || {}).role) !== 'patient') {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'Patient accounts only' }) };
  }

  // Read under the caller's own JWT so RLS is the enforcement layer, exactly as
  // profile.js does. No service role needed for a self-scoped read.
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_documents?patient_id=eq.${user.id}&select=id,filename,mime_type,size_bytes,status,uploaded_at&order=uploaded_at.desc&limit=50`,
    { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    // The table may not exist yet if the migration has not been run
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ documents: [], unavailable: true }) };
  }
  const rows = await res.json();

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ documents: Array.isArray(rows) ? rows : [] })
  };
};
