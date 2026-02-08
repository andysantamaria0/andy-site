'use client';

import { useState } from 'react';
import CalendarDayList from './CalendarDayList';
import CalendarMonthGrid from './CalendarMonthGrid';

export default function CalendarViewToggle({ trip, members, events, logistics, isOwner }) {
  const [view, setView] = useState('month');

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
