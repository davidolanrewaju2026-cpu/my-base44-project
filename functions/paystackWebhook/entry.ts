import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ticketLabels = {
  early: '🎟 Early Bird — FREE',
  regular: '🔥 Regular Visitor — ₦5,000',
  premium: '⭐ Premium Visitor — ₦50,000',
  delegate: '💎 Delegate Pass — ₦250,000',
};

function buildConfirmationEmail(name, ticket, reference) {
  const ticketLabel = ticketLabels[ticket] || ticket;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>LFS2026 Registration Confirmed</title></head>
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
          <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;">Payment Confirmed, ${name}!</h2>
          <p style="margin:0 0 24px;font-size:14px;color:#8896a7;">Your ticket for LFS2026 has been confirmed. We look forward to seeing you!</p>
          <span style="display:inline-block;padding:4px 14px;border-radius:100px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.4);color:#D4AF37;font-size:12px;font-weight:700;">${ticketLabel}</span>
          ${reference ? `<p style="margin:16px 0 0;font-size:12px;color:#4a5568;">Payment Reference: <strong style="color:#8896a7;">${reference}</strong></p>` : ''}
          <hr style="border:none;border-top:1px solid #1e2a40;margin:28px 0;" />
          <p style="margin:0 0 4px;font-size:14px;color:#ffffff;font-weight:600;">📅 15 – 17 October 2026</p>
          <p style="margin:0 0 24px;font-size:14px;color:#ffffff;font-weight:600;">📍 Landmark Event Centre, Lagos</p>
          <a href="https://lfs2026.com" style="display:inline-block;padding:14px 32px;background:#D4AF37;color:#070B14;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">Visit LFS2026 Website</a>
          <p style="margin:24px 0 0;font-size:13px;color:#4a5568;">Your ticket badge and full event details will be sent closer to the event. Keep this email safe.</p>
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
  const body = await req.text();

  // Verify Paystack HMAC-SHA512 signature
  const signature = req.headers.get('x-paystack-signature');
  const secret = Deno.env.get('PAYSTACK_WEBHOOK_SECRET');

  if (!secret) {
    console.error('PAYSTACK_WEBHOOK_SECRET is not set');
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(body));
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedSignature !== signature) {
    console.error('Invalid Paystack webhook signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);
  console.log('Paystack webhook event:', event.event);

  if (event.event === 'charge.success') {
    const data = event.data;
    const reference = data.reference;
    const email = data.customer?.email;
    const metadata = data.metadata || {};

    console.log('Payment successful — ref:', reference, 'email:', email);

    const base44 = createClientFromRequest(req);

    // Match registration by reference (precise, no ambiguity)
    let reg = null;
    const byRef = await base44.asServiceRole.entities.VisitorRegistration.filter({ reference });
    if (byRef && byRef.length > 0) {
      reg = byRef[0];
    } else {
      // Fallback: match by email + status new (most recent)
      console.warn('No registration found by reference, falling back to email match');
      const byEmail = await base44.asServiceRole.entities.VisitorRegistration.filter({ email, status: 'new' });
      if (byEmail && byEmail.length > 0) {
        reg = byEmail[byEmail.length - 1];
      }
    }

    if (!reg) {
      console.warn('No registration found for ref:', reference, 'email:', email);
      return Response.json({ received: true }, { status: 200 });
    }

    // Guard against duplicate webhook delivery
    if (reg.status === 'confirmed') {
      console.log('Registration already confirmed, skipping duplicate webhook:', reg.id);
      return Response.json({ received: true }, { status: 200 });
    }

    // Confirm registration
    await base44.asServiceRole.entities.VisitorRegistration.update(reg.id, { status: 'confirmed' });
    console.log('Registration confirmed:', reg.id);

    // Decrement ticket inventory
    if (reg.ticket && reg.ticket !== 'early') {
      const inventory = await base44.asServiceRole.entities.TicketInventory.filter({ ticketType: reg.ticket });
      if (inventory && inventory.length > 0) {
        const inv = inventory[0];
        await base44.asServiceRole.entities.TicketInventory.update(inv.id, {
          remaining: Math.max(0, (inv.remaining || 0) - 1),
        });
      }
    }

    // Send confirmation email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && email) {
      const name = reg.name || metadata.name || 'Attendee';
      const html = buildConfirmationEmail(name, reg.ticket, reference);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Lagos Finance Summit <support@lfs2026.com>',
          to: [email],
          subject: '✅ Payment Confirmed — Your LFS2026 Ticket',
          html,
        }),
      });
      if (!resendRes.ok) {
        console.error('Resend error:', await resendRes.text());
      } else {
        console.log('Confirmation email sent to:', email);
      }
    }
  }

  return Response.json({ received: true }, { status: 200 });
});