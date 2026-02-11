'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function FeaturedToggle({ tripId, featured }) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleToggle() {
    setSaving(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('set_trip_featured', {
      trip_id: tripId,
      is_featured: !featured,
    });

    setSaving(false);
    if (rpcError) {
      setError(rpcError.message);
    } else {
      router.refresh();
    }
  }

  return (
    <button
      className="v-btn v-btn-secondary v-featured-toggle"
      onClick={handleToggle}
      disabled={saving}
    >
      {saving ? '...' : featured ? 'Unfeature' : 'Feature on Landing'}
      {error && <span style={{ color: 'var(--v-cinnabar)', fontSize: '0.75rem', marginLeft: 8 }}>{error}</span>}
    </button>
  );
}
