import { createClient } from '@supabase/supabase-js';
import { emailLayout } from '../../../lib/email/template';
import { createRateLimit } from '../../../lib/utils/rateLimit';

const limit = createRateLimit({ windowMs: 60_000, max: 5 });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  const limited = limit(request);
  if (limited) return limited;
  try {
    const body = await request.json();
    const { name, email, neighborhood, role, note } = body || {};

    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const trimmedName = name.trim().slice(0, 200);
    const trimmedEmail = email.trim().slice(0, 254).toLowerCase();
    const trimmedNeighborhood = typeof neighborhood === 'string' ? neighborhood.trim().slice(0, 100) : null;
    const trimmedRole = typeof role === 'string' ? role.trim().slice(0, 50) : null;
    const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 1000) : null;

    if (!trimmedName || !EMAIL_RE.test(trimmedEmail)) {
      return Response.json({ error: 'Invalid name or email' }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;

    const supabase = getSupabase();
    const { error: dbError } = await supabase
      .from('brown_glove_waitlist')
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        neighborhood: trimmedNeighborhood,
        role: trimmedRole,
        note: trimmedNote,
        user_agent: userAgent,
      });

    if (dbError) {
      console.error('Failed to insert bg waitlist entry:', dbError);
      return Response.json({ error: 'Failed to save entry' }, { status: 500 });
    }

    const bodyHtml = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#0E0E0E;font-family:Georgia,serif;">New Brown Glove Waitlist Entry</h2>
      <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
      <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>
      ${trimmedRole ? `<p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Role:</strong> ${escapeHtml(trimmedRole)}</p>` : ''}
      ${trimmedNeighborhood ? `<p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Neighborhood:</strong> ${escapeHtml(trimmedNeighborhood)}</p>` : ''}
      ${trimmedNote ? `<p style="margin:16px 0 0;font-size:15px;color:#555;font-style:italic;">${escapeHtml(trimmedNote)}</p>` : ''}
    `;

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Brown Glove <concierge@andysantamaria.com>',
            to: ['andyjsantamaria@gmail.com'],
            subject: `Brown Glove waitlist: ${trimmedName}${trimmedRole ? ` · ${trimmedRole}` : ''}`,
            text: `${trimmedName} (${trimmedEmail})${trimmedRole ? ` — ${trimmedRole}` : ''}${trimmedNeighborhood ? ` — ${trimmedNeighborhood}` : ''}${trimmedNote ? `\n\nNote: ${trimmedNote}` : ''}`,
            html: emailLayout(bodyHtml),
          }),
        });
      } catch (e) {
        console.error('Resend notify failed (non-fatal):', e);
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('bg-waitlist error:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
