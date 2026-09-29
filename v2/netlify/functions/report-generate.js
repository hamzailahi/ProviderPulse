const { renderAuditReport } = require('./lib/audit-report.js');

/**
 * Render a stored Directory Accuracy audit as a self-contained HTML report.
 *
 * Gated on the same x-audit-key as audit-run/audit-narrate, and on the same
 * fail-closed rule: an UNSET AUDIT_ADMIN_KEY returns 503, never an open
 * endpoint. Returns text/html so the browser renders it directly and the buyer
 * can print to PDF; ?format=json returns the underlying rows instead.
 */
async function auditReport(event, parsed) {
    const env = process.env;
    const JSONH = { 'Content-Type': 'application/json' };

    if (!env.AUDIT_ADMIN_KEY) {
        return { statusCode: 503, headers: JSONH, body: JSON.stringify({ error: 'Audit tooling is not configured' }) };
    }
    const key = event.headers['x-audit-key'] || event.headers['X-Audit-Key'] || '';
    if (key !== env.AUDIT_ADMIN_KEY) {
        return { statusCode: 401, headers: JSONH, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return { statusCode: 503, headers: JSONH, body: JSON.stringify({ error: 'Database is not configured' }) };
    }

    const auditId = String(parsed.audit_id || '').trim();
    if (!auditId) {
        return { statusCode: 400, headers: JSONH, body: JSON.stringify({ error: 'audit_id is required' }) };
    }

    const svc = {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    };
    const get = async (path) => {
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
            headers: svc, signal: AbortSignal.timeout(8000)
        });
        if (!r.ok) return null;
        return r.json().catch(() => null);
    };

    const [audits, findings] = await Promise.all([
        get(`directory_audits?id=eq.${encodeURIComponent(auditId)}&select=*`),
        // No cap: a report must show every finding in the audit, not a page of them.
        get(`audit_findings?audit_id=eq.${encodeURIComponent(auditId)}&select=*&order=confidence.asc`)
    ]);

    const audit = Array.isArray(audits) ? audits[0] : null;
    if (!audit) {
        return { statusCode: 404, headers: JSONH, body: JSON.stringify({ error: 'No such audit' }) };
    }
    const rows = Array.isArray(findings) ? findings : [];

    if ((parsed.format || '').toLowerCase() === 'json') {
        return { statusCode: 200, headers: JSONH, body: JSON.stringify({ audit, findings: rows }) };
    }

    // A pending audit is still worth rendering -- partial findings are useful --
    // but the reader must not mistake it for a finished one.
    const html = renderAuditReport(audit, rows);
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        body: audit.status === 'complete' ? html : html.replace(
            '<h2>Executive summary</h2>',
            '<div class="disclaimer"><b>Incomplete audit.</b> This run is still marked ' +
            '<code>' + String(audit.status) + '</code>; some requested records have no finding yet, ' +
            'so the counts below cover only what has been scored.</div><h2>Executive summary</h2>'
        )
    };
}


exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    let parsed;
    try { parsed = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }

    // Directory-accuracy mode, the only one left. The narratives were already
    // written by audit-narrate, so this renders stored rows and calls no model.
    if (parsed.type === 'directory_audit') {
        return await auditReport(event, parsed);
    }

    // The dashboard's market report used to be written here, from whatever
    // clinics the browser sent. Reports are now written by the market assistant
    // (market-assistant.js, create_deliverable), grounded in the market model.
    return {
        statusCode: 410,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Market reports are now written by the dashboard assistant (Reports tab).' })
    };
};
