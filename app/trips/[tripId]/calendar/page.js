import { createClient } from '../../../../lib/supabase/server';
import StayTimeline from '../../../../components/trips/StayTimeline';
import CalendarDayList from '../../../../components/trips/CalendarDayList';

export default async function CalendarPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  const { data: members } = await supabase
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
    .order('joined_at', { ascending: true });

  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      event_attendees (
        id,
        member_id
      )
    `)
    .eq('trip_id', tripId)
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false });

  const membership = (members || []).find((m) => m.user_id === user?.id);
  const isOwner = membership?.role === 'owner';

  return (
    <div className="v-page">
      <StayTimeline trip={trip} members={members} />
      <CalendarDayList
        trip={trip}
        members={members || []}
        events={events || []}
        isOwner={isOwner}
      />
    </div>
  );
}
