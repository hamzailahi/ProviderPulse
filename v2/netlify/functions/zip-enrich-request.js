// zip-enrich-request.js
// Public, unauthenticated. The frontend calls this, fire-and-forget, whenever
// someone searches a ZIP (patient navigator or analyst dashboard) so the
// background NPI backfill (scripts/enrich-npi-zips.mjs) has something to work
// from. It does NOT call NPPES itself and does NOT write provider data -- it
// only upserts a queue row (migration 013's zip_enrichment_queue) and returns.
// See lib/zip-enrichment.js for the staleness/dedupe logic this wraps.
//
// Safe to expose with no auth: the only effect of calling it is "this ZIP is
// due for a backfill pass", and requestZipEnrichment() already no-ops on a
// ZIP that's already queued or was enriched recently, so spamming this
// endpoint cannot spam NPPES or Supabase writes.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { requestZipEnrichment } = require('./lib/zip-enrichment');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };
  }

  let zip = '';
  try {
    zip = String(JSON.parse(event.body || '{}').zip || '');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const result = await requestZipEnrichment(process.env, zip);
  // Always 200: this is a best-effort hint, never something the caller should
  // treat as a failure worth surfacing to the user.
  return { statusCode: 200, headers: CORS, body: JSON.stringify(result) };
};
