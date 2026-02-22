import React from 'react';
import { differenceInDays, parseISO, format, min as dateMin, max as dateMax } from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';

const MEMBER_COLORS = ['#4A35D7', '#FF7D73', '#DFB288', '#2D8659', '#4285F4', '#E040FB', '#FF6D00', '#00BFA5'];
const LEG_COLORS = [
  'rgba(74, 53, 215, 0.5)',   // royal
  'rgba(196, 167, 125, 0.5)', // champagne
  'rgba(45, 134, 89, 0.5)',   // green
  'rgba(224, 64, 251, 0.5)',  // pink
  'rgba(66, 133, 244, 0.5)',  // blue
  'rgba(255, 109, 0, 0.5)',   // orange
];

function useTimelineData(trip, members, legs) {
  let tripStart, tripEnd;
  try {
    tripStart = parseISO(trip.start_date);
    tripEnd = parseISO(trip.end_date);
  } catch {
    return null;
  }
  if (isNaN(tripStart) || isNaN(tripEnd)) return null;

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

  const assignedLegs = {};
  for (const leg of legs) {
    for (const tlm of (leg.trip_leg_members || [])) {
      if (!assignedLegs[tlm.member_id]) assignedLegs[tlm.member_id] = new Set();
      assignedLegs[tlm.member_id].add(leg.id);
    }
  }

  const legData = legs.filter((l) => l.start_date && l.end_date).map((leg, i) => {
    const legStart = parseISO(leg.start_date);
    const legEnd = parseISO(leg.end_date);
    const leftPct = Math.max(0, (differenceInDays(legStart, rangeStart) / totalDays) * 100);
    const widthPct = Math.max(1, Math.min(100 - leftPct, (differenceInDays(legEnd, legStart) / totalDays) * 100));
    return { ...leg, legStart, legEnd, leftPct, widthPct, color: LEG_COLORS[i % LEG_COLORS.length] };
  });

  return { rangeStart, rangeEnd, totalDays, membersWithDates, legData, assignedLegs };
}

/* ============================================================
   Option A — Axis marker labels with divider lines
   ============================================================ */
function OptionA({ trip, members, legs }) {
  const data = useTimelineData(trip, members, legs);
  if (!data) return null;
  const { rangeStart, rangeEnd, totalDays, membersWithDates, legData } = data;
  if (membersWithDates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Option A: Axis Markers</h2>
      <div className="v-timeline" style={{ paddingBottom: 40, position: 'relative' }}>
        {/* Date labels */}
        <div className="v-timeline-dates">
          <span>{format(rangeStart, 'MMM d')}</span>
          <span>{format(rangeEnd, 'MMM d')}</span>
        </div>

        {/* Track area */}
        <div className="v-timeline-track" style={{ position: 'relative' }}>
          {/* Leg divider lines + labels */}
          {legData.map((leg, i) => (
            <React.Fragment key={leg.id}>
              {/* Start divider (only for first leg or when there's a gap) */}
              {i === 0 && (
                <div
                  style={{
                    position: 'absolute', top: 0, bottom: -32,
                    left: `${leg.leftPct}%`, width: 1,
                    background: 'rgba(196, 167, 125, 0.25)', zIndex: 1,
                  }}
                />
              )}
              {/* End divider */}
              <div
                style={{
                  position: 'absolute', top: 0, bottom: -32,
                  left: `${leg.leftPct + leg.widthPct}%`, width: 1,
                  background: 'rgba(196, 167, 125, 0.25)', zIndex: 1,
                }}
              />
              {/* Leg name label below the track */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -28,
                  left: `${leg.leftPct}%`,
                  width: `${leg.widthPct}%`,
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'var(--v-champagne)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  padding: '0 2px',
                }}
                title={leg.destination}
              >
                {leg.destination}
              </div>
            </React.Fragment>
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
                <div className="v-timeline-row-label">{info.name}</div>
                <div className="v-timeline-row-track">
                  <div className="v-timeline-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color }} />
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

/* ============================================================
   Option B — Color-coded bar segments per leg
   ============================================================ */
function OptionB({ trip, members, legs }) {
  const data = useTimelineData(trip, members, legs);
  if (!data) return null;
  const { rangeStart, rangeEnd, totalDays, membersWithDates, legData, assignedLegs } = data;
  if (membersWithDates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Option B: Segmented Bars</h2>
      <div className="v-timeline">
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginBottom: 12 }}>
          {legData.map((leg) => (
            <div key={leg.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: leg.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--v-pearl-dim)' }}>{leg.destination}</span>
            </div>
          ))}
        </div>

        {/* Date labels */}
        <div className="v-timeline-dates">
          <span>{format(rangeStart, 'MMM d')}</span>
          <span>{format(rangeEnd, 'MMM d')}</span>
        </div>

        {/* Track area */}
        <div className="v-timeline-track">
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
                <div className="v-timeline-row-label">{info.name}</div>
                <div className="v-timeline-row-track">
                  {/* Base bar (dim) for full stay */}
                  <div className="v-timeline-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: baseColor, opacity: 0.2 }} />
                  {/* Colored segments for each assigned leg */}
                  {legData.map((leg) => {
                    if (!memberLegIds.has(leg.id)) return null;
                    // Clip to member's stay range
                    const segStart = dateMax([memberStart, leg.legStart]);
                    const segEnd = dateMin([memberEnd, leg.legEnd]);
                    if (differenceInDays(segEnd, segStart) < 0) return null;
                    const segLeftPct = Math.max(0, (differenceInDays(segStart, rangeStart) / totalDays) * 100);
                    const segWidthPct = Math.max(0.5, Math.min(100 - segLeftPct, (differenceInDays(segEnd, segStart) / totalDays) * 100));
                    return (
                      <div
                        key={leg.id}
                        style={{
                          position: 'absolute', top: 2, bottom: 2, borderRadius: 2,
                          left: `${segLeftPct}%`, width: `${segWidthPct}%`,
                          backgroundColor: leg.color,
                        }}
                      />
                    );
                  })}
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

/* ============================================================
   Option C — Stacked per-leg mini-timelines
   ============================================================ */
function OptionC({ trip, members, legs }) {
  const data = useTimelineData(trip, members, legs);
  if (!data) return null;
  const { membersWithDates, legData, assignedLegs } = data;
  if (membersWithDates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Option C: Stacked by Leg</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {legData.map((leg) => {
          const legDays = Math.max(1, differenceInDays(leg.legEnd, leg.legStart));
          const legMembers = membersWithDates.filter((m) => {
            const mLegs = assignedLegs[m.id] || new Set();
            return mLegs.has(leg.id);
          });

          return (
            <div key={leg.id} className="v-timeline" style={{ padding: 14 }}>
              {/* Leg header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--v-champagne)' }}>
                  {leg.destination}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--v-pearl-dim)' }}>
                  {format(leg.legStart, 'MMM d')} – {format(leg.legEnd, 'MMM d')}
                </span>
              </div>

              {/* Member bars within this leg */}
              {legMembers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {legMembers.map((member, i) => {
                    const info = getMemberDisplayInfo(member);
                    const memberStart = parseISO(member.stay_start);
                    const memberEnd = parseISO(member.stay_end);
                    // Clip to leg range
                    const clippedStart = dateMax([memberStart, leg.legStart]);
                    const clippedEnd = dateMin([memberEnd, leg.legEnd]);
                    const leftPct = legDays > 0 ? Math.max(0, (differenceInDays(clippedStart, leg.legStart) / legDays) * 100) : 0;
                    const widthPct = legDays > 0 ? Math.max(2, Math.min(100 - leftPct, (differenceInDays(clippedEnd, clippedStart) / legDays) * 100)) : 100;
                    const color = member.color || MEMBER_COLORS[i % MEMBER_COLORS.length];

                    return (
                      <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 90, fontSize: '0.75rem', fontWeight: 500, color: 'var(--v-pearl)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
                          {info.name}
                        </div>
                        <div style={{ flex: 1, height: 18, background: 'var(--v-pearl-faint)', borderRadius: 2, position: 'relative' }}>
                          <div style={{
                            position: 'absolute', top: 2, bottom: 2, borderRadius: 2,
                            left: `${leftPct}%`, width: `${widthPct}%`,
                            backgroundColor: color, opacity: 0.85,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '0.7rem', color: 'var(--v-pearl-dim)', fontStyle: 'italic' }}>
                  No one assigned to this leg
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Main export — renders all three for comparison
   ============================================================ */
export default function StayTimeline({ trip, members, legs = [] }) {
  if (!trip.start_date || !trip.end_date) return null;

  const isMultiLeg = legs.length > 1;

  // For single-leg trips, use the original simple timeline
  if (!isMultiLeg) {
    return <OriginalTimeline trip={trip} members={members} />;
  }

  // For multi-leg: show all three options for comparison
  return (
    <>
      <OptionA trip={trip} members={members} legs={legs} />
      <OptionB trip={trip} members={members} legs={legs} />
      <OptionC trip={trip} members={members} legs={legs} />
    </>
  );
}

/* Original single-leg timeline (unchanged) */
function OriginalTimeline({ trip, members }) {
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
        <p className="v-hint">No one has set their stay dates yet. Go to Members to add yours.</p>
      </div>
    );
  }
  if (membersWithDates.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 className="v-section-title">Who&apos;s There When</h2>
      <div className="v-timeline">
        <div className="v-timeline-dates">
          <span>{format(tripStart, 'MMM d')}</span>
          <span>{format(tripEnd, 'MMM d')}</span>
        </div>
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
                <div className="v-timeline-row-label">{info.name}</div>
                <div className="v-timeline-row-track">
                  <div className="v-timeline-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color }} />
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
