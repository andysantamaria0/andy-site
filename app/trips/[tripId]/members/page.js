import { createClient } from '../../../../lib/supabase/server';
import MemberAvatar from '../../../../components/trips/MemberAvatar';
import StayDatesEditor from '../../../../components/trips/StayDatesEditor';
import AdminMemberDates from '../../../../components/trips/AdminMemberDates';
import AddMemberForm from '../../../../components/trips/AddMemberForm';
import { formatDateRange } from '../../../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../../../lib/utils/members';

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

      {isOwner && (
        <AddMemberForm
          tripId={tripId}
          tripStart={trip?.start_date}
          tripEnd={trip?.end_date}
          existingMembers={members || []}
        />
      )}

      {isOwner ? (
        // Admin view — inline date editing, grouped by accommodation
        <div className="v-members-list">
          {(() => {
            const grouped = {};
            for (const member of (members || [])) {
              const key = member.staying_at || '';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(member);
            }
            const keys = Object.keys(grouped).sort((a, b) => {
              if (!a) return 1;
              if (!b) return -1;
              return a.localeCompare(b);
            });
            const hasAccommodations = keys.some((k) => k !== '');
            return keys.map((key) => (
              <div key={key || '_none'} className="v-accommodation-group">
                {hasAccommodations && (
                  <div className="v-accommodation-group-label">
                    {key || 'Not specified'}
                  </div>
                )}
                {grouped[key].map((member) => (
                  <AdminMemberDates
                    key={member.id}
                    member={member}
                    tripStart={trip?.start_date}
                    tripEnd={trip?.end_date}
                  />
                ))}
              </div>
            ));
          })()}
        </div>
      ) : (
        // Regular member view — read-only list, grouped by accommodation
        <div className="v-members-list">
          {(() => {
            const grouped = {};
            for (const member of (members || [])) {
              const key = member.staying_at || '';
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(member);
            }
            const keys = Object.keys(grouped).sort((a, b) => {
              if (!a) return 1;
              if (!b) return -1;
              return a.localeCompare(b);
            });
            const hasAccommodations = keys.some((k) => k !== '');
            return keys.map((key) => (
              <div key={key || '_none'} className="v-accommodation-group">
                {hasAccommodations && (
                  <div className="v-accommodation-group-label">
                    {key || 'Not specified'}
                  </div>
                )}
                {grouped[key].map((member) => {
                  const info = getMemberDisplayInfo(member);
                  const isMe = member.user_id === user.id;
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
                          {isMe && <span style={{ color: 'var(--v-pearl-dim)', fontWeight: 400 }}> (you)</span>}
                        </div>
                        <span className={`v-badge ${member.role === 'owner' ? 'v-badge-owner' : 'v-badge-member'}`}>
                          {member.role}
                        </span>
                      </div>
                      <div>
                        {member.stay_start && member.stay_end ? (
                          <div className="v-member-dates">
                            {formatDateRange(member.stay_start, member.stay_end)}
                          </div>
                        ) : (
                          <div className="v-member-dates" style={{ fontStyle: 'italic', opacity: 0.5 }}>
                            Dates not set
                          </div>
                        )}
                        {member.staying_at && (
                          <div className="v-staying-at-label">{member.staying_at}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
