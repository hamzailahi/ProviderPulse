const https = require('https');

const SUPABASE_URL = "https://khkmdultmrggpfvkbfzj.supabase.co";
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function supabaseFetch(path) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_SECRET,
                'Authorization': `Bearer ${SUPABASE_SECRET}`,
                'Accept': 'application/json'
            }
        };
        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data: null }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    let body;
    try { body = JSON.parse(event.body); }
    catch (e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    if (!ADMIN_PASSWORD || body.password !== ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const [requestsRes, codesRes] = await Promise.all([
            supabaseFetch('access_requests?order=created_at.desc'),
            supabaseFetch('access_codes?order=created_at.desc')
        ]);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ok: true,
                requests: requestsRes.data || [],
                codes: codesRes.data || []
            })
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
