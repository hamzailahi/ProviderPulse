// demand-stats.js
// Public, unauthenticated, AGGREGATE-ONLY view of what patients searched for.
//
// This is the read side of demand_log. It runs under the service role because
// demand_log is RLS-denied to anon, which makes this function the security
// boundary in exactly the way providers-public.js is: whatever shape this
// returns is published to anyone who asks.
//
// ---------------------------------------------------------------------------
// THE SUPPRESSION THRESHOLD IS NOT OPTIONAL.
//
// A count of 1 for "Endocrinology in 38017 last week" is not an aggregate --
// in a small ZIP it can identify the person who searched. Groups below
// MIN_GROUP are returned as {suppressed:true} with NO count, and the total is
// likewise withheld when it is small enough to reconstruct them.
//
// Do not add a per-day breakdown, a payer breakdown crossed with taxonomy, or
// any other dimension without re-deriving the threshold: each extra dimension
// slices the same rows thinner and makes re-identification easier.
// ---------------------------------------------------------------------------
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

const WINDOW_DAYS = 90;
const MIN_GROUP = 5;
const MAX_ROWS = 5000;

// Same normalisation the taxonomy matcher uses, so a caller asking for
// "Family Medicine" matches a stored "Family Medicine Physician". Word-boundary
// prefix matching, never a plain includes -- see the taxonomy rule in CLAUDE.md.
const norm = s => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const matches = (stored, term) => (' ' + norm(stored)).includes(' ' + norm(term));

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'GET only' }) };
  }

  const env = process.env;
  const q = event.queryStringParameters || {};
  const zip = String(q.zip || '').trim();
  const taxonomy = String(q.taxonomy || '').trim().slice(0, 120);

  if (!/^\d{5}$/.test(zip)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'A 5-digit zip is required' }) };
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    // Degrade to "no data" rather than an error: the provider page falls back
    // to its scarcity copy, which is always safe to show.
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, window_days: WINDOW_DAYS, available: false, groups: [] }) };
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString();

  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/demand_log` +
      `?zip=eq.${encodeURIComponent(zip)}&created_at=gte.${encodeURIComponent(since)}` +
      `&select=taxonomies,matched_count&limit=${MAX_ROWS}`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        signal: AbortSignal.timeout(6000)
      }
    );
    if (!res.ok) {
      // Missing table means the migration has not run. Unknown, not zero.
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, window_days: WINDOW_DAYS, available: false, groups: [] }) };
    }
    const rows = (await res.json()) || [];

    // One search can carry several taxonomy terms; count it once per term. A
    // search is the unit of demand, not a row.
    const counts = new Map();
    const matchedTotals = new Map();
    for (const r of rows) {
      const terms = Array.isArray(r.taxonomies) ? r.taxonomies : [];
      for (const t of new Set(terms.map(x => String(x)))) {
        counts.set(t, (counts.get(t) || 0) + 1);
        if (Number.isFinite(Number(r.matched_count))) {
          const m = matchedTotals.get(t) || { sum: 0, n: 0 };
          m.sum += Number(r.matched_count); m.n++;
          matchedTotals.set(t, m);
        }
      }
    }

    let groups = [...counts.entries()].map(([term, count]) => {
      const m = matchedTotals.get(term);
      return {
        taxonomy: term,
        count,
        // Mean providers returned for that search: a high-demand, low-supply
        // pair is the shortage signal worth selling.
        mean_matched: m && m.n ? Math.round((m.sum / m.n) * 10) / 10 : null
      };
    });

    if (taxonomy) groups = groups.filter(g => matches(g.taxonomy, taxonomy) || matches(taxonomy, g.taxonomy));

    // Suppress before sorting, so a suppressed group cannot be ranked by a
    // count the caller is not allowed to see.
    const published = groups
      .map(g => g.count >= MIN_GROUP
        ? g
        : { taxonomy: g.taxonomy, suppressed: true })
      .sort((a, b) => (b.count || 0) - (a.count || 0));

    // The total is withheld on the same rule. With only a couple of searches in
    // a ZIP, a total plus the suppressed group names reconstructs the counts.
    const totalSearches = rows.length;
    const suppressedGroups = published.filter(g => g.suppressed).length;

    return {
      statusCode: 200,
      headers: { ...CORS, 'Cache-Control': 'public, max-age=600' },
      body: JSON.stringify({
        zip,
        window_days: WINDOW_DAYS,
        available: true,
        min_group: MIN_GROUP,
        total_searches: totalSearches >= MIN_GROUP ? totalSearches : null,
        total_suppressed: totalSearches < MIN_GROUP,
        suppressed_groups: suppressedGroups,
        groups: published
      })
    };
  } catch (e) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ zip, window_days: WINDOW_DAYS, available: false, groups: [] }) };
  }
};
