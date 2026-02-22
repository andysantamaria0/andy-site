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

  const isMultiLeg = legs.length > 1;

  // Build set of leg IDs this member is assigned to
  const assignedLegIds = new Set();
  for (const leg of legs) {
    for (const tlm of (leg.trip_leg_members || [])) {
      if (tlm.member_id === member.id) assignedLegIds.add(leg.id);
    }
  }

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

  const changed = stayStart !== (member.stay_start || '') || stayEnd !== (member.stay_end || '') || stayingAt !== (member.staying_at || '');

  return (
    <div className="v-admin-member-row">
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
        <div className="v-admin-dates">
          <div className="v-leg-checkboxes">
            {legs.map((leg) => {
              const isAssigned = assignedLegIds.has(leg.id);
              return (
                <label key={leg.id} className="v-leg-member-toggle" style={{ fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggleLeg(leg.id, isAssigned)}
                    disabled={toggling}
                  />
                  <span>{leg.destination}</span>
                </label>
              );
            })}
          </div>
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
