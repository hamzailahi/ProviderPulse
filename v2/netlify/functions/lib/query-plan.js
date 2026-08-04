// query-plan.js
// Validates and executes the constrained query plans the market-analyst agent
// produces. Pure validation + a thin PostgREST builder, so the whole security
// boundary can be unit-tested without a network.
//
// ---------------------------------------------------------------------------
// THE MODEL NEVER TOUCHES THE DATABASE.
//
// Claude emits a JSON *plan*. This module decides whether that plan may run.
// It never receives credentials, never emits SQL, and cannot reach a table or
// column that is not named below. The allowlist is a boundary, not a
// convenience: everything absent from it is denied, so adding a table here
// publishes it to anyone who can ask the agent a question.
//
// PATIENT AND ACCOUNT DATA IS NOT REACHABLE, BY CONSTRUCTION. patient_profiles,
// provider_profiles, provider_insurance, patient_documents, audit_log,
// demand_log and auth.users are absent from TABLES and always will be. A plan
// naming any of them is rejected before a request is built.
// ---------------------------------------------------------------------------

'use strict';

// Column-level allowlists. Selecting * is never permitted: a future column on
// an allowed table would otherwise be published without anyone deciding to.
const TABLES = {
  clinics: {
    columns: ['npi', 'name', 'address', 'city', 'state', 'zip', 'primary_taxonomy', 'latitude', 'longitude'],
    aggregatesOnly: false
  },
  demographics_raw: {
    columns: ['zip', 'state', 'Total Population', 'Insured Population'],
    aggregatesOnly: false
  },
  hpsa_designations: {
    columns: ['state', 'county', 'discipline', 'hpsa_score', 'hpsa_type', 'rural_status', 'designation_population'],
    aggregatesOnly: false
  },
  npi_activity: {
    // Aggregates only, per the work order. Row-level Medicare behaviour for a
    // named practitioner is not something the dashboard agent should hand back.
    columns: ['npi', 'last_medicare_activity_year', 'pecos_enrolled'],
    aggregatesOnly: true
  }
};

const OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'like', 'ilike', 'is', 'not.is'];
const AGGREGATES = ['none', 'count', 'count_by'];
const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 1000;

/**
 * @returns {{ok:true, plan:object} | {ok:false, error:string}}
 */
function validatePlan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Plan must be a JSON object.' };
  }

  const table = String(raw.table || '');
  if (!Object.prototype.hasOwnProperty.call(TABLES, table)) {
    return {
      ok: false,
      error: `Table "${table}" is not available to this tool. Allowed: ${Object.keys(TABLES).join(', ')}. ` +
             `Patient records, provider accounts and contact details are deliberately unreachable.`
    };
  }
  const spec = TABLES[table];

  const aggregate = String(raw.aggregate || 'none');
  if (!AGGREGATES.includes(aggregate)) {
    return { ok: false, error: `Unknown aggregate "${aggregate}". Allowed: ${AGGREGATES.join(', ')}.` };
  }
  if (spec.aggregatesOnly && aggregate === 'none') {
    return { ok: false, error: `${table} may only be queried in aggregate; use count or count_by.` };
  }

  const select = Array.isArray(raw.select) ? raw.select.map(String) : [];
  if (!select.length) return { ok: false, error: 'select must name at least one column.' };
  if (select.includes('*')) return { ok: false, error: 'select * is not permitted; name the columns.' };
  const badCol = select.find(c => !spec.columns.includes(c));
  if (badCol) {
    return { ok: false, error: `Column "${badCol}" is not available on ${table}. Allowed: ${spec.columns.join(', ')}.` };
  }

  const filters = Array.isArray(raw.filters) ? raw.filters : [];
  for (const f of filters) {
    if (!f || typeof f !== 'object') return { ok: false, error: 'Each filter must be an object.' };
    const col = String(f.column || '');
    if (!spec.columns.includes(col)) {
      return { ok: false, error: `Cannot filter on "${col}"; it is not an allowed column of ${table}.` };
    }
    if (!OPS.includes(String(f.op || ''))) {
      return { ok: false, error: `Operator "${f.op}" is not allowed. Allowed: ${OPS.join(', ')}.` };
    }
    if (f.value === undefined || f.value === null) {
      return { ok: false, error: `Filter on "${col}" has no value.` };
    }
  }

  let groupBy = raw.group_by == null ? null : String(raw.group_by);
  if (aggregate === 'count_by') {
    if (!groupBy) return { ok: false, error: 'count_by requires group_by.' };
    if (!spec.columns.includes(groupBy)) {
      return { ok: false, error: `Cannot group by "${groupBy}"; it is not an allowed column of ${table}.` };
    }
    if (!select.includes(groupBy)) select.push(groupBy);
  } else {
    groupBy = null;
  }

  // Taxonomy is matched in this module, never pushed down as an operator, so
  // the word-boundary rule from CLAUDE.md is applied exactly once and cannot be
  // reduced to a plain `includes` by a generated filter.
  const taxonomy = raw.taxonomy == null ? null : String(raw.taxonomy).slice(0, 120);
  if (taxonomy && !spec.columns.includes('primary_taxonomy')) {
    return { ok: false, error: `Taxonomy matching is only meaningful on clinics.` };
  }

  let limit = Number(raw.limit);
  if (!Number.isFinite(limit) || limit <= 0) limit = DEFAULT_LIMIT;
  limit = Math.min(Math.floor(limit), MAX_LIMIT);

  return { ok: true, plan: { table, select, filters, aggregate, group_by: groupBy, taxonomy, limit } };
}

// The taxonomy matcher, unchanged: normalise both sides, then require a match at
// a word boundary. Both halves are load-bearing -- without the leading space
// "Urology" matches "Neurology"; with a trailing one "Dentist" stops matching
// "General Practice Dentistry".
const taxNorm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const taxMatches = (stored, term) => (' ' + taxNorm(stored)).includes(' ' + taxNorm(term));

/**
 * Build the PostgREST path for a validated plan.
 *
 * The taxonomy term is pushed down as a COARSE `ilike` prefilter, then the exact
 * word-boundary rule is applied to whatever comes back (see summarise).
 *
 * This matters for correctness, not just speed. Filtering in JavaScript alone
 * meant the limit applied FIRST: a question about primary care in TN fetched an
 * arbitrary 2000-row slice of ~100k clinics and then filtered it, so the answer
 * was drawn from a random 2% and came back as zero. `ilike '%term%'` is a strict
 * superset of the word-boundary match -- it can only over-include -- so nothing
 * is lost by narrowing with it, and the precise matcher still decides the final
 * answer. This is a prefilter, never a replacement for the rule.
 */
function buildPath(plan) {
  const parts = [`select=${encodeURIComponent(plan.select.join(','))}`];
  for (const f of plan.filters) {
    const v = Array.isArray(f.value) ? `(${f.value.map(x => String(x)).join(',')})` : String(f.value);
    parts.push(`${encodeURIComponent(f.column)}=${f.op}.${encodeURIComponent(v)}`);
  }
  if (plan.taxonomy) {
    // Only the first word: "Primary Care" must still reach
    // "Primary Care Clinic/Center", and a multi-word ilike would miss
    // punctuation and word-order variants the exact matcher handles.
    const head = String(plan.taxonomy).trim().split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, '');
    if (head.length >= 3) {
      parts.push(`primary_taxonomy=ilike.${encodeURIComponent('*' + head + '*')}`);
    }
  }
  parts.push(`limit=${plan.limit}`);
  return `${plan.table}?${parts.join('&')}`;
}

/**
 * Reduce rows to the summary the model is allowed to see.
 * Never returns raw rows for an aggregatesOnly table.
 */
function summarise(plan, rows) {
  const spec = TABLES[plan.table];
  let data = Array.isArray(rows) ? rows : [];

  if (plan.taxonomy) {
    data = data.filter(r => taxMatches(r.primary_taxonomy, plan.taxonomy));
  }

  if (plan.aggregate === 'count') {
    return { table: plan.table, aggregate: 'count', matched: data.length };
  }
  if (plan.aggregate === 'count_by') {
    const counts = new Map();
    for (const r of data) {
      const k = r[plan.group_by];
      const key = k == null || k === '' ? '(none)' : String(k);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const groups = [...counts.entries()]
      .map(([key, count]) => ({ [plan.group_by]: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 200);
    return { table: plan.table, aggregate: 'count_by', group_by: plan.group_by, matched: data.length, groups };
  }

  // Row mode. Capped hard: the model gets a sample to reason over, not a dump.
  if (spec.aggregatesOnly) {
    return { table: plan.table, aggregate: 'count', matched: data.length };
  }
  return { table: plan.table, aggregate: 'none', matched: data.length, rows: data.slice(0, 200) };
}

module.exports = { validatePlan, buildPath, summarise, TABLES, OPS, AGGREGATES, taxMatches, MAX_LIMIT };
