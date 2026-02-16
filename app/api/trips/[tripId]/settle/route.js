import { createClient } from '../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a trip owner
  const { data: ownership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!ownership || ownership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can settle up' }, { status: 403 });
  }

  const { split_type, shares } = await request.json();

  if (!split_type || !shares || !Array.isArray(shares)) {
    return NextResponse.json({ error: 'split_type and shares are required' }, { status: 400 });
  }

  // Create settlement record
  const { data: settlement, error: settleError } = await supabase
    .from('settlements')
    .insert({
      trip_id: tripId,
      split_type,
      settled_by: user.id,
    })
    .select('id')
    .single();

  if (settleError) {
    return NextResponse.json({ error: settleError.message }, { status: 500 });
  }

  // Create settlement shares
  const shareRows = shares.map(s => ({
    settlement_id: settlement.id,
    member_id: s.member_id,
    amount_owed: s.amount_owed,
    paid: false,
  }));

  const { error: sharesError } = await supabase
    .from('settlement_shares')
    .insert(shareRows);

  if (sharesError) {
    return NextResponse.json({ error: sharesError.message }, { status: 500 });
  }

  return NextResponse.json({ settlement_id: settlement.id });
}

export async function PATCH(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a member of this trip
  const { data: membership } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Not a trip member' }, { status: 403 });
  }

  const { share_id, paid } = await request.json();

  if (!share_id || typeof paid !== 'boolean') {
    return NextResponse.json({ error: 'share_id and paid are required' }, { status: 400 });
  }

  const updateData = { paid };
  if (paid) {
    updateData.paid_at = new Date().toISOString();
  } else {
    updateData.paid_at = null;
  }

  const { error } = await supabase
    .from('settlement_shares')
    .update(updateData)
    .eq('id', share_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
