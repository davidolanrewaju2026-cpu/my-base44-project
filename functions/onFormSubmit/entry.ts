import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const entityFormTypeMap = {
  SpeakerApplication: 'speaker',
  ExhibitorApplication: 'exhibitor',
  SponsorRequest: 'sponsor',
  PartnershipInquiry: 'partnership',
  MediaAccreditation: 'media',
  ContactInquiry: 'contact',
};

const formSubjects = {
  speaker: '🎤 Speaker Application Received — LFS2026',
  exhibitor: '🏢 Exhibitor Application Received — LFS2026',
  sponsor: '🤝 Sponsorship Enquiry Received — LFS2026',
  partnership: '🔗 Partnership Enquiry Received — LFS2026',
  media: '📸 Media Accreditation Application Received — LFS2026',
  contact: '📩 We Got Your Message — LFS2026 Team',
};

function getEmailRecipient(formType, data) {
  if (formType === 'exhibitor') return data.repEmail;
  return data.email;
}

function getDisplayName(formType, data) {
  if (formType === 'exhibitor') return data.repName || data.companyName || 'Applicant';
  if (formType === 'sponsor') return data.name || data.company || 'Applicant';
  if (formType === 'partnership') return data.name || data.org || 'Applicant';
  if (formType === 'media') return data.name || 'Applicant';
  return data.name || 'Applicant';
}

function buildFormEmail(formType, data) {
  const name = getDisplayName(formType, data);
  const messages = {
    speaker: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your speaker application for LFS2026. Our committee reviews all applications within <strong>5–7 business days</strong>.</p><p><strong>Topic:</strong> ${data.topic || '—'}</p>`,
    exhibitor: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your exhibitor application from <strong style="color:#fff">${data.companyName || '—'}</strong>. Our partnerships team will contact you within <strong>24 hours</strong>.</p>`,
    sponsor: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your sponsorship enquiry from <strong style="color:#fff">${data.company || '—'}</strong>. Expect a detailed proposal within <strong>48 hours</strong>.</p>`,
    partnership: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your partnership enquiry from <strong style="color:#fff">${data.org || '—'}</strong>. Our team will respond within <strong>48 hours</strong>.</p>`,
    media: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your media accreditation application from <strong style="color:#fff">${data.outlet || '—'}</strong>. We'll respond within <strong>3–5 business days</strong>.</p>`,
    contact: `<p>Hi <strong style="color:#fff">${name}</strong>,</p><p>We've received your message and will respond within <strong>24–48 hours</strong>.</p>`,
  };

  const body = messages[formType] || `<p>Thank you for reaching out to LFS2026.</p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>LFS2026</title></head>
<body style="margin:0;padding:0;background:#070B14;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070B14;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0D1220;border-radius:16px;border:1px solid #1e2a40;overflow:hidden;">
        <tr>
          <td style="background:#0D1220;padding:32px 40px;border-bottom:1px solid #1e2a40;text-align:center;">
            <div style="font-size:11px;letter-spacing:0.3em;color:#D4AF37;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Lagos Finance Summit</div>
            <div style="font-size:32px;font-weight:800;color:#ffffff;">LFS <span style="color:#0A84FF;">2026</span></div>
            <div style="font-size:12px;color:#4a5568;margin-top:6px;">15 – 17 October 2026 · Landmark Event Centre, Lagos</div>
          </td>
        </tr>
        <tr><td style="padding:40px;font-size:14px;color:#8896a7;line-height:1.7;">
          ${body}
          <hr style="border:none;border-top:1px solid #1e2a40;margin:28px 0;" />
          <a href="https://lfs2026.com" style="display:inline-block;padding:14px 32px;background:#0A84FF;color:#ffffff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">Visit LFS2026 Website</a>
        </td></tr>
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #1e2a40;text-align:center;background:#070B14;">
            <p style="margin:0;font-size:12px;color:#4a5568;">© 2026 Lagos Finance Summit · <a href="mailto:team@lfsevents.com" style="color:#0A84FF;text-decoration:none;">team@lfsevents.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const entityName = payload.event?.entity_name;
    const formType = entityFormTypeMap[entityName];

    if (!formType) {
      console.warn('Unknown entity for form email:', entityName);
      return Response.json({ skipped: true });
    }

    const data = payload.data;
    if (!data) {
      return Response.json({ skipped: true, reason: 'no data' });
    }

    const email = getEmailRecipient(formType, data);
    if (!email) {
      console.warn('No email found for', formType, entityName);
      return Response.json({ skipped: true, reason: 'no email' });
    }

    const subject = formSubjects[formType] || 'Application Received — LFS2026';
    const html = buildFormEmail(formType, data);

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('RESEND_API_KEY not set');
      return Response.json({ error: 'Email not configured' }, { status: 500 });
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Lagos Finance Summit <support@lfs2026.com>',
        to: [email],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend error:', err);
      return Response.json({ error: 'Email send failed' }, { status: 500 });
    }

    console.log(`Form email sent for ${entityName} to ${email}`);
    return Response.json({ sent: true });

  } catch (error) {
    console.error('onFormSubmit error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});