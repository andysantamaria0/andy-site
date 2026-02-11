import { createClient } from '../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import TripNav from '../../../components/trips/TripNav';
import TripHeaderEditor from '../../../components/trips/TripHeaderEditor';
import HappeningNowProvider from '../../../components/trips/HappeningNowProvider';
import HappeningNowPill from '../../../components/trips/HappeningNowPill';
import { computeHappeningNow } from '../../../lib/utils/happeningNow';
import { loadFeatures, isFeatureEnabled } from '../../../lib/features';

export async function generateMetadata({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('name, destination')
    .eq('id', tripId)
    .single();

  const title = trip ? `${trip.name} — Vialoure` : 'Trip — Vialoure';
  const description = trip?.destination
    ? `${trip.name} · ${trip.destination} — planned with Vialoure`
    : 'A trip planned with Vialoure';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Vialoure',
      type: 'website',
    },
  };
}

export default async function TripLayout({ children, params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  // Fetch trip details
  const { data: trip, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error || !trip) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: membership }, { data: profile }, featureMap] = await Promise.all([
    supabase
      .from('trip_members')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user?.id)
      .single(),
    supabase
      .from('profiles')
      .select('role')
      .eq('email', user?.email)
      .single(),
    loadFeatures(),
  ]);

  const isOwner = membership?.role === 'owner';
  const userRole = profile?.role || 'user';

  // Determine which tab features are enabled for this user's role
  const tabFeatures = ['calendar', 'expenses', 'members', 'inbox', 'travel_log'];
  const enabledTabs = tabFeatures.filter((f) => isFeatureEnabled(featureMap, f, userRole));

  const showHappeningNow = isFeatureEnabled(featureMap, 'happening_now', userRole);

  // Get pending inbox count
  const { count: inboxCount } = await supabase
    .from('inbound_emails')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('status', 'pending');

  // Happening Now: fetch today's events, logistics, and members
  const today = new Date().toISOString().split('T')[0];
  const [{ data: hnEvents }, { data: hnLogistics }, { data: hnMembers }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, category, event_date, start_time, end_time, location, event_attendees(member_id)')
      .eq('trip_id', tripId)
      .eq('event_date', today),
    supabase
      .from('logistics')
      .select('id, type, title, details, start_time, end_time, profiles:user_id(display_name, avatar_url)')
      .eq('trip_id', tripId)
      .gte('end_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`),
    supabase
      .from('trip_members')
      .select('id, stay_start, stay_end, color, display_name, email, profiles:user_id(display_name, avatar_url)')
      .eq('trip_id', tripId),
  ]);

  const happeningNowItems = computeHappeningNow({
    events: hnEvents || [],
    logistics: hnLogistics || [],
    members: hnMembers || [],
    trip,
    now: new Date(),
  });

  return (
    <>
      {trip.cover_image_url && (
        <div
          className="v-trip-cover"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%), url(${trip.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="v-trip-cover-content">
            <div className="v-trip-cover-destination">{trip.destination}</div>
            <div className="v-trip-cover-name">{trip.name}</div>
          </div>
        </div>
      )}
      <div className="v-trip-header">
        {isOwner ? (
          <TripHeaderEditor trip={trip} />
        ) : (
          <>
            <div className="v-trip-header-top">
              <h1 className="v-trip-name">{trip.name}</h1>
              <a href="/trips" className="v-back">&larr; All Trips</a>
            </div>
            <div className="v-trip-destination">{trip.destination}</div>
          </>
        )}
        <TripNav tripId={tripId} inboxCount={inboxCount || 0} enabledTabs={enabledTabs} />
      </div>
      <HappeningNowProvider items={happeningNowItems} tripId={tripId}>
        {children}
        {showHappeningNow && <HappeningNowPill />}
      </HappeningNowProvider>
    </>
  );
}
