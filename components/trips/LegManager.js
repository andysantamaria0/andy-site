'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import MemberAvatar from './MemberAvatar';

export default function LegManager({ tripId, legs, members }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);
  const [editDest, setEditDest] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  async function addLeg() {
    setLoading(true);
    await fetch(`/api/trips/${tripId}/legs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: 'New Destination' }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteLeg(legId) {
    setLoading(true);
    await fetch(`/api/trips/${tripId}/legs`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: legId }),
    });
    setLoading(false);
    router.refresh();
  }

  function startEdit(leg) {
    setEditingLeg(leg.id);
    setEditDest(leg.destination);
    setEditStart(leg.start_date || '');
    setEditEnd(leg.end_date || '');
  }

  async function saveEdit(legId) {
    setLoading(true);
    await fetch(`/api/trips/${tripId}/legs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: legId,
        destination: editDest,
        start_date: editStart,
        end_date: editEnd,
      }),
    });
    setEditingLeg(null);
    setLoading(false);
    router.refresh();
  }

  async function toggleMember(legId, memberId, isAssigned) {
    setLoading(true);
    if (isAssigned) {
      await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });
    } else {
      await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId }),
      });
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="v-leg-manager">
      <div className="v-leg-manager-header">
        <h3 className="v-section-title" style={{ margin: 0 }}>Trip Legs</h3>
        <button
          className="v-btn v-btn-secondary"
          onClick={addLeg}
          disabled={loading}
          style={{ fontSize: '0.8rem', padding: '4px 12px' }}
        >
          + Add Destination
        </button>
      </div>

      <div className="v-leg-list">
        {(legs || []).map((leg) => {
          const assignedMemberIds = new Set(
            (leg.trip_leg_members || []).map((tlm) => tlm.member_id)
          );
          const isEditing = editingLeg === leg.id;

          return (
            <div key={leg.id} className="v-leg-card">
              <div className="v-leg-card-header">
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <input
                      className="v-form-input"
                      value={editDest}
                      onChange={(e) => setEditDest(e.target.value)}
                      placeholder="Destination"
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
                        disabled={loading || !editDest.trim()}
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        Save
                      </button>
                      <button
                        className="v-btn v-btn-secondary"
                        onClick={() => setEditingLeg(null)}
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
                          {leg.start_date} — {leg.end_date}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="v-btn-link"
                        onClick={() => startEdit(leg)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        edit
                      </button>
                      {(legs || []).length > 1 && (
                        <button
                          className="v-btn-link"
                          onClick={() => deleteLeg(leg.id)}
                          disabled={loading}
                          style={{ fontSize: '0.75rem', color: 'var(--v-cinnabar)' }}
                        >
                          remove
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
                  return (
                    <label key={member.id} className="v-leg-member-toggle">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleMember(leg.id, member.id, isAssigned)}
                        disabled={loading}
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
                      <span className="v-leg-member-name">{info.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
