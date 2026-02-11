import { createClient } from '../../../lib/supabase/server';
import { formatDateRange, tripDuration } from '../../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../../lib/utils/members';
import MemberAvatar from '../../../components/trips/MemberAvatar';
import StayTimeline from '../../../components/trips/StayTimeline';
import TripDatesEditor from '../../../components/trips/TripDatesEditor';
import FeaturedToggle from '../../../components/trips/FeaturedToggle';
import TripCodeEditor from '../../../components/trips/TripCodeEditor';
import HappeningNowInline from '../../../components/trips/HappeningNowInline';
import { loadFeatures, isFeatureEnabled } from '../../../lib/features';
import NotchReveal from '../../../components/NotchReveal';

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

  const { data: { user } } = await supabase.auth.getUser();
  const myMembership = (members || []).find((m) => m.user_id === user?.id);
  const isOwner = myMembership?.role === 'owner';

  const [featureMap, { data: profile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user?.email).single(),
  ]);
  const userRole = profile?.role || 'user';
  const showFeatured = isFeatureEnabled(featureMap, 'featured_trip', userRole);
  const showHappeningNow = isFeatureEnabled(featureMap, 'happening_now', userRole);

  const duration = trip.start_date && trip.end_date
    ? tripDuration(trip.start_date, trip.end_date)
    : null;

  return (
    <div className="v-page">
      {isOwner && showFeatured && (
        <div style={{ marginBottom: 24 }}>
          <FeaturedToggle tripId={trip.id} featured={!!trip.featured} />
        </div>
      )}

      {/* Summary Cards */}
      <div className="v-overview-grid">
        {isOwner ? (
          <TripDatesEditor trip={trip} />
        ) : trip.start_date && trip.end_date ? (
          <div className="v-overview-card">
            <div className="v-overview-card-label">Dates</div>
            <div className="v-overview-card-value" style={{ fontSize: '1.125rem' }}>
              {formatDateRange(trip.start_date, trip.end_date)}
            </div>
            {duration !== null && (
              <div className="v-overview-card-sub">{duration} nights</div>
            )}
          </div>
        ) : null}

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

        <div className="v-overview-card">
          <div className="v-overview-card-label">Trip Code</div>
          {isOwner ? (
            <TripCodeEditor
              tripId={trip.id}
              initialCode={trip.trip_code || ''}
              initialKeywords={trip.trip_keywords || []}
            />
          ) : (
            <>
              <div className="v-trip-code">{trip.trip_code || '—'}</div>
              <div className="v-overview-card-sub">Use this code when messaging the concierge</div>
            </>
          )}
        </div>
      </div>

      <NotchReveal compact />

      {/* Description */}
      {trip.description && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="v-section-title">About</h2>
          <p style={{ color: 'var(--v-pearl-dim)', lineHeight: 1.6, fontFamily: "'Crimson Pro', serif", fontSize: '1rem' }}>{trip.description}</p>
        </div>
      )}

      {/* Happening Now */}
      {showHappeningNow && <HappeningNowInline />}

      {/* Stay Timeline */}
      <StayTimeline trip={trip} members={members} />

      {/* Members */}
      <h2 className="v-section-title">Who&apos;s Going</h2>
      <div className="v-members-list">
        {(members || []).map((member) => {
          const info = getMemberDisplayInfo(member);
          return (
            <div key={member.id} className="v-member-row">
              <MemberAvatar
                member={{
                  display_name: info.name,
                  avatar_url: info.avatarUrl,
                  email: info.email,
                  color: info.color,
                }}
              />
              <div className="v-member-info">
                <div className="v-member-name">
                  {info.name}
                </div>
                <span className={`v-badge ${member.role === 'owner' ? 'v-badge-owner' : 'v-badge-member'}`}>
                  {member.role}
                </span>
              </div>
              {member.stay_start && member.stay_end ? (
                <div className="v-member-dates">
                  {formatDateRange(member.stay_start, member.stay_end)}
                </div>
              ) : (
                <div className="v-member-dates" style={{ fontStyle: 'italic', opacity: 0.5 }}>
                  Dates not set
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
