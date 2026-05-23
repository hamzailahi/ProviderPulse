const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    try {
        const { system, messages } = JSON.parse(event.body);

        const payload = JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system,
            messages
        });

        const result = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.write(payload);
            req.end();
        });

        return {
            statusCode: result.status,
            headers: { 'Content-Type': 'application/json' },
            body: result.body
        };

    } catch(e) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: e.message }) 
        };
    }
};
