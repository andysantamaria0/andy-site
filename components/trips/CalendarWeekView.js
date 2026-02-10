'use client';

import { useState } from 'react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isWithinInterval,
  differenceInCalendarDays,
} from 'date-fns';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import MemberAvatar from './MemberAvatar';
import EventCard from './EventCard';
import EventForm from './EventForm';
import LogisticsCard from './LogisticsCard';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarWeekView({ trip, members, events, logistics, isOwner }) {
  const tripStart = trip.start_date ? parseISO(trip.start_date) : new Date();
  const tripEnd = trip.end_date ? parseISO(trip.end_date) : tripStart;
  const tripDuration = differenceInCalendarDays(tripEnd, tripStart) + 1;
  const showNav = tripDuration > 7;

  const [weekStart, setWeekStart] = useState(startOfWeek(tripStart));
  const [formState, setFormState] = useState(null);

  const weekEnd = endOfWeek(weekStart);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

  function getArrivals(day) {
    return (members || []).filter((m) => {
      if (!m.stay_start) return false;
      try { return isSameDay(parseISO(m.stay_start), day); } catch { return false; }
    });
  }

  function getDepartures(day) {
    return (members || []).filter((m) => {
      if (!m.stay_end) return false;
      try { return isSameDay(parseISO(m.stay_end), day); } catch { return false; }
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

  const navLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  return (
    <div className="v-week-wrapper">
      <div className="v-month-nav">
        {showNav && (
          <button className="v-month-nav-btn" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>&larr;</button>
        )}
        <span className="v-month-nav-title">{navLabel}</span>
        {showNav && (
          <button className="v-month-nav-btn" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>&rarr;</button>
        )}
      </div>

      <div className="v-week-grid">
        {weekDays.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isToday = isSameDay(day, today);
          const inTrip = isTripDay(day);
          const present = getMembersPresent(day);
          const arrivals = getArrivals(day);
          const departures = getDepartures(day);
          const dayEvents = getEventsForDay(dayStr);
          const dayLogistics = getLogisticsForDay(dayStr);
          const dayIndex = weekDays.indexOf(day);

          const colClasses = [
            'v-week-col',
            !inTrip && 'v-week-col-outside',
            isToday && 'v-week-col-today',
          ].filter(Boolean).join(' ');

          return (
            <div key={dayStr} className={colClasses}>
              <div className="v-week-col-header">
                <span className="v-week-col-weekday">{WEEKDAYS[dayIndex]}</span>
                <span className={`v-week-col-day ${isToday ? 'v-month-cell-today' : ''}`}>
                  {format(day, 'd')}
                </span>
                <span className="v-week-col-month">{format(day, 'MMM')}</span>
              </div>

              {/* Arrival / departure badges */}
              {(arrivals.length > 0 || departures.length > 0) && (
                <div className="v-week-col-badges">
                  {arrivals.map((m) => {
                    const info = getMemberDisplayInfo(m);
                    return (
                      <span key={`arr-${m.id}`} className="v-month-badge v-month-badge-arrive">
                        <span className="v-month-badge-arrow">&darr;</span>
                        <span className="v-month-badge-name">{info.name.split(' ')[0]}</span>
                      </span>
                    );
                  })}
                  {departures.map((m) => {
                    const info = getMemberDisplayInfo(m);
                    return (
                      <span key={`dep-${m.id}`} className="v-month-badge v-month-badge-depart">
                        <span className="v-month-badge-arrow">&uarr;</span>
                        <span className="v-month-badge-name">{info.name.split(' ')[0]}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Member presence avatars */}
              {present.length > 0 && (
                <div className="v-week-col-avatars">
                  {present.slice(0, 4).map((m) => {
                    const info = getMemberDisplayInfo(m);
                    return (
                      <div key={m.id} className="v-month-cell-avatar" title={info.name}>
                        <MemberAvatar
                          member={{
                            display_name: info.name,
                            avatar_url: info.avatarUrl,
                            email: info.email,
                            color: info.color,
                          }}
                          size={20}
                        />
                      </div>
                    );
                  })}
                  {present.length > 4 && (
                    <span className="v-month-cell-avatar-more">+{present.length - 4}</span>
                  )}
                </div>
              )}

              {/* Logistics cards */}
              {dayLogistics.length > 0 && (
                <div className="v-week-col-logistics">
                  {dayLogistics.map((entry) => (
                    <LogisticsCard
                      key={entry.id}
                      entry={entry}
                      member={membersByUserId[entry.user_id]}
                    />
                  ))}
                </div>
              )}

              {/* Event cards */}
              {dayEvents.length > 0 && (
                <div className="v-week-col-events">
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

              {/* Add event button */}
              {isOwner && inTrip && (
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
          tripCurrency={trip.currency}
        />
      )}
    </div>
  );
}
