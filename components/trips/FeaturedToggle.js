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

    // If featuring this trip, unfeatured any currently featured trip first
    if (!featured) {
      await supabase.from('trips').update({ featured: false }).eq('featured', true);
    }

    const { error: updateError } = await supabase
      .from('trips')
      .update({ featured: !featured })
      .eq('id', tripId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
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
      {error && <span className="v-error-sm" style={{ marginLeft: 8 }}>{error}</span>}
    </button>
  );
}
