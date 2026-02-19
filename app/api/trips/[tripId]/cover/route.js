import { createClient } from '@supabase/supabase-js';
import { createClient as createAuthClient } from '../../../../../lib/supabase/server';
import { NextResponse } from 'next/server';

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request, { params }) {
  const { tripId } = await params;

  // Verify the user is authenticated and is the trip owner
  const authSupabase = await createAuthClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await authSupabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || !ACCEPT_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type] || 'jpg';
  const storagePath = `${tripId}/cover.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Use service role client to bypass RLS
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error: uploadErr } = await service.storage
    .from('trip-photos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = service.storage
    .from('trip-photos')
    .getPublicUrl(storagePath);

  const { error: updateErr } = await service
    .from('trips')
    .update({ cover_image_url: urlData.publicUrl })
    .eq('id', tripId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.publicUrl });
}

export async function DELETE(request, { params }) {
  const { tripId } = await params;

  const authSupabase = await createAuthClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await authSupabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get current cover URL to find storage path
  const { data: trip } = await service
    .from('trips')
    .select('cover_image_url')
    .eq('id', tripId)
    .single();

  if (trip?.cover_image_url) {
    const oldPath = trip.cover_image_url.split('/trip-photos/')[1];
    if (oldPath) {
      await service.storage.from('trip-photos').remove([decodeURIComponent(oldPath)]);
    }
  }

  await service.from('trips').update({ cover_image_url: null }).eq('id', tripId);

  return NextResponse.json({ ok: true });
}
