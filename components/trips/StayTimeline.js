import React from 'react';
import { differenceInDays, parseISO, format, min as dateMin, max as dateMax } from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';

const MEMBER_COLORS = ['#4A35D7', '#FF7D73', '#DFB288', '#2D8659', '#4285F4', '#E040FB', '#FF6D00', '#00BFA5'];

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

  // Compute leg band flex weights (proportional to duration)
  const legBands = isMultiLeg ? legs.filter((l) => l.start_date && l.end_date).map((leg) => {
    const legStart = parseISO(leg.start_date);
    const legEnd = parseISO(leg.end_date);
    const days = Math.max(1, differenceInDays(legEnd, legStart)); // min 1 day for 0-day legs
    const leftPct = Math.max(0, (differenceInDays(legStart, rangeStart) / totalDays) * 100);
    return { ...leg, days, leftPct };
  }) : [];

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Who&apos;s There When</h2>
      <div className="v-timeline">
        {/* Leg destination bands (multi-leg only) */}
        {isMultiLeg && legBands.length > 0 && (
          <div className="v-timeline-legs-row">
            <div className="v-timeline-legs-spacer" />
            <div className="v-timeline-legs">
              {legBands.map((band, i) => {
                // Compute gap before this band (for legs that don't start right after previous)
                const prevEnd = i > 0 ? legBands[i - 1].days + differenceInDays(parseISO(legBands[i - 1].start_date), rangeStart) : 0;
                const thisStart = differenceInDays(parseISO(band.start_date), rangeStart);
                const gapDays = Math.max(0, thisStart - prevEnd);
                return (
                  <React.Fragment key={band.id}>
                    {gapDays > 0 && <div style={{ flex: gapDays }} />}
                    <div
                      className="v-timeline-leg-band"
                      style={{ flex: band.days }}
                      title={band.destination}
                    >
                      {band.destination}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="v-timeline-legs-spacer-end" />
          </div>
        )}

        {/* Date labels */}
        <div className="v-timeline-dates">
          <span>{format(rangeStart, 'MMM d')}</span>
          <span>{format(rangeEnd, 'MMM d')}</span>
        </div>

        {/* Track for full trip */}
        <div className="v-timeline-track" style={isMultiLeg ? { position: 'relative' } : undefined}>
          {/* Leg boundary dividers */}
          {isMultiLeg && legBands.slice(1).map((band) => (
            <div
              key={`divider-${band.id}`}
              className="v-timeline-leg-divider"
              style={{ left: `${band.leftPct}%` }}
            />
          ))}

          {membersWithDates.map((member, i) => {
            const info = getMemberDisplayInfo(member);
            const memberStart = parseISO(member.stay_start);
            const memberEnd = parseISO(member.stay_end);

            const leftPct = Math.max(0, (differenceInDays(memberStart, rangeStart) / totalDays) * 100);
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
