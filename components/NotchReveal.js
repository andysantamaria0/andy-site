'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The Notch Reveal — a scroll-triggered section divider.
 * Two champagne lines draw outward from center, the V chevron fades in between.
 *
 * Props:
 *   compact — smaller version for tighter spaces (journal entries)
 */
export default function NotchReveal({ compact = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const lineWidth = compact ? 28 : 40;
  const chevronSize = compact ? 16 : 24;

  return (
    <div
      ref={ref}
      className={`v-notch${compact ? ' v-notch-compact' : ''}${visible ? ' v-notch-visible' : ''}`}
      aria-hidden="true"
    >
      <div className="v-notch-line" style={{ '--v-notch-width': `${lineWidth}px` }} />
      <svg
        className="v-notch-chevron"
        width={chevronSize}
        height={chevronSize * 0.4}
        viewBox="0 0 120 48"
        fill="none"
      >
        <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
      </svg>
      <div className="v-notch-line" style={{ '--v-notch-width': `${lineWidth}px` }} />
    </div>
  );
}
