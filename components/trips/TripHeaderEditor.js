'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function TripHeaderEditor({ trip }) {
  const supabase = createClient();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trip.name || '');
  const [destination, setDestination] = useState(trip.destination || '');
  const [description, setDescription] = useState(trip.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!name.trim() || !destination.trim()) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim() || null,
      })
      .eq('id', trip.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <>
        <div className="v-trip-header-top">
          <h1 className="v-trip-name" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>{trip.name}</h1>
          <a href="/trips" className="v-back">&larr; All Trips</a>
        </div>
        <div className="v-trip-destination" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>{trip.destination}</div>
      </>
    );
  }

  return (
    <>
      <div className="v-trip-header-top">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="v-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Trip name"
            style={{ fontSize: '1.25rem', fontWeight: 700 }}
          />
          <input
            className="v-form-input"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
          />
          <textarea
            className="v-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          {error && <div style={{ color: 'var(--v-coral)', fontSize: '0.75rem' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="v-btn v-btn-primary" onClick={handleSave} disabled={saving || !name.trim() || !destination.trim()} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              {saving ? '...' : 'Save'}
            </button>
            <button className="v-btn v-btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              Cancel
            </button>
          </div>
        </div>
        <a href="/trips" className="v-back">&larr; All Trips</a>
      </div>
    </>
  );
}
