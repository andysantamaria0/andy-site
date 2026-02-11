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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const parsed = email.parsed_data;

  function startEditing() {
    setEditData(JSON.parse(JSON.stringify(parsed)));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditData(null);
  }

  function updateEvent(index, field, value) {
    setEditData(prev => {
      const next = { ...prev, events: [...prev.events] };
      next.events[index] = { ...next.events[index], [field]: value };
      return next;
    });
  }

  function removeEvent(index) {
    setEditData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index),
    }));
  }

  function updateLogistic(index, field, value) {
    setEditData(prev => {
      const next = { ...prev, logistics: [...prev.logistics] };
      next.logistics[index] = { ...next.logistics[index], [field]: value };
      return next;
    });
  }

  function removeLogistic(index) {
    setEditData(prev => ({
      ...prev,
      logistics: prev.logistics.filter((_, i) => i !== index),
    }));
  }

  function updateMemberUpdate(index, field, value) {
    setEditData(prev => {
      const next = { ...prev, member_updates: [...prev.member_updates] };
      next.member_updates[index] = { ...next.member_updates[index], [field]: value };
      return next;
    });
  }

  function removeMemberUpdate(index) {
    setEditData(prev => ({
      ...prev,
      member_updates: prev.member_updates.filter((_, i) => i !== index),
    }));
  }

  function updateNewTraveler(index, field, value) {
    setEditData(prev => {
      const next = { ...prev, new_travelers: [...prev.new_travelers] };
      next.new_travelers[index] = { ...next.new_travelers[index], [field]: value };
      return next;
    });
  }

  function removeNewTraveler(index) {
    setEditData(prev => ({
      ...prev,
      new_travelers: prev.new_travelers.filter((_, i) => i !== index),
    }));
  }

  async function handleAccept() {
    const data = editing ? editData : parsed;
    if (!data) return;
    setApplying(true);
    setError(null);

    try {
      const applyRes = await fetch(`/trips/${tripId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_updates: data.member_updates,
          new_travelers: data.new_travelers,
          logistics: data.logistics,
          events: data.events,
        }),
      });
      const applyData = await applyRes.json();
      setResult(applyData);

      await fetch(`/trips/${tripId}/inbox/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      });

      setEditing(false);
      setEditData(null);
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
          <span className="v-inbox-item-subject">
            {email.channel && email.channel !== 'email' && (
              <span className="v-badge-channel">{email.channel.toUpperCase()}</span>
            )}
            {email.channel === 'voice'
              ? 'Voice Note'
              : email.channel === 'sms' || email.channel === 'mms'
                ? (email.text_body ? email.text_body.slice(0, 60) : (email.channel === 'mms' ? 'MMS Message' : '(no text)'))
                : (email.subject || '(no subject)')
            }
          </span>
          <span className="v-inbox-item-meta">
            {email.from_name || email.from_email} &middot; {dateStr}
          </span>
        </div>
        <div className="v-inbox-item-header-right">
          {email.reply_sent && (
            <span className="v-badge v-badge-member" style={{ fontSize: '0.625rem' }}>replied</span>
          )}
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
            <div style={{ color: 'var(--v-cinnabar)', fontSize: '0.875rem', marginBottom: 12 }}>
              Parse error: {email.parse_error}
            </div>
          )}

          {parsed && !result && !editing && (
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
                  <p style={{ color: 'var(--v-pearl-dim)', fontSize: '0.875rem' }}>{parsed.notes}</p>
                </div>
              )}
            </div>
          )}

          {editing && editData && !result && (
            <div className="v-parsed-results v-inbox-editing">
              {editData.member_updates?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Stay Date Updates</div>
                  {editData.member_updates.map((u, i) => (
                    <div key={i} className="v-inbox-edit-row">
                      <input className="v-form-input v-inbox-edit-input" value={u.name} onChange={e => updateMemberUpdate(i, 'name', e.target.value)} placeholder="Name" />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={u.stay_start || ''} onChange={e => updateMemberUpdate(i, 'stay_start', e.target.value)} />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={u.stay_end || ''} onChange={e => updateMemberUpdate(i, 'stay_end', e.target.value)} />
                      <button className="v-inbox-edit-remove" onClick={() => removeMemberUpdate(i)} title="Remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {editData.new_travelers?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">New Members</div>
                  {editData.new_travelers.map((t, i) => (
                    <div key={i} className="v-inbox-edit-row">
                      <input className="v-form-input v-inbox-edit-input" value={t.name} onChange={e => updateNewTraveler(i, 'name', e.target.value)} placeholder="Name" />
                      <input className="v-form-input v-inbox-edit-input" value={t.email || ''} onChange={e => updateNewTraveler(i, 'email', e.target.value)} placeholder="Email" />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={t.stay_start || ''} onChange={e => updateNewTraveler(i, 'stay_start', e.target.value)} />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={t.stay_end || ''} onChange={e => updateNewTraveler(i, 'stay_end', e.target.value)} />
                      <button className="v-inbox-edit-remove" onClick={() => removeNewTraveler(i)} title="Remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {editData.logistics?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Logistics</div>
                  {editData.logistics.map((l, i) => (
                    <div key={i} className="v-inbox-edit-row">
                      <input className="v-form-input v-inbox-edit-input v-inbox-edit-input-sm" value={l.type} onChange={e => updateLogistic(i, 'type', e.target.value)} placeholder="Type" />
                      <input className="v-form-input v-inbox-edit-input" value={l.title} onChange={e => updateLogistic(i, 'title', e.target.value)} placeholder="Title" />
                      <input className="v-form-input v-inbox-edit-input" value={l.person_name || ''} onChange={e => updateLogistic(i, 'person_name', e.target.value)} placeholder="Person" />
                      <input className="v-form-input v-inbox-edit-input" value={l.start_time || ''} onChange={e => updateLogistic(i, 'start_time', e.target.value)} placeholder="Time" />
                      <button className="v-inbox-edit-remove" onClick={() => removeLogistic(i)} title="Remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}

              {editData.events?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Events</div>
                  {editData.events.map((ev, i) => (
                    <div key={i} className="v-inbox-edit-row">
                      <input className="v-form-input v-inbox-edit-input v-inbox-edit-input-sm" value={ev.category} onChange={e => updateEvent(i, 'category', e.target.value)} placeholder="Category" />
                      <input className="v-form-input v-inbox-edit-input" value={ev.title} onChange={e => updateEvent(i, 'title', e.target.value)} placeholder="Title" />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={ev.event_date || ''} onChange={e => updateEvent(i, 'event_date', e.target.value)} />
                      <input className="v-form-input v-inbox-edit-input v-inbox-edit-input-sm" value={ev.start_time || ''} onChange={e => updateEvent(i, 'start_time', e.target.value)} placeholder="Time" />
                      <input className="v-form-input v-inbox-edit-input" value={ev.location || ''} onChange={e => updateEvent(i, 'location', e.target.value)} placeholder="Location" />
                      <button className="v-inbox-edit-remove" onClick={() => removeEvent(i)} title="Remove">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="v-parsed-results">
              <div className="v-parsed-summary" style={{ color: 'var(--v-champagne)' }}>
                Applied! Updated {result.updated} member{result.updated !== 1 ? 's' : ''}
                {result.members_added > 0 && `, added ${result.members_added} new member${result.members_added !== 1 ? 's' : ''}`}
                {result.logistics_added > 0 && `, added ${result.logistics_added} logistics entr${result.logistics_added !== 1 ? 'ies' : 'y'}`}
                {result.events_added > 0 && `, created ${result.events_added} event${result.events_added !== 1 ? 's' : ''}`}.
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--v-cinnabar)', fontSize: '0.875rem', marginTop: 8 }}>{error}</div>
          )}

          {email.status === 'pending' && isOwner && parsed && !result && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                className="v-btn v-btn-primary"
                onClick={handleAccept}
                disabled={applying}
              >
                {applying ? 'Accepting...' : 'Accept'}
              </button>
              {!editing ? (
                <button
                  className="v-btn v-btn-secondary"
                  onClick={startEditing}
                >
                  Edit
                </button>
              ) : (
                <button
                  className="v-btn v-btn-secondary"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              )}
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
