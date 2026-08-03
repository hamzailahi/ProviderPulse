// audit-narrate.js
// Writes the plain-English rationale for each finding in an audit.
//
// SEPARATE FROM audit-run.js ON PURPOSE. A 25-NPI audit can consume its whole
// 15s working budget; bolting a 15s Anthropic call onto the end would put the
// combined function past Netlify's 26s kill and lose findings that had already
// been scored. Narration is a second pass over rows that are already durable.
//
// ONE API CALL PER AUDIT, not per provider. Twenty-five sequential calls would
// be twenty-five round trips inside a 26s budget, which does not fit.
//
// WHAT THE MODEL IS GIVEN: the decomposed `signals` array and nothing else.
// No raw NPPES payloads, no clinic rows -- those are large, mostly irrelevant,
// and the payload-size lesson from ai-query. Every fact the narrative can state
// is therefore a fact the scorer already recorded and a reader can audit.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUDIT_ADMIN_KEY, ANTHROPIC_API_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-audit-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

const MAX_BATCH = 25;
const AI_TIMEOUT = 15000;
const SUPABASE_TIMEOUT = 6000;

// The line the product is not allowed to cross. LEIE NPI coverage is ~10.5%,
// Medicare activity says nothing about a paediatric practice, and a directory
// address can be stale while the provider is fine. Everything here surfaces
// candidates for a human.
const DISCLAIMER = 'screening signal, not a compliance determination';

const SYSTEM = `You write one short rationale for each provider record in a healthcare directory accuracy audit.

You are given, per provider: an NPI, a confidence score, a verdict, and a decomposed list of signals. Each signal has a name, a value, a direction (positive, negative or none) and a detail string.

RULES, all mandatory:
1. Write 2 to 4 sentences per provider. Plain English for a compliance officer. No marketing tone, no hedging filler.
2. Cite by name every signal you rely on, e.g. "medicare_activity", "nppes_status". Use the signal names verbatim.
3. If a signal has the value "unknown", and it affects the conclusion, say explicitly that it is unknown. Never let an unknown read as a pass.
4. NEVER assert certainty. Do not write that a provider IS inactive, IS excluded, or IS accurate. Write what the signals indicate.
5. NEVER describe the result as compliance, certification, validation, or a guarantee. Every rationale must make clear this is a ${DISCLAIMER}.
6. Do not invent facts. If it is not in the signals, it is not available to you.

Return ONLY a JSON object mapping each NPI string to its rationale string. No markdown, no code fence, no commentary.
Example shape: {"1234567890":"...","1987654321":"..."}`;

const svc = env => ({
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
});

/**
 * Deterministic rationale assembled from the signals alone.
 *
 * Used when the model is unavailable or returns something unparseable. It must
 * be shippable, not a placeholder: a finding without a rationale is a finding
 * the buyer cannot act on, and failing the whole audit over a bad JSON response
 * would throw away work that is already correct.
 */
function fallbackNarrative(f) {
  const sigs = Array.isArray(f.signals) ? f.signals : [];
  const neg = sigs.filter(s => s.direction === 'negative');
  const pos = sigs.filter(s => s.direction === 'positive');
  const unk = sigs.filter(s => s.value === 'unknown');

  const list = arr => arr.map(s => s.name).join(', ');
  const parts = [];

  parts.push(`Confidence ${f.confidence == null ? 'unavailable' : f.confidence} (${f.verdict || 'no verdict'}).`);
  if (neg.length) parts.push(`Signals counting against this record: ${list(neg)}.`);
  if (pos.length) parts.push(`Signals supporting it: ${list(pos)}.`);
  if (unk.length) parts.push(`No data was available for: ${list(unk)}; these are unknown, not cleared.`);
  parts.push(`This is a ${DISCLAIMER}; confirm with the provider before acting.`);
  return parts.join(' ');
}

/** Strip a code fence the prompt already forbids, then parse. */
function parseModelJson(text) {
  let t = String(text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // Tolerate a leading sentence before the object.
  const brace = t.indexOf('{');
  if (brace > 0) t = t.slice(brace);
  try {
    const o = JSON.parse(t);
    return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null;
  } catch { return null; }
}

/** Compact one finding for the prompt: signals only, details trimmed. */
function forPrompt(f) {
  return {
    npi: f.npi,
    confidence: f.confidence,
    verdict: f.verdict,
    signals: (Array.isArray(f.signals) ? f.signals : []).map(s => ({
      name: s.name,
      value: s.value,
      direction: s.direction,
      detail: String(s.detail || '').slice(0, 180)
    }))
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };
  }

  const env = process.env;
  if (!env.AUDIT_ADMIN_KEY) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: 'Audit tooling is not configured' }) };
  }
  const key = event.headers['x-audit-key'] || event.headers['X-Audit-Key'] || '';
  if (key !== env.AUDIT_ADMIN_KEY) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const auditId = String(body.audit_id || '').trim();
  if (!auditId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'audit_id is required' }) };
  const redo = body.overwrite === true;

  // Only findings that still need one, unless explicitly redoing.
  const filter = redo ? '' : '&narrative=is.null';
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/audit_findings?audit_id=eq.${encodeURIComponent(auditId)}${filter}` +
    `&select=id,npi,confidence,verdict,signals&limit=${MAX_BATCH}`,
    { headers: svc(env), signal: AbortSignal.timeout(SUPABASE_TIMEOUT) }
  ).catch(() => null);

  if (!res || !res.ok) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not read findings' }) };
  }
  const findings = (await res.json().catch(() => [])) || [];
  if (!findings.length) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ audit_id: auditId, narrated: 0, note: 'Nothing to narrate' }) };
  }

  // ---- one call for the whole batch --------------------------------------
  let byNpi = null;
  let source = 'model';
  if (env.ANTHROPIC_API_KEY) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AI_TIMEOUT);
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          // ~4 sentences x 25 providers, plus JSON structure.
          max_tokens: 4000,
          system: SYSTEM,
          messages: [{ role: 'user', content: JSON.stringify(findings.map(forPrompt)) }]
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      const aiData = await aiRes.json();
      if (aiRes.ok) {
        const text = (aiData.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
        byNpi = parseModelJson(text);
      }
    } catch { /* fall through to the deterministic path */ }
  }
  if (!byNpi) source = env.ANTHROPIC_API_KEY ? 'fallback_parse_failed' : 'fallback_no_api_key';

  // ---- write back ---------------------------------------------------------
  let narrated = 0, fellBack = 0;
  for (const f of findings) {
    let text = byNpi && typeof byNpi[f.npi] === 'string' ? byNpi[f.npi].trim() : '';
    if (!text) { text = fallbackNarrative(f); fellBack++; }

    // Belt and braces: the disclaimer is a contract, not a hope. If the model
    // dropped it, append it rather than shipping a rationale that reads like a
    // determination.
    if (!new RegExp(DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text) &&
        !/screening/i.test(text)) {
      text += ` This is a ${DISCLAIMER}.`;
    }

    const w = await fetch(
      `${env.SUPABASE_URL}/rest/v1/audit_findings?id=eq.${encodeURIComponent(f.id)}`,
      { method: 'PATCH', headers: { ...svc(env), Prefer: 'return=minimal' },
        body: JSON.stringify({ narrative: text.slice(0, 4000) }),
        signal: AbortSignal.timeout(SUPABASE_TIMEOUT) }
    ).catch(() => null);
    if (w && w.ok) narrated++;
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      audit_id: auditId,
      narrated,
      of: findings.length,
      source,
      fell_back: fellBack
    })
  };
};
