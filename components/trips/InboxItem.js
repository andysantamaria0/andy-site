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

  function updateExpense(index, field, value) {
    setEditData(prev => {
      const next = { ...prev, expenses: [...(prev.expenses || [])] };
      next.expenses[index] = { ...next.expenses[index], [field]: value };
      return next;
    });
  }

  function removeExpense(index) {
    setEditData(prev => ({
      ...prev,
      expenses: (prev.expenses || []).filter((_, i) => i !== index),
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
          expenses: data.expenses,
        }),
      });
      const applyData = await applyRes.json();
      setResult(applyData);

      const totalApplied = (applyData.updated || 0) + (applyData.members_added || 0) +
        (applyData.logistics_added || 0) + (applyData.events_added || 0) + (applyData.expenses_added || 0);

      if (totalApplied > 0 || !applyData.errors?.length) {
        await fetch(`/trips/${tripId}/inbox/${email.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'applied' }),
        });
      }

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
                : email.channel === 'whatsapp'
                  ? (email.text_body ? email.text_body.slice(0, 60) : 'WhatsApp Media')
                  : (email.subject || '(no subject)')
            }
          </span>
          <span className="v-inbox-item-meta">
            {email.whatsapp_sender_name || email.from_name || email.from_email} &middot; {dateStr}
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
          {email.auto_applied_items && email.auto_applied_items.length > 0 && (
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--v-champagne)',
              marginBottom: 12,
              padding: '8px 12px',
              background: 'rgba(196, 167, 125, 0.08)',
              borderLeft: '3px solid var(--v-champagne)',
              borderRadius: '2px',
            }}>
              Auto-applied: {email.auto_applied_items.map((item) =>
                item.item_type === 'member_update'
                  ? `${item.name} dates updated`
                  : item.item_type === 'expense'
                    ? `${item.vendor || item.description}${item.amount ? ` ($${item.amount})` : ''}`
                    : item.title || `${item.type} added`
              ).join(', ')}
            </div>
          )}

          {email.parse_error && (
            <div className="v-error" style={{ marginBottom: 12 }}>
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

              {parsed.expenses?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Expenses</div>
                  {parsed.expenses.map((ex, i) => (
                    <div key={i} className="v-parsed-item">
                      <span className="v-badge v-badge-member" style={{ marginRight: 8 }}>{ex.category || 'other'}</span>
                      <span className="v-parsed-item-name">{ex.vendor || ex.description}</span>
                      <span className="v-parsed-item-detail">
                        {ex.currency || 'USD'} {ex.amount}{ex.payer_name ? ` — paid by ${ex.payer_name}` : ''}{ex.expense_date ? ` — ${ex.expense_date}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {parsed.notes && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Notes</div>
                  <p className="v-hint">{parsed.notes}</p>
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

              {editData.expenses?.length > 0 && (
                <div className="v-parsed-section">
                  <div className="v-parsed-section-title">Expenses</div>
                  {editData.expenses.map((ex, i) => (
                    <div key={i} className="v-inbox-edit-row">
                      <input className="v-form-input v-inbox-edit-input v-inbox-edit-input-sm" value={ex.category || 'other'} onChange={e => updateExpense(i, 'category', e.target.value)} placeholder="Category" />
                      <input className="v-form-input v-inbox-edit-input" value={ex.vendor || ''} onChange={e => updateExpense(i, 'vendor', e.target.value)} placeholder="Vendor" />
                      <input className="v-form-input v-inbox-edit-input" value={ex.description || ''} onChange={e => updateExpense(i, 'description', e.target.value)} placeholder="Description" />
                      <input className="v-form-input v-inbox-edit-input v-inbox-edit-input-sm" type="number" step="0.01" value={ex.amount || ''} onChange={e => updateExpense(i, 'amount', parseFloat(e.target.value) || 0)} placeholder="Amount" />
                      <input className="v-form-input v-inbox-edit-input" value={ex.payer_name || ''} onChange={e => updateExpense(i, 'payer_name', e.target.value)} placeholder="Payer" />
                      <input className="v-form-input v-inbox-edit-input" type="date" value={ex.expense_date || ''} onChange={e => updateExpense(i, 'expense_date', e.target.value)} />
                      <button className="v-inbox-edit-remove" onClick={() => removeExpense(i)} title="Remove">&times;</button>
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
                {result.events_added > 0 && `, created ${result.events_added} event${result.events_added !== 1 ? 's' : ''}`}
                {result.expenses_added > 0 && `, added ${result.expenses_added} expense${result.expenses_added !== 1 ? 's' : ''}`}.
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {result.errors.map((err, i) => (
                    <div key={i} className="v-error" style={{ marginTop: 4 }}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="v-error" style={{ marginTop: 8 }}>{error}</div>
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
