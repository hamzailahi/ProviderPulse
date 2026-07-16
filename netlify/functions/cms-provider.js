const https = require('https');

function fetchFromCMS(npi) {
    return new Promise((resolve, reject) => {
        // Query the National Downloadable File by NPI
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
                    resolve(parsed?.results?.[0] || null);
                } catch(e) {
                    resolve(null);
                }
            });
        });

        req.on('error', reject);
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
        const record = await fetchFromCMS(npi);

        if (!record) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ found: false, npi })
            };
        }

        // Return only the fields we care about, cleanly named
        const result = {
            found: true,
            npi,
            name: [record.frst_nm, record.mid_nm, record.lst_nm].filter(Boolean).join(' ') || record.org_nm || null,
            organization: record.org_nm || null,
            facility: record.facility_name || null,
            primary_specialty: record.pri_spec || null,
            secondary_specialties: [
                record.sec_spec_1,
                record.sec_spec_2,
                record.sec_spec_3,
                record.sec_spec_4
            ].filter(Boolean),
            medical_school: record.med_sch || null,
            graduation_year: record.grd_yr || null,
            medicare_participant: record.ind_assgn === 'Y',
            telehealth: record.telehlth === 'Y',
            accepts_medicare_assignment: record.ind_assgn === 'Y',
            address: [record.adr_ln_1, record.cty, record.st, record.zip].filter(Boolean).join(', ') || null,
            phone: record.phn_numbr || null,
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400' // cache 24h per NPI
            },
            body: JSON.stringify(result)
        };

    } catch(e) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: e.message })
        };
    }
};
