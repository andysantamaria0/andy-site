import { createClient } from '../../../lib/supabase/server';
import { formatDateRange, tripDuration } from '../../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../../lib/utils/members';
import MemberAvatar from '../../../components/trips/MemberAvatar';
import StayTimeline from '../../../components/trips/StayTimeline';
import TripDatesEditor from '../../../components/trips/TripDatesEditor';
import FeaturedToggle from '../../../components/trips/FeaturedToggle';
import TripCodeEditor from '../../../components/trips/TripCodeEditor';
import HappeningNowInline from '../../../components/trips/HappeningNowInline';
import LegManager from '../../../components/trips/LegManager';
import { loadFeatures, isFeatureEnabled } from '../../../lib/features';
import InviteLinkButton from '../../../components/trips/InviteLinkButton';
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
  // Fetch trip legs with member assignments
  const { data: legs } = await supabase
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
    .order('leg_order', { ascending: true });

  const myMembership = (members || []).find((m) => m.user_id === user?.id);
  const isOwner = myMembership?.role === 'owner';
  const isMultiLeg = (legs || []).length > 1;

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
          <div className="v-overview-card-label">{isMultiLeg ? 'Route' : 'Destination'}</div>
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

      {isOwner && trip.trip_code && (
        <div style={{ marginBottom: 24 }}>
          <InviteLinkButton tripCode={trip.trip_code} />
        </div>
      )}

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

      {/* Leg Manager (owner only, multi-leg or button to add) */}
      {isOwner && (
        <LegManager tripId={tripId} legs={legs || []} members={members || []} />
      )}

      {/* Stay Timeline */}
      <StayTimeline trip={trip} members={members} legs={legs || []} />

      {/* Members */}
      <h2 className="v-section-title">Who&apos;s Going</h2>
      <div className="v-members-list">
        {(() => {
          const allMembers = members || [];
          const allLegs = legs || [];

          // Build a map of member_id -> list of leg destinations
          const memberLegMap = {};
          for (const leg of allLegs) {
            for (const tlm of (leg.trip_leg_members || [])) {
              if (!memberLegMap[tlm.member_id]) memberLegMap[tlm.member_id] = [];
              memberLegMap[tlm.member_id].push(leg.destination);
            }
          }

          function renderMemberRow(member) {
            const info = getMemberDisplayInfo(member);
            const memberLegs = memberLegMap[member.id] || [];
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
                  <div className="v-member-name">{info.name}</div>
                  <span className={`v-badge ${member.role === 'owner' ? 'v-badge-owner' : 'v-badge-member'}`}>
                    {member.role}
                  </span>
                  {isMultiLeg && memberLegs.length > 0 && (
                    <div className="v-leg-badges">
                      {memberLegs.map((dest, i) => (
                        <span key={i} className="v-leg-badge">{dest}</span>
                      ))}
                    </div>
                  )}
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
          }

          const hasAccommodations = allMembers.some((m) => m.staying_at);
          if (!hasAccommodations) {
            return allMembers.map(renderMemberRow);
          }
          const grouped = {};
          for (const member of allMembers) {
            const key = member.staying_at || '';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(member);
          }
          const keys = Object.keys(grouped).sort((a, b) => {
            if (!a) return 1;
            if (!b) return -1;
            return a.localeCompare(b);
          });
          return keys.map((key) => (
            <div key={key || '_none'} className="v-accommodation-group">
              <div className="v-accommodation-group-label">
                {key || 'Not specified'}
              </div>
              {grouped[key].map(renderMemberRow)}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
