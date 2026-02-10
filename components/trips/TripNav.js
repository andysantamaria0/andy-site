'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const allTabs = [
  { label: 'Overview', path: '', feature: null },
  { label: 'Calendar', path: '/calendar', feature: 'calendar' },
  { label: 'Expenses', path: '/expenses', feature: 'expenses' },
  { label: 'Members', path: '/members', feature: 'members' },
  { label: 'Inbox', path: '/inbox', feature: 'inbox' },
];

export default function TripNav({ tripId, inboxCount = 0, enabledTabs }) {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;

  const tabs = enabledTabs
    ? allTabs.filter((tab) => !tab.feature || enabledTabs.includes(tab.feature))
    : allTabs;

  return (
    <nav className="v-trip-nav">
      {tabs.map((tab) => {
        const href = `${base}${tab.path}`;
        const isActive = tab.path === ''
          ? pathname === base || pathname === `${base}/`
          : pathname.startsWith(href);
        return (
          <Link
            key={tab.label}
            href={href}
            className={`v-trip-nav-link${isActive ? ' active' : ''}`}
          >
            {tab.label}
            {tab.label === 'Inbox' && inboxCount > 0 && (
              <span className="v-inbox-badge-count">{inboxCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
