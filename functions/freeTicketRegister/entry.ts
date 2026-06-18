import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, email, whatsapp, ticket, interests } = await req.json();

    if (!name || !email || !ticket) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save registration using service role (no auth needed for public forms)
    const reg = await base44.asServiceRole.entities.VisitorRegistration.create({
      name,
      email,
      whatsapp,
      ticket,
      interests: interests || [],
      status: 'confirmed',
    });

    // Send confirmation email directly via Resend (avoids auth dependency)
    const ticketLabels = {
      early: '🎟 Early Bird — FREE',
      regular: '🔥 Regular Visitor — ₦5,000',
      premium: '⭐ Premium Visitor — ₦50,000',
      delegate: '💎 Delegate Pass — ₦250,000',
    };
    const ticketLabel = ticketLabels[ticket] || ticket;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>LFS2026 Registration</title></head>
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
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Welcome aboard, ${name}!</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your registration for LFS2026 has been confirmed.</p>
          <span style="display:inline-block;padding:4px 14px;border-radius:100px;background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.4);color:#0A84FF;font-size:12px;font-weight:700;">${ticketLabel}</span>
          <hr style="border:none;border-top:1px solid #1e2a40;margin:28px 0;" />
          <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
          <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
          <a href="https://lfs2026.com" style="display:inline-block;padding:14px 32px;background:#0A84FF;color:#ffffff;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">Visit LFS2026 Website</a>
          <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">Keep this email safe — your ticket badge and event details will follow closer to the event date.</p>
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

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lagos Finance Summit <support@lfs2026.com>',
        to: [email],
        subject: `🎟 You're Registered — LFS2026 Confirmation`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      console.error('Resend error:', err);
      // Still return success — registration was saved
    } else {
      console.log('Free ticket registered and email sent for:', email);
    }

    return Response.json({ success: true, id: reg.id });

  } catch (error) {
    console.error('freeTicketRegister error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});