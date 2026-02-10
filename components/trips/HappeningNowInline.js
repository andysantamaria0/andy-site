'use client';

import { useHappeningNow } from './HappeningNowProvider';
import HappeningNowContent from './HappeningNowContent';

export default function HappeningNowInline() {
  const ctx = useHappeningNow();
  if (!ctx || ctx.totalCount === 0) return null;

  return (
    <div className="v-happening-inline v-happening-inline-enter">
      <h2 className="v-section-title">Happening Now</h2>
      <HappeningNowContent />
    </div>
  );
}
