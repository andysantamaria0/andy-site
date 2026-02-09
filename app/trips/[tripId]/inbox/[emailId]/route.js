import { createClient } from '../../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { sendAcceptReply } from '../../../../../lib/utils/sendReply';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const { tripId, emailId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a trip owner
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can manage inbox' }, { status: 403 });
  }

  const { status } = await request.json();
  if (!['applied', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('inbound_emails')
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', emailId)
    .eq('trip_id', tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire reply on accept (non-blocking)
  if (status === 'applied') {
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch the email and trip name in parallel
    Promise.all([
      serviceSupabase.from('inbound_emails').select('*').eq('id', emailId).single(),
      serviceSupabase.from('trips').select('name').eq('id', tripId).single(),
    ]).then(([{ data: emailRecord }, { data: trip }]) => {
      if (emailRecord && trip) {
        sendAcceptReply(emailRecord, trip.name).catch((e) =>
          console.error('Reply send failed:', e)
        );
      }
    }).catch((e) => console.error('Failed to fetch for reply:', e));
  }

  return NextResponse.json({ ok: true });
}
