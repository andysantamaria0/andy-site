import { createClient } from '../../../../lib/supabase/server';
import MemberAvatar from '../../../../components/trips/MemberAvatar';
import { formatDateRange } from '../../../../lib/utils/dates';

export default async function MembersPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

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

  return (
    <div className="v-page">
      <div className="v-page-header">
        <h2 className="v-section-title">Members</h2>
      </div>
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
