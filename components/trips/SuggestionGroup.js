'use client';

import SuggestionCard from './SuggestionCard';

export default function SuggestionGroup({ groupKey, groupLabel, suggestions, tripId, members, isOwner, onEdit }) {
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="v-suggestion-group">
      <div className="v-suggestion-group-header">
        <span className="v-suggestion-group-label">
          {groupLabel || groupKey}
        </span>
        <span className="v-suggestion-group-count">
          {pendingCount} option{pendingCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="v-suggestion-group-cards">
        {suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            tripId={tripId}
            members={members}
            isOwner={isOwner}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
