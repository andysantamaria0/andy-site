'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

const FUNNEL_PATTERNS = ['/trips/join/', '/trips/login', '/trips/claim'];

function isFunnelPage(path) {
  return FUNNEL_PATTERNS.some((p) => path.startsWith(p));
}

export default function PostHogProvider({ userId, userEmail, children }) {
  const initialized = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) return;

    try {
      if (!initialized.current) {
        posthog.init(key, {
          api_host: host,
          capture_pageview: false,
          disable_session_recording: true,
          advanced_disable_feature_flags: true,
          advanced_disable_toolbar_metrics: true,
          persistence: 'localStorage',
        });
        initialized.current = true;
      }

      if (userId) {
        posthog.identify(userId, { email: userEmail });
      }
    } catch (_) {
      // Ad blockers / privacy browsers may block PostHog — never break the app
    }
  }, [userId, userEmail]);

  useEffect(() => {
    if (!initialized.current) return;
    try {
      if (isFunnelPage(pathname)) {
        posthog.capture('$pageview', { $current_url: window.location.href });
      }
    } catch (_) {}
  }, [pathname]);

  return children;
}
