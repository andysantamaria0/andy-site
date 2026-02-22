import { createClient } from '../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { welcomeEmailHtml } from '../../../../lib/email/templates';
import { NextResponse } from 'next/server';

export async function PATCH(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status } = await request.json();

  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: row, error: fetchError } = await service
    .from('access_requests')
    .select('name, email')
    .eq('id', id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const { error } = await service
    .from('access_requests')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === 'approved') {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Vialoure <concierge@andysantamaria.com>',
          to: [row.email],
          subject: "You're in — welcome to Vialoure",
          text: `${row.name}, your access to Vialoure has been approved. Sign in at https://andysantamaria.com/trips/login`,
          html: welcomeEmailHtml(row.name),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend error:', err);
      }
    } catch (e) {
      console.error('Failed to send welcome email:', e);
    }
  }

  return NextResponse.json({ ok: true });
}
