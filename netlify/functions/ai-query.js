const https = require('https');

exports.handler = async function(event, context) {
    console.log('ai-query called, method:', event.httpMethod);
    
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API key present:', !!apiKey, 'length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
    }

    let parsed;
    try {
        parsed = JSON.parse(event.body);
        console.log('Body parsed OK, messages count:', parsed.messages ? parsed.messages.length : 0);
    } catch(e) {
        console.log('Body parse error:', e.message);
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const { system, messages } = parsed;

    const payload = JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system,
        messages
    });

    console.log('Payload size:', payload.length, 'bytes');
    console.log('Calling Anthropic API...');

    try {
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
                res.on('end', () => {
                    console.log('API response status:', res.statusCode);
                    console.log('API response preview:', data.substring(0, 200));
                    resolve({ status: res.statusCode, body: data });
                });
            });
            req.on('error', e => {
                console.log('Request error:', e.message);
                reject(e);
            });
            req.write(payload);
            req.end();
        });

        return {
            statusCode: result.status,
            headers: { 'Content-Type': 'application/json' },
            body: result.body
        };

    } catch(e) {
        console.log('Caught error:', e.message);
        return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
};
