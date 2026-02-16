import { createClient } from '@supabase/supabase-js';
import { emailLayout } from '../../../lib/email/template';
import { createRateLimit } from '../../../lib/utils/rateLimit';

const limit = createRateLimit({ windowMs: 60_000, max: 5 });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
    const { name, email } = await request.json();

    if (!name || !email || typeof name !== 'string' || typeof email !== 'string') {
      return Response.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const trimmedName = name.trim().slice(0, 200);
    const trimmedEmail = email.trim().slice(0, 254).toLowerCase();

    if (!trimmedName || !EMAIL_RE.test(trimmedEmail)) {
      return Response.json({ error: 'Invalid name or email' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error: dbError } = await supabase
      .from('access_requests')
      .insert({ name: trimmedName, email: trimmedEmail });

    if (dbError) {
      console.error('Failed to insert access request:', dbError);
      return Response.json({ error: 'Failed to save request' }, { status: 500 });
    }

    const bodyHtml = `
      <h2 style="margin:0 0 16px;font-size:20px;color:#0A1628;">New Access Request</h2>
      <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
      <p style="margin:0 0 8px;font-size:16px;color:#333;"><strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vialoure <concierge@andysantamaria.com>',
        to: ['andyjsantamaria@gmail.com'],
        subject: `Access Request: ${trimmedName}`,
        text: `New access request from ${trimmedName} (${trimmedEmail})`,
        html: emailLayout(bodyHtml),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('Request access error:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
