'use client';

import HappeningNowItem from './HappeningNowItem';
import { useHappeningNow } from './HappeningNowProvider';

function SectionLabel({ children }) {
  return <div className="v-happening-section-label">{children}</div>;
}

export default function HappeningNowContent() {
  const { grouped } = useHappeningNow();
  let itemIndex = 0;

  return (
    <div className="v-happening-content">
      {grouped.in_progress.length > 0 && (
        <>
          <SectionLabel>Happening Now</SectionLabel>
          {grouped.in_progress.map((item) => (
            <HappeningNowItem key={item.id} item={item} index={itemIndex++} />
          ))}
        </>
      )}

      {grouped.upcoming.length > 0 && (
        <>
          <SectionLabel>Coming Up</SectionLabel>
          {grouped.upcoming.map((item) => (
            <HappeningNowItem key={item.id} item={item} index={itemIndex++} />
          ))}
        </>
      )}

      {grouped.today.length > 0 && (
        <>
          <SectionLabel>Today</SectionLabel>
          {grouped.today.map((item) => (
            <HappeningNowItem key={item.id} item={item} index={itemIndex++} />
          ))}
        </>
      )}
    </div>
  );
}
