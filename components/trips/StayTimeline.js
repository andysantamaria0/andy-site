import React from 'react';
import { differenceInDays, parseISO, format, min as dateMin, max as dateMax } from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';

const MEMBER_COLORS = ['#4A35D7', '#FF7D73', '#DFB288', '#2D8659', '#4285F4', '#E040FB', '#FF6D00', '#00BFA5'];
const LEG_COLORS = [
  'rgba(74, 53, 215, 0.6)',
  'rgba(196, 167, 125, 0.6)',
  'rgba(45, 134, 89, 0.6)',
  'rgba(224, 64, 251, 0.6)',
  'rgba(66, 133, 244, 0.6)',
  'rgba(255, 109, 0, 0.6)',
];

export default function StayTimeline({ trip, members, legs = [] }) {
  if (!trip.start_date || !trip.end_date) return null;

  let tripStart, tripEnd;
  try {
    tripStart = parseISO(trip.start_date);
    tripEnd = parseISO(trip.end_date);
  } catch {
    return null;
  }
  if (isNaN(tripStart) || isNaN(tripEnd)) return null;

  // Expand the timeline range to include all leg dates
  let rangeStart = tripStart;
  let rangeEnd = tripEnd;
  for (const leg of legs) {
    if (leg.start_date) {
      const s = parseISO(leg.start_date);
      if (!isNaN(s)) rangeStart = dateMin([rangeStart, s]);
    }
    if (leg.end_date) {
      const e = parseISO(leg.end_date);
      if (!isNaN(e)) rangeEnd = dateMax([rangeEnd, e]);
    }
  }

  const totalDays = differenceInDays(rangeEnd, rangeStart);

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
        <p className="v-hint">
          No one has set their stay dates yet. Go to Members to add yours.
        </p>
      </div>
    );
  }

  if (membersWithDates.length === 0) return null;

  const isMultiLeg = legs.length > 1;

  // Build leg data for multi-leg mode
  const legData = isMultiLeg ? legs.filter((l) => l.start_date && l.end_date).map((leg, i) => {
    const legStart = parseISO(leg.start_date);
    const legEnd = parseISO(leg.end_date);
    const leftPct = Math.max(0, (differenceInDays(legStart, rangeStart) / totalDays) * 100);
    const widthPct = Math.max(0.5, Math.min(100 - leftPct, (differenceInDays(legEnd, legStart) / totalDays) * 100));
    return { ...leg, legStart, legEnd, leftPct, widthPct, color: LEG_COLORS[i % LEG_COLORS.length] };
  }) : [];

  // Build assigned-legs lookup for multi-leg mode
  const assignedLegs = {};
  if (isMultiLeg) {
    for (const leg of legs) {
      for (const tlm of (leg.trip_leg_members || [])) {
        if (!assignedLegs[tlm.member_id]) assignedLegs[tlm.member_id] = new Set();
        assignedLegs[tlm.member_id].add(leg.id);
      }
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Who&apos;s There When</h2>
      <div className="v-timeline">
        {/* Leg color legend (multi-leg only) */}
        {isMultiLeg && legData.length > 0 && (
          <div className="v-timeline-legend">
            {legData.map((leg) => (
              <div key={leg.id} className="v-timeline-legend-item">
                <div className="v-timeline-legend-swatch" style={{ background: leg.color }} />
                <span>{leg.destination}</span>
              </div>
            ))}
          </div>
        )}

        {/* Date labels */}
        <div className="v-timeline-dates">
          <span>{format(rangeStart, 'MMM d')}</span>
          <span>{format(rangeEnd, 'MMM d')}</span>
        </div>

        {/* Track for full trip */}
        <div className="v-timeline-track" style={isMultiLeg ? { position: 'relative' } : undefined}>
          {membersWithDates.map((member, i) => {
            const info = getMemberDisplayInfo(member);
            const memberStart = parseISO(member.stay_start);
            const memberEnd = parseISO(member.stay_end);

            const leftPct = Math.max(0, (differenceInDays(memberStart, rangeStart) / totalDays) * 100);
            const widthPct = Math.min(100 - leftPct, (differenceInDays(memberEnd, memberStart) / totalDays) * 100);
            const baseColor = member.color || MEMBER_COLORS[i % MEMBER_COLORS.length];
            const memberLegIds = assignedLegs[member.id] || new Set();

            return (
              <div key={member.id} className="v-timeline-row">
                <div className="v-timeline-row-label">
                  {info.name}
                  {member.staying_at && (
                    <span className="v-staying-at-label">{member.staying_at}</span>
                  )}
                </div>
                <div className="v-timeline-row-track">
                  {isMultiLeg ? (
                    <>
                      {/* Dim base bar for full stay range */}
                      <div
                        className="v-timeline-bar"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: baseColor, opacity: 0.15 }}
                      />
                      {/* Colored segments for each assigned leg */}
                      {legData.map((leg) => {
                        if (!memberLegIds.has(leg.id)) return null;
                        const segStart = dateMax([memberStart, leg.legStart]);
                        const segEnd = dateMin([memberEnd, leg.legEnd]);
                        if (differenceInDays(segEnd, segStart) < 0) return null;
                        const segLeftPct = Math.max(0, (differenceInDays(segStart, rangeStart) / totalDays) * 100);
                        const segWidthPct = Math.max(0.5, Math.min(100 - segLeftPct, (differenceInDays(segEnd, segStart) / totalDays) * 100));
                        return (
                          <div
                            key={leg.id}
                            className="v-timeline-bar"
                            style={{ left: `${segLeftPct}%`, width: `${segWidthPct}%`, backgroundColor: leg.color }}
                          />
                        );
                      })}
                    </>
                  ) : (
                    <div
                      className="v-timeline-bar"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: baseColor }}
                    />
                  )}
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
