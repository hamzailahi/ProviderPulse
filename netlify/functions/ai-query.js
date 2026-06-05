const https = require('https');

const TOOLS = [
    {
        name: "count_clinics_by_taxonomy",
        description: "Count clinics grouped by taxonomy/specialty, sorted by count descending. Use this for questions like 'top taxonomies', 'how many X clinics', 'most common specialties'.",
        input_schema: {
            type: "object",
            properties: {
                top_n: { type: "number", description: "How many results to return (default 10)" },
                filter_keyword: { type: "string", description: "Optional keyword to filter taxonomy names" }
            },
            required: []
        }
    },
    {
        name: "get_procedure_by_code",
        description: "Get Medicare procedure data for a specific HCPCS code. Returns tot_benes (unique patients), tot_srvcs (total services), avg_mdcr_pymt across all specialties that performed it.",
        input_schema: {
            type: "object",
            properties: {
                hcpcs_cd: { type: "string", description: "The HCPCS procedure code to look up" }
            },
            required: ["hcpcs_cd"]
        }
    },
    {
        name: "get_top_procedures_by_specialty",
        description: "Get top procedures for a given specialty sorted by patient volume.",
        input_schema: {
            type: "object",
            properties: {
                specialty: { type: "string", description: "Specialty name e.g. 'Cardiology', 'Family Practice'" },
                top_n: { type: "number", description: "How many procedures to return (default 10)" }
            },
            required: ["specialty"]
        }
    },
    {
        name: "get_places_metrics",
        description: "Get CDC PLACES health metrics for the loaded area. Returns disease prevalence rates.",
        input_schema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "get_cms_utilization",
        description: "Get CMS Medicare utilization data for the loaded county (ER visits, hospitalizations, etc).",
        input_schema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "get_demographics_summary",
        description: "Get population and insurance summary across all loaded ZIPs.",
        input_schema: { type: "object", properties: {}, required: [] }
    },
    {
        name: "compute_clinics_per_capita",
        description: "Compute number of clinics per 10,000 adults for a given taxonomy/specialty.",
        input_schema: {
            type: "object",
            properties: {
                taxonomy_keyword: { type: "string", description: "Keyword to match taxonomy names e.g. 'family medicine', 'cardiology'" }
            },
            required: ["taxonomy_keyword"]
        }
    },
    {
        name: "compare_disease_vs_provider_density",
        description: "Compare CDC PLACES disease prevalence with provider density for a condition. Identifies potential unmet need.",
        input_schema: {
            type: "object",
            properties: {
                condition: { type: "string", description: "Disease name e.g. 'diabetes', 'heart disease', 'depression'" }
            },
            required: ["condition"]
        }
    }
];

function callTool(toolName, toolInput, clientData) {
    const { clinics, demographics, procedures, places, cms } = clientData;

    if (toolName === "count_clinics_by_taxonomy") {
        const topN = toolInput.top_n || 10;
        const keyword = (toolInput.filter_keyword || '').toLowerCase();
        const counts = {};
        clinics.forEach(c => {
            const t = c.taxonomy || 'Unknown';
            if (keyword && !t.toLowerCase().includes(keyword)) return;
            counts[t] = (counts[t] || 0) + 1;
        });
        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(([taxonomy, count]) => ({ taxonomy, count }));
        return { total_clinics: clinics.length, results: sorted };
    }

    if (toolName === "get_procedure_by_code") {
        const code = (toolInput.hcpcs_cd || '').toUpperCase();
        const matches = [];
        Object.entries(procedures || {}).forEach(([specialty, procs]) => {
            Object.values(procs).forEach(p => {
                if ((p.hcpcs_cd || '').toUpperCase() === code) {
                    matches.push({
                        specialty,
                        hcpcs_cd: p.hcpcs_cd,
                        hcpcs_desc: p.hcpcs_desc,
                        tot_benes: Math.round(p.tot_benes),
                        tot_srvcs: Math.round(p.tot_srvcs),
                        avg_mdcr_pymt: p.count > 0 ? Math.round(p.avg_mdcr_pymt_amt / p.count) : 0
                    });
                }
            });
        });
        if (!matches.length) return { found: false, hcpcs_cd: code, message: "No data for this code in the loaded area" };
        const totals = matches.reduce((acc, m) => ({
            tot_benes: acc.tot_benes + m.tot_benes,
            tot_srvcs: acc.tot_srvcs + m.tot_srvcs
        }), { tot_benes: 0, tot_srvcs: 0 });
        return { found: true, hcpcs_cd: code, hcpcs_desc: matches[0].hcpcs_desc, ...totals, by_specialty: matches };
    }

    if (toolName === "get_top_procedures_by_specialty") {
        const spec = toolInput.specialty || '';
        const topN = toolInput.top_n || 10;
        const specData = procedures ? procedures[spec] : null;
        if (!specData) {
            const available = Object.keys(procedures || {}).filter(s => s.toLowerCase().includes(spec.toLowerCase()));
            return { found: false, specialty: spec, available_similar: available.slice(0, 5) };
        }
        const sorted = Object.values(specData)
            .map(p => ({
                hcpcs_cd: p.hcpcs_cd,
                hcpcs_desc: p.hcpcs_desc,
                tot_benes: Math.round(p.tot_benes),
                tot_srvcs: Math.round(p.tot_srvcs),
                avg_mdcr_pymt: p.count > 0 ? Math.round(p.avg_mdcr_pymt_amt / p.count) : 0
            }))
            .sort((a, b) => b.tot_benes - a.tot_benes)
            .slice(0, topN);
        return { specialty: spec, results: sorted };
    }

    if (toolName === "get_places_metrics") {
        if (!places || Object.keys(places).length === 0)
            return { loaded: false, message: "PLACES data not loaded. User must click a county or ZIP on the map." };
        return { loaded: true, metrics: places };
    }

    if (toolName === "get_cms_utilization") {
        if (!cms || Object.keys(cms).length === 0)
            return { loaded: false, message: "CMS utilization data not loaded. User must click a county on the map." };
        return { loaded: true, data: cms };
    }

    if (toolName === "get_demographics_summary") {
        if (!demographics || demographics.length === 0)
            return { loaded: false, message: "No demographics data loaded." };
        const totals = demographics.reduce((acc, d) => ({
            total_population: acc.total_population + (d.total_population || 0),
            adult_population: acc.adult_population + (d.adult_population_18plus || 0),
            insured_population: acc.insured_population + (d.insured_population || 0),
        }), { total_population: 0, adult_population: 0, insured_population: 0 });
        totals.insured_pct = totals.total_population > 0
            ? Math.round((totals.insured_population / totals.total_population) * 100) : 0;
        totals.zip_count = demographics.length;
        return totals;
    }

    if (toolName === "compute_clinics_per_capita") {
        const keyword = (toolInput.taxonomy_keyword || '').toLowerCase();
        const matched = clinics.filter(c => (c.taxonomy || '').toLowerCase().includes(keyword));
        const demSummary = demographics ? demographics.reduce((acc, d) => acc + (d.adult_population_18plus || 0), 0) : 0;
        if (demSummary === 0) return { error: "Demographics not loaded, cannot compute per-capita rate." };
        const rate = (matched.length / demSummary) * 10000;
        return {
            taxonomy_keyword: keyword,
            matching_clinics: matched.length,
            adult_population: Math.round(demSummary),
            clinics_per_10000_adults: Math.round(rate * 100) / 100
        };
    }

    if (toolName === "compare_disease_vs_provider_density") {
        const condition = (toolInput.condition || '').toLowerCase();
        const placesMatch = places ? Object.entries(places).filter(([k]) => k.toLowerCase().includes(condition)) : [];
        const clinicMatch = clinics.filter(c => (c.taxonomy || '').toLowerCase().includes(condition));
        const demTotal = demographics ? demographics.reduce((acc, d) => acc + (d.adult_population_18plus || 0), 0) : 0;
        return {
            condition,
            places_metrics: placesMatch.slice(0, 5).map(([measure, value]) => ({ measure, value })),
            related_clinics: clinicMatch.length,
            clinics_per_10000: demTotal > 0 ? Math.round((clinicMatch.length / demTotal) * 100000) / 10 : null,
            interpretation: placesMatch.length === 0 ? "No PLACES data loaded for this condition — click a county first." : null
        };
    }

    return { error: `Unknown tool: ${toolName}` };
}

async function callAnthropic(payload, apiKey) {
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
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

    let parsed;
    try { parsed = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { system, messages, clientData } = parsed;

    // Agentic tool loop — max 5 iterations
    let currentMessages = [...messages];
    let iterations = 0;

    while (iterations < 5) {
        iterations++;
        const result = await callAnthropic({
            model: 'claude-sonnet-4-5',
            max_tokens: 2000,
            system,
            tools: TOOLS,
            messages: currentMessages
        }, apiKey);

        if (result.status !== 200) {
            return { statusCode: result.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.body) };
        }

        const response = result.body;

        // If stop reason is end_turn or no tool use, return the text response
        if (response.stop_reason === 'end_turn') {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response)
            };
        }

        // Process tool calls
        if (response.stop_reason === 'tool_use') {
            const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
            if (!toolUseBlocks.length) break;

            // Add assistant response to messages
            currentMessages.push({ role: 'assistant', content: response.content });

            // Execute all tool calls and build tool results
            const toolResults = toolUseBlocks.map(block => ({
                type: 'tool_result',
                tool_use_id: block.id,
                content: JSON.stringify(callTool(block.name, block.input, clientData))
            }));

            currentMessages.push({ role: 'user', content: toolResults });
            continue;
        }

        break;
    }

    return { statusCode: 500, body: JSON.stringify({ error: 'Max iterations reached' }) };
};
