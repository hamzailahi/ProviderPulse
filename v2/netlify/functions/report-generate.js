const https = require('https');

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
        req.setTimeout(22000, () => { req.destroy(); reject(new Error('Anthropic API timeout after 22s')); });
        req.write(body);
        req.end();
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

    let parsed;
    try { parsed = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }

    const { question, zips, clinics, demographics, procedures, places, cms } = parsed;

    if (!zips || zips.length === 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No ZIP codes provided.' }) };
    }
    if (!question || !question.trim()) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No report question provided.' }) };
    }

    // Trim procedures to top 60 rows by patient volume to keep payload small
    const procRows = [];
    if (procedures) {
        Object.entries(procedures).forEach(([specialty, procs]) => {
            Object.values(procs).forEach(p => {
                procRows.push({
                    specialty,
                    hcpcs_cd: p.hcpcs_cd,
                    hcpcs_desc: (p.hcpcs_desc || '').substring(0, 50),
                    tot_benes: Math.round(p.tot_benes || 0),
                    avg_mdcr_pymt: p.count > 0 ? Math.round((p.avg_mdcr_pymt_amt || 0) / p.count) : 0
                });
            });
        });
        procRows.sort((a, b) => b.tot_benes - a.tot_benes);
        procRows.splice(60);
    }

    const clinicSummary = (clinics || []).slice(0, 300).map(c => ({
        name: c.name, taxonomy: c.taxonomy, zip: c.zip
    }));

    const dataPacket = {
        zip_codes_in_scope: zips,
        clinics: clinicSummary,
        demographics: demographics || [],
        top_procedures: procRows,
        cdc_places_health_metrics: places || {},
        cms_county_utilization: cms || {}
    };

    const systemPrompt = `You are a healthcare market intelligence analyst writing a report for ProviderPulse.

STRICT RULES:
1. The report must be NO MORE THAN 500 WORDS. Count carefully and stay under this limit.
2. You may ONLY use data provided in the JSON data packet below. Do not reference any ZIP code, provider, or statistic not present in this packet.
3. The report is scoped exclusively to these ZIP codes: ${zips.join(', ')}. Do not generalize beyond them.
4. If the data packet is missing something needed to answer fully (e.g. no health data loaded), say so plainly rather than guessing.
5. Write in clear prose with short paragraphs. No markdown headers, no bullet-point lists longer than 5 items, no fluff or disclaimers.
6. Ground every claim in a specific number from the data packet where possible.
7. End with a one-sentence bottom-line takeaway that directly answers the user's question.

DATA PACKET (JSON):
${JSON.stringify(dataPacket)}`;

    try {
        const result = await callAnthropic({
            model: 'claude-sonnet-4-5',
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
