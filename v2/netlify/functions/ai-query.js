const https = require('https');
const { validatePlan, buildPath, summarise, TABLES, OPS } = require('./lib/query-plan.js');

// ---------------------------------------------------------------------------
// MARKET MEMO: a two-step agent.
//
// Step 1 turns a natural-language market question into a constrained JSON query
// plan. Step 2 executes the plan server-side -- only if it validates -- and asks
// the model to write a memo over the pre-summarised results.
//
// The model never sees credentials, never emits SQL, and cannot name a table
// outside the allowlist in lib/query-plan.js. Rejection is the default.
// ---------------------------------------------------------------------------

const PLANNER_SYSTEM = `You turn a question about healthcare market data into ONE JSON query plan.

Available tables and columns (nothing else exists, and nothing else may be named):
${Object.entries(TABLES).map(([t, s]) =>
  `- ${t}${s.aggregatesOnly ? ' (AGGREGATES ONLY: aggregate must be "count" or "count_by")' : ''}: ${s.columns.join(', ')}`
).join('\n')}

Plan shape:
{
  "table": "<one table>",
  "select": ["<column>", ...],
  "filters": [{"column":"<column>","op":"<op>","value":<string|number|array>}],
  "aggregate": "none" | "count" | "count_by",
  "group_by": "<column, required when aggregate is count_by>",
  "taxonomy": "<optional specialty term, clinics only>",
  "limit": <1-2000>
}

Allowed operators: ${OPS.join(', ')}.

Rules:
- To filter clinics by specialty use the "taxonomy" field, NOT a filter on primary_taxonomy.

- clinics.primary_taxonomy is NOT one controlled vocabulary. Two coexist, from
  different import batches: a long form ("Family Medicine Physician", "Internal
  Medicine Physician", "General Practice Dentistry") and a short category form
  ("Family Medicine", "Internal Medicine", "Dentistry", "Vision & Eye Care").
  Always give the SHORT form: matching is at a word boundary, so "Family
  Medicine" finds both, while the long form finds only one.

- There is NO "Primary Care" value in most states. Primary care is spread across
  "Family Medicine", "Internal Medicine", "General Practice" and "Pediatrics".
  If asked about primary care, pick ONE of those and name it, or ask about
  clinics generally -- do not invent a "Primary Care" category.

- Values that really occur include: Family Medicine, Internal Medicine, General
  Practice, Pediatrics, Cardiology, Dentistry, Vision & Eye Care, Psychiatry &
  Mental Health, Chiropractic, Pharmacy, Nursing, Emergency Services, Therapy &
  Rehabilitation, Facility / Clinic, Radiology & Imaging, Surgery, Oncology,
  Dermatology, Neurology, Obstetrics & Gynecology.
- Prefer count_by for "how many per X" questions.
- There is no table of patients, provider accounts, emails, or contact details. If the question asks for any of those, or for anything not answerable from the tables above, return {"refuse":"<one short sentence saying what is unavailable>"}.
- Return ONLY the JSON object. No prose, no code fence.`;

const MEMO_SYSTEM = `You write a short market memo for a healthcare strategy analyst, grounded ONLY in the query results supplied.

Format exactly:
HEADLINE: <one sentence>
FINDINGS:
- <finding>
- <finding>
- <finding>
CAVEAT: <one sentence naming the main limitation of this data>

Rules:
- Use only numbers present in the results. Never estimate, extrapolate, or project.
- If the results are empty or too thin to support a finding, say so plainly in the headline rather than inventing one.
- Name the table the numbers came from.
- No compliance or regulatory claims.`;

function stripFence(t) {
  let s = String(t || '').trim();
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (m) s = m[1].trim();
  const b = s.indexOf('{');
  if (b > 0) s = s.slice(b);
  return s;
}

async function marketMemo(parsed, apiKey) {
  const JSONH = { 'Content-Type': 'application/json' };
  const env = process.env;
  const question = String(parsed.question || '').trim().slice(0, 500);
  if (!question) {
    return { statusCode: 400, headers: JSONH, body: JSON.stringify({ error: 'A question is required' }) };
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { statusCode: 503, headers: JSONH, body: JSON.stringify({ error: 'Database is not configured' }) };
  }

  // ---- step 1: plan ------------------------------------------------------
  const planRes = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system: PLANNER_SYSTEM,
    messages: [{ role: 'user', content: question }]
  }, apiKey);

  if (planRes.status !== 200) {
    return { statusCode: 502, headers: JSONH, body: JSON.stringify({ error: 'The planner is unavailable right now.' }) };
  }
  const planText = (planRes.body.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
  let rawPlan;
  try { rawPlan = JSON.parse(stripFence(planText)); }
  catch { return { statusCode: 200, headers: JSONH, body: JSON.stringify({ refused: true, reason: 'Could not turn that into a query I can run. Try naming a state, ZIP or specialty.' }) }; }

  if (rawPlan && rawPlan.refuse) {
    return { statusCode: 200, headers: JSONH, body: JSON.stringify({ refused: true, reason: String(rawPlan.refuse).slice(0, 300) }) };
  }

  const check = validatePlan(rawPlan);
  if (!check.ok) {
    // The validator's message is the honest one; do not soften it.
    return { statusCode: 200, headers: JSONH, body: JSON.stringify({ refused: true, reason: check.error, plan: rawPlan }) };
  }
  const plan = check.plan;

  // ---- step 2: execute, server-side --------------------------------------
  let rows = [];
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${buildPath(plan)}`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      signal: AbortSignal.timeout(9000)
    });
    if (!r.ok) throw new Error('query failed: HTTP ' + r.status);
    rows = await r.json();
  } catch (e) {
    return { statusCode: 200, headers: JSONH, body: JSON.stringify({ refused: true, reason: 'The query could not be run against the database.', plan }) };
  }

  const summary = summarise(plan, rows);

  // ---- step 3: memo over the summary only --------------------------------
  const memoRes = await callAnthropic({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: MEMO_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify({ question, plan, results: summary }) }]
  }, apiKey);

  const memo = memoRes.status === 200
    ? (memoRes.body.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim()
    : '';

  return {
    statusCode: 200,
    headers: JSONH,
    body: JSON.stringify({
      question,
      plan,                 // shown in the UI: the analyst can see what was run
      results: summary,
      memo: memo || 'The memo could not be generated, but the query results above are complete.'
    })
  };
}

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
        name: "get_provider_contact_info",
        description: "Get contact information (phone, fax, authorized official) for specific providers enriched from NPPES. Only available for clinics the user has clicked on.",
        input_schema: {
            type: "object",
            properties: {
                npi: { type: "string", description: "The NPI number to look up contact info for" },
                name_keyword: { type: "string", description: "Optional: filter by provider name keyword" }
            },
            required: []
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

    if (toolName === "get_provider_contact_info") {
        const nppes = clientData.nppes || [];
        if (!nppes.length) return { loaded: false, message: "No NPPES contact data loaded yet. Click on clinic markers on the map to load their contact info." };
        const npi = toolInput.npi;
        const keyword = (toolInput.name_keyword || '').toLowerCase();
        let results = nppes;
        if (npi) results = results.filter(r => r.npi === npi);
        if (keyword) {
            const clinics = clientData.clinics || [];
            const matchingNPIs = clinics.filter(c => (c.name || '').toLowerCase().includes(keyword)).map(c => c.npi);
            results = results.filter(r => matchingNPIs.includes(r.npi));
        }
        if (!results.length) return { found: false, message: `No contact info found for ${npi || keyword || 'that provider'}. Try clicking their marker on the map first.` };
        // Join with clinic names
        const clinics = clientData.clinics || [];
        return results.map(r => {
            const clinic = clinics.find(c => c.npi === r.npi);
            return { ...r, clinic_name: clinic?.name, taxonomy: clinic?.taxonomy, address: clinic?.address };
        });
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
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch(e) {
                    console.log('JSON parse error, raw response:', data.substring(0, 300));
                    resolve({ status: res.statusCode, body: { error: 'Invalid JSON from Anthropic', raw: data.substring(0, 200) } });
                }
            });
        });
        req.on('error', e => {
            console.log('Anthropic request error:', e.message);
            reject(e);
        });
        req.setTimeout(22000, () => {
            req.destroy();
            reject(new Error('Anthropic API timeout after 22s'));
        });
        req.write(body);
        req.end();
    });
}

exports.handler = async function(event, context) {
    try {
        if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };

        let parsed;
        try { parsed = JSON.parse(event.body); }
        catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }; }

        // Market-memo mode: the constrained two-step agent. Branches before the
        // client-data tool loop below, which is untouched.
        if (parsed.mode === 'market_memo') {
            return await marketMemo(parsed, apiKey);
        }

        const { system, messages, clientData } = parsed;

        // Log payload size for debugging
        console.log('Payload size:', Buffer.byteLength(event.body), 'bytes');
        console.log('Clinics:', clientData?.clinics?.length, '| Procedures:', Object.keys(clientData?.procedures || {}).length, 'specialties');

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

            console.log('Anthropic response status:', result.status, '| stop_reason:', result.body?.stop_reason);

            if (result.status !== 200) {
                return { statusCode: result.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.body) };
            }

            const response = result.body;

            if (response.stop_reason === 'end_turn') {
                return {
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(response)
                };
            }

            if (response.stop_reason === 'tool_use') {
                const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
                if (!toolUseBlocks.length) break;

                currentMessages.push({ role: 'assistant', content: response.content });

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

        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Max iterations reached' }) };

    } catch(e) {
        console.log('Handler error:', e.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: e.message })
        };
    }
};
