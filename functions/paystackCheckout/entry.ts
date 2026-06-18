import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { email, name, amount, ticketId, ticketName, whatsapp, interests } = await req.json();

    if (!email || !amount || !ticketId) {
      return Response.json({ error: 'Missing required fields: email, amount, ticketId' }, { status: 400 });
    }

    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not set');
      return Response.json({ error: 'Payment not configured' }, { status: 500 });
    }

    // Always use the canonical production URL for the callback
    const callbackUrl = `https://lfs2026.base44.app/?payment=success&ticket=${ticketId}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // convert to kobo
        currency: 'NGN',
        callback_url: callbackUrl,
        metadata: {
          name,
          whatsapp,
          ticketId,
          ticketName,
          interests,
          custom_fields: [
            { display_name: 'Full Name', variable_name: 'name', value: name || '' },
            { display_name: 'Ticket', variable_name: 'ticket', value: ticketName || '' },
            { display_name: 'WhatsApp', variable_name: 'whatsapp', value: whatsapp || '' },
          ],
        },
      }),
    });

    const data = await paystackRes.json();

    if (!data.status || !data.data?.authorization_url) {
      console.error('Paystack init error:', data.message);
      return Response.json({ error: data.message || 'Paystack initialization failed' }, { status: 400 });
    }

    const reference = data.data.reference;

    // Save registration with reference so webhook can match precisely
    await base44.asServiceRole.entities.VisitorRegistration.create({
      name,
      email,
      whatsapp,
      ticket: ticketId,
      interests: interests || [],
      reference,
      status: 'new',
    });

    console.log(`Paystack checkout initiated: ref=${reference}, email=${email}, ticket=${ticketId}`);
    return Response.json({ authorization_url: data.data.authorization_url, reference });

  } catch (error) {
    console.error('paystackCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});