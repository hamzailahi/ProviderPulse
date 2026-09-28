const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const npi = event.queryStringParameters?.npi;
    // Strict 10 digits: this value is spliced into the NPPES query string, so
    // anything else (e.g. "1&limit=200&state=TX") turned the endpoint into an
    // open NPPES search proxy.
    if (!npi || !/^\d{10}$/.test(npi)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Valid 10-digit NPI required' }) };
    }

    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}&limit=1`;

    try {
        const result = await new Promise((resolve, reject) => {
            https.get(url, { headers: { 'Accept': 'application/json' } }, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            }).on('error', reject);
        });

        return {
            statusCode: result.status,
            headers: { 'Content-Type': 'application/json' },
            body: result.body
        };
    } catch(e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
