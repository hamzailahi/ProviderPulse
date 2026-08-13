const https = require('https');

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
                    resolve(parsed?.results?.[0] || null);
                } catch(e) {
                    console.log(`[CMS] JSON parse error: ${e.message} raw: ${data.substring(0,200)}`);
                    resolve(null);
                }
            });
        });

        req.on('error', e => { console.log(`[CMS] Request error: ${e.message}`); reject(e); });
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('CMS API timeout')); });
        req.write(body);
        req.end();
    });
}

function fetchFromCMSGet(npi) {
    return new Promise((resolve) => {
        const path = '/provider-data/api/1/datastore/query/mj5m-pzi6/0?limit=1&offset=0'
            + '&conditions[0][property]=NPI&conditions[0][value]=' + npi + '&conditions[0][operator]=%3D';
        const req = https.request({ hostname: 'data.cms.gov', path, method: 'GET' }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`[CMS-GET] NPI ${npi} status:${res.statusCode} results:${parsed?.results?.length || 0}`);
                    resolve(parsed?.results?.[0] || null);
                } catch (e) {
                    console.log(`[CMS-GET] parse error: ${e.message} raw: ${data.substring(0,200)}`);
                    resolve(null);
                }
            });
        });
        req.on('error', e => { console.log(`[CMS-GET] error: ${e.message}`); resolve(null); });
        req.setTimeout(7000, () => { req.destroy(); resolve(null); });
        req.end();
    });
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

    const npi = event.queryStringParameters?.npi;
    if (!npi || !/^\d{10}$/.test(npi)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid 10-digit NPI required' }) };
    }

    try {
        let r = null;
        try {
            r = await fetchFromCMS(npi);
        } catch (postErr) {
            console.log(`[CMS] POST failed, trying GET: ${postErr.message}`);
        }
        if (!r) r = await fetchFromCMSGet(npi);

        if (!r) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ found: false, npi })
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

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400'
            },
            body: JSON.stringify(result)
        };

    } catch(e) {
        // Enrichment is optional: degrade quietly so the popup still renders
        console.log(`[CMS] Handler error: ${e.message}`);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ found: false, npi, unavailable: true })
        };
    }
};
