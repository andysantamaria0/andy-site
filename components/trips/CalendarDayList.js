'use client';

import { useState } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { daysInRange } from '../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import EventCard from './EventCard';
import EventForm from './EventForm';
import LogisticsCard from './LogisticsCard';
import MemberAvatar from './MemberAvatar';

export default function CalendarDayList({ trip, members, events, logistics, legs = [], isOwner }) {
  const [formState, setFormState] = useState(null); // null | { date, event? }

  if (!trip.start_date || !trip.end_date) {
    return (
      <p className="v-hint">
        Set trip dates to see the calendar.
      </p>
    );
  }

  const days = daysInRange(trip.start_date, trip.end_date);
  const isMultiLeg = legs.length > 1;

  const membersById = {};
  (members || []).forEach((m) => { membersById[m.id] = m; });
  // Also index by user_id for logistics which use user_id
  const membersByUserId = {};
  (members || []).forEach((m) => { if (m.user_id) membersByUserId[m.user_id] = m; });

  // Build leg lookup by date range for section headers
  function getLegForDay(dayStr) {
    if (!isMultiLeg) return null;
    for (const leg of legs) {
      if (leg.start_date && leg.end_date && dayStr >= leg.start_date && dayStr <= leg.end_date) {
        return leg;
      }
    }
    return null;
  }

  // Build travelers array from logistics_travelers for a logistics entry
  function getTravelers(entry) {
    if (!entry.logistics_travelers || entry.logistics_travelers.length === 0) return [];
    return entry.logistics_travelers
      .map((lt) => {
        const m = membersById[lt.member_id];
        if (!m) return null;
        const info = getMemberDisplayInfo(m);
        return { id: m.id, display_name: info.name, avatar_url: info.avatarUrl, email: info.email, color: info.color };
      })
      .filter(Boolean);
  }

  function getMembersPresent(day) {
    return (members || []).filter((m) => {
      if (!m.stay_start || !m.stay_end) return false;
      try {
        return isWithinInterval(day, {
          start: parseISO(m.stay_start),
          end: parseISO(m.stay_end),
        });
      } catch {
        return false;
      }
    });
  }

  function getEventsForDay(dayStr) {
    return (events || []).filter((e) => e.event_date === dayStr);
  }

  function getLogisticsForDay(dayStr) {
    return (logistics || []).filter((l) => {
      if (l.start_time) {
        try {
          const d = new Date(l.start_time);
          return format(d, 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      }
      if (l.end_time) {
        try {
          const d = new Date(l.end_time);
          return format(d, 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      }
      return false;
    });
  }

  let lastLegId = null;

  return (
    <>
      <div className="v-calendar-days">
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayNum = i + 1;
          const present = getMembersPresent(day);
          const dayEvents = getEventsForDay(dayStr);
          const dayLogistics = getLogisticsForDay(dayStr);
          const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');

          // Show leg header when crossing into a new leg
          const currentLeg = getLegForDay(dayStr);
          let showLegHeader = false;
          if (isMultiLeg && currentLeg && currentLeg.id !== lastLegId) {
            showLegHeader = true;
            lastLegId = currentLeg.id;
          }

          return (
            <div key={dayStr}>
              {showLegHeader && (
                <div className="v-calendar-leg-header">
                  {currentLeg.destination}
                </div>
              )}
              <div className={`v-calendar-day ${isToday ? 'v-calendar-day-today' : ''}`}>
                <div className="v-calendar-day-header">
                  <div className="v-calendar-day-label">
                    <span className="v-calendar-day-name">{format(day, 'EEE, MMM d')}</span>
                    <span className="v-calendar-day-num">Day {dayNum}</span>
                  </div>
                  {present.length > 0 && (
                    <div className="v-calendar-presence">
                      {present.map((m) => {
                        const info = getMemberDisplayInfo(m);
                        return (
                          <MemberAvatar
                            key={m.id}
                            member={{
                              display_name: info.name,
                              avatar_url: info.avatarUrl,
                              email: info.email,
                              color: info.color,
                            }}
                            size={18}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {dayLogistics.length > 0 && (
                  <div className="v-calendar-logistics">
                    {dayLogistics.map((entry) => (
                      <LogisticsCard
                        key={entry.id}
                        entry={entry}
                        member={membersByUserId[entry.user_id]}
                        travelers={getTravelers(entry)}
                      />
                    ))}
                  </div>
                )}

                {dayEvents.length > 0 && (
                  <div className="v-calendar-events">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        members={members}
                        onClick={isOwner ? () => setFormState({ date: dayStr, event }) : undefined}
                      />
                    ))}
                  </div>
                )}

                {isOwner && (
                  <button
                    className="v-calendar-add-btn"
                    onClick={() => setFormState({ date: dayStr })}
                  >
                    + Add event
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {formState && (
        <EventForm
          tripId={trip.id}
          members={members}
          event={formState.event || null}
          initialDate={formState.date}
          onClose={() => setFormState(null)}
          tripCurrency={trip.currency}
          tripDestination={trip.destination}
        />
      )}
    </>
  );
}
