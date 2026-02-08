'use client';

import { useState } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
} from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import EventCard from './EventCard';
import EventForm from './EventForm';
import LogisticsCard from './LogisticsCard';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarMonthGrid({ trip, members, events, logistics, isOwner }) {
  const tripStart = trip.start_date ? parseISO(trip.start_date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(tripStart));
  const [expandedDay, setExpandedDay] = useState(null); // 'yyyy-MM-dd' or null
  const [formState, setFormState] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const today = new Date();
  const tripStartDate = trip.start_date ? parseISO(trip.start_date) : null;
  const tripEndDate = trip.end_date ? parseISO(trip.end_date) : null;

  const membersByUserId = {};
  (members || []).forEach((m) => { if (m.user_id) membersByUserId[m.user_id] = m; });

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
          return format(new Date(l.start_time), 'yyyy-MM-dd') === dayStr;
        } catch { return false; }
      }
      return false;
    });
  }

  function isTripDay(day) {
    if (!tripStartDate || !tripEndDate) return false;
    try {
      return isWithinInterval(day, { start: tripStartDate, end: tripEndDate });
    } catch {
      return false;
    }
  }

  function toggleDay(dayStr) {
    setExpandedDay((prev) => (prev === dayStr ? null : dayStr));
  }

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < calDays.length; i += 7) {
    weeks.push(calDays.slice(i, i + 7));
  }

  return (
    <div className="v-month-grid-wrapper">
      <div className="v-month-nav">
        <button className="v-month-nav-btn" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&larr;</button>
        <span className="v-month-nav-title">{format(currentMonth, 'MMMM yyyy')}</span>
        <button className="v-month-nav-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&rarr;</button>
      </div>

      <div className="v-month-grid-header">
        {WEEKDAYS.map((d) => (
          <div key={d} className="v-month-grid-weekday">{d}</div>
        ))}
      </div>

      <div className="v-month-grid">
        {weeks.map((week, wi) => {
          const weekKey = format(week[0], 'yyyy-MM-dd');
          // Check if any day in this week is expanded
          const expandedInWeek = week.find((d) => format(d, 'yyyy-MM-dd') === expandedDay);

          return (
            <div key={weekKey}>
              <div className="v-month-grid-week">
                {week.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const inMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, today);
                  const inTrip = isTripDay(day);
                  const present = getMembersPresent(day);
                  const dayEvents = getEventsForDay(dayStr);
                  const isExpanded = expandedDay === dayStr;

                  const cellClasses = [
                    'v-month-cell',
                    !inMonth && 'v-month-cell-outside',
                    inTrip && 'v-month-cell-trip',
                    isExpanded && 'v-month-cell-expanded',
                  ].filter(Boolean).join(' ');

                  return (
                    <div
                      key={dayStr}
                      className={cellClasses}
                      onClick={() => toggleDay(dayStr)}
                    >
                      <div className={`v-month-cell-day ${isToday ? 'v-month-cell-today' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      {present.length > 0 && (
                        <div className="v-month-cell-dots">
                          {present.slice(0, 6).map((m) => (
                            <div
                              key={m.id}
                              className="v-month-cell-dot"
                              style={{ backgroundColor: m.color || '#4A35D7' }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="v-month-cell-events">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div key={ev.id} className="v-month-cell-event-line">
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="v-month-cell-event-more">+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expanded day detail panel — renders between week rows */}
              {expandedInWeek && (() => {
                const dayStr = expandedDay;
                const day = expandedInWeek;
                const present = getMembersPresent(day);
                const dayEvents = getEventsForDay(dayStr);
                const dayLogistics = getLogisticsForDay(dayStr);

                return (
                  <div className="v-month-expanded">
                    <div className="v-month-expanded-header">
                      <span className="v-month-expanded-date">{format(day, 'EEEE, MMMM d')}</span>
                      <button className="v-modal-close" onClick={() => setExpandedDay(null)}>&times;</button>
                    </div>

                    {present.length > 0 && (
                      <div className="v-month-expanded-members">
                        {present.map((m) => {
                          const info = getMemberDisplayInfo(m);
                          return (
                            <span key={m.id} className="v-month-expanded-member">
                              {info.name}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {dayLogistics.length > 0 && (
                      <div className="v-calendar-logistics">
                        {dayLogistics.map((entry) => (
                          <LogisticsCard
                            key={entry.id}
                            entry={entry}
                            member={membersByUserId[entry.user_id]}
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
                );
              })()}
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
        />
      )}
    </div>
  );
}
