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
  // Get all legs this member is assigned to, including per-member overrides
  const { data: assignments } = await supabase
    .from('trip_leg_members')
    .select('leg_id, stay_start, stay_end, trip_legs!inner(start_date, end_date, trip_id)')
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

  // Use per-member override dates when set, otherwise fall back to leg dates
  const dates = tripAssignments
    .map((a) => ({
      start: a.stay_start || a.trip_legs.start_date,
      end: a.stay_end || a.trip_legs.end_date,
    }))
    .filter((d) => d.start && d.end);

  if (dates.length === 0) return;

  const stayStart = dates.reduce(
    (min, d) => (d.start < min ? d.start : min),
    dates[0].start
  );
  const stayEnd = dates.reduce(
    (max, d) => (d.end > max ? d.end : max),
    dates[0].end
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

  const { member_id, staying_at, stay_start, stay_end } = await request.json();

  const { data, error } = await supabase
    .from('trip_leg_members')
    .insert({
      leg_id: legId,
      member_id,
      staying_at: staying_at || null,
      stay_start: stay_start || null,
      stay_end: stay_end || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeMemberDates(supabase, tripId, member_id);

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request, { params }) {
  const { tripId, legId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { member_id, stay_start, stay_end } = await request.json();

  // Validate dates are within leg bounds if provided
  if (stay_start || stay_end) {
    const { data: leg } = await supabase
      .from('trip_legs')
      .select('start_date, end_date')
      .eq('id', legId)
      .single();

    if (leg) {
      if (stay_start && leg.start_date && stay_start < leg.start_date) {
        return NextResponse.json({ error: 'stay_start is before leg start' }, { status: 400 });
      }
      if (stay_end && leg.end_date && stay_end > leg.end_date) {
        return NextResponse.json({ error: 'stay_end is after leg end' }, { status: 400 });
      }
    }
  }

  const { data, error } = await supabase
    .from('trip_leg_members')
    .update({
      stay_start: stay_start || null,
      stay_end: stay_end || null,
    })
    .eq('leg_id', legId)
    .eq('member_id', member_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeMemberDates(supabase, tripId, member_id);

  return NextResponse.json(data);
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
