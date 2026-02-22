'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import MemberAvatar from './MemberAvatar';

export default function LegManager({ tripId, legs, members }) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState(null); // string key like 'add', 'save-<id>', 'delete-<id>', 'toggle-<id>-<mid>'
  const [error, setError] = useState(null);
  const [editingLeg, setEditingLeg] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newDest, setNewDest] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [editDest, setEditDest] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const newDestRef = useRef(null);

  const busy = busyAction !== null;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  async function handleAdd() {
    if (!newDest.trim()) return;
    setBusyAction('add');
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/legs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: newDest.trim(),
          start_date: newStart || undefined,
          end_date: newEnd || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed (${res.status})`);
        setBusyAction(null);
        return;
      }
      setAdding(false);
      setNewDest('');
      setNewStart('');
      setNewEnd('');
    } catch (e) {
      setError(e.message);
    }
    setBusyAction(null);
    refresh();
  }

  async function deleteLeg(legId) {
    setRemovingId(legId);
    setBusyAction(`delete-${legId}`);
    setError(null);
    // Brief delay so the fade-out animation plays
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`/api/trips/${tripId}/legs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: legId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed (${res.status})`);
        setRemovingId(null);
      }
    } catch (e) {
      setError(e.message);
      setRemovingId(null);
    }
    setBusyAction(null);
    refresh();
  }

  function startEdit(leg) {
    setEditingLeg(leg.id);
    setEditDest(leg.destination);
    setEditStart(leg.start_date || '');
    setEditEnd(leg.end_date || '');
  }

  async function saveEdit(legId) {
    if (!editDest.trim()) return;
    setBusyAction(`save-${legId}`);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/legs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: legId,
          destination: editDest.trim(),
          start_date: editStart,
          end_date: editEnd,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed (${res.status})`);
        setBusyAction(null);
        return;
      }
    } catch (e) {
      setError(e.message);
      setBusyAction(null);
      return;
    }
    setEditingLeg(null);
    setBusyAction(null);
    refresh();
  }

  async function toggleMember(legId, memberId, isAssigned) {
    const key = `toggle-${legId}-${memberId}`;
    setBusyAction(key);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Failed (${res.status})`);
      }
    } catch (e) {
      setError(e.message);
    }
    setBusyAction(null);
    refresh();
  }

  function openAddForm() {
    setAdding(true);
    setNewDest('');
    setNewStart('');
    setNewEnd('');
    setError(null);
    setTimeout(() => newDestRef.current?.focus(), 50);
  }

  return (
    <div className="v-leg-manager">
      <div className="v-leg-manager-header">
        <h3 className="v-section-title" style={{ margin: 0 }}>Trip Legs</h3>
        {!adding && (
          <button
            className="v-btn v-btn-secondary"
            onClick={openAddForm}
            disabled={busy}
            style={{ fontSize: '0.8rem', padding: '4px 12px' }}
          >
            + Add Destination
          </button>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--v-cinnabar)', fontSize: '0.85rem', marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div className="v-leg-list">
        {(legs || []).map((leg, i) => {
          const assignedMemberIds = new Set(
            (leg.trip_leg_members || []).map((tlm) => tlm.member_id)
          );
          const isEditing = editingLeg === leg.id;
          const isRemoving = removingId === leg.id;

          return (
            <div
              key={leg.id}
              className="v-leg-card"
              style={{
                opacity: isRemoving ? 0 : 1,
                transform: isRemoving ? 'scale(0.95)' : 'scale(1)',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
            >
              <div className="v-leg-card-order">{i + 1}</div>
              <div className="v-leg-card-body">
                <div className="v-leg-card-header">
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <input
                        className="v-form-input"
                        value={editDest}
                        onChange={(e) => setEditDest(e.target.value)}
                        placeholder="Destination"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(leg.id)}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="v-form-input"
                          type="date"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                        />
                        <input
                          className="v-form-input"
                          type="date"
                          value={editEnd}
                          min={editStart || undefined}
                          onChange={(e) => setEditEnd(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="v-btn v-btn-primary"
                          onClick={() => saveEdit(leg.id)}
                          disabled={busy || !editDest.trim()}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          {busyAction === `save-${leg.id}` ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="v-btn v-btn-secondary"
                          onClick={() => setEditingLeg(null)}
                          disabled={busy}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ flex: 1 }}>
                        <div className="v-leg-card-destination">{leg.destination}</div>
                        {leg.start_date && leg.end_date && (
                          <div className="v-leg-card-dates">
                            {new Date(leg.start_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' — '}
                            {new Date(leg.end_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="v-btn-link"
                          onClick={() => startEdit(leg)}
                          disabled={busy}
                          style={{ fontSize: '0.75rem' }}
                        >
                          edit
                        </button>
                        {(legs || []).length > 1 && (
                          <button
                            className="v-btn-link"
                            onClick={() => deleteLeg(leg.id)}
                            disabled={busy}
                            style={{ fontSize: '0.75rem', color: 'var(--v-cinnabar)' }}
                          >
                            {busyAction === `delete-${leg.id}` ? 'removing...' : 'remove'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="v-leg-card-members">
                  {(members || []).map((member) => {
                    const info = getMemberDisplayInfo(member);
                    const isAssigned = assignedMemberIds.has(member.id);
                    const toggleKey = `toggle-${leg.id}-${member.id}`;
                    return (
                      <label key={member.id} className="v-leg-member-toggle">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleMember(leg.id, member.id, isAssigned)}
                          disabled={busy}
                        />
                        <MemberAvatar
                          member={{
                            display_name: info.name,
                            avatar_url: info.avatarUrl,
                            email: info.email,
                            color: info.color,
                          }}
                          size={20}
                        />
                        <span className="v-leg-member-name">
                          {busyAction === toggleKey ? '...' : info.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Inline add form */}
        {adding && (
          <div className="v-leg-card v-leg-card-adding">
            <div className="v-leg-card-order">{(legs || []).length + 1}</div>
            <div className="v-leg-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  ref={newDestRef}
                  className="v-form-input"
                  value={newDest}
                  onChange={(e) => setNewDest(e.target.value)}
                  placeholder="Where to next?"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="v-form-input"
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    placeholder="Start"
                  />
                  <input
                    className="v-form-input"
                    type="date"
                    value={newEnd}
                    min={newStart || undefined}
                    onChange={(e) => setNewEnd(e.target.value)}
                    placeholder="End"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="v-btn v-btn-primary"
                    onClick={handleAdd}
                    disabled={busy || !newDest.trim()}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {busyAction === 'add' ? 'Adding...' : 'Add Leg'}
                  </button>
                  <button
                    className="v-btn v-btn-secondary"
                    onClick={() => setAdding(false)}
                    disabled={busy}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
