import { createClient } from '../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { notifyOwner } from '../../../lib/utils/notifyOwner';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId } = await request.json();
  if (!tripId) {
    return Response.json({ error: 'Missing tripId' }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: trip } = await service
    .from('trips')
    .select('name')
    .eq('id', tripId)
    .single();

  const tripName = trip?.name || 'a trip';
  notifyOwner(`Vialoure: ${user.email} just claimed their spot on ${tripName}`);

  return Response.json({ ok: true });
}
