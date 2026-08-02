// doc-delete.js
// Deletes a patient's uploaded document, everything extracted from it, and the
// stored file itself.
//
// This has to actually work. Someone who uploads their oncology records and then
// changes their mind must be able to remove them completely, not just hide them
// from a list. Storage object first, then rows — an orphaned row is recoverable,
// an orphaned PHI file in a bucket is not acceptable.
//
// Facts already APPLIED to the profile are not silently reverted: conditions the
// patient chose to keep are theirs now and live on patient_profiles, which they
// edit directly. The response says which ones those were so the UI can offer to
// remove them too.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DOCUMENT_UPLOAD_ENABLED

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

const BUCKET = 'patient-docs';

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
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST or DELETE only' }) };
  }

  const env = process.env;
  // Deliberately NOT gated on DOCUMENT_UPLOAD_ENABLED: if the feature is switched
  // off while documents exist, patients must still be able to delete them.

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

  const docRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${encodeURIComponent(documentId)}&patient_id=eq.${user.id}&select=id,storage_path`,
    { headers: svc }
  );
  const docs = docRes.ok ? await docRes.json() : [];
  const doc = Array.isArray(docs) && docs[0];
  if (!doc) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Document not found' }) };

  // Which accepted facts already reached the profile, so the UI can offer cleanup
  const acceptedRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/patient_document_facts?document_id=eq.${doc.id}&patient_id=eq.${user.id}&status=eq.accepted&select=fact_type,value`,
    { headers: svc }
  );
  const appliedFacts = acceptedRes.ok ? await acceptedRes.json() : [];

  // 1. The file itself. If this fails, stop — deleting the rows first would leave
  //    an unreferenced PHI object with nothing pointing at it.
  if (doc.storage_path && doc.storage_path !== 'pending') {
    const delObj = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${doc.storage_path}`, {
      method: 'DELETE',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
    });
    if (!delObj.ok && delObj.status !== 404) {
      await audit(env, { actor: user.id, actor_role: 'patient', action: 'document_delete_storage_failed', target: doc.id, ip });
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Could not delete the file. Nothing was removed — please try again.' }) };
    }
  }

  // 2. Facts, then the document row. (The FK is ON DELETE CASCADE, so this is
  //    belt and braces — but explicit beats relying on schema we do not own.)
  await fetch(`${env.SUPABASE_URL}/rest/v1/patient_document_facts?document_id=eq.${doc.id}&patient_id=eq.${user.id}`, {
    method: 'DELETE', headers: svc
  }).catch(() => {});

  const delDoc = await fetch(`${env.SUPABASE_URL}/rest/v1/patient_documents?id=eq.${doc.id}&patient_id=eq.${user.id}`, {
    method: 'DELETE', headers: svc
  });
  if (!delDoc.ok) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'The file was removed but its record was not. Contact support.' }) };
  }

  await audit(env, {
    actor: user.id, actor_role: 'patient', action: 'document_deleted', target: doc.id, ip,
    detail: { applied_facts_remaining: appliedFacts.length }
  });

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      ok: true,
      // Values are returned to the patient who owns them, so the UI can say
      // exactly what is still on the profile and offer to remove it.
      still_on_profile: appliedFacts.map(f => ({ fact_type: f.fact_type, value: f.value })),
      message: appliedFacts.length
        ? 'Document deleted. Some details you approved are still on your profile — you can remove them in your account.'
        : 'Document and everything read from it have been deleted.'
    })
  };
};
