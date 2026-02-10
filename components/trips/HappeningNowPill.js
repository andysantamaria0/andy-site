'use client';

import { useHappeningNow } from './HappeningNowProvider';
import HappeningNowContent from './HappeningNowContent';

export default function HappeningNowPill() {
  const ctx = useHappeningNow();
  if (!ctx || ctx.totalCount === 0 || ctx.isOverview) return null;

  const { isExpanded, setIsExpanded, inProgressCount, totalCount } = ctx;
  const hasActive = inProgressCount > 0;

  const label = inProgressCount > 0
    ? `${inProgressCount} happening now`
    : `${totalCount} today`;

  return (
    <div className={`v-happening-pill${isExpanded ? ' v-happening-pill-expanded' : ''}${hasActive ? ' v-happening-pill-pulse' : ''}`}>
      <button
        className="v-happening-pill-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="v-happening-pill-dot" />
        <span className="v-happening-pill-label">{label}</span>
        <span className={`v-happening-pill-chevron${isExpanded ? ' v-happening-pill-chevron-up' : ''}`}>
          &#x2039;
        </span>
      </button>

      <div className="v-happening-pill-body">
        <HappeningNowContent />
      </div>
    </div>
  );
}
