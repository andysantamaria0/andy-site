import { createClient } from '../../../lib/supabase/server';
import { formatDateRange, tripDuration } from '../../../lib/utils/dates';
import MemberAvatar from '../../../components/trips/MemberAvatar';

export default async function TripOverviewPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  // Get members with their profile info
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

  const duration = trip.start_date && trip.end_date
    ? tripDuration(trip.start_date, trip.end_date)
    : null;

  return (
    <div className="v-page">
      {/* Summary Cards */}
      <div className="v-overview-grid">
        {trip.start_date && trip.end_date && (
          <div className="v-overview-card">
            <div className="v-overview-card-label">Dates</div>
            <div className="v-overview-card-value" style={{ fontSize: '1.125rem' }}>
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
            {duration !== null && (
              <div className="v-overview-card-sub">{duration} nights</div>
            )}
          </div>
        )}

        <div className="v-overview-card">
          <div className="v-overview-card-label">Travelers</div>
          <div className="v-overview-card-value">{(members || []).length}</div>
          <div className="v-overview-card-sub">
            {(members || []).length === 1 ? 'person' : 'people'} going
          </div>
        </div>

        <div className="v-overview-card">
          <div className="v-overview-card-label">Destination</div>
          <div className="v-overview-card-value" style={{ fontSize: '1.125rem' }}>
            {trip.destination}
          </div>
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="v-section-title">About</h2>
          <p style={{ color: 'var(--v-ivory-dim)', lineHeight: 1.6 }}>{trip.description}</p>
        </div>
      )}

      {/* Members */}
      <h2 className="v-section-title">Who&apos;s Going</h2>
      <div className="v-members-list">
        {(members || []).map((member) => {
          const profile = member.profiles;
          return (
            <div key={member.id} className="v-member-row">
              <MemberAvatar
                member={{
                  display_name: profile?.display_name,
                  avatar_url: profile?.avatar_url,
                  email: profile?.email,
                  color: member.color,
                }}
              />
              <div className="v-member-info">
                <div className="v-member-name">
                  {profile?.display_name || profile?.email || 'Unknown'}
                </div>
                <span className={`v-badge ${member.role === 'owner' ? 'v-badge-owner' : 'v-badge-member'}`}>
                  {member.role}
                </span>
              </div>
              {member.stay_start && member.stay_end && (
                <div className="v-member-dates">
                  {formatDateRange(member.stay_start, member.stay_end)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
