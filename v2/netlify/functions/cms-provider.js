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

exports.handler = async function(event) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method not allowed' };

    const npi = event.queryStringParameters?.npi;
    if (!npi || !/^\d{10}$/.test(npi)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid 10-digit NPI required' }) };
    }

    try {
        const r = await fetchFromCMS(npi);

        if (!r) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ found: false, npi })
            };
        }

        // Exact field names from CMS Data Dictionary
        const result = {
            found: true,
            npi,
            first_name: r['Provider First Name'] || null,
            last_name: r['Provider Last Name'] || null,
            credential: r['Cred'] || null,
            gender: r['gndr'] || null,
            primary_specialty: r['Pri_spec'] || null,
            secondary_specialties: [r['Sec_spec_1'], r['Sec_spec_2'], r['Sec_spec_3'], r['Sec_spec_4']].filter(Boolean),
            medical_school: r['Med_sch'] || null,
            graduation_year: r['Grd_yr'] || null,
            telehealth: r['Telehlth'] === 'Y',
            facility: r['Facility Name'] || null,
            org_pac_id: r['Org_PAC_ID'] || null,
            group_size: r['num_org_mem'] || null,
            address: [r['adr_ln_1'], r['City/Town'], r['State'], r['ZIP Code']].filter(Boolean).join(', ') || null,
            phone: r['Telephone Number'] || null,
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
        console.log(`[CMS] Handler error: ${e.message}`);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: e.message })
        };
    }
};
