'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Overview', path: '' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Expenses', path: '/expenses' },
  { label: 'Logistics', path: '/logistics' },
  { label: 'Members', path: '/members' },
  { label: 'Inbox', path: '/inbox' },
];

export default function TripNav({ tripId, inboxCount = 0 }) {
  const pathname = usePathname();
  const base = `/trips/${tripId}`;

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
