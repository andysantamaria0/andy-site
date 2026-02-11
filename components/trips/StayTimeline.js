import { differenceInDays, parseISO, format } from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';

const MEMBER_COLORS = ['#4A35D7', '#FF7D73', '#DFB288', '#2D8659', '#4285F4', '#E040FB', '#FF6D00', '#00BFA5'];

export default function StayTimeline({ trip, members }) {
  if (!trip.start_date || !trip.end_date) return null;

  let tripStart, tripEnd;
  try {
    tripStart = parseISO(trip.start_date);
    tripEnd = parseISO(trip.end_date);
  } catch {
    return null;
  }
  if (isNaN(tripStart) || isNaN(tripEnd)) return null;

  const totalDays = differenceInDays(tripEnd, tripStart);

  if (totalDays <= 0) return null;

  // Filter members who have valid stay dates
  const membersWithDates = (members || []).filter((m) => {
    if (!m.stay_start || !m.stay_end) return false;
    try {
      const s = parseISO(m.stay_start);
      const e = parseISO(m.stay_end);
      return !isNaN(s) && !isNaN(e);
    } catch {
      return false;
    }
  });

  if (membersWithDates.length === 0 && members?.length > 0) {
    return (
      <div style={{ marginBottom: 32 }}>
        <h2 className="v-section-title">Who&apos;s There When</h2>
        <p style={{ color: 'var(--v-pearl-dim)', fontSize: '0.875rem' }}>
          No one has set their stay dates yet. Go to Members to add yours.
        </p>
      </div>
    );
  }

  if (membersWithDates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Who&apos;s There When</h2>
      <div className="v-timeline">
        {/* Date labels */}
        <div className="v-timeline-dates">
          <span>{format(tripStart, 'MMM d')}</span>
          <span>{format(tripEnd, 'MMM d')}</span>
        </div>

        {/* Track for full trip */}
        <div className="v-timeline-track">
          {membersWithDates.map((member, i) => {
            const info = getMemberDisplayInfo(member);
            const memberStart = parseISO(member.stay_start);
            const memberEnd = parseISO(member.stay_end);

            const leftPct = Math.max(0, (differenceInDays(memberStart, tripStart) / totalDays) * 100);
            const widthPct = Math.min(100 - leftPct, (differenceInDays(memberEnd, memberStart) / totalDays) * 100);
            const color = member.color || MEMBER_COLORS[i % MEMBER_COLORS.length];

            return (
              <div key={member.id} className="v-timeline-row">
                <div className="v-timeline-row-label">
                  {info.name}
                  {member.staying_at && (
                    <span className="v-staying-at-label">{member.staying_at}</span>
                  )}
                </div>
                <div className="v-timeline-row-track">
                  <div
                    className="v-timeline-bar"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="v-timeline-row-dates">
                  {format(memberStart, 'MMM d')} – {format(memberEnd, 'MMM d')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
