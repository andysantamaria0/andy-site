'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function StayDatesEditor({ membership, tripStart, tripEnd }) {
  const supabase = createClient();
  const router = useRouter();
  const [stayStart, setStayStart] = useState(membership.stay_start || '');
  const [stayEnd, setStayEnd] = useState(membership.stay_end || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('trip_members')
      .update({
        stay_start: stayStart || null,
        stay_end: stayEnd || null,
      })
      .eq('id', membership.id);

    setSaving(false);
    if (error) {
      setStatus('error');
    } else {
      setStatus('saved');
      router.refresh();
      setTimeout(() => setStatus(null), 2000);
    }
  }

  return (
    <div className="v-stay-editor">
      <div className="v-stay-editor-label">Your stay dates</div>
      <div className="v-stay-editor-row">
        <div className="v-stay-editor-field">
          <label className="v-stay-editor-sublabel">Arriving</label>
          <input
            className="v-form-input"
            type="date"
            value={stayStart}
            min={tripStart || undefined}
            max={tripEnd || undefined}
            onChange={(e) => setStayStart(e.target.value)}
          />
        </div>
        <div className="v-stay-editor-field">
          <label className="v-stay-editor-sublabel">Departing</label>
          <input
            className="v-form-input"
            type="date"
            value={stayEnd}
            min={stayStart || tripStart || undefined}
            max={tripEnd || undefined}
            onChange={(e) => setStayEnd(e.target.value)}
          />
        </div>
        <button
          className="v-btn v-btn-primary"
          onClick={handleSave}
          disabled={saving || !stayStart || !stayEnd}
          style={{ alignSelf: 'flex-end' }}
        >
          {saving ? 'Saving...' : status === 'saved' ? 'Saved' : 'Save'}
        </button>
        {status === 'error' && (
          <span style={{ color: 'var(--v-cinnabar)', fontSize: '0.75rem', alignSelf: 'flex-end' }}>
            Failed to save. Try again.
          </span>
        )}
      </div>
    </div>
  );
}
