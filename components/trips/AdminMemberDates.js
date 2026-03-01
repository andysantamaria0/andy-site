'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import { formatDateRange } from '../../lib/utils/dates';

export default function AdminMemberDates({ member, tripStart, tripEnd, legs = [], tripId }) {
  const supabase = createClient();
  const router = useRouter();
  const info = getMemberDisplayInfo(member);
  const [stayStart, setStayStart] = useState(member.stay_start || '');
  const [stayEnd, setStayEnd] = useState(member.stay_end || '');
  const [stayingAt, setStayingAt] = useState(member.staying_at || '');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [editingChipLeg, setEditingChipLeg] = useState(null);
  const [chipStayStart, setChipStayStart] = useState('');
  const [chipStayEnd, setChipStayEnd] = useState('');
  const [chipSaving, setChipSaving] = useState(false);

  const isMultiLeg = legs.length > 1;

  // Build lookup of leg IDs this member is assigned to, with tlm record
  const memberTlmByLeg = {};
  for (const leg of legs) {
    for (const tlm of (leg.trip_leg_members || [])) {
      if (tlm.member_id === member.id) memberTlmByLeg[leg.id] = tlm;
    }
  }
  const assignedLegIds = new Set(Object.keys(memberTlmByLeg));

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    const { error } = await supabase
      .from('trip_members')
      .update({
        stay_start: stayStart || null,
        stay_end: stayEnd || null,
        staying_at: stayingAt || null,
      })
      .eq('id', member.id);

    setSaving(false);
    if (error) {
      console.error('Save error:', error);
      setStatus('error');
    } else {
      setStatus('saved');
      router.refresh();
      setTimeout(() => setStatus(null), 2000);
    }
  }

  async function toggleLeg(legId, isAssigned) {
    if (!tripId) return;
    setToggling(true);
    if (isAssigned) {
      await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id }),
      });
    } else {
      await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: member.id }),
      });
    }
    setToggling(false);
    router.refresh();
  }

  function openChipDates(legId) {
    const tlm = memberTlmByLeg[legId];
    setEditingChipLeg(legId);
    setChipStayStart(tlm?.stay_start || '');
    setChipStayEnd(tlm?.stay_end || '');
  }

  async function saveChipDates(legId) {
    if (!tripId) return;
    setChipSaving(true);
    await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: member.id,
        stay_start: chipStayStart || null,
        stay_end: chipStayEnd || null,
      }),
    });
    setChipSaving(false);
    setEditingChipLeg(null);
    router.refresh();
  }

  async function removeFromLeg(legId) {
    if (!tripId) return;
    setToggling(true);
    await fetch(`/api/trips/${tripId}/legs/${legId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: member.id }),
    });
    setToggling(false);
    setEditingChipLeg(null);
    router.refresh();
  }

  const changed = stayStart !== (member.stay_start || '') || stayEnd !== (member.stay_end || '') || stayingAt !== (member.staying_at || '');

  return (
    <div className={`v-admin-member-row${isMultiLeg ? ' v-admin-member-row-multileg' : ''}`}>
      <div style={{ flex: 1 }}>
        <div className="v-member-name">
          {info.name}
        </div>
        <span className={`v-badge ${member.role === 'owner' ? 'v-badge-owner' : 'v-badge-member'}`}>
          {member.role}
        </span>
        {!member.user_id && (
          <div style={{ fontSize: '0.75rem', color: 'var(--v-pearl-dim)', marginTop: 2 }}>
            {[info.email, member.phone].filter(Boolean).join(' \u00B7 ')}
          </div>
        )}
      </div>

      {isMultiLeg ? (
        <div className="v-leg-chips-section">
          <div className="v-leg-chips">
            {legs.map((leg) => {
              const isAssigned = assignedLegIds.has(leg.id);
              const tlm = memberTlmByLeg[leg.id];
              const hasOverride = tlm && (tlm.stay_start || tlm.stay_end);
              const effectiveStart = tlm?.stay_start || leg.start_date;
              const effectiveEnd = tlm?.stay_end || leg.end_date;
              return (
                <div key={leg.id} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`v-leg-chip${isAssigned ? ' v-leg-chip-active' : ''}`}
                    onClick={() => isAssigned ? openChipDates(leg.id) : toggleLeg(leg.id, false)}
                    disabled={toggling}
                  >
                    {isAssigned ? '\u2713' : ''} {leg.destination}
                  </button>
                  {isAssigned && effectiveStart && effectiveEnd && (
                    <div className="v-leg-chip-dates">
                      {new Date(effectiveStart + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(effectiveEnd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {hasOverride && ' *'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {editingChipLeg && assignedLegIds.has(editingChipLeg) && (() => {
            const leg = legs.find((l) => l.id === editingChipLeg);
            if (!leg) return null;
            return (
              <div className="v-leg-member-date-editor" style={{ marginTop: 6 }}>
                <input
                  className="v-form-input"
                  type="date"
                  value={chipStayStart}
                  min={leg.start_date || undefined}
                  max={leg.end_date || undefined}
                  onChange={(e) => setChipStayStart(e.target.value)}
                />
                <span style={{ color: 'var(--v-pearl-dim)', fontSize: '0.7rem' }}>to</span>
                <input
                  className="v-form-input"
                  type="date"
                  value={chipStayEnd}
                  min={chipStayStart || leg.start_date || undefined}
                  max={leg.end_date || undefined}
                  onChange={(e) => setChipStayEnd(e.target.value)}
                />
                <button
                  className="v-btn v-btn-primary"
                  onClick={() => saveChipDates(editingChipLeg)}
                  disabled={chipSaving}
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                >
                  {chipSaving ? '...' : 'Save'}
                </button>
                <button
                  className="v-btn-link"
                  onClick={() => setEditingChipLeg(null)}
                  style={{ fontSize: '0.7rem' }}
                >
                  cancel
                </button>
                <button
                  className="v-btn-link"
                  onClick={() => removeFromLeg(editingChipLeg)}
                  disabled={toggling}
                  style={{ fontSize: '0.7rem', color: 'var(--v-cinnabar)' }}
                >
                  remove
                </button>
              </div>
            );
          })()}
          {member.stay_start && member.stay_end && (
            <div style={{ fontSize: '0.75rem', color: 'var(--v-pearl-dim)', marginTop: 4 }}>
              {formatDateRange(member.stay_start, member.stay_end)}
            </div>
          )}
        </div>
      ) : (
        <div className="v-admin-dates">
          <input
            className="v-form-input"
            type="date"
            value={stayStart}
            onChange={(e) => setStayStart(e.target.value)}
          />
          <span style={{ color: 'var(--v-pearl-dim)', fontSize: '0.75rem' }}>to</span>
          <input
            className="v-form-input"
            type="date"
            value={stayEnd}
            min={stayStart || undefined}
            onChange={(e) => setStayEnd(e.target.value)}
          />
          <input
            className="v-form-input v-admin-staying-at"
            type="text"
            placeholder="e.g. Hotel Splendido"
            value={stayingAt}
            onChange={(e) => setStayingAt(e.target.value)}
          />
          {changed && (
            <button
              className="v-admin-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '...' : status === 'saved' ? 'Saved' : 'Save'}
            </button>
          )}
          {status === 'error' && (
            <span className="v-error-sm">Error</span>
          )}
        </div>
      )}
    </div>
  );
}
