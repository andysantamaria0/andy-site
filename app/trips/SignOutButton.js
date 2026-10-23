'use client';

import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignOutButton({ returnTo = '/trips/login' }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(returnTo);
    router.refresh();
  }

  return (
    <button className="v-signout-btn" onClick={handleSignOut}>
      Sign Out
    </button>
  );
}
