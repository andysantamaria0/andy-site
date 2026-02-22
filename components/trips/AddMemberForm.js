'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getNextColor } from '../../lib/utils/members';

export default function AddMemberForm({ tripId, tripStart, tripEnd, existingMembers, legs = [] }) {
  const supabase = createClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('search'); // 'search' | 'detail'
  const [contacts, setContacts] = useState([]);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stayStart, setStayStart] = useState('');
  const [stayEnd, setStayEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetch('/api/contacts')
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setContacts(data); })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open && mode === 'search' && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, mode]);

  function reset() {
    setMode('search');
    setQuery('');
    setName('');
    setEmail('');
    setPhone('');
    setStayStart('');
    setStayEnd('');
    setError(null);
  }

  function selectContact(contact) {
    setName(contact.display_name);
    setEmail(contact.email || '');
    setPhone(contact.phone || '');
    setMode('detail');
  }

  function selectNewName() {
    setName(query.trim());
    setMode('detail');
  }

  const filtered = query.trim()
    ? contacts.filter((c) =>
        c.display_name.toLowerCase().includes(query.trim().toLowerCase())
      )
    : contacts;

  const exactMatch = query.trim() && contacts.some(
    (c) => c.display_name.toLowerCase() === query.trim().toLowerCase()
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const color = getNextColor(existingMembers);

    const { data: newMember, error: insertError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: tripId,
        user_id: null,
        role: 'member',
        display_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        stay_start: stayStart || null,
        stay_end: stayEnd || null,
        color,
      })
      .select('id')
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      // Auto-assign new member to all legs
      if (newMember && legs.length > 0) {
        const legAssignments = legs.map((leg) => ({
          leg_id: leg.id,
          member_id: newMember.id,
        }));
        await supabase.from('trip_leg_members').insert(legAssignments);
      }
      // Send invite email if member has an email
      if (email.trim()) {
        fetch(`/api/trips/${tripId}/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), name: name.trim() }),
        }).catch(() => {});
      }
      // Save/update contact in background
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      }).catch(() => {});

      reset();
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        className="v-btn v-btn-secondary"
        onClick={() => { reset(); setOpen(true); }}
        style={{ marginBottom: 16 }}
      >
        + Add Member
      </button>
    );
  }

  return (
    <div className="v-add-member-form" style={{ marginBottom: 16, padding: 16, background: 'var(--v-surface)', borderRadius: 12 }}>
      {mode === 'search' ? (
        <div>
          <input
            ref={searchRef}
            className="v-form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or add someone..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                e.preventDefault();
                if (filtered.length === 1) {
                  selectContact(filtered[0]);
                } else if (!exactMatch) {
                  selectNewName();
                }
              }
            }}
          />

          {query.trim() && filtered.length > 0 && (
            <div className="v-contact-results">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="v-contact-row"
                  onClick={() => selectContact(c)}
                >
                  <span className="v-contact-name">{c.display_name}</span>
                  {c.email && <span className="v-contact-detail">{c.email}</span>}
                </button>
              ))}
            </div>
          )}

          {!query.trim() && contacts.length > 0 && (
            <div className="v-contact-results">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="v-contact-row"
                  onClick={() => selectContact(c)}
                >
                  <span className="v-contact-name">{c.display_name}</span>
                  {c.email && <span className="v-contact-detail">{c.email}</span>}
                </button>
              ))}
            </div>
          )}

          {query.trim() && !exactMatch && (
            <button
              type="button"
              className="v-contact-row v-contact-new"
              onClick={selectNewName}
            >
              Add <strong>{query.trim()}</strong> as new contact
            </button>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="v-btn v-btn-secondary" type="button" onClick={() => { reset(); setOpen(false); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="v-form-group">
            <label className="v-form-label">Name *</label>
            <input
              className="v-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Miller"
              required
            />
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Email</label>
              <input
                className="v-form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
              />
            </div>
            <div className="v-form-group">
              <label className="v-form-label">Phone</label>
              <input
                className="v-form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-1234"
              />
            </div>
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Arrival</label>
              <input
                className="v-form-input"
                type="date"
                value={stayStart}
                min={tripStart || undefined}
                max={tripEnd || undefined}
                onChange={(e) => setStayStart(e.target.value)}
              />
            </div>
            <div className="v-form-group">
              <label className="v-form-label">Departure</label>
              <input
                className="v-form-input"
                type="date"
                value={stayEnd}
                min={stayStart || tripStart || undefined}
                max={tripEnd || undefined}
                onChange={(e) => setStayEnd(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="v-error" style={{ marginBottom: 12 }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="v-btn v-btn-primary" type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Adding...' : 'Add Member'}
            </button>
            <button className="v-btn v-btn-secondary" type="button" onClick={() => setMode('search')}>
              Back
            </button>
            <button className="v-btn v-btn-secondary" type="button" onClick={() => { reset(); setOpen(false); }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
