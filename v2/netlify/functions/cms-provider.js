const https = require('https');

// Read-through cache for CMS lookups (migration 017, cms_provider_cache).
// Without it, every map popup open fired a live request to data.cms.gov with
// no persistence beyond the browser tab's in-memory cmsCache -- gone on
// refresh, never shared across visitors, and repeated forever for NPIs CMS
// doesn't cover at all (a doula, a facility). CMS's own file only refreshes
// quarterly, so a found:true row is treated as fresh for CACHE_TTL_DAYS before
// refetching.
//
// found:false rows get a much shorter TTL. A "not found" answer is cheap to
// double-check, and the alternative is worse: a slow or failed CMS response
// and a genuine "CMS has never heard of this NPI" both used to collapse to
// the same value here, so one flaky request could get permanently cached as
// false for the full TTL. That already happened live on 2026-08-14 -- a real
// CMS record (confirmed by querying CMS directly) came back found:false from
// this function and stayed that way on repeat calls, because a fetch failure
// had been written to the cache as if it were a confirmed miss. The fix below
// is fetchFromCMS/fetchFromCMSGet now distinguishing "CMS answered and the
// result set was empty" from "we didn't get an answer" -- only the former is
// ever written to the cache. The short TTL on genuine misses is a second,
// independent safety margin on top of that, not a substitute for it.
const CACHE_TTL_DAYS = 90;
const CACHE_TTL_DAYS_NOT_FOUND = 7;

async function readCache(npi, env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
    try {
        const res = await fetch(
            `${env.SUPABASE_URL}/rest/v1/cms_provider_cache?npi=eq.${npi}&select=*&limit=1`,
            {
                headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` },
                signal: AbortSignal.timeout(1000)
            }
        );
        if (!res.ok) return null;          // table missing, etc. -- fall through to a live fetch
        const rows = await res.json();
        const row = rows && rows[0];
        if (!row) return null;
        const ttl = row.found ? CACHE_TTL_DAYS : CACHE_TTL_DAYS_NOT_FOUND;
        const ageDays = (Date.now() - new Date(row.fetched_at).getTime()) / 86400000;
        if (ageDays > ttl) return null;
        return row;
    } catch (e) {
        return null;                        // cache is an optimization, never a hard dependency
    }
}

async function writeCache(result, env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
    try {
        await fetch(`${env.SUPABASE_URL}/rest/v1/cms_provider_cache`, {
            method: 'POST',
            headers: {
                apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ ...result, fetched_at: new Date().toISOString() }),
            signal: AbortSignal.timeout(1000)
        });
    } catch (e) {
        // A failed cache write must never fail the request -- the popup already
        // has its answer, this was only trying to save the next visitor a round trip.
    }
}

// A cache row's shape matches the API response exactly except for one thing:
// PostgREST returns secondary_specialties as a real array already, so this is
// only needed to strip the DB-only fetched_at field back off before sending.
function rowToResult(row, npi) {
    const { fetched_at, ...rest } = row;
    return { ...rest, npi };
}

// Resolves { confirmed: true, row } when CMS actually answered (row is null
// for a genuine empty result set), or rejects when we don't have an answer at
// all (network error, timeout, bad JSON). The caller must never treat a
// rejection as "not found" -- that conflation is exactly what caused a live
// CMS record to get cached as missing.
function fetchFromCMS(npi) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            conditions: [
                { property: 'NPI', value: npi, operator: '=' }
            ],
            limit: 1,
            offset: 0
        });

        const req = https.request({
            hostname: 'data.cms.gov',
            path: '/provider-data/api/1/datastore/query/mj5m-pzi6/0',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`[CMS] NPI ${npi} status:${res.statusCode} results:${parsed?.results?.length || 0}`);
                    resolve({ confirmed: true, row: parsed?.results?.[0] || null });
                } catch(e) {
                    console.log(`[CMS] JSON parse error: ${e.message} raw: ${data.substring(0,200)}`);
                    reject(e);
                }
            });
        });

        req.on('error', e => { console.log(`[CMS] Request error: ${e.message}`); reject(e); });
        // Budgeted against the function's 20s cap in netlify.toml: cache read (~1s) +
        // this + the GET fallback (~6s) + cache write (~1s) must all fit inside it.
        // A live database-wide check on 2026-08-14 found CMS regularly takes longer
        // than the previous 10s cap allowed at all -- a slow-but-real answer and an
        // outright failure looked identical to the caller. This is the primary path;
        // most of the 20s budget belongs here, not the fallback.
        req.setTimeout(10000, () => { req.destroy(); reject(new Error('CMS API timeout')); });
        req.write(body);
        req.end();
    });
}

function fetchFromCMSGet(npi) {
    return new Promise((resolve, reject) => {
        const path = '/provider-data/api/1/datastore/query/mj5m-pzi6/0?limit=1&offset=0'
            + '&conditions[0][property]=NPI&conditions[0][value]=' + npi + '&conditions[0][operator]=%3D';
        const req = https.request({ hostname: 'data.cms.gov', path, method: 'GET' }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`[CMS-GET] NPI ${npi} status:${res.statusCode} results:${parsed?.results?.length || 0}`);
                    resolve({ confirmed: true, row: parsed?.results?.[0] || null });
                } catch (e) {
                    console.log(`[CMS-GET] parse error: ${e.message} raw: ${data.substring(0,200)}`);
                    reject(e);
                }
            });
        });
        req.on('error', e => { console.log(`[CMS-GET] error: ${e.message}`); reject(e); });
        req.setTimeout(6000, () => { req.destroy(); reject(new Error('CMS-GET timeout')); });
        req.end();
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

    const npi = event.queryStringParameters?.npi;
    if (!npi || !/^\d{10}$/.test(npi)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid 10-digit NPI required' }) };
    }

    const env = process.env;

    const cached = await readCache(npi, env);
    if (cached) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
            body: JSON.stringify(rowToResult(cached, npi))
        };
    }

    let confirmed = false, r = null;
    try {
        const out = await fetchFromCMS(npi);
        confirmed = out.confirmed; r = out.row;
    } catch (postErr) {
        console.log(`[CMS] POST failed, trying GET: ${postErr.message}`);
        try {
            const out = await fetchFromCMSGet(npi);
            confirmed = out.confirmed; r = out.row;
        } catch (getErr) {
            console.log(`[CMS-GET] also failed: ${getErr.message}`);
        }
    }

    if (!confirmed) {
        // Neither attempt got an answer from CMS. Degrade quietly -- this popup just
        // shows no CMS box -- but do NOT write anything to the cache: writing here is
        // exactly the bug this function shipped with once already.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ found: false, npi, unavailable: true })
        };
    }

    if (!r) {
        const result = { found: false, npi };
        // Awaited, not fire-and-forget: Netlify (Lambda underneath) can freeze the
        // execution environment right after the response is sent, which would
        // silently drop an un-awaited write before it reaches Supabase.
        await writeCache(result, env);   // confirmed empty -- safe to cache, short TTL above
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };
    }

    // The CMS Data Dictionary documents these as "Provider First Name", "Pri_spec",
    // "Facility Name", etc., but the live datastore API actually returns lowercase
    // snake_case keys (provider_first_name, pri_spec, facility_name, ...) -- confirmed
    // 2026-08-13 via a direct query. Reading the dictionary's display names here meant
    // every field silently came back undefined except the ones that happened to already
    // be lowercase in both places (gndr, ind_assgn, num_org_mem, adr_ln_1) -- so a
    // provider's enrichment box would show only the Medicare badge and nothing else,
    // even though CMS actually had their facility, school, and specialty on file.
    const result = {
        found: true,
        npi,
        first_name: r['provider_first_name'] || null,
        last_name: r['provider_last_name'] || null,
        credential: r['cred'] || null,
        gender: r['gndr'] || null,
        primary_specialty: r['pri_spec'] || null,
        secondary_specialties: [r['sec_spec_1'], r['sec_spec_2'], r['sec_spec_3'], r['sec_spec_4']].filter(Boolean),
        medical_school: r['med_sch'] || null,
        graduation_year: r['grd_yr'] || null,
        telehealth: r['telehlth'] === 'Y',
        facility: r['facility_name'] || null,
        org_pac_id: r['org_pac_id'] || null,
        group_size: r['num_org_mem'] || null,
        address: [r['adr_ln_1'], r['citytown'], r['state'], r['zip_code']].filter(Boolean).join(', ') || null,
        phone: r['telephone_number'] || null,
        medicare_participant: r['ind_assgn'] === 'Y' || r['ind_assgn'] === 'M',
        medicare_assignment: r['ind_assgn'] || null,  // Y=accepts full, M=may accept
    };

    await writeCache(result, env);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400'
        },
        body: JSON.stringify(result)
    };
};
