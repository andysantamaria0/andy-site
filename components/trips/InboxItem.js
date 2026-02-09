'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InboxItem({ email, tripId, isOwner }) {
  const router = useRouter();
  const [applying, setApplying] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(email.status === 'pending');

  const parsed = email.parsed_data;

  async function handleApply() {
    if (!parsed) return;
    setApplying(true);
    setError(null);

    try {
      // Apply changes via the existing apply route
      const applyRes = await fetch(`/trips/${tripId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_updates: parsed.member_updates,
          new_travelers: parsed.new_travelers,
          logistics: parsed.logistics,
          events: parsed.events,
        }),
      });
      const applyData = await applyRes.json();
      setResult(applyData);

      // Mark email as applied
      await fetch(`/trips/${tripId}/inbox/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      });

      router.refresh();
    } catch (e) {
      setError('Failed to apply changes.');
    }
    setApplying(false);
  }

  async function handleDismiss() {
    setDismissing(true);
    setError(null);

    try {
      await fetch(`/trips/${tripId}/inbox/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      router.refresh();
    } catch (e) {
      setError('Failed to dismiss.');
    }
    setDismissing(false);
  }

  const dateStr = new Date(email.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`v-inbox-item ${email.status !== 'pending' ? 'v-inbox-item-processed' : ''}`}>
      <div className="v-inbox-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="v-inbox-item-header-left">
          <span className="v-inbox-item-subject">{email.subject || '(no subject)'}</span>
          <span className="v-inbox-item-meta">
            {email.from_name || email.from_email} &middot; {dateStr}
          </span>
        </div>
        <div className="v-inbox-item-header-right">
          {email.status !== 'pending' && (
            <span className={`v-badge ${email.status === 'applied' ? 'v-badge-owner' : 'v-badge-member'}`}>
              {email.status}
            </span>
          )}
          <span className="v-inbox-item-chevron">{expanded ? '\u25B4' : '\u25BE'}</span>
        </div>
      </div>

      {expanded && (
        <div className="v-inbox-item-body">
          {email.parse_error && (
            <div style={{ color: 'var(--v-coral)', fontSize: '0.875rem', marginBottom: 12 }}>
              Parse error: {email.parse_error}
            </div>
          )}

          {parsed && !result && (
            <div className="v-parsed-results">
              <div className="v-parsed-summary">{parsed.summary}</div>

              {parsed.member_updates?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Stay Date Updates</div>
                  {parsed.member_updates.map((u, i) => (
                    <div key={i} className="v-parsed-item">
                      <span className="v-parsed-item-name">{u.name}</span>
                      <span className="v-parsed-item-detail">
                        {u.stay_start && u.stay_end
                          ? `${u.stay_start} to ${u.stay_end}`
                          : u.stay_start ? `Arriving ${u.stay_start}` : u.stay_end ? `Departing ${u.stay_end}` : 'No dates found'}
                      </span>
                      {u.matched_existing ? (
                        <span className="v-badge v-badge-owner">Matched</span>
                      ) : (
                        <span className="v-badge v-badge-member">New</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {parsed.new_travelers?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">New Members</div>
                  {parsed.new_travelers.map((t, i) => (
                    <div key={i} className="v-parsed-item">
                      <span className="v-parsed-item-name">{t.name}</span>
                      <span className="v-parsed-item-detail">
                        {t.stay_start && t.stay_end
                          ? `${t.stay_start} to ${t.stay_end}`
                          : t.email || 'No details'}
                      </span>
                      <span className="v-badge v-badge-owner">Will be added</span>
                    </div>
                  ))}
                </div>
              )}

              {parsed.logistics?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Logistics</div>
                  {parsed.logistics.map((l, i) => (
                    <div key={i} className="v-parsed-item">
                      <span className="v-badge v-badge-member" style={{ marginRight: 8 }}>{l.type}</span>
                      <span className="v-parsed-item-name">{l.title}</span>
                      <span className="v-parsed-item-detail">
                        {l.person_name}{l.start_time ? ` \u2014 ${l.start_time}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parsed.events?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Events</div>
                  {parsed.events.map((ev, i) => (
                    <div key={i} className="v-parsed-item">
                      <span className="v-badge v-badge-member" style={{ marginRight: 8 }}>{ev.category}</span>
                      <span className="v-parsed-item-name">{ev.title}</span>
                      <span className="v-parsed-item-detail">
                        {ev.event_date}{ev.start_time ? ` at ${ev.start_time}` : ''}{ev.location ? ` \u2014 ${ev.location}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parsed.notes && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Notes</div>
                  <p style={{ color: 'var(--v-ivory-dim)', fontSize: '0.875rem' }}>{parsed.notes}</p>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="v-parsed-results">
              <div className="v-parsed-summary" style={{ color: 'var(--v-hide)' }}>
                Applied! Updated {result.updated} member{result.updated !== 1 ? 's' : ''}
                {result.members_added > 0 && `, added ${result.members_added} new member${result.members_added !== 1 ? 's' : ''}`}
                {result.logistics_added > 0 && `, added ${result.logistics_added} logistics entr${result.logistics_added !== 1 ? 'ies' : 'y'}`}
                {result.events_added > 0 && `, created ${result.events_added} event${result.events_added !== 1 ? 's' : ''}`}.
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--v-coral)', fontSize: '0.875rem', marginTop: 8 }}>{error}</div>
          )}

          {email.status === 'pending' && isOwner && parsed && !result && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className="v-btn v-btn-primary"
                onClick={handleApply}
                disabled={applying}
              >
                {applying ? 'Applying...' : 'Apply Changes'}
              </button>
              <button
                className="v-btn v-btn-secondary"
                onClick={handleDismiss}
                disabled={dismissing}
              >
                {dismissing ? 'Dismissing...' : 'Dismiss'}
              </button>
            </div>
          )}

          {email.status === 'pending' && isOwner && !parsed && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className="v-btn v-btn-secondary"
                onClick={handleDismiss}
                disabled={dismissing}
              >
                {dismissing ? 'Dismissing...' : 'Dismiss'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
