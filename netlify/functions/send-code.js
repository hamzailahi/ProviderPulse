exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { email, name, code, expires_at } = JSON.parse(event.body);
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    const expiryDate = new Date(expires_at).toLocaleString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: 'Your Healthcare Map Access Code',
        html: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0d1117; color: #e6edf3; border-radius: 12px; overflow: hidden; border: 1px solid #2a3444;">
            <div style="background: #161b22; padding: 24px 32px; border-bottom: 1px solid #2a3444;">
              <div style="font-size: 12px; font-weight: 600; color: #58a6ff; letter-spacing: 0.08em; text-transform: uppercase;">IT Connections LLC</div>
            </div>
            <div style="padding: 32px;">
              <h2 style="font-size: 20px; margin-bottom: 8px;">Access Approved, ${name}!</h2>
              <p style="font-size: 14px; color: #8b949e; margin-bottom: 28px; line-height: 1.6;">
                Your request to access the Healthcare Provider Map has been approved. Use the code below to sign in.
              </p>
              <div style="background: #1c2330; border: 1px solid #2a3444; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #8b949e; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Your Access Code</div>
                <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #58a6ff; letter-spacing: 0.2em;">${code}</div>
                <div style="font-size: 12px; color: #8b949e; margin-top: 10px;">Expires: ${expiryDate}</div>
              </div>
              <a href="https://medicalpracticemap.netlify.app/login.html"
                 style="display: block; background: #3b82f6; color: #fff; text-align: center; padding: 12px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px;">
                Access the Map →
              </a>
              <p style="font-size: 12px; color: #484f58; line-height: 1.6;">
                This code is valid for 72 hours and is for your use only. Do not share it with others.
                If you did not request access, please ignore this email.
              </p>
            </div>
          </div>
        `
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: 500, body: `Email failed: ${err}` };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch(e) {
    return { statusCode: 500, body: e.message };
  }
};
