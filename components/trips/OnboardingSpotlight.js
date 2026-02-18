'use client';

import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from './OnboardingProvider';

export default function OnboardingSpotlight() {
  const ctx = useOnboarding();
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  const selector = ctx?.active ? ctx.currentStep?.spotlight : null;

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    function update() {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      rafRef.current = requestAnimationFrame(update);
    }

    // Small delay to let tabs render
    const timer = setTimeout(() => {
      update();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selector]);

  if (!ctx?.active || !rect) return null;

  const padding = 8;

  return (
    <div
      className="v-onboarding-spotlight"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          borderRadius: 6,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.4s cubic-bezier(.2, 0, 0, 1)',
        }}
      />
    </div>
  );
}
