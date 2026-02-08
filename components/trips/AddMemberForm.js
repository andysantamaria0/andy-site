'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getNextColor } from '../../lib/utils/members';

export default function AddMemberForm({ tripId, tripStart, tripEnd, existingMembers }) {
  const supabase = createClient();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stayStart, setStayStart] = useState('');
  const [stayEnd, setStayEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const color = getNextColor(existingMembers);

    const { error: insertError } = await supabase
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
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStayStart('');
      setStayEnd('');
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        className="v-btn v-btn-secondary"
        onClick={() => setOpen(true)}
        style={{ marginBottom: 16 }}
      >
        + Add Member
      </button>
    );
  }

  return (
    <div className="v-add-member-form" style={{ marginBottom: 16, padding: 16, background: 'var(--v-surface)', borderRadius: 12 }}>
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
          <div style={{ color: 'var(--v-coral)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="v-btn v-btn-primary" type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Adding...' : 'Add Member'}
          </button>
          <button className="v-btn v-btn-secondary" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
