'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const HappeningNowContext = createContext(null);

export function useHappeningNow() {
  return useContext(HappeningNowContext);
}

export default function HappeningNowProvider({ items = [], tripId, children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const base = `/trips/${tripId}`;
  const isOverview = pathname === base || pathname === `${base}/`;

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
  };

  return (
    <HappeningNowContext.Provider value={value}>
      {children}
    </HappeningNowContext.Provider>
  );
}
