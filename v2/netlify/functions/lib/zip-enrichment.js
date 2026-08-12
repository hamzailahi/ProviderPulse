// zip-enrichment.js
// Queues a ZIP for the background NPI backfill (scripts/enrich-npi-zips.mjs)
// instead of calling NPPES inline. An exhaustive per-ZIP NPPES pull (both
// NPI-1 and NPI-2, paginated) does not reliably fit inside a search request's
// time budget -- see CLAUDE.md's Timeouts section -- so this only ever writes
// one small upsert to zip_enrichment_queue (migration 013) and returns.
//
// Called from both zip-enrich-request.js (the public HTTP entry point used by
// the frontend) and patient-match.js (server-side, inline) so there is one
// place that decides whether a ZIP is stale enough to requeue.

'use strict';

// Re-queuing every search would spam the queue table and re-run NPPES pulls
// for a ZIP whose data hasn't gone stale. A ZIP is "fresh enough" for this
// window regardless of how many times it's searched.
const FRESHNESS_DAYS = 30;

async function requestZipEnrichment(env, zip) {
  const zip5 = String(zip || '').slice(0, 5);
  if (!/^\d{5}$/.test(zip5)) return { queued: false, reason: 'invalid_zip' };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { queued: false, reason: 'not_configured' };
  }

  const svc = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const existing = await fetch(
      `${env.SUPABASE_URL}/rest/v1/zip_enrichment_queue?zip=eq.${zip5}&select=status,last_enriched_at`,
      { headers: svc, signal: AbortSignal.timeout(4000) }
    );
    if (existing.ok) {
      const rows = await existing.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) {
        // Already queued or actively running -- nothing to do.
        if (row.status === 'pending' || row.status === 'processing') {
          return { queued: false, reason: 'already_queued' };
        }
        // Enriched recently enough -- don't requeue just because someone
        // searched it again.
        if (row.last_enriched_at) {
          const ageDays = (Date.now() - new Date(row.last_enriched_at).getTime()) / 86400000;
          if (ageDays < FRESHNESS_DAYS) return { queued: false, reason: 'fresh' };
        }
      }
    }

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/zip_enrichment_queue?on_conflict=zip`,
      {
        method: 'POST',
        headers: { ...svc, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ zip: zip5, status: 'pending', requested_at: new Date().toISOString() }]),
        signal: AbortSignal.timeout(4000)
      }
    );
    return { queued: res.ok };
  } catch {
    // Fire-and-forget: a failed queue write must never affect the search
    // that triggered it.
    return { queued: false, reason: 'error' };
  }
}

module.exports = { requestZipEnrichment, FRESHNESS_DAYS };
