const https = require('https');

const SUPABASE_URL = "https://khkmdultmrggpfvkbfzj.supabase.co";
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

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

    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || '').trim().toUpperCase();

    if (!email || !code) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email and code are required.' }) };
    }

    try {
        const result = await supabaseFetch(
            `access_codes?email=eq.${encodeURIComponent(email)}&code=eq.${encodeURIComponent(code)}&used=eq.false&select=expires_at`
        );

        if (!Array.isArray(result.data) || result.data.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'Invalid code or email.' }) };
        }

        const record = result.data[0];
        if (new Date() > new Date(record.expires_at)) {
            return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'This code has expired. Please request a new one.' }) };
        }

        // Only ever return what the client needs to maintain a session —
        // never the code itself or any other row data.
        return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, expires_at: record.expires_at })
        };
    } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
