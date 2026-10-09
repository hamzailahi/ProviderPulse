// market-assistant.js
// The dashboard's Ask AI: a tool-using market assistant for providers and staff.
//
// ---------------------------------------------------------------------------
// STEPPED, BECAUSE OF THE 26s CEILING
//
// One question can take several model calls and tool runs. That does not fit
// in one Netlify Function invocation, so the loop is split across calls: each
// invocation works until ~STEP_BUDGET_MS, then returns `done:false` with the
// conversation so far, and the browser calls again with `continue:true`. The
// browser only ever stores and echoes `messages`; it never authors assistant
// or tool content that the server trusts for anything but the conversation.
//
// History is append-only. Assistant turns (including thinking blocks) are
// echoed back exactly as the API returned them; editing them would invalidate
// the model's preserved thinking.
//
// WHAT THE MODEL CAN REACH
//
// Read-only public aggregates, and nothing else:
//   get_market_insights / compare_markets  -> market-score.js (public)
//   find_providers                         -> clinics / provider_individuals (public)
//   query_database                         -> lib/query-plan.js allowlist (the boundary)
// Two tools have no server effect at all: update_map and create_deliverable
// are returned to the browser as actions / documents.
// No patient data, provider accounts, emails or search logs are reachable.
//
// The system prompt lives here, not in the request. The old ai-query tool loop
// accepted a client-written system prompt; this endpoint does not.
// ---------------------------------------------------------------------------

'use strict';

const AnthropicModule = require('@anthropic-ai/sdk');
const Anthropic = AnthropicModule.default || AnthropicModule;
const { getUser, isProvider } = require('./lib/auth.js');
const { validatePlan, buildPath, summarise, TABLES, OPS } = require('./lib/query-plan.js');
const { verifyText } = require('./lib/answer-check.js');
const SPECIALTIES = require('../../assets/specialties.js').MARKET;   // the market side's frozen list until phase 3b
const marketScore = require('./market-score.js');

const MODEL = 'claude-opus-5-5';
// A model call that writes a document (~900 tokens) needs 15 to 20 seconds, so
// it must never start late in an invocation. It is only started while at least
// MODEL_MIN_BUDGET_MS remain before HARD_BUDGET_MS; otherwise the step is handed
// back (done:false) and the browser continues in a fresh invocation whose clock
// starts near zero. (Until 2026-09-30 a call could start at 12s and got the
// remaining ~11s, so any long answer that followed tool lookups timed out.)
const HARD_BUDGET_MS = 23500;     // every model call and tool must finish before this
const MODEL_MIN_BUDGET_MS = 18000; // only start a model call with at least this much left
const TOOL_START_BUDGET_MS = 16000; // stop starting tool runs after this
const STEP_BUDGET_MS = HARD_BUDGET_MS - MODEL_MIN_BUDGET_MS;   // = 5500ms into an invocation
const MAX_ROUNDS_PER_QUESTION = 8;
const MAX_HISTORY_BYTES = 350000;
const SPEC_LABELS = SPECIALTIES.map(s => s[0]);
const GEO_MEASURE = 'DENTAL';     // the PLACES measure market-score reads centroids from

const JSONH = { 'Content-Type': 'application/json' };
const reply = (statusCode, body) => ({ statusCode, headers: JSONH, body: JSON.stringify(body) });

// ---------------------------------------------------------------------------
// Tracing. One JSON line per model call, tool run and invocation, in the
// function logs, so cost and latency can be measured instead of guessed. It
// records WHAT happened and how long it took: tool names, token counts,
// timings, outcomes and how many figures failed verification. It never records
// the question, the answer, a document, a ZIP or who asked. `cid` is a random
// per-chat id made by the browser, only so one chat's steps can be grouped.
// ---------------------------------------------------------------------------
// USD per million tokens, list prices for MODEL (an estimate, not a bill).
const PRICES = { input: 4, cache_write: 5, cache_read: 0.2, output: 20 };
function estimateCostUsd(u) {
  u = u || {};
  return ((u.input_tokens || 0) * PRICES.input + (u.cache_creation_input_tokens || 0) * PRICES.cache_write +
    (u.cache_read_input_tokens || 0) * PRICES.cache_read + (u.output_tokens || 0) * PRICES.output) / 1e6;
}
let traceSink = line => console.log(line);
function trace(ev) { try { traceSink('[assistant-trace] ' + JSON.stringify(ev)); } catch (e) { /* tracing never breaks a request */ } }
function _setTraceSink(f) { traceSink = f || (line => console.log(line)); }

// ---------------------------------------------------------------------------
// Figure checking (lib/answer-check.js). Every figure in an answer or document
// must trace to a tool result from this conversation, be derived from two
// traced figures on the same line, or be part of the assistant's own method
// (the system prompt) or the user's own words. An error result is never a
// source: the rejection message itself lists the untraced figures.
// ---------------------------------------------------------------------------
const SYNTHETIC = '[automatic check]';
const MAX_DOC_REJECTIONS = 2;

function blocksOf(m) { return Array.isArray(m.content) ? m.content : []; }
function isRealQuestion(m) {
  return m.role === 'user' && (typeof m.content === 'string' ||
    blocksOf(m).some(b => b.type === 'text' && !String(b.text).startsWith(SYNTHETIC)));
}
// The messages since the last thing the user actually typed.
function sinceQuestion(messages) {
  for (let i = messages.length - 1; i >= 0; i--) if (isRealQuestion(messages[i])) return messages.slice(i + 1);
  return messages.slice();
}
function toolResultTexts(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role !== 'user') continue;
    for (const b of blocksOf(m)) {
      if (b.type === 'tool_result' && !b.is_error) out.push(typeof b.content === 'string' ? b.content : JSON.stringify(b.content));
    }
  }
  return out;
}
function userTexts(messages) {
  const out = [];
  for (const m of messages) {
    if (m.role !== 'user') continue;
    if (typeof m.content === 'string') out.push(m.content);
    else for (const b of blocksOf(m)) if (b.type === 'text' && !String(b.text).startsWith(SYNTHETIC)) out.push(b.text);
  }
  return out;
}
function checkText(text, messages) {
  return verifyText(text, toolResultTexts(messages), [SYSTEM].concat(userTexts(messages)));
}
function figureList(check) { return [...new Set(check.unverified.map(u => u.raw))].slice(0, 12); }
function alreadyRepaired(messages) {
  return sinceQuestion(messages).some(m => m.role === 'user' && blocksOf(m).some(b => b.type === 'text' && String(b.text).startsWith(SYNTHETIC)));
}
function documentRejections(messages) {
  let n = 0;
  for (const m of sinceQuestion(messages)) {
    if (m.role !== 'user') continue;
    for (const b of blocksOf(m)) if (b.type === 'tool_result' && b.is_error && String(b.content).includes('Not created: these figures')) n++;
  }
  return n;
}
function traceCheck(tr, where, check, repaired) {
  if (!tr) return;
  trace({ ev: 'check', cid: tr.cid, where, checked: check.checked, traced: check.traced, derived: check.derived,
    exempt: check.exempt, unverified: check.unverified.length, figures: figureList(check), repaired: !!repaired });
}

let client = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  return client;
}
// Tests swap in a fake client.
function _setClient(c) { client = c; }

// ---------------------------------------------------------------------------
// System prompt. Stable text only: anything that changes per request goes in
// the user turn, so the cached prefix (tools + system) stays byte-identical.
// ---------------------------------------------------------------------------
const SYSTEM = `You are the ProviderPulse market assistant, inside the market dashboard of ProviderPulse, a healthcare provider directory with a map.

Who you help: healthcare providers deciding where to open, expand or compete, and the ProviderPulse team preparing market analyses for prospective clients.

Each user turn starts with a <dashboard> block describing what the user is looking at (mode, ZIP, specialty). Treat "here", "this market" or "my area" as that ZIP and that specialty unless the user names others.

How to answer:
- Ground every number in a tool result from this conversation. Never estimate, extrapolate or invent figures. State each figure as a tool returned it (rounding is fine). If you compute a difference, ratio or percent change, put the two figures it comes from on the same line. The server checks every figure in your answers and documents against the tool results, and an untraceable one is rejected. If the data does not cover something (rents, salaries, reimbursement rates, referral patterns, patient search volume), say so plainly.
- For questions about a market, call get_market_insights first. Explain results in plain language: the archetype and what it means, the factors that drove the score, and the confidence level. Mention a caveat when the tool reports one that affects the answer.
- For "what if I open here" or "what if another practice opens", call run_scenario and report the before and after with its assumptions; say plainly that only supply changes. To compare places, call compare_markets. To count or list nearby providers of a specialty, call find_providers. For statewide or cross-market counts the other tools cannot answer, call query_database with a plan.
- When the user wants to see something on the map ("show me", "zoom to", "switch to"), call update_map. Say briefly what you changed.
- When the user asks for a memo, one-pager, summary for a client, pitch or report, gather the numbers first, then call create_deliverable with the full document. Keep the document under 450 words, organized with short headings and bullets, every figure traceable to a tool result, and a short "Data notes" section listing sources and caveats. After creating it, reply with one or two sentences; do not repeat the document.
- Independent tool calls can go in the same turn.

The market model, for explaining results:
- Each specialty is scored 0 to 100 from five factors: health need (30%, local rates of the conditions that specialty treats, and age mix, vs the US), access gap (30%, clinicians per 1,000 adults vs the national rate for that specialty; higher means thinner supply), ability to pay (20%, insured rate and household income within the state), federal shortage designation (10%), and room from competitors (10%, distance to the nearest same-specialty listing). Missing factors are left out, never assumed average.
- Archetypes: Prime expansion (high need, thin supply, good payers), Safety-net opportunity (high need, thin supply, weaker payers), Latent demand (thin supply, average need), Crowded premium market (dense supply, strong payers), Saturated (dense supply, weaker payers), Balanced, Unserved (no clinicians of that specialty within 25 miles), Not enough data.
- The catchment is the ZIP plus nearby ZIPs within 25 miles. Listings come from the federal NPPES registry and include organizations and individual clinicians.

Boundaries:
- You cannot see patient data, provider accounts, contact details or search logs. Do not claim patient demand trends.
- This is market information, not legal, financial or medical advice.

Style: lead with the answer. Short paragraphs and bullets; a markdown table when comparing. No em dashes. Use the specialty labels exactly as the tools return them.`;

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------
const specEnum = { type: ['string', 'null'], enum: SPEC_LABELS.concat([null]) };
const zipProp = { type: 'string', description: '5-digit US ZIP code' };

const TOOLS = [
  {
    name: 'get_market_insights',
    description: 'Scores the market around one ZIP (the ZIP plus nearby ZIPs within 25 miles). Returns the whole-area score, population, insured rate, Medicare mix, the full breakdown for the chosen specialty (score, archetype, factors with evidence, reasons, confidence, caveats), and a ranking of all 33 specialties. Use for any question about what a market looks like or why it scores the way it does.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        zip: zipProp,
        specialty: Object.assign({ description: 'Specialty to explain in detail, or null for primary care' }, specEnum)
      },
      required: ['zip', 'specialty'],
      additionalProperties: false
    }
  },
  {
    name: 'compare_markets',
    description: 'Compares 2 to 4 ZIPs for one specialty side by side: specialty score, archetype, confidence, the five factors, clinician count and catchment size, plus each ZIP\'s whole-area score.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        zips: { type: 'array', items: zipProp, description: '2 to 4 ZIP codes' },
        specialty: Object.assign({ description: 'Specialty to compare' }, specEnum)
      },
      required: ['zips', 'specialty'],
      additionalProperties: false
    }
  },
  {
    name: 'run_scenario',
    description: 'What-if: re-scores one ZIP and specialty as if 1 to 5 more clinicians of that specialty opened at the centre of the ZIP. Returns the before and after score, archetype, factors, clinician count, listings per 1,000 adults and nearest competitor, plus the assumptions. Only supply changes; payers, need and shortage are held fixed. If the viewer has their own listing it is already left out of the before. Use for "what if I open here", "what happens if another practice opens" or "would this market still look good with N more".',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        zip: zipProp,
        specialty: { type: 'string', enum: SPEC_LABELS, description: 'Specialty that would open' },
        clinicians: { type: 'integer', description: 'How many clinicians open, 1 to 5' }
      },
      required: ['zip', 'specialty', 'clinicians'],
      additionalProperties: false
    }
  },
  {
    name: 'find_providers',
    description: 'Counts listings of one specialty within a radius of a ZIP and lists the nearest ones (name, type, city, distance). Public NPPES registry data.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        zip: zipProp,
        specialty: Object.assign({ description: 'Specialty to look for' }, specEnum),
        radius_miles: { type: 'integer', description: 'Search radius, 1 to 25 miles' }
      },
      required: ['zip', 'specialty', 'radius_miles'],
      additionalProperties: false
    }
  },
  {
    name: 'query_database',
    description: 'Runs one read-only query plan against allowlisted public tables, for counts or lists the other tools cannot answer (for example statewide counts by specialty, or shortage designations by county). Tables and columns: ' +
      Object.entries(TABLES).map(([t, s]) => `${t} (${s.columns.join(', ')}${s.aggregatesOnly ? '; aggregates only' : ''})`).join('; ') +
      '. To filter clinics by specialty use the "taxonomy" field, never a filter on primary_taxonomy. Give the SHORT form of the term: two vocabularies coexist ("Family Medicine Physician" and "Family Medicine"), and matching at a word boundary means the short form finds both. ' +
      // Carried over from the retired memo planner: without it the model
      // invented a "Primary Care" value that matches almost nothing.
      'There is NO "Primary Care" value in most states; primary care is spread across "Family Medicine", "Internal Medicine", "General Practice" and "Pediatrics", so pick one and name it. ' +
      'Values that really occur include: Family Medicine, Internal Medicine, General Practice, Pediatrics, Cardiology, Dentistry, Vision & Eye Care, Psychiatry & Mental Health, Chiropractic, Pharmacy, Nursing, Emergency Services, Therapy & Rehabilitation, Facility / Clinic, Radiology & Imaging, Surgery, Oncology, Dermatology, Neurology, Obstetrics & Gynecology. ' +
      'Prefer aggregate "count_by" for "how many per X" questions. State is a 2-letter code in clinics and a full name in hpsa_designations.',
    input_schema: {
      type: 'object',
      properties: {
        table: { type: 'string', enum: Object.keys(TABLES) },
        select: { type: 'array', items: { type: 'string' } },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              column: { type: 'string' },
              op: { type: 'string', enum: OPS },
              value: { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'array', items: { type: 'string' } }] }
            },
            required: ['column', 'op', 'value']
          }
        },
        aggregate: { type: 'string', enum: ['none', 'count', 'count_by'] },
        group_by: { type: 'string' },
        taxonomy: { type: 'string' },
        limit: { type: 'integer' }
      },
      required: ['table']
    }
  },
  {
    name: 'update_map',
    description: 'Changes the dashboard map the user is looking at: moves it to a ZIP and/or filters it to a specialty. Pass null to leave a field unchanged.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        zip: { type: ['string', 'null'], description: '5-digit ZIP to show, or null' },
        specialty: Object.assign({ description: 'Specialty to filter the map to, or null' }, specEnum)
      },
      required: ['zip', 'specialty'],
      additionalProperties: false
    }
  },
  {
    name: 'create_deliverable',
    description: 'Hands the user a finished document (market memo, expansion one-pager, or pitch summary for a prospective client) as a card they can copy, download or print. body_markdown is the complete document in markdown.',
    strict: true,
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['market_memo', 'expansion_one_pager', 'client_pitch'] },
        title: { type: 'string' },
        body_markdown: { type: 'string' }
      },
      required: ['kind', 'title', 'body_markdown'],
      additionalProperties: false
    }
  }
];

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------
const isZip = z => typeof z === 'string' && /^\d{5}$/.test(z);
const taxNorm = s => String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const taxMatches = (stored, terms) => terms.some(t => (' ' + taxNorm(stored)).includes(' ' + taxNorm(t)));
const termsFor = label => ((SPECIALTIES.find(s => s[0] === label) || [0, ''])[1]).split(',').map(s => s.trim()).filter(Boolean);
const milesBetween = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8, r = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Market scores are pure functions of public data that changes monthly at
// most, so a warm instance reuses them across the steps of one conversation.
const scoreCache = new Map();
async function scoreFor(zip, specialty, npi, add) {
  const key = [zip, specialty || '', npi || '', add || ''].join('|');
  const hit = scoreCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.data;
  const q = { zip };
  if (specialty) q.specialty = specialty;
  if (npi) q.npi = npi;
  if (add) q.add = String(add);
  const res = await marketScore.handler({ httpMethod: 'GET', queryStringParameters: q, headers: {} });
  const data = JSON.parse(res.body || '{}');
  if (res.statusCode === 200 && data.available !== false) {
    scoreCache.set(key, { at: Date.now(), data });
    if (scoreCache.size > 200) scoreCache.delete(scoreCache.keys().next().value);
  }
  return data;
}

// The model needs the story, not every field of market-score's response.
function specialtySummary(x) {
  if (!x) return null;
  return {
    specialty: x.specialty, score: x.score, archetype: x.archetype_name, strategy: x.strategy,
    confidence: x.confidence, clinicians_in_catchment: x.clinicians, factors: x.factors,
    evidence: x.evidence, reasons: (x.reasons || []).map(r => r.text), caveats: x.caveats
  };
}

async function getMarketInsights({ zip, specialty }, ctx) {
  if (!isZip(zip)) return { error: 'zip must be 5 digits' };
  const want = specialty || 'Primary care / family doctor';
  const d = await scoreFor(zip, want, ctx.npi);
  if (!d.available) return { zip, available: false, reason: d.reason || d.error || 'No score for this ZIP' };
  const specs = (d.model && d.model.specialties) || [];
  const ranked = specs.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const m = d.metrics || {};
  return {
    zip: d.zip, state: d.state,
    whole_area: { score: d.score, label: d.label },
    population: m.population, insured_rate: m.insured_rate, state_insured_rate: m.state_insured_rate,
    listings_per_1k_residents: m.providers_per_1k, state_average_listings_per_1k: m.benchmark_per_1k, state: d.state,
    medicare: d.medicare && d.medicare.available ? {
      beneficiaries: d.medicare.total_beneficiaries, medicare_advantage_pct: d.medicare.medicare_advantage_pct,
      level: d.medicare.level, as_of: d.medicare.as_of
    } : null,
    catchment: d.catchment ? {
      radius_miles: d.catchment.radius_miles, zip_count: d.catchment.zip_count,
      adults: d.catchment.adults_18plus, counts_truncated: !!d.catchment.truncated
    } : null,
    specialty_detail: specialtySummary(specs.find(x => x.specialty === want)),
    benchmarks: d.model ? d.model.benchmarks : null,
    all_specialties_ranked: ranked.map(x => [x.specialty, x.score, x.archetype_name, x.confidence, x.clinicians]),
    ranked_columns: ['specialty', 'score', 'archetype', 'confidence', 'clinicians']
  };
}

async function runScenario({ zip, specialty, clinicians }, ctx) {
  if (!isZip(zip)) return { error: 'zip must be 5 digits' };
  if (!specialty) return { error: 'specialty is required' };
  const n = Math.max(1, Math.min(5, Math.round(Number(clinicians)) || 1));
  const d = await scoreFor(zip, specialty, ctx.npi, n);
  if (!d.available) return { zip, available: false, reason: d.reason || d.error || 'No score for this ZIP' };
  const sc = d.model && d.model.scenario;
  if (!sc) return { zip, available: false, reason: 'The scenario could not be scored for this ZIP and specialty.' };
  return {
    zip: d.zip, state: d.state, specialty: sc.specialty, clinicians_added: sc.added,
    before: sc.before, after: sc.after, score_change: sc.score_change, assumptions: sc.assumptions
  };
}

async function compareMarkets({ zips, specialty }, ctx) {
  const list = [...new Set((zips || []).filter(isZip))].slice(0, 4);
  if (list.length < 2) return { error: 'Give 2 to 4 distinct 5-digit ZIPs' };
  const want = specialty || 'Primary care / family doctor';
  const rows = await Promise.all(list.map(async z => {
    const d = await scoreFor(z, want, ctx.npi);
    if (!d.available) return { zip: z, available: false, reason: d.reason || 'No score' };
    const x = ((d.model && d.model.specialties) || []).find(s => s.specialty === want);
    return {
      zip: z, state: d.state, whole_area_score: d.score,
      specialty_score: x ? x.score : null, archetype: x ? x.archetype_name : null,
      confidence: x ? x.confidence : null, factors: x ? x.factors : null,
      clinicians_in_catchment: x ? x.clinicians : null,
      catchment_adults: d.catchment ? d.catchment.adults_18plus : null,
      insured_rate: d.metrics ? d.metrics.insured_rate : null,
      top_reason: x && x.reasons && x.reasons[0] ? x.reasons[0].text : null
    };
  }));
  return { specialty: want, markets: rows };
}

async function findProviders({ zip, specialty, radius_miles }) {
  if (!isZip(zip)) return { error: 'zip must be 5 digits' };
  const label = specialty || 'Primary care / family doctor';
  const radius = Math.max(1, Math.min(25, Number(radius_miles) || 10));
  const env = process.env;
  const H = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
  const get = (path, ms) => fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers: H, signal: AbortSignal.timeout(ms || 6000) })
    .then(r => (r.ok ? r.json() : [])).catch(() => []);

  const home = await get(`cdc_places?zip=eq.${zip}&measureid=eq.${GEO_MEASURE}&select=zip,lat,lon&limit=1`, 5000);
  if (!home[0] || home[0].lat == null) return { zip, error: 'No location data for this ZIP' };
  const lat = Number(home[0].lat), lon = Number(home[0].lon);
  const dLat = radius / 69, dLon = radius / Math.max(1, 69 * Math.cos(lat * Math.PI / 180));
  const box = await get(`cdc_places?measureid=eq.${GEO_MEASURE}&lat=gte.${(lat - dLat).toFixed(4)}&lat=lte.${(lat + dLat).toFixed(4)}` +
    `&lon=gte.${(lon - dLon).toFixed(4)}&lon=lte.${(lon + dLon).toFixed(4)}&select=zip,lat,lon&limit=1000`, 6000);
  // Listings in a ZIP can sit a little outside the radius from its centroid;
  // the per-listing distance filter below is what decides.
  const zips = [...new Set([zip].concat(box.filter(r => milesBetween(lat, lon, +r.lat, +r.lon) <= radius + 3).map(r => r.zip)))].slice(0, 150);
  const variants = [...new Set(zips.flatMap(z => [z, String(parseInt(z, 10))]))].join(',');
  const terms = termsFor(label);

  // Keyset on npi (unique), up to 4 pages per table.
  const pageAll = async table => {
    const out = []; let last = '';
    for (let i = 0; i < 4; i++) {
      const rows = await get(`${table}?zip=in.(${variants})&select=npi,name,city,primary_taxonomy,latitude,longitude${last ? `&npi=gt.${last}` : ''}&order=npi&limit=1000`, 7000);
      out.push(...rows);
      if (rows.length < 1000) return { rows: out, truncated: false };
      last = rows[rows.length - 1].npi;
    }
    return { rows: out, truncated: true };
  };
  const [orgs, people] = await Promise.all([pageAll('clinics'), pageAll('provider_individuals')]);
  const hits = [];
  for (const [rows, type] of [[orgs.rows, 'organization'], [people.rows, 'individual']]) {
    for (const r of rows) {
      if (!taxMatches(r.primary_taxonomy, terms) || r.latitude == null) continue;
      const mi = milesBetween(lat, lon, +r.latitude, +r.longitude);
      if (mi <= radius) hits.push({ name: r.name, type, taxonomy: r.primary_taxonomy, city: r.city, miles: Math.round(mi * 10) / 10 });
    }
  }
  hits.sort((a, b) => a.miles - b.miles);
  return {
    zip, specialty: label, radius_miles: radius,
    total: hits.length,
    organizations: hits.filter(h => h.type === 'organization').length,
    individuals: hits.filter(h => h.type === 'individual').length,
    nearest: hits.slice(0, 10),
    count_is_floor: orgs.truncated || people.truncated,
    source: 'NPPES registry listings with coordinates'
  };
}

async function queryDatabase(input) {
  const env = process.env;
  const check = validatePlan(input);
  if (!check.ok) return { refused: true, reason: check.error };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { error: 'Database is not configured' };
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/${buildPath(check.plan)}`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(9000)
    });
    if (!r.ok) return { error: 'The query could not be run (HTTP ' + r.status + ')' };
    return { plan: check.plan, results: summarise(check.plan, await r.json()) };
  } catch (e) {
    return { error: 'The query could not be run against the database.' };
  }
}

// Browser-side effects: validated here, performed by the dashboard.
function updateMap({ zip, specialty }, ctx) {
  const action = { type: 'update_map' };
  if (isZip(zip)) action.zip = zip;
  if (specialty && SPEC_LABELS.includes(specialty)) action.specialty = specialty;
  if (!action.zip && !action.specialty) return { error: 'Nothing to change: give a ZIP and/or a specialty' };
  ctx.actions.push(action);
  return { ok: true, applied: action };
}

function createDeliverable({ kind, title, body_markdown }, ctx) {
  const body = String(body_markdown || '').slice(0, 20000);
  if (!body.trim()) return { error: 'body_markdown is empty' };
  // A document gets forwarded, so it is held to the same rule as an answer:
  // every figure traced. Rejected up to twice, with the offending figures named
  // so the model can fix them; after that it is issued with the figures marked.
  const check = checkText(body, ctx.messages || []);
  const rejected = documentRejections(ctx.messages || []);
  traceCheck(ctx.tr, 'document', check, rejected > 0);
  if (check.unverified.length && rejected < MAX_DOC_REJECTIONS) {
    return { error: 'Not created: these figures do not appear in any tool result from this conversation: ' + figureList(check).join(', ') +
      '. Remove them, or call a tool that returns them, then call create_deliverable again. State each figure exactly as a tool returned it, and show any figure you derive (a difference, ratio or percent change) on the same line as the two figures it comes from.' };
  }
  const doc = { id: 'd' + Date.now().toString(36) + ctx.deliverables.length, kind, title: String(title || 'Market memo').slice(0, 200), body };
  if (check.unverified.length) doc.unverified = figureList(check);
  ctx.deliverables.push(doc);
  return { ok: true, id: doc.id, shown_to_user: true };
}

const RUNNERS = {
  get_market_insights: getMarketInsights,
  compare_markets: compareMarkets,
  run_scenario: runScenario,
  find_providers: findProviders,
  query_database: queryDatabase,
  update_map: updateMap,
  create_deliverable: createDeliverable
};

// What the user sees while a tool runs.
function stepLabel(name, input) {
  const i = input || {};
  const spec = i.specialty ? ' for ' + String(i.specialty).toLowerCase() : '';
  switch (name) {
    case 'get_market_insights': return `Scoring ${i.zip}${spec}`;
    case 'run_scenario': return `Modelling ${i.clinicians || 1} new ${String(i.specialty || '').toLowerCase()} in ${i.zip}`;
    case 'compare_markets': return `Comparing ${(i.zips || []).join(', ')}${spec}`;
    case 'find_providers': return `Finding ${String(i.specialty || 'primary care').toLowerCase()} listings within ${i.radius_miles} mi of ${i.zip}`;
    case 'query_database': return `Querying ${i.table || 'the database'}`;
    case 'update_map': return 'Updating the map';
    case 'create_deliverable': return `Writing "${String(i.title || 'document').slice(0, 60)}"`;
    default: return name;
  }
}

// Every tool races the invocation's remaining budget, so a slow lookup comes
// back as an error result instead of the 26s kill taking the whole step.
async function runTool(block, ctx, budgetMs) {
  const t0 = Date.now();
  const fn = RUNNERS[block.name];
  let out;
  try {
    if (!fn) out = { error: 'Unknown tool' };
    else {
      let timer;
      const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve({ error: 'Timed out. Try again, or narrow the request.' }), Math.max(1000, budgetMs));
      });
      out = await Promise.race([fn(block.input || {}, ctx), timeout]);
      clearTimeout(timer);
    }
  } catch (e) {
    out = { error: 'Tool failed: ' + (e && e.message ? e.message : 'unknown error') };
  }
  const result = { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) };
  if (out && (out.error || out.refused)) result.is_error = true;
  if (ctx.tr) { ctx.tr.tools++; trace({ ev: 'tool', cid: ctx.tr.cid, name: block.name, ms: Date.now() - t0, error: !!result.is_error }); }
  return result;
}

// ---------------------------------------------------------------------------
// History validation. The browser echoes the conversation; the server only
// accepts user/assistant turns and never lets a client add a system turn.
// ---------------------------------------------------------------------------
function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const m of raw) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
    if (typeof m.content !== 'string' && !Array.isArray(m.content)) return null;
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

function contextBlock(c) {
  const ctx = c && typeof c === 'object' ? c : {};
  const lines = [
    `mode: ${ctx.mode === 'mine' ? 'my market (the signed-in provider\'s own area)' : 'explore'}`,
    `zip: ${isZip(ctx.zip) ? ctx.zip : 'none selected'}`,
    `specialty: ${SPEC_LABELS.includes(ctx.specialty) ? ctx.specialty : 'none selected'}`
  ];
  if (ctx.place) lines.push(`search: ${String(ctx.place).slice(0, 80)}`);
  return `<dashboard>\n${lines.join('\n')}\n</dashboard>`;
}

// Rounds since the last real question (user text, not tool results).
function roundsSinceQuestion(messages) {
  return sinceQuestion(messages).filter(m => m.role === 'assistant').length;
}

function textOf(content) {
  return (Array.isArray(content) ? content : []).filter(b => b.type === 'text').map(b => b.text).join('\n\n').trim();
}

// ---------------------------------------------------------------------------
exports.handler = async (event) => {
  const tr = { started: Date.now(), cid: '', outcome: '', models: 0, tools: 0, usd: 0 };
  let res;
  try { res = await handle(event, tr); return res; }
  finally {
    trace({ ev: 'step', cid: tr.cid, ms: Date.now() - tr.started, outcome: tr.outcome || ('http_' + (res ? res.statusCode : 'error')),
      models: tr.models, tools: tr.tools, usd: Math.round(tr.usd * 1e5) / 1e5 });
  }
};

async function handle(event, tr) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: JSONH, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
  const started = Date.now();

  if (!process.env.ANTHROPIC_API_KEY) return reply(503, { error: 'The assistant is not configured.' });
  const user = await getUser(process.env, event);
  if (!user) return reply(401, { error: 'Please sign in again to use the assistant.' });
  if (!(await isProvider(process.env, user))) return reply(403, { error: 'The market assistant is available to registered providers.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Invalid JSON' }); }
  if ((event.body || '').length > MAX_HISTORY_BYTES) {
    return reply(413, { error: 'This conversation is too long. Start a new chat to continue.' });
  }

  tr.cid = /^[A-Za-z0-9_-]{8,64}$/.test(String(body.cid || '')) ? String(body.cid) : '';
  const messages = cleanHistory(body.messages);
  if (!messages) return reply(400, { error: 'Invalid conversation history' });

  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 2000) : '';
  const tail = messages[messages.length - 1];
  const tailPending = tail && tail.role === 'assistant' && pendingCalls(tail).length > 0;
  let questionMsg = null;
  if (question) {
    // A new question may follow a finished answer, or tool results whose
    // answer was declined; never an assistant turn still waiting on tools.
    if (tailPending) return reply(409, { error: 'The previous answer is still in progress.' });
    questionMsg = { role: 'user', content: [{ type: 'text', text: contextBlock(body.context) }, { type: 'text', text: question }] };
    messages.push(questionMsg);
  } else if (!body.continue || !tail || !(tail.role === 'user' || tailPending)) {
    return reply(400, { error: 'Ask a question' });
  }

  const ctx = {
    npi: /^\d{10}$/.test(String(body.npi || '')) ? String(body.npi) : '',
    actions: [], deliverables: [], steps: [], messages, tr
  };
  const partial = () => { tr.outcome = 'partial'; return reply(200, { done: false, messages, actions: ctx.actions, deliverables: ctx.deliverables, steps: ctx.steps }); };
  const done = (extra) => {
    tr.outcome = (extra && extra.stopped) || 'done';
    return reply(200, Object.assign({
      done: true, messages, actions: ctx.actions, deliverables: ctx.deliverables, steps: ctx.steps
    }, extra || {}));
  };

  let modelCalls = 0;
  while (true) {
    const elapsed = Date.now() - started;

    // Pending tool calls (from this step, or left over from the last one).
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      const calls = pendingCalls(last);
      if (!calls.length) return done({ reply: textOf(last.content) });
      if (elapsed > TOOL_START_BUDGET_MS) return partial();
      calls.forEach(c => ctx.steps.push({ tool: c.name, label: stepLabel(c.name, c.input) }));
      const results = await Promise.all(calls.map(c => runTool(c, ctx, HARD_BUDGET_MS - elapsed)));
      messages.push({ role: 'user', content: results });   // all results in one turn, in call order
      continue;
    }

    if (elapsed > STEP_BUDGET_MS) return partial();   // not enough time left for a model call
    if (roundsSinceQuestion(messages) >= MAX_ROUNDS_PER_QUESTION) {
      return done({ reply: 'I ran out of steps on that one. Try asking a narrower question.', stopped: 'rounds' });
    }

    let res;
    try {
      const t0 = Date.now();
      res = await createTurn(messages, HARD_BUDGET_MS - elapsed);
      modelCalls++; tr.models++;
      const u = res.usage || {}, usd = estimateCostUsd(u);
      tr.usd += usd;
      trace({ ev: 'model', cid: tr.cid, ms: Date.now() - t0, stop: res.stop_reason, round: roundsSinceQuestion(messages) + 1,
        in: u.input_tokens || 0, out: u.output_tokens || 0, cache_read: u.cache_read_input_tokens || 0,
        cache_write: u.cache_creation_input_tokens || 0, usd: Math.round(usd * 1e5) / 1e5, plain: plainMode });
    } catch (e) {
      trace({ ev: 'model_error', cid: tr.cid, kind: (e && e.constructor && e.constructor.name) || 'Error', status: e && e.status || null });
      // No history is returned on failure: the browser keeps what it had and
      // can retry the same step, so nothing half-finished is ever stored.
      if (e instanceof Anthropic.RateLimitError) return reply(429, { error: 'The assistant is busy. Try again in a moment.' });
      if (e instanceof Anthropic.APIConnectionTimeoutError) {
        // A later call in this invocation had a shortened budget: a fresh
        // invocation gives the retry the whole clock, so hand the step back
        // instead of failing. The FIRST call of an invocation already had
        // (nearly) all of it; if that timed out, the answer really is too big
        // for one call, and looping would only repeat the cost.
        if (modelCalls > 0) return partial();
        return reply(504, { error: 'That took too long. Try a narrower question, or ask for a shorter document.' });
      }
      if (e instanceof Anthropic.APIError) return reply(502, { error: 'The assistant is unavailable right now (' + (e.status || 'error') + ').' });
      return reply(502, { error: 'The assistant is unavailable right now.' });
    }

    if (res.stop_reason === 'refusal') {
      // A declined turn is not kept in history, and a question declined
      // outright is dropped too, so it can be rephrased.
      if (questionMsg && messages[messages.length - 1] === questionMsg) messages.pop();
      return done({ reply: textOf(res.content) || 'I can\'t help with that request.', stopped: 'refusal' });
    }
    messages.push({ role: 'assistant', content: res.content });
    if (res.stop_reason === 'pause_turn') continue;
    if (res.stop_reason === 'max_tokens') {
      // A tool call cut off mid-input must never run. Answer each one with an
      // error result (history stays append-only) and let the model retry
      // shorter on the next round.
      const cut = pendingCalls({ content: res.content });
      if (!cut.length) {
        return done({ reply: (textOf(res.content) + '\n\n(The answer was cut off. Ask me to continue, or to keep it shorter.)').trim(), stopped: 'max_tokens' });
      }
      messages.push({ role: 'user', content: cut.map(c => ({
        type: 'tool_result', tool_use_id: c.id, is_error: true,
        content: 'Not run: the input was cut off at the output limit. Retry with a shorter input.'
      })) });
      continue;
    }
    if (res.stop_reason !== 'tool_use') {
      const text = textOf(res.content);
      const check = checkText(text, messages);
      const repaired = alreadyRepaired(messages);
      traceCheck(tr, 'answer', check, repaired);
      if (check.unverified.length && !repaired) {
        // One automatic repair. The draft is never shown: the model is told
        // which figures have no source and answers again. It is a plain user
        // turn marked SYNTHETIC, so history stays append-only.
        messages.push({ role: 'user', content: [{ type: 'text', text: SYNTHETIC + ' These figures in your last answer do not appear in any tool result from this conversation: ' +
          figureList(check).join(', ') + '. Answer again: state only figures a tool returned, exactly as returned; call a tool if you need one; and show any figure you derive (a difference, ratio or percent change) on the same line as the two figures it comes from. Do not mention this check.' }] });
        continue;
      }
      return done({ reply: text, verification: { checked: check.checked, traced: check.traced, derived: check.derived, unverified: figureList(check), repaired } });
    }
    // tool_use: the top of the loop runs the calls (or hands them to the next step).
  }
}

// One model turn. The request opts into strict tool schemas and server-side
// refusal fallbacks; if the API rejects the request shape (a 400 on a feature
// this account or model doesn't accept), retry once without those two and
// keep that plainer shape for the life of the instance, so a feature flag can
// never take the whole assistant down. The reason is logged, never the chat.
let plainMode = false;
async function createTurn(messages, timeout) {
  const params = {
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: 'low' },
    cache_control: { type: 'ephemeral' },
    system: SYSTEM,
    messages
  };
  if (!plainMode) {
    try {
      return await getClient().beta.messages.create(Object.assign({}, params, {
        tools: TOOLS, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default'
      }), { timeout });
    } catch (e) {
      if (!(e instanceof Anthropic.BadRequestError)) throw e;
      console.log('[market-assistant] request shape rejected, retrying plain:', e.message);
      plainMode = true;
    }
  }
  const plainTools = TOOLS.map(t => { const c = Object.assign({}, t); delete c.strict; return c; });
  return getClient().beta.messages.create(Object.assign({}, params, { tools: plainTools }), { timeout });
}

function pendingCalls(assistantTurn) {
  return (Array.isArray(assistantTurn.content) ? assistantTurn.content : []).filter(b => b.type === 'tool_use');
}

// For tests.
exports._setClient = _setClient;
exports._setTraceSink = _setTraceSink;
exports._internals = { TOOLS, SYSTEM, cleanHistory, contextBlock, roundsSinceQuestion, updateMap, createDeliverable, stepLabel, STEP_BUDGET_MS, HARD_BUDGET_MS, MODEL_MIN_BUDGET_MS, estimateCostUsd, checkText, SYNTHETIC };
