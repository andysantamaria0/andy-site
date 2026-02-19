'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';

const ConciergePillContext = createContext(null);

export function useConciergePill() {
  return useContext(ConciergePillContext);
}

export default function ConciergePillProvider({ tripId, tripCode, children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const base = `/trips/${tripId}`;
  const isConciergeTab = pathname.startsWith(`${base}/concierge`);

  const value = {
    isExpanded,
    setIsExpanded,
    isConciergeTab,
    tripId,
    tripCode,
  };

  return (
    <ConciergePillContext.Provider value={value}>
      {children}
    </ConciergePillContext.Provider>
  );
}
