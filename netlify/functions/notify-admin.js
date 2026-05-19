exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { name, email, organization, reason } = JSON.parse(event.body);
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['hilahi@itconnections.info'],
        subject: `New Map Access Request — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0d1117; color: #e6edf3; border-radius: 12px; overflow: hidden; border: 1px solid #2a3444;">
            <div style="background: #161b22; padding: 24px 32px; border-bottom: 1px solid #2a3444;">
              <div style="font-size: 12px; font-weight: 600; color: #58a6ff; letter-spacing: 0.08em; text-transform: uppercase;">IT Connections LLC — Admin Alert</div>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 18px; margin-bottom: 16px;">New Access Request</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8b949e;width:120px;">Name</td>
                  <td style="padding:8px 0;font-size:13px;color:#e6edf3;">${name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8b949e;">Email</td>
                  <td style="padding:8px 0;font-size:13px;color:#e6edf3;">${email}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8b949e;">Organization</td>
                  <td style="padding:8px 0;font-size:13px;color:#e6edf3;">${organization || '—'}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:12px;color:#8b949e;">Reason</td>
                  <td style="padding:8px 0;font-size:13px;color:#e6edf3;">${reason || '—'}</td>
                </tr>
              </table>
              <a href="https://medicalpracticemap.netlify.app/admin.html"
                 style="display:block;background:#3b82f6;color:#fff;text-align:center;padding:12px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
                Review in Admin Panel →
              </a>
            </div>
          </div>
        `
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, body: `Notification failed: ${err}` };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
