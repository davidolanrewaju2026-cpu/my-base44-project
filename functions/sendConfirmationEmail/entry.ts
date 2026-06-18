import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ── HTML email templates ──────────────────────────────────────────────────────

function baseLayout(content) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lagos Finance Summit 2026</title>
</head>
<body style="margin:0;padding:0;background:#070B14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070B14;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0D1220;border-radius:16px;border:1px solid #1e2a40;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0D1220,#111827);padding:32px 40px;border-bottom:1px solid #1e2a40;text-align:center;">
            <div style="font-size:11px;letter-spacing:0.3em;color:#D4AF37;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Lagos Finance Summit</div>
            <div style="font-size:32px;font-weight:800;color:#ffffff;">LFS <span style="color:#0A84FF;">2026</span></div>
            <div style="font-size:12px;color:#4a5568;margin-top:6px;">15 – 17 October 2026 · Landmark Event Centre, Lagos</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #1e2a40;text-align:center;background:#070B14;">
            <p style="margin:0 0 8px;font-size:12px;color:#4a5568;">© 2026 Lagos Finance Summit. All rights reserved.</p>
            <p style="margin:0;font-size:12px;color:#4a5568;">
              <a href="mailto:team@lfsevents.com" style="color:#0A84FF;text-decoration:none;">team@lfsevents.com</a>
              &nbsp;·&nbsp;
              <a href="https://lfs2026.com" style="color:#0A84FF;text-decoration:none;">lfs2026.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ticketBadge(color, label) {
  return `<span style="display:inline-block;padding:4px 14px;border-radius:100px;background:${color}18;border:1px solid ${color}40;color:${color};font-size:12px;font-weight:700;letter-spacing:0.08em;">${label}</span>`;
}

function sectionDivider() {
  return `<hr style="border:none;border-top:1px solid #1e2a40;margin:28px 0;" />`;
}

function ctaButton(href, text, color = '#0A84FF') {
  return `<a href="${href}" style="display:inline-block;padding:14px 32px;background:${color};color:${color === '#D4AF37' ? '#070B14' : '#ffffff'};font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">${text}</a>`;
}

// ── TICKET EMAILS ─────────────────────────────────────────────────────────────

const ticketEmails = {
  early: (name, ref) => ({
    subject: '🎟 You\'re In — Free Early Bird Ticket Confirmed | LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Welcome aboard, ${name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your free Early Bird ticket for LFS2026 has been confirmed.</p>
      ${ticketBadge('#0A84FF', '🎟 Early Bird — FREE')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">What's included</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${['Expo Attendance & Floor Access', 'Coffee Bar Access'].map(f => `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#c8d3e0;">
            <span style="color:#0A84FF;margin-right:10px;">✓</span>${f}
          </td>
        </tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 6px;font-size:13px;color:#8896a7;">Event Details</p>
      <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
      <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
      ${ctaButton('https://lfs2026.com', 'Visit LFS2026 Website')}
      <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">Keep this email safe — more details will follow closer to the event date.</p>
    `),
  }),

  regular: (name, ref) => ({
    subject: '🎟 Registration Confirmed — Regular Visitor | LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">You're registered, ${name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your Regular Visitor ticket for LFS2026 is confirmed.</p>
      ${ticketBadge('#0A84FF', '🔥 Regular Visitor — ₦5,000')}
      ${ref ? `<p style="margin:16px 0 0;font-size:12px;color:#4a5568;">Reference: <strong style="color:#8896a7;">${ref}</strong></p>` : ''}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">What's included</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${['Expo Attendance & Floor Access', 'Speaker Hall Access & Networking Areas', 'Opening Ceremony Party', 'Coffee Bar Access', 'Gift Bags'].map(f => `
        <tr><td style="padding:6px 0;font-size:14px;color:#c8d3e0;"><span style="color:#0A84FF;margin-right:10px;">✓</span>${f}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
      <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
      ${ctaButton('https://lfs2026.com', 'Visit LFS2026 Website')}
      <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">Your ticket badge will be sent closer to the event. See you in October!</p>
    `),
  }),

  premium: (name, ref) => ({
    subject: '⭐ Premium Ticket Confirmed — See You at LFS2026!',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Welcome to the Premium Experience, ${name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your Premium Visitor ticket for LFS2026 is confirmed. You're in for an exceptional summit.</p>
      ${ticketBadge('#D4AF37', '⭐ Premium Visitor — ₦50,000')}
      ${ref ? `<p style="margin:16px 0 0;font-size:12px;color:#4a5568;">Reference: <strong style="color:#8896a7;">${ref}</strong></p>` : ''}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your Premium Benefits</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${['Expo Attendance & Floor Access', 'Speaker Hall Access & Networking Areas', 'Trading Seminar Access', 'Opening Ceremony Access', 'Cafe Access', 'Unlimited Food & Drinks', 'Coffee Bar Access', 'Reserved Parking', 'Gift Bags'].map(f => `
        <tr><td style="padding:6px 0;font-size:14px;color:#c8d3e0;"><span style="color:#D4AF37;margin-right:10px;">✓</span>${f}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
      <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
      ${ctaButton('https://lfs2026.com', 'Visit LFS2026 Website', '#D4AF37')}
      <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">We'll be in touch with exclusive pre-event briefings and your premium badge details.</p>
    `),
  }),

  delegate: (name, ref) => ({
    subject: '💎 Delegate Pass Confirmed — Executive Access Awaits | LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Welcome, Delegate ${name}.</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your Delegate Pass for LFS2026 is confirmed. You have full executive access to Africa's premier finance summit.</p>
      ${ticketBadge('#A78BFA', '💎 Delegate Pass — ₦250,000')}
      ${ref ? `<p style="margin:16px 0 0;font-size:12px;color:#4a5568;">Reference: <strong style="color:#8896a7;">${ref}</strong></p>` : ''}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your Executive Access</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${['Full Expo & Executive Access', 'Speaker Hall & Networking Areas', 'Trading Seminar + Investor Sessions', 'Trading Room Access', 'Opening Ceremony', 'Award Night Party', 'Unlimited Food & Drinks', 'VIP Parking', 'Closed-Door Meeting Room Access', 'VIP Lounge Access', 'VIP Pack'].map(f => `
        <tr><td style="padding:6px 0;font-size:14px;color:#c8d3e0;"><span style="color:#A78BFA;margin-right:10px;">✓</span>${f}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
      <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
      ${ctaButton('https://lfs2026.com', 'Visit LFS2026 Website', '#A78BFA')}
      <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">A dedicated account manager will reach out to you personally with your VIP briefing package.</p>
    `),
  }),
};

// ── FORM EMAILS ───────────────────────────────────────────────────────────────

const formEmails = {
  speaker: (data) => ({
    subject: '🎤 Speaker Application Received — LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Thanks for applying, ${data.name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your speaker application for LFS2026 and our team will review it shortly.</p>
      ${ticketBadge('#0A84FF', '🎤 Speaker Application')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your Submission</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${[
          ['Topic', data.topic],
          ['Session Type', data.sessionType || '—'],
          ['Stage', data.stage || '—'],
          ['Company', data.company || '—'],
        ].map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#8896a7;width:40%;">${k}</td><td style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${v}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">Our team reviews all applications within <strong style="color:#ffffff;">5–7 business days</strong>. We'll notify you of the outcome via email.</p>
      ${ctaButton('https://lfs2026.com/speakers', 'Learn More About Speaking at LFS2026')}
    `),
  }),

  exhibitor: (data) => ({
    subject: '🏢 Exhibitor Application Received — LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Thanks for applying, ${data.repName}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your exhibitor application from <strong style="color:#ffffff;">${data.companyName}</strong> and our partnerships team will be in touch soon.</p>
      ${ticketBadge('#D4AF37', '🏢 Exhibitor Application')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Application Summary</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${[
          ['Company', data.companyName],
          ['Industry', data.industry || '—'],
          ['Booth Type', data.booth || '—'],
          ['Country', data.country || '—'],
        ].map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#8896a7;width:40%;">${k}</td><td style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${v}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">Our partnerships team will send you a detailed proposal within <strong style="color:#ffffff;">3–5 business days</strong>.</p>
      ${ctaButton('https://lfs2026.com/sponsors', 'Explore Exhibitor Opportunities')}
    `),
  }),

  sponsor: (data) => ({
    subject: '🤝 Sponsorship Enquiry Received — LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Thank you, ${data.name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your sponsorship enquiry from <strong style="color:#ffffff;">${data.company}</strong>. We're excited about the possibility of partnering with you.</p>
      ${ticketBadge('#D4AF37', `🤝 ${data.tier ? data.tier.charAt(0).toUpperCase() + data.tier.slice(1) + ' Sponsor' : 'Sponsorship Enquiry'}`)}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Enquiry Summary</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${[
          ['Company', data.company],
          ['Tier Interest', data.tier ? data.tier.charAt(0).toUpperCase() + data.tier.slice(1) : '—'],
          ['Contact', data.name],
          ['Title', data.title || '—'],
        ].map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#8896a7;width:40%;">${k}</td><td style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${v}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">A member of our team will reach out within <strong style="color:#ffffff;">48 hours</strong> with a tailored sponsorship proposal.</p>
      ${ctaButton('https://lfs2026.com/sponsors', 'View Sponsorship Packages', '#D4AF37')}
    `),
  }),

  partnership: (data) => ({
    subject: '🔗 Partnership Enquiry Received — LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Thanks for reaching out, ${data.name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your partnership enquiry from <strong style="color:#ffffff;">${data.org}</strong> and we'd love to explore working together.</p>
      ${ticketBadge('#A78BFA', '🔗 Partnership Enquiry')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Enquiry Details</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${[
          ['Organisation', data.org],
          ['Partnership Type', data.type || '—'],
          ['Contact', data.name],
          ['Website', data.website || '—'],
        ].map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#8896a7;width:40%;">${k}</td><td style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${v}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">Our team will get back to you within <strong style="color:#ffffff;">48 hours</strong> to discuss the opportunity further.</p>
      ${ctaButton('https://lfs2026.com/partners', 'Learn About Partnerships', '#A78BFA')}
    `),
  }),

  media: (data) => ({
    subject: '📸 Media Accreditation Application Received — LFS2026',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Application received, ${data.name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your media accreditation request from <strong style="color:#ffffff;">${data.outlet}</strong>.</p>
      ${ticketBadge('#22c55e', '📸 Media Accreditation')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Application Summary</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${[
          ['Media Outlet', data.outlet],
          ['Role', data.role || '—'],
          ['Coverage Type', data.coverageType || '—'],
          ['Website', data.website || '—'],
        ].map(([k, v]) => `<tr><td style="padding:7px 0;font-size:13px;color:#8896a7;width:40%;">${k}</td><td style="padding:7px 0;font-size:13px;color:#ffffff;font-weight:600;">${v}</td></tr>`).join('')}
      </table>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">Our media team will review your application and respond within <strong style="color:#ffffff;">3–5 business days</strong>.</p>
      ${ctaButton('https://lfs2026.com/contact', 'Contact the Press Team')}
    `),
  }),

  contact: (data) => ({
    subject: '📩 We Got Your Message — LFS2026 Team',
    body: baseLayout(`
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Thanks for getting in touch, ${data.name}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">We've received your message and will get back to you shortly.</p>
      ${ticketBadge('#0A84FF', '📩 General Enquiry')}
      ${sectionDivider()}
      <p style="margin:0 0 12px;font-size:13px;color:#8896a7;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">Your Message</p>
      <div style="background:#070B14;border-radius:8px;padding:16px;border:1px solid #1e2a40;">
        <p style="margin:0;font-size:14px;color:#8896a7;line-height:1.7;">${data.message}</p>
      </div>
      ${sectionDivider()}
      <p style="margin:0 0 20px;font-size:14px;color:#8896a7;">Our team typically responds within <strong style="color:#ffffff;">24–48 hours</strong> on business days.</p>
      ${ctaButton('https://lfs2026.com', 'Visit LFS2026 Website')}
    `),
  }),
};

// ── HANDLER ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, data, reference } = await req.json();

    let emailPayload = null;

    // Ticket confirmation emails
    if (type === 'ticket') {
      const ticketId = data.ticket;
      const name = data.name;
      const email = data.email;
      const fn = ticketEmails[ticketId];
      if (!fn) return Response.json({ error: 'Unknown ticket type' }, { status: 400 });
      const { subject, body } = fn(name, reference);
      emailPayload = { to: email, subject, body };
    }

    // Form confirmation emails
    else if (type === 'form') {
      const formType = data.formType;
      const email = data.email || data.repEmail;
      const fn = formEmails[formType];
      if (!fn) return Response.json({ error: 'Unknown form type' }, { status: 400 });
      const { subject, body } = fn(data);
      emailPayload = { to: email, subject, body };
    }

    else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lagos Finance Summit <support@lfs2026.com>',
        to: [emailPayload.to],
        subject: emailPayload.subject,
        html: emailPayload.body,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      throw new Error(`Resend error: ${err}`);
    }

    console.log(`Sent ${type} email to ${emailPayload.to} via Resend`);
    return Response.json({ sent: true });

  } catch (error) {
    console.error('sendConfirmationEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});