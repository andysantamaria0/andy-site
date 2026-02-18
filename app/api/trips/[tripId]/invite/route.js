import { createClient } from '../../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { inviteEmailHtml } from '../../../../../lib/email/templates';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify caller is a trip owner
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can send invites' }, { status: 403 });
  }

  const { email, name } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Get trip details
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: trip } = await service
    .from('trips')
    .select('name, destination, start_date, end_date, trip_code')
    .eq('id', tripId)
    .single();

  if (!trip || !trip.trip_code) {
    return NextResponse.json({ error: 'Trip not found or has no trip code' }, { status: 404 });
  }

  // Get inviter's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();
  const inviterName = profile?.display_name || user.email.split('@')[0];

  const joinUrl = `https://andysantamaria.com/trips/join/${trip.trip_code}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vialoure <concierge@andysantamaria.com>',
        to: [email],
        subject: `${inviterName} invited you to ${trip.name}`,
        html: inviteEmailHtml(trip.name, trip.destination, inviterName, joinUrl),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to send invite email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
