'use client';

import { useState, useMemo } from 'react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import CalendarDayList from './CalendarDayList';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthGrid from './CalendarMonthGrid';

export default function CalendarViewToggle({ trip, members, events, logistics, isOwner }) {
  const defaultView = useMemo(() => {
    if (trip.start_date && trip.end_date) {
      const days = differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1;
      return days <= 7 ? 'week' : 'month';
    }
    return 'month';
  }, [trip.start_date, trip.end_date]);

  const [view, setView] = useState(defaultView);

  return (
    <div>
      <div className="v-view-toggle">
        <button
          className={`v-view-toggle-btn ${view === 'list' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => setView('list')}
        >
          List
        </button>
        <button
          className={`v-view-toggle-btn ${view === 'week' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          className={`v-view-toggle-btn ${view === 'month' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => setView('month')}
        >
          Month
        </button>
      </div>

      {view === 'list' ? (
        <CalendarDayList
          trip={trip}
          members={members}
          events={events}
          logistics={logistics}
          isOwner={isOwner}
        />
      ) : view === 'week' ? (
        <CalendarWeekView
          trip={trip}
          members={members}
          events={events}
          logistics={logistics}
          isOwner={isOwner}
        />
      ) : (
        <CalendarMonthGrid
          trip={trip}
          members={members}
          events={events}
          logistics={logistics}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
