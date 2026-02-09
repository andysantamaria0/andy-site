import { createClient } from '../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import TripNav from '../../../components/trips/TripNav';
import TripHeaderEditor from '../../../components/trips/TripHeaderEditor';

export async function generateMetadata({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: trip } = await supabase
    .from('trips')
    .select('name')
    .eq('id', tripId)
    .single();

  return {
    title: trip ? `${trip.name} — Vialoure` : 'Trip — Vialoure',
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
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user?.id)
    .single();
  const isOwner = membership?.role === 'owner';

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
        <TripNav tripId={tripId} />
      </div>
      {children}
    </>
  );
}
