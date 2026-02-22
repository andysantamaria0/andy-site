import { createClient } from '../../../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

async function verifyOwner(supabase, tripId, userId) {
  const { data } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .single();
  return data?.role === 'owner';
}

async function recomputeMemberDates(supabase, tripId, memberId) {
  // Get all legs this member is assigned to
  const { data: assignments } = await supabase
    .from('trip_leg_members')
    .select('leg_id, trip_legs!inner(start_date, end_date, trip_id)')
    .eq('member_id', memberId);

  // Filter to legs belonging to this trip
  const tripAssignments = (assignments || []).filter(
    (a) => a.trip_legs?.trip_id === tripId
  );

  if (tripAssignments.length === 0) {
    // No legs assigned — clear dates
    await supabase
      .from('trip_members')
      .update({ stay_start: null, stay_end: null })
      .eq('id', memberId);
    return;
  }

  const dates = tripAssignments
    .map((a) => a.trip_legs)
    .filter((l) => l.start_date && l.end_date);

  if (dates.length === 0) return;

  const stayStart = dates.reduce(
    (min, l) => (l.start_date < min ? l.start_date : min),
    dates[0].start_date
  );
  const stayEnd = dates.reduce(
    (max, l) => (l.end_date > max ? l.end_date : max),
    dates[0].end_date
  );

  await supabase
    .from('trip_members')
    .update({ stay_start: stayStart, stay_end: stayEnd })
    .eq('id', memberId);
}

export async function POST(request, { params }) {
  const { tripId, legId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { member_id, staying_at } = await request.json();

  const { data, error } = await supabase
    .from('trip_leg_members')
    .insert({
      leg_id: legId,
      member_id,
      staying_at: staying_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeMemberDates(supabase, tripId, member_id);

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { tripId, legId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { member_id } = await request.json();

  const { error } = await supabase
    .from('trip_leg_members')
    .delete()
    .eq('leg_id', legId)
    .eq('member_id', member_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeMemberDates(supabase, tripId, member_id);

  return NextResponse.json({ ok: true });
}
