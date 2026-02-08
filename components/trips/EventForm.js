'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { CATEGORY_EMOJI } from './EventCard';

export default function EventForm({ tripId, members, event, initialDate, onClose }) {
  const router = useRouter();
  const supabase = createClient();
  const overlayRef = useRef(null);

  const isEdit = !!event;
  const existingAttendeeIds = (event?.event_attendees || []).map((a) => a.member_id);

  const [title, setTitle] = useState(event?.title || '');
  const [category, setCategory] = useState(event?.category || 'other');
  const [eventDate, setEventDate] = useState(event?.event_date || initialDate || '');
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) || '');
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) || '');
  const [location, setLocation] = useState(event?.location || '');
  const [notes, setNotes] = useState(event?.notes || '');
  const [selectedMembers, setSelectedMembers] = useState(
    isEdit ? (existingAttendeeIds.length > 0 ? existingAttendeeIds : []) : []
  );
  const [everyoneInvited, setEveryoneInvited] = useState(
    isEdit ? existingAttendeeIds.length === 0 : true
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function toggleMember(memberId) {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setSaving(true);
    setError(null);

    const eventData = {
      trip_id: tripId,
      title: title.trim(),
      category,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };

    let eventId = event?.id;

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      eventData.created_by = user.id;
      const { data, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      eventId = data.id;
    }

    // Sync attendees: delete all then re-insert
    if (isEdit) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId);
    }

    if (!everyoneInvited && selectedMembers.length > 0) {
      const rows = selectedMembers.map((member_id) => ({
        event_id: eventId,
        member_id,
      }));
      const { error: attendeeError } = await supabase
        .from('event_attendees')
        .insert(rows);
      if (attendeeError) {
        setError(attendeeError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!confirm('Delete this event?')) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    setDeleting(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="v-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="v-modal">
        <div className="v-modal-header">
          <h3 className="v-section-title" style={{ marginBottom: 0 }}>
            {isEdit ? 'Edit Event' : 'Add Event'}
          </h3>
          <button className="v-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="v-form-group">
            <label className="v-form-label">Title</label>
            <input
              className="v-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at the harbor"
              required
            />
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Category</label>
              <select
                className="v-form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(CATEGORY_EMOJI).map(([key, { emoji, label }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div className="v-form-group">
              <label className="v-form-label">Date</label>
              <input
                className="v-form-input"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Start time</label>
              <input
                className="v-form-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="v-form-group">
              <label className="v-form-label">End time</label>
              <input
                className="v-form-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="v-form-group">
            <label className="v-form-label">Location</label>
            <input
              className="v-form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ristorante Da Mario"
            />
          </div>

          <div className="v-form-group">
            <label className="v-form-label">Notes</label>
            <textarea
              className="v-form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <div className="v-form-group">
            <label className="v-form-label">Attendees</label>
            <label className="v-checkbox-row">
              <input
                type="checkbox"
                checked={everyoneInvited}
                onChange={(e) => setEveryoneInvited(e.target.checked)}
              />
              <span>Everyone invited</span>
            </label>
            {!everyoneInvited && (
              <div className="v-attendee-list">
                {(members || []).map((m) => {
                  const profile = m.profiles;
                  const name = profile?.display_name || profile?.email || 'Member';
                  return (
                    <label key={m.id} className="v-checkbox-row">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                      />
                      <span>{name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--v-coral)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</div>
          )}

          <div className="v-form-actions">
            <button className="v-btn v-btn-primary" type="submit" disabled={saving || !title.trim() || !eventDate}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
            {isEdit && (
              <button
                className="v-btn v-btn-danger"
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button className="v-btn v-btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
