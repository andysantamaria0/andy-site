import { createClient } from '../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify membership
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  const legId = url.searchParams.get('leg_id');

  let query = supabase
    .from('suggestions')
    .select('*, created_by_profile:created_by(display_name), approved_by_profile:approved_by(display_name), leg:leg_id(destination)')
    .eq('trip_id', tripId);

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (legId) {
    query = query.eq('leg_id', legId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify membership
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const {
    leg_id, suggestion_type, title, subtitle,
    group_key, group_label,
    price_amount, price_currency, price_note,
    payload, source, source_email_id,
    notes, url,
  } = body;

  if (!suggestion_type || !title) {
    return NextResponse.json({ error: 'suggestion_type and title are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('suggestions')
    .insert({
      trip_id: tripId,
      leg_id: leg_id || null,
      suggestion_type,
      title,
      subtitle: subtitle || null,
      group_key: group_key || null,
      group_label: group_label || null,
      price_amount: price_amount || null,
      price_currency: price_currency || null,
      price_note: price_note || null,
      payload: payload || {},
      source: source || 'manual',
      source_email_id: source_email_id || null,
      notes: notes || null,
      url: url || null,
      created_by: user.id,
    })
    .select('*, leg:leg_id(destination)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
