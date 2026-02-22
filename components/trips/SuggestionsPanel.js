'use client';

import { useState, useEffect, useCallback } from 'react';
import SuggestionGroup from './SuggestionGroup';
import SuggestionCard from './SuggestionCard';
import SuggestionForm from './SuggestionForm';

export default function SuggestionsPanel({ tripId, legs, members, isOwner }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [legFilter, setLegFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('status', statusFilter);
    if (legFilter) params.set('leg_id', legFilter);

    try {
      const res = await fetch(`/api/trips/${tripId}/suggestions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }, [tripId, statusFilter, legFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Re-fetch when the page navigates (router.refresh())
  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) fetchSuggestions();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchSuggestions]);

  // Listen for custom refresh event (fired by router.refresh in cards)
  useEffect(() => {
    function handleRefresh() { fetchSuggestions(); }
    window.addEventListener('suggestions-refresh', handleRefresh);
    // Also listen for Next.js route change
    const observer = new MutationObserver(() => fetchSuggestions());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('suggestions-refresh', handleRefresh);
      observer.disconnect();
    };
  }, [fetchSuggestions]);

  // Group suggestions by group_key
  const grouped = [];
  const standalone = [];
  const groupMap = new Map();

  for (const s of suggestions) {
    if (s.group_key) {
      if (!groupMap.has(s.group_key)) {
        groupMap.set(s.group_key, { key: s.group_key, label: s.group_label, items: [] });
      }
      groupMap.get(s.group_key).items.push(s);
    } else {
      standalone.push(s);
    }
  }
  for (const g of groupMap.values()) grouped.push(g);

  // Existing groups for the form dropdown
  const existingGroups = grouped.map((g) => ({ key: g.key, label: g.label }));

  function handleEdit(suggestion) {
    setEditingSuggestion(suggestion);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingSuggestion(null);
    fetchSuggestions();
  }

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="v-suggestion-panel">
      <div className="v-suggestion-panel-header">
        <h2 className="v-section-title" style={{ marginBottom: 0 }}>
          Suggestions {pendingCount > 0 && `(${pendingCount})`}
        </h2>
        <button
          className="v-btn v-btn-secondary v-btn-sm"
          onClick={() => { setEditingSuggestion(null); setShowForm(true); }}
        >
          + Add Suggestion
        </button>
      </div>

      <div className="v-suggestion-filters">
        <div className="v-suggestion-status-tabs">
          {['pending', 'approved', 'dismissed', 'all'].map((s) => (
            <button
              key={s}
              className={`v-leg-filter-tab${statusFilter === s ? ' v-leg-filter-tab-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {legs && legs.length > 1 && (
          <select
            className="v-form-select v-suggestion-leg-filter"
            value={legFilter}
            onChange={(e) => setLegFilter(e.target.value)}
          >
            <option value="">All legs</option>
            {legs.map((l) => (
              <option key={l.id} value={l.id}>{l.destination}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="v-hint">Loading suggestions...</p>
      ) : suggestions.length === 0 ? (
        <p className="v-hint">
          {statusFilter === 'pending'
            ? 'No pending suggestions yet. Add options you\'re considering — villas, restaurants, activities — and greenlight the winners.'
            : `No ${statusFilter} suggestions.`}
        </p>
      ) : (
        <div className="v-suggestion-list">
          {grouped.map((g) => (
            <SuggestionGroup
              key={g.key}
              groupKey={g.key}
              groupLabel={g.label}
              suggestions={g.items}
              tripId={tripId}
              members={members}
              isOwner={isOwner}
              onEdit={handleEdit}
            />
          ))}
          {standalone.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              tripId={tripId}
              members={members}
              isOwner={isOwner}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {showForm && (
        <SuggestionForm
          tripId={tripId}
          legs={legs}
          existingGroups={existingGroups}
          onClose={handleCloseForm}
          suggestion={editingSuggestion}
        />
      )}
    </div>
  );
}
