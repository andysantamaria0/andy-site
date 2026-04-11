'use client';

import { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const HappeningNowContext = createContext(null);
const POLL_INTERVAL = 30_000; // 30 seconds

export function useHappeningNow() {
  return useContext(HappeningNowContext);
}

export default function HappeningNowProvider({ items: initialItems = [], tripId, children }) {
  const [items, setItems] = useState(initialItems);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const base = `/trips/${tripId}`;
  const isOverview = pathname === base || pathname === `${base}/`;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/happening-now`);
      if (res.ok) {
        const data = await res.json();
        if (data.items) setItems(data.items);
      }
    } catch {
      // silently fail — keep showing last known data
    }
  }, [tripId]);

  // Poll for updates when there are in-progress items (flights etc.)
  useEffect(() => {
    const hasActiveItems = items.some((i) => i.status === 'in_progress');
    if (!hasActiveItems) return;

    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [items, refresh]);

  // Also refresh when tab becomes visible again
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  const inProgressCount = useMemo(
    () => items.filter((i) => i.status === 'in_progress').length,
    [items]
  );

  const grouped = useMemo(() => {
    const groups = { in_progress: [], upcoming: [], today: [] };
    for (const item of items) {
      if (groups[item.status]) {
        groups[item.status].push(item);
      }
    }
    return groups;
  }, [items]);

  const value = {
    items,
    grouped,
    isExpanded,
    setIsExpanded,
    isOverview,
    inProgressCount,
    totalCount: items.length,
    refresh,
  };

  return (
    <HappeningNowContext.Provider value={value}>
      {children}
    </HappeningNowContext.Provider>
  );
}
