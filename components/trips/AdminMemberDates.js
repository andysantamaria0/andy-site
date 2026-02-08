'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { getMemberDisplayInfo } from '../../lib/utils/members';

export default function AdminMemberDates({ member, tripStart, tripEnd }) {
  const supabase = createClient();
  const router = useRouter();
  const info = getMemberDisplayInfo(member);
  const [stayStart, setStayStart] = useState(member.stay_start || '');
  const [stayEnd, setStayEnd] = useState(member.stay_end || '');
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
      .eq('id', member.id);

    setSaving(false);
    if (error) {
      setStatus('error');
    } else {
      setStatus('saved');
      router.refresh();
      setTimeout(() => setStatus(null), 2000);
    }
  }

  const changed = stayStart !== (member.stay_start || '') || stayEnd !== (member.stay_end || '');

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
          <div style={{ fontSize: '0.75rem', color: 'var(--v-ivory-dim)', marginTop: 2 }}>
            {[info.email, member.phone].filter(Boolean).join(' \u00B7 ')}
          </div>
        )}
      </div>
      <div className="v-admin-dates">
        <input
          className="v-form-input"
          type="date"
          value={stayStart}
          min={tripStart || undefined}
          max={tripEnd || undefined}
          onChange={(e) => setStayStart(e.target.value)}
        />
        <span style={{ color: 'var(--v-ivory-dim)', fontSize: '0.75rem' }}>to</span>
        <input
          className="v-form-input"
          type="date"
          value={stayEnd}
          min={stayStart || tripStart || undefined}
          max={tripEnd || undefined}
          onChange={(e) => setStayEnd(e.target.value)}
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
          <span style={{ color: 'var(--v-coral)', fontSize: '0.75rem' }}>Error</span>
        )}
      </div>
    </div>
  );
}
