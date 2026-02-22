import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import StayTimeline from '../../../../components/trips/StayTimeline';
import CalendarViewToggle from '../../../../components/trips/CalendarViewToggle';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';

export default async function CalendarPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [featureMap, { data: userProfile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user?.email).single(),
  ]);
  const userRole = userProfile?.role || 'user';

  if (!isFeatureEnabled(featureMap, 'calendar', userRole)) {
    redirect(`/trips/${tripId}`);
  }

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  const [{ data: members }, { data: events }, { data: logistics }, { data: legs }] = await Promise.all([
    supabase
      .from('trip_members')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('events')
      .select(`
        *,
        event_attendees (
          id,
          member_id
        ),
        event_cost_splits (
          id,
          member_id,
          amount,
          percentage
        ),
        event_invites (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('trip_id', tripId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false }),
    supabase
      .from('logistics')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          email
        ),
        logistics_travelers (
          id,
          member_id
        )
      `)
      .eq('trip_id', tripId)
      .order('start_time', { ascending: true, nullsFirst: false }),
    supabase
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
      .order('leg_order', { ascending: true }),
  ]);

  const membership = (members || []).find((m) => m.user_id === user?.id);
  const isOwner = membership?.role === 'owner';

  return (
    <div className="v-page">
      <StayTimeline trip={trip} members={members} legs={legs || []} />
      <CalendarViewToggle
        trip={trip}
        members={members || []}
        events={events || []}
        logistics={logistics || []}
        legs={legs || []}
        isOwner={isOwner}
        tripId={tripId}
      />
    </div>
  );
}
