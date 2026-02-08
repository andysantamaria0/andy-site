'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SmartPaste({ tripId }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleParse() {
    setLoading(true);
    setError(null);
    setParsed(null);
    setResult(null);

    try {
      const res = await fetch(`/trips/${tripId}/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setParsed(data.parsed);
      }
    } catch (e) {
      setError('Failed to parse. Try again.');
    }
    setLoading(false);
  }

  async function handleApply() {
    setApplying(true);
    try {
      const res = await fetch(`/trips/${tripId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_updates: parsed.member_updates,
          new_travelers: parsed.new_travelers,
          logistics: parsed.logistics,
          events: parsed.events,
        }),
      });
      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch (e) {
      setError('Failed to apply changes.');
    }
    setApplying(false);
  }

  function handleReset() {
    setText('');
    setParsed(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="v-smart-paste">
      <div className="v-smart-paste-header">
        <h3 className="v-section-title" style={{ marginBottom: 0 }}>Smart Paste</h3>
        <span className="v-smart-paste-hint">
          Paste texts, emails, or any info about the trip and it will be parsed automatically
        </span>
      </div>

      {!parsed && !result && (
        <>
          <textarea
            className="v-form-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste anything here...\n\ne.g. \"Hey Andy, I'm flying in May 17th on Delta DL1234, landing at 2:30pm. Leaving the 21st on AA567.\""}
            rows={5}
            style={{ marginBottom: 12 }}
          />
          <button
            className="v-btn v-btn-primary"
            onClick={handleParse}
            disabled={loading || !text.trim()}
          >
            {loading ? 'Parsing...' : 'Parse'}
          </button>
        </>
      )}

      {error && (
        <div style={{ color: 'var(--v-coral)', fontSize: '0.875rem', marginTop: 12 }}>{error}</div>
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
              <div className="v-parsed-section-title">New Travelers</div>
              {parsed.new_travelers.map((t, i) => (
                <div key={i} className="v-parsed-item">
                  <span className="v-parsed-item-name">{t.name}</span>
                  <span className="v-parsed-item-detail">
                    {t.stay_start && t.stay_end
                      ? `${t.stay_start} to ${t.stay_end}`
                      : t.email || 'No details'}
                  </span>
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
                    {l.person_name}{l.start_time ? ` — ${l.start_time}` : ''}
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
                    {ev.event_date}{ev.start_time ? ` at ${ev.start_time}` : ''}{ev.location ? ` — ${ev.location}` : ''}
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

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              className="v-btn v-btn-primary"
              onClick={handleApply}
              disabled={applying}
            >
              {applying ? 'Applying...' : 'Apply Changes'}
            </button>
            <button className="v-btn v-btn-secondary" onClick={handleReset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="v-parsed-results">
          <div className="v-parsed-summary" style={{ color: 'var(--v-hide)' }}>
            Done! Updated {result.updated} member{result.updated !== 1 ? 's' : ''}
            {result.logistics_added > 0 && `, added ${result.logistics_added} logistics entr${result.logistics_added !== 1 ? 'ies' : 'y'}`}
            {result.events_added > 0 && `, created ${result.events_added} event${result.events_added !== 1 ? 's' : ''}`}
            {result.travelers_noted > 0 && `. Noted ${result.travelers_noted} new traveler${result.travelers_noted !== 1 ? 's' : ''}: ${result.new_traveler_names?.join(', ')}`}.
            {result.errors?.length > 0 && ` (${result.errors.length} error${result.errors.length !== 1 ? 's' : ''})`}
          </div>
          {result.errors?.length > 0 && (
            <div style={{ color: 'var(--v-coral)', fontSize: '0.8125rem', marginTop: 8 }}>
              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
          <button className="v-btn v-btn-secondary" onClick={handleReset} style={{ marginTop: 12 }}>
            Paste More
          </button>
        </div>
      )}
    </div>
  );
}
