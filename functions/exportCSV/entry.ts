import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function toCSV(headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    let csv = '';
    let filename = '';

    if (type === 'visitors') {
      const records = await base44.asServiceRole.entities.VisitorRegistration.list();
      csv = toCSV(
        ['ID', 'Name', 'Email', 'WhatsApp', 'Ticket', 'Interests', 'Status', 'Date'],
        records.map(r => [r.id, r.name, r.email, r.whatsapp, r.ticket, (r.interests || []).join('; '), r.status, r.created_date])
      );
      filename = 'lfs2026-visitor-registrations.csv';

    } else if (type === 'speakers') {
      const records = await base44.asServiceRole.entities.SpeakerApplication.list();
      csv = toCSV(
        ['ID', 'Name', 'Title', 'Company', 'Email', 'LinkedIn', 'Topic', 'Session Type', 'Stage', 'Bio', 'Status', 'Date'],
        records.map(r => [r.id, r.name, r.title, r.company, r.email, r.linkedin, r.topic, r.sessionType, r.stage, r.bio, r.status, r.created_date])
      );
      filename = 'lfs2026-speaker-applications.csv';

    } else if (type === 'sponsors') {
      const records = await base44.asServiceRole.entities.SponsorRequest.list();
      csv = toCSV(
        ['ID', 'Company', 'Website', 'Contact Name', 'Title', 'Email', 'WhatsApp', 'Tier', 'Goals', 'Status', 'Date'],
        records.map(r => [r.id, r.company, r.website, r.name, r.title, r.email, r.whatsapp, r.tier, r.goals, r.status, r.created_date])
      );
      filename = 'lfs2026-sponsor-requests.csv';

    } else if (type === 'exhibitors') {
      const records = await base44.asServiceRole.entities.ExhibitorApplication.list();
      csv = toCSV(
        ['ID', 'Company', 'Reg Name', 'Rep Name', 'Rep Email', 'Rep WhatsApp', 'Booth', 'Industry', 'Country', 'Status', 'Date'],
        records.map(r => [r.id, r.companyName, r.regName, r.repName, r.repEmail, r.repWhatsapp, r.booth, r.industry, r.country, r.status, r.created_date])
      );
      filename = 'lfs2026-exhibitor-applications.csv';

    } else if (type === 'partnerships') {
      const records = await base44.asServiceRole.entities.PartnershipInquiry.list();
      csv = toCSV(
        ['ID', 'Organisation', 'Contact Name', 'Email', 'Website', 'Partnership Type', 'Collaboration', 'Message', 'Status', 'Date'],
        records.map(r => [r.id, r.org, r.name, r.email, r.website, r.type, (r.collaboration || []).join('; '), r.message, r.status, r.created_date])
      );
      filename = 'lfs2026-partnership-inquiries.csv';

    } else if (type === 'media') {
      const records = await base44.asServiceRole.entities.MediaAccreditation.list();
      csv = toCSV(
        ['ID', 'Name', 'Email', 'Outlet', 'Role', 'Website', 'WhatsApp', 'Coverage Type', 'Message', 'Status', 'Date'],
        records.map(r => [r.id, r.name, r.email, r.outlet, r.role, r.website, r.whatsapp, r.coverageType, r.message, r.status, r.created_date])
      );
      filename = 'lfs2026-media-accreditations.csv';

    } else if (type === 'all') {
      // Combined export
      const [visitors, speakers, sponsors, exhibitors, partnerships, media, contacts] = await Promise.all([
        base44.asServiceRole.entities.VisitorRegistration.list(),
        base44.asServiceRole.entities.SpeakerApplication.list(),
        base44.asServiceRole.entities.SponsorRequest.list(),
        base44.asServiceRole.entities.ExhibitorApplication.list(),
        base44.asServiceRole.entities.PartnershipInquiry.list(),
        base44.asServiceRole.entities.MediaAccreditation.list(),
        base44.asServiceRole.entities.ContactInquiry.list(),
      ]);
      const rows = [
        ...visitors.map(r => ['Visitor', r.name, r.email, r.ticket || '', r.status, r.created_date]),
        ...speakers.map(r => ['Speaker', r.name, r.email, r.topic || '', r.status, r.created_date]),
        ...sponsors.map(r => ['Sponsor', r.company, r.email, r.tier || '', r.status, r.created_date]),
        ...exhibitors.map(r => ['Exhibitor', r.companyName, r.repEmail, r.booth || '', r.status, r.created_date]),
        ...partnerships.map(r => ['Partnership', r.org, r.email, r.type || '', r.status, r.created_date]),
        ...media.map(r => ['Media', r.name, r.email, r.outlet || '', r.status, r.created_date]),
        ...contacts.map(r => ['Contact', r.name, r.email, r.type || '', r.status, r.created_date]),
      ];
      csv = toCSV(['Type', 'Name/Company', 'Email', 'Category', 'Status', 'Date'], rows);
      filename = 'lfs2026-all-submissions.csv';

    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error) {
    console.error('exportCSV error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});