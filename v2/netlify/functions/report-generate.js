const https = require('https');
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

function callAnthropic(payload, apiKey) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const req = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch(e) { resolve({ status: res.statusCode, body: { error: 'Invalid JSON from Anthropic', raw: data.substring(0, 200) } }); }
            });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Anthropic API timeout after 15s')); });
        req.write(body);
        req.end();
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    let parsed;
    try { parsed = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }

    // Directory-accuracy mode. Branches BEFORE the Anthropic key and ZIP checks
    // below: the narratives were already written by audit-narrate, so this path
    // renders stored rows and calls no model at all.
    if (parsed.type === 'directory_audit') {
        return await auditReport(event, parsed);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

    const { question, zips, clinics, demographics, procedures, places, cms } = parsed;

    if (!zips || zips.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No ZIP codes provided.' }) };
    }
    if (!question || !question.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No report question provided.' }) };
    }

    // 1. Filter clinics to scope ZIPs, count by taxonomy
    const zipSet = new Set(zips.map(z => String(z).padStart(5, '0')));
    const scopedClinics = (clinics || []).filter(c => zipSet.has(String(c.zip || '').padStart(5, '0')));
    const taxonomyCounts = {};
    scopedClinics.forEach(c => {
        const t = c.taxonomy || 'Unknown';
        taxonomyCounts[t] = (taxonomyCounts[t] || 0) + 1;
    });
    const topTaxonomies = Object.entries(taxonomyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([taxonomy, count]) => ({ taxonomy, count }));

    // 2. Summarize demographics
    const demList = demographics || [];
    const demTotals = demList.reduce((acc, d) => ({
        total_population: acc.total_population + (d.total_population || 0),
        adult_population: acc.adult_population + (d.adult_population_18plus || 0),
        insured_population: acc.insured_population + (d.insured_population || 0),
    }), { total_population: 0, adult_population: 0, insured_population: 0 });
    if (demTotals.total_population > 0) {
        demTotals.insured_pct = Math.round((demTotals.insured_population / demTotals.total_population) * 100);
    }
    demTotals.zip_count = demList.length;

    // 3. Top 10 procedures only
    const procRows = [];
    if (procedures) {
        Object.entries(procedures).forEach(([specialty, procs]) => {
            Object.values(procs).forEach(p => {
                procRows.push({
                    specialty,
                    desc: (p.hcpcs_desc || '').substring(0, 40),
                    patients: Math.round(p.tot_benes || 0),
                    avg_pay: p.count > 0 ? Math.round((p.avg_mdcr_pymt_amt || 0) / p.count) : 0
                });
            });
        });
        procRows.sort((a, b) => b.patients - a.patients);
        procRows.splice(10);
    }

    // 4. PLACES — numeric only
    const placesCompact = {};
    Object.entries(places || {}).forEach(([k, v]) => {
        if (typeof v === 'number') placesCompact[k] = Math.round(v * 10) / 10;
    });

    const systemPrompt = `You are a healthcare market intelligence analyst for ProviderPulse.
Write a report of NO MORE THAN 400 WORDS. Use only the data below. Be direct, cite specific numbers, end with one bottom-line sentence.

SCOPE: ZIP codes ${zips.join(', ')}
TOTAL CLINICS IN SCOPE: ${scopedClinics.length}

TOP SPECIALTIES (by clinic count):
${topTaxonomies.map(t => `  ${t.taxonomy}: ${t.count}`).join('\n')}

DEMOGRAPHICS:
  Total population: ${demTotals.total_population.toLocaleString()}
  Adult population (18+): ${demTotals.adult_population.toLocaleString()}
  Insured: ${demTotals.insured_pct || 'N/A'}%
  ZIP codes loaded: ${demTotals.zip_count}

CDC PLACES HEALTH METRICS:
${Object.keys(placesCompact).length > 0 ? Object.entries(placesCompact).map(([k, v]) => `  ${k}: ${v}%`).join('\n') : '  Not loaded — click a county on the map first'}

TOP MEDICARE PROCEDURES:
${procRows.length > 0 ? procRows.map(p => `  ${p.desc} (${p.specialty}): ${p.patients} patients, avg $${p.avg_pay}`).join('\n') : '  Not loaded'}

CMS UTILIZATION: ${Object.keys(cms || {}).length > 0 ? JSON.stringify(cms).substring(0, 300) : 'Not loaded'}`;

    try {
        const result = await callAnthropic({
            model: 'claude-sonnet-5',
            max_tokens: 900,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }]
        }, apiKey);

        if (result.status !== 200) {
            return { statusCode: result.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: result.body?.error?.message || 'Anthropic API error' }) };
        }

        const textBlock = result.body.content?.find(b => b.type === 'text');
        const report = textBlock ? textBlock.text : 'No report text returned.';

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report, zips })
        };

    } catch(e) {
        return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
};
