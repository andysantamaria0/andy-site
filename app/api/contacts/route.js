import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('owner_id', user.id)
    .order('display_name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { display_name, email, phone } = await request.json();
  if (!display_name?.trim()) {
    return NextResponse.json({ error: 'display_name required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contacts')
    .upsert(
      {
        owner_id: user.id,
        display_name: display_name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
      },
      { onConflict: 'owner_id, lower(display_name)' }
    )
    .select()
    .single();

  // Supabase doesn't support functional indexes in onConflict — fall back to manual upsert
  if (error?.code === '42P10' || error?.message?.includes('could not')) {
    // Try find-then-update approach
    const { data: existing } = await supabase
      .from('contacts')
      .select('id')
      .eq('owner_id', user.id)
      .ilike('display_name', display_name.trim())
      .single();

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('contacts')
        .update({
          email: email?.trim() || null,
          phone: phone?.trim() || null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      return NextResponse.json(updated);
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('contacts')
        .insert({
          owner_id: user.id,
          display_name: display_name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
        })
        .select()
        .single();

      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      return NextResponse.json(inserted, { status: 201 });
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
