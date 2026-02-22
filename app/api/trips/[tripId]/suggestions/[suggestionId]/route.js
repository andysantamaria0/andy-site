import { createClient } from '../../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const { tripId, suggestionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = [
    'leg_id', 'title', 'subtitle', 'suggestion_type',
    'group_key', 'group_label',
    'price_amount', 'price_currency', 'price_note',
    'payload', 'notes', 'url', 'status',
  ];

  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('suggestions')
    .update(updates)
    .eq('id', suggestionId)
    .eq('trip_id', tripId)
    .select('*, leg:leg_id(destination)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const { tripId, suggestionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('suggestions')
    .delete()
    .eq('id', suggestionId)
    .eq('trip_id', tripId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
