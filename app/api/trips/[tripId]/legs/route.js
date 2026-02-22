import { createClient } from '../../../../../lib/supabase/server';
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

async function recomputeDestination(supabase, tripId) {
  const { data: legs } = await supabase
    .from('trip_legs')
    .select('destination')
    .eq('trip_id', tripId)
    .order('leg_order', { ascending: true });

  if (!legs || legs.length === 0) return;

  const summary = legs.map((l) => l.destination).join(' → ');
  await supabase
    .from('trips')
    .update({ destination: summary })
    .eq('id', tripId);
}

export async function GET(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: legs, error } = await supabase
    .from('trip_legs')
    .select(`
      *,
      trip_leg_members (
        id,
        member_id,
        staying_at
      )
    `)
    .eq('trip_id', tripId)
    .order('leg_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(legs || []);
}

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { destination, start_date, end_date, accommodation_notes } = await request.json();

  // Get current max leg_order
  const { data: existing } = await supabase
    .from('trip_legs')
    .select('leg_order')
    .eq('trip_id', tripId)
    .order('leg_order', { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.leg_order || 0) + 1;

  const { data: leg, error } = await supabase
    .from('trip_legs')
    .insert({
      trip_id: tripId,
      destination: destination || 'New Destination',
      start_date: start_date || null,
      end_date: end_date || null,
      leg_order: nextOrder,
      accommodation_notes: accommodation_notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-assign all current members to the new leg
  const { data: members } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId);

  if (members && members.length > 0) {
    await supabase
      .from('trip_leg_members')
      .insert(members.map((m) => ({ leg_id: leg.id, member_id: m.id })));
  }

  await recomputeDestination(supabase, tripId);

  return NextResponse.json(leg, { status: 201 });
}

export async function PUT(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, destination, start_date, end_date, leg_order, accommodation_notes } = await request.json();
  if (!id) return NextResponse.json({ error: 'Missing leg id' }, { status: 400 });

  const updates = {};
  if (destination !== undefined) updates.destination = destination;
  if (start_date !== undefined) updates.start_date = start_date || null;
  if (end_date !== undefined) updates.end_date = end_date || null;
  if (leg_order !== undefined) updates.leg_order = leg_order;
  if (accommodation_notes !== undefined) updates.accommodation_notes = accommodation_notes || null;

  const { data: leg, error } = await supabase
    .from('trip_legs')
    .update(updates)
    .eq('id', id)
    .eq('trip_id', tripId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeDestination(supabase, tripId);

  return NextResponse.json(leg);
}

export async function DELETE(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await verifyOwner(supabase, tripId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await request.json();

  // Ensure at least 1 leg remains
  const { count } = await supabase
    .from('trip_legs')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last leg' }, { status: 400 });
  }

  const { error } = await supabase
    .from('trip_legs')
    .delete()
    .eq('id', id)
    .eq('trip_id', tripId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeDestination(supabase, tripId);

  return NextResponse.json({ ok: true });
}
