'use client';

import { useState } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { daysInRange } from '../../lib/utils/dates';
import EventCard from './EventCard';
import EventForm from './EventForm';

export default function CalendarDayList({ trip, members, events, isOwner }) {
  const [formState, setFormState] = useState(null); // null | { date, event? }

  if (!trip.start_date || !trip.end_date) {
    return (
      <p style={{ color: 'var(--v-ivory-dim)', fontSize: '0.875rem' }}>
        Set trip dates to see the calendar.
      </p>
    );
  }

  const days = daysInRange(trip.start_date, trip.end_date);
  const tripStart = parseISO(trip.start_date);

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

  return (
    <>
      <div className="v-calendar-days">
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayNum = i + 1;
          const present = getMembersPresent(day);
          const dayEvents = getEventsForDay(dayStr);
          const isToday = dayStr === format(new Date(), 'yyyy-MM-dd');

          return (
            <div key={dayStr} className={`v-calendar-day ${isToday ? 'v-calendar-day-today' : ''}`}>
              <div className="v-calendar-day-header">
                <div className="v-calendar-day-label">
                  <span className="v-calendar-day-name">{format(day, 'EEE, MMM d')}</span>
                  <span className="v-calendar-day-num">Day {dayNum}</span>
                </div>
                {present.length > 0 && (
                  <div className="v-calendar-presence">
                    {present.map((m) => (
                      <div
                        key={m.id}
                        className="v-presence-dot"
                        style={{ backgroundColor: m.color || '#4A35D7' }}
                        title={m.profiles?.display_name || m.profiles?.email || 'Member'}
                      />
                    ))}
                  </div>
                )}
              </div>

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
        />
      )}
    </>
  );
}
