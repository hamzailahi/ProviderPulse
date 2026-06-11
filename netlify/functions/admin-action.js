const https = require('https');

const SUPABASE_URL = "https://khkmdultmrggpfvkbfzj.supabase.co";
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Password12@$#";

function supabaseFetch(path, method, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'apikey': SUPABASE_SECRET,
                'Authorization': `Bearer ${SUPABASE_SECRET}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };
        if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

        const req = https.request(options, res => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: responseData ? JSON.parse(responseData) : null });
                } catch(e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function sendEmail(email, name, code, expires_at, days) {
    const expiryDate = new Date(expires_at).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });
    const daysLabel = `${days} day${days > 1 ? 's' : ''}`;

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'ProviderPulse <noreply@itconnections.info>',
            to: [email],
            subject: 'Your ProviderPulse Access Code',
            html: `
              <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0d1117;color:#e6edf3;border-radius:12px;overflow:hidden;border:1px solid #2a3444;">
                <div style="background:#161b22;padding:24px 32px;border-bottom:1px solid #2a3444;">
                  <div style="font-size:12px;font-weight:600;color:#58a6ff;letter-spacing:0.08em;text-transform:uppercase;">IT Connections LLC</div>
                </div>
                <div style="padding:32px;">
                  <h2 style="font-size:20px;margin-bottom:8px;color:#e6edf3;">Access Approved, ${name}!</h2>
                  <p style="font-size:14px;color:#8b949e;margin-bottom:28px;line-height:1.6;">
                    Your request to access ProviderPulse has been approved for <strong style="color:#e6edf3;">${daysLabel}</strong>.
                  </p>
                  <div style="background:#1c2330;border:1px solid #2a3444;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px;">
                    <div style="font-size:12px;color:#8b949e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Your Access Code</div>
                    <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#58a6ff;letter-spacing:0.2em;">${code}</div>
                    <div style="font-size:12px;color:#8b949e;margin-top:10px;">Expires: ${expiryDate}</div>
                  </div>
                  <a href="https://medicalpracticemap.netlify.app/?signin"
                     style="display:block;background:#3b82f6;color:#fff;text-align:center;padding:12px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;margin-bottom:24px;">
                    Sign In to ProviderPulse →
                  </a>
                  <p style="font-size:12px;color:#484f58;line-height:1.6;">
                    This code is for your use only. Do not share it.
                    If you did not request access, please ignore this email.
                  </p>
                </div>
              </div>`
        })
    });
    const text = await res.text();
    console.log('Resend response:', res.status, text);
    return { ok: res.ok, status: res.status, body: text };
}

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

    let body;
    try { body = JSON.parse(event.body); }
    catch(e) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

    const { action, password, id, email, name, days } = body;

    // Verify admin password
    if (password !== ADMIN_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const headers = { 'Content-Type': 'application/json' };

    try {
        if (action === 'approve') {
            const accessDays = parseInt(days) || 3;

            // Check for existing active code
            const existing = await supabaseFetch(
                `access_codes?email=eq.${encodeURIComponent(email.toLowerCase())}&used=eq.false&select=id,expires_at`,
                'GET'
            );
            const hasActive = Array.isArray(existing.data) &&
                existing.data.some(c => new Date(c.expires_at) > new Date());
            if (hasActive) {
                return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: 'active_code_exists' }) };
            }

            const code = generateCode();
            const expires_at = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000).toISOString();

            // Insert code
            const codeRes = await supabaseFetch('access_codes', 'POST',
                { request_id: id, email: email.toLowerCase(), code, expires_at }
            );
            console.log('Insert code status:', codeRes.status);

            // Update request status
            const patchRes = await supabaseFetch(
                `access_requests?id=eq.${id}`, 'PATCH', { status: 'approved' }
            );
            console.log('Patch request status:', patchRes.status);

            // Send email
            const emailRes = await sendEmail(email, name, code, expires_at, accessDays);
            console.log('Email result:', emailRes);

            return { statusCode: 200, headers, body: JSON.stringify({
                ok: true, code, expires_at, email_sent: emailRes.ok
            })};
        }

        if (action === 'deny') {
            await supabaseFetch(`access_requests?id=eq.${id}`, 'PATCH', { status: 'denied' });
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        if (action === 'revoke') {
            await supabaseFetch(`access_codes?id=eq.${id}`, 'PATCH', { used: true });
            return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
        }

        return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };

    } catch(e) {
        console.log('admin-action error:', e.message);
        return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
    }
};
