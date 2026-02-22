'use client';

import { useState, useMemo, useEffect } from 'react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import CalendarDayList from './CalendarDayList';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthGrid from './CalendarMonthGrid';

function useIsMobile(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mql.matches);
    function handler(e) { setIsMobile(e.matches); }
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

export default function CalendarViewToggle({ trip, members, events, logistics, legs = [], isOwner, tripId }) {
  const isMobile = useIsMobile();
  const isMultiLeg = legs.length > 1;
  const [selectedLegId, setSelectedLegId] = useState(null); // null = All

  const defaultView = useMemo(() => {
    if (trip.start_date && trip.end_date) {
      const days = differenceInCalendarDays(parseISO(trip.end_date), parseISO(trip.start_date)) + 1;
      return days <= 7 ? 'week' : 'month';
    }
    return 'month';
  }, [trip.start_date, trip.end_date]);

  const [view, setView] = useState(defaultView);
  const [userOverride, setUserOverride] = useState(false);

  // Auto-switch to list on mobile unless the user explicitly picked a view
  useEffect(() => {
    if (!userOverride) {
      if (isMobile) {
        setView('list');
      } else {
        setView(defaultView);
      }
    }
  }, [isMobile, defaultView, userOverride]);

  // Filter events and logistics by selected leg
  const filteredEvents = useMemo(() => {
    if (!selectedLegId) return events;
    return events.filter((e) => e.leg_id === selectedLegId);
  }, [events, selectedLegId]);

  const filteredLogistics = useMemo(() => {
    if (!selectedLegId) return logistics;
    return logistics.filter((l) => l.leg_id === selectedLegId);
  }, [logistics, selectedLegId]);

  return (
    <div>
      {/* Leg filter tabs (multi-leg only) */}
      {isMultiLeg && (
        <div className="v-leg-filter-tabs">
          <button
            className={`v-leg-filter-tab ${!selectedLegId ? 'v-leg-filter-tab-active' : ''}`}
            onClick={() => setSelectedLegId(null)}
          >
            All
          </button>
          {legs.map((leg) => (
            <button
              key={leg.id}
              className={`v-leg-filter-tab ${selectedLegId === leg.id ? 'v-leg-filter-tab-active' : ''}`}
              onClick={() => setSelectedLegId(leg.id)}
            >
              {leg.destination}
            </button>
          ))}
        </div>
      )}

      <div className="v-view-toggle">
        <button
          className={`v-view-toggle-btn ${view === 'list' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => { setUserOverride(true); setView('list'); }}
        >
          List
        </button>
        <button
          className={`v-view-toggle-btn ${view === 'week' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => { setUserOverride(true); setView('week'); }}
        >
          Week
        </button>
        <button
          className={`v-view-toggle-btn ${view === 'month' ? 'v-view-toggle-btn-active' : ''}`}
          onClick={() => { setUserOverride(true); setView('month'); }}
        >
          Month
        </button>
        {tripId && (
          <a
            href={`/api/trips/${tripId}/itinerary`}
            target="_blank"
            rel="noopener noreferrer"
            className="v-view-toggle-btn"
            style={{ textDecoration: 'none', marginLeft: 'auto' }}
          >
            🖨 Itinerary
          </a>
        )}
      </div>

      {view === 'list' ? (
        <CalendarDayList
          trip={trip}
          members={members}
          events={filteredEvents}
          logistics={filteredLogistics}
          legs={legs}
          isOwner={isOwner}
        />
      ) : view === 'week' ? (
        <CalendarWeekView
          trip={trip}
          members={members}
          events={filteredEvents}
          logistics={filteredLogistics}
          isOwner={isOwner}
        />
      ) : (
        <CalendarMonthGrid
          trip={trip}
          members={members}
          events={filteredEvents}
          logistics={filteredLogistics}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
