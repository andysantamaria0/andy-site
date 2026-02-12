'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { formatDateRange } from '../../lib/utils/dates';

export default function TripDatesEditor({ trip }) {
  const supabase = createClient();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [startDate, setStartDate] = useState(trip.start_date || '');
  const [endDate, setEndDate] = useState(trip.end_date || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('trips')
      .update({
        start_date: startDate || null,
        end_date: endDate || null,
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
      <div className="v-overview-card" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        <div className="v-overview-card-label">Dates</div>
        <div className="v-overview-card-value" style={{ fontSize: '1.125rem' }}>
          {trip.start_date && trip.end_date
            ? formatDateRange(trip.start_date, trip.end_date)
            : 'Not set'}
        </div>
        <div className="v-overview-card-sub" style={{ fontSize: '0.7rem', opacity: 0.5 }}>tap to edit</div>
      </div>
    );
  }

  return (
    <div className="v-overview-card">
      <div className="v-overview-card-label">Trip Dates</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <input
          className="v-form-input"
          type="date"
          value={startDate}
          onChange={(e) => {
            const val = e.target.value;
            setStartDate(val);
            if (val && (!endDate || endDate < val)) {
              setEndDate(val);
            }
          }}
          style={{ fontSize: '0.85rem' }}
        />
        <span style={{ color: 'var(--v-pearl-dim)', fontSize: '0.75rem' }}>to</span>
        <input
          className="v-form-input"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ fontSize: '0.85rem' }}
        />
      </div>
      {error && <div style={{ color: 'var(--v-cinnabar)', fontSize: '0.75rem', marginTop: 4 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="v-btn v-btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          {saving ? '...' : 'Save'}
        </button>
        <button className="v-btn v-btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
