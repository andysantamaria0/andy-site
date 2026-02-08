'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function FeaturedToggle({ tripId, featured }) {
  const supabase = createClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);

    if (!featured) {
      // Unfeature any currently-featured trip first
      await supabase
        .from('trips')
        .update({ featured: false })
        .eq('featured', true);
    }

    await supabase
      .from('trips')
      .update({ featured: !featured })
      .eq('id', tripId);

    setSaving(false);
    router.refresh();
  }

  return (
    <button
      className="v-btn v-btn-secondary v-featured-toggle"
      onClick={handleToggle}
      disabled={saving}
    >
      {saving ? '...' : featured ? 'Unfeature' : 'Feature on Landing'}
    </button>
  );
}
