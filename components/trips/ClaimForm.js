'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import posthog from 'posthog-js';

export default function ClaimForm({ membershipId, tripId }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not signed in');
      setLoading(false);
      return;
    }

    // Check if user already has a membership for this trip
    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already a member — just delete the unclaimed row
      await supabase.from('trip_members').delete().eq('id', membershipId);
      setClaimed(true);
      setLoading(false);
      return;
    }

    // Claim: set user_id on the manual member row
    const { error: updateError } = await supabase
      .from('trip_members')
      .update({ user_id: user.id })
      .eq('id', membershipId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setClaimed(true);
      try { posthog.capture('trip_joined', { tripId, method: 'claim_form' }); } catch (_) {}
      fetch('/api/notify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      }).catch(() => {});
    }
  }

  if (claimed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--v-champagne)', fontWeight: 600 }}>Claimed!</span>
        <a href={`/trips/${tripId}`} className="v-btn v-btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
          View Trip
        </a>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="v-error-sm" style={{ marginBottom: 8 }}>{error}</div>}
      <button
        className="v-btn v-btn-primary"
        onClick={handleClaim}
        disabled={loading}
        style={{ fontSize: '0.85rem', padding: '8px 20px' }}
      >
        {loading ? 'Claiming...' : 'Claim My Spot'}
      </button>
    </div>
  );
}
