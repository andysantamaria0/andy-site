import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import TripCard from '../../components/trips/TripCard';

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get all trips where the current user is a member
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id, role')
    .eq('user_id', user.id);

  const tripIds = (memberships || []).map((m) => m.trip_id);

  let trips = [];
  let memberCounts = {};

  if (tripIds.length > 0) {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .in('id', tripIds)
      .order('start_date', { ascending: true });
    trips = data || [];

    // Get member counts for each trip
    const { data: allMembers } = await supabase
      .from('trip_members')
      .select('trip_id')
      .in('trip_id', tripIds);

    for (const m of allMembers || []) {
      memberCounts[m.trip_id] = (memberCounts[m.trip_id] || 0) + 1;
    }
  }

  return (
    <div className="v-page">
      <div className="v-page-header">
        <h1 className="v-page-title">Your Trips</h1>
        <Link href="/trips/new" className="v-btn v-btn-primary">
          + Create Trip
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="v-empty">
          <div className="v-empty-icon">&#9992;</div>
          <div className="v-empty-title">No trips yet</div>
          <div className="v-empty-text">Create your first trip to start planning with friends.</div>
          <Link href="/trips/new" className="v-btn v-btn-primary">
            + Create Trip
          </Link>
        </div>
      ) : (
        <div className="v-trip-grid">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              memberCount={memberCounts[trip.id] || 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
