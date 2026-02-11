'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TravelLogEntry({ log, photos, tripId, isOwner }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(log.edited_body || log.body);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const displayBody = log.edited_body || log.body;

  const dateStr = new Date(log.log_date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/trips/${tripId}/journal/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edited_body: editBody }),
      });
      setEditing(false);
      router.refresh();
    } catch (e) {
      console.error('Failed to save edit:', e);
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await fetch(`/trips/${tripId}/journal/${log.id}`, {
        method: 'POST',
      });
      router.refresh();
    } catch (e) {
      console.error('Failed to regenerate:', e);
    }
    setRegenerating(false);
  }

  return (
    <div className="v-journal-entry">
      <div className="v-journal-date">{dateStr}</div>

      {log.title && <h3 className="v-journal-title">{log.title}</h3>}

      {editing ? (
        <div className="v-journal-edit">
          <textarea
            className="v-form-textarea v-journal-edit-textarea"
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={8}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="v-btn v-btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="v-btn v-btn-secondary"
              onClick={() => { setEditing(false); setEditBody(log.edited_body || log.body); }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="v-journal-body">
          {displayBody.split('\n\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="v-journal-photos">
          {photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.storage_url}
              alt={photo.caption || ''}
              className="v-journal-photo"
            />
          ))}
        </div>
      )}

      {isOwner && !editing && (
        <div className="v-journal-actions">
          <button
            className="v-btn v-btn-secondary v-btn-sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button
            className="v-btn v-btn-secondary v-btn-sm"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  );
}
