import { createClient } from '../../../../lib/supabase/server';
import MemberAvatar from '../../../../components/trips/MemberAvatar';
import StayDatesEditor from '../../../../components/trips/StayDatesEditor';
import AdminMemberDates from '../../../../components/trips/AdminMemberDates';
import SmartPaste from '../../../../components/trips/SmartPaste';
import { formatDateRange } from '../../../../lib/utils/dates';

export default async function MembersPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from('trips')
    .select('start_date, end_date')
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

  const myMembership = (members || []).find((m) => m.user_id === user.id);
  const isOwner = myMembership?.role === 'owner';

  return (
    <div className="v-page">
      {/* Smart Paste — owner only */}
      {isOwner && <SmartPaste tripId={tripId} />}

      {/* Current user's stay dates editor (non-owner view) */}
      {myMembership && !isOwner && (
        <StayDatesEditor
          membership={myMembership}
          tripStart={trip?.start_date}
          tripEnd={trip?.end_date}
        />
      )}

      <h2 className="v-section-title">
        {isOwner ? 'Manage Members' : 'Members'}
      </h2>

      {isOwner ? (
        // Admin view — inline date editing for all members
        <div className="v-members-list">
          {(members || []).map((member) => (
            <AdminMemberDates
              key={member.id}
              member={member}
              tripStart={trip?.start_date}
              tripEnd={trip?.end_date}
            />
          ))}
        </div>
      ) : (
        // Regular member view — read-only list
        <div className="v-members-list">
          {(members || []).map((member) => {
            const profile = member.profiles;
            const isMe = member.user_id === user.id;
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
                    {isMe && <span style={{ color: 'var(--v-ivory-dim)', fontWeight: 400 }}> (you)</span>}
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
      )}
    </div>
  );
}
