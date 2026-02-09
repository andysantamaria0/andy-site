'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function TripCodeEditor({ tripId, initialCode, initialKeywords }) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [keywords, setKeywords] = useState(initialKeywords.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    const trimmedCode = code.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!trimmedCode) {
      setError('Trip code cannot be empty');
      return;
    }
    if (trimmedCode.length > 20) {
      setError('Trip code must be 20 characters or less');
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const keywordsArr = keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from('trips')
      .update({ trip_code: trimmedCode, trip_keywords: keywordsArr })
      .eq('id', tripId);

    if (updateError) {
      if (updateError.message.includes('unique') || updateError.message.includes('duplicate')) {
        setError('This trip code is already taken');
      } else {
        setError(updateError.message);
      }
    } else {
      setCode(trimmedCode);
      setEditing(false);
    }
    setSaving(false);
  }

  if (!editing) {
    return (
      <div>
        <div className="v-trip-code" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
          {code || '—'}
        </div>
        <div className="v-overview-card-sub">
          Use this code when messaging the concierge
          <button
            className="v-btn-link"
            onClick={() => setEditing(true)}
            style={{ marginLeft: 8, fontSize: '0.75rem' }}
          >
            edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        className="v-form-input"
        value={code}
        onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        placeholder="trip-code"
        style={{ fontSize: '1rem', marginBottom: 6, width: '100%' }}
      />
      <input
        className="v-form-input"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        placeholder="keywords (comma-separated)"
        style={{ fontSize: '0.8125rem', marginBottom: 8, width: '100%' }}
      />
      {error && (
        <div style={{ color: 'var(--v-coral)', fontSize: '0.75rem', marginBottom: 6 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="v-btn v-btn-primary" onClick={handleSave} disabled={saving} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="v-btn v-btn-secondary" onClick={() => { setEditing(false); setCode(initialCode); setKeywords(initialKeywords.join(', ')); setError(null); }} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
