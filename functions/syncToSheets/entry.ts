import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SHEET_TITLE = 'LFS2026 Submissions';

async function getOrCreateSpreadsheet(accessToken) {
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title: SHEET_TITLE },
      sheets: [
        { properties: { title: 'Visitor Registrations' } },
        { properties: { title: 'Speaker Applications' } },
        { properties: { title: 'Sponsor Requests' } },
        { properties: { title: 'Exhibitor Applications' } },
        { properties: { title: 'Partnership Inquiries' } },
        { properties: { title: 'Media Accreditations' } },
        { properties: { title: 'Contact Inquiries' } },
      ]
    })
  });
  const created = await createRes.json();
  console.log('Created spreadsheet:', created.spreadsheetId);
  return created.spreadsheetId;
}

async function writeSheet(accessToken, spreadsheetId, sheetName, headers, rows) {
  // Clear existing content
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:Z10000:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (rows.length === 0) {
    // Just write headers
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [headers] })
      }
    );
    return;
  }

  const values = [headers, ...rows];
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    }
  );
  const result = await res.json();
  console.log(`Written ${rows.length} rows to ${sheetName}:`, result.updatedCells);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Fetch all data in parallel
    const [visitors, speakers, sponsors, exhibitors, partnerships, media, contacts] = await Promise.all([
      base44.asServiceRole.entities.VisitorRegistration.list(),
      base44.asServiceRole.entities.SpeakerApplication.list(),
      base44.asServiceRole.entities.SponsorRequest.list(),
      base44.asServiceRole.entities.ExhibitorApplication.list(),
      base44.asServiceRole.entities.PartnershipInquiry.list(),
      base44.asServiceRole.entities.MediaAccreditation.list(),
      base44.asServiceRole.entities.ContactInquiry.list(),
    ]);

    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);

    // Write each sheet
    await writeSheet(accessToken, spreadsheetId, 'Visitor Registrations',
      ['ID', 'Name', 'Email', 'WhatsApp', 'Ticket', 'Interests', 'Status', 'Date'],
      visitors.map(r => [r.id, r.name, r.email, r.whatsapp, r.ticket, (r.interests || []).join(', '), r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Speaker Applications',
      ['ID', 'Name', 'Title', 'Company', 'Email', 'Topic', 'Session Type', 'Stage', 'Status', 'Date'],
      speakers.map(r => [r.id, r.name, r.title, r.company, r.email, r.topic, r.sessionType, r.stage, r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Sponsor Requests',
      ['ID', 'Company', 'Website', 'Contact Name', 'Title', 'Email', 'WhatsApp', 'Tier', 'Goals', 'Status', 'Date'],
      sponsors.map(r => [r.id, r.company, r.website, r.name, r.title, r.email, r.whatsapp, r.tier, r.goals, r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Exhibitor Applications',
      ['ID', 'Company', 'Rep Name', 'Rep Email', 'Rep WhatsApp', 'Booth', 'Industry', 'Country', 'Status', 'Date'],
      exhibitors.map(r => [r.id, r.companyName, r.repName, r.repEmail, r.repWhatsapp, r.booth, r.industry, r.country, r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Partnership Inquiries',
      ['ID', 'Organisation', 'Contact Name', 'Email', 'Website', 'Partnership Type', 'Message', 'Status', 'Date'],
      partnerships.map(r => [r.id, r.org, r.name, r.email, r.website, r.type, r.message, r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Media Accreditations',
      ['ID', 'Name', 'Email', 'Outlet', 'Role', 'Website', 'WhatsApp', 'Coverage Type', 'Status', 'Date'],
      media.map(r => [r.id, r.name, r.email, r.outlet, r.role, r.website, r.whatsapp, r.coverageType, r.status, r.created_date])
    );

    await writeSheet(accessToken, spreadsheetId, 'Contact Inquiries',
      ['ID', 'Name', 'Email', 'Company', 'Inquiry Type', 'Message', 'Status', 'Date'],
      contacts.map(r => [r.id, r.name, r.email, r.company, r.type, r.message, r.status, r.created_date])
    );

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    console.log('Sync complete. Sheet URL:', sheetUrl);

    return Response.json({
      success: true,
      spreadsheetId,
      sheetUrl,
      counts: {
        visitors: visitors.length,
        speakers: speakers.length,
        sponsors: sponsors.length,
        exhibitors: exhibitors.length,
        partnerships: partnerships.length,
        media: media.length,
        contacts: contacts.length,
      }
    });
  } catch (error) {
    console.error('syncToSheets error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});