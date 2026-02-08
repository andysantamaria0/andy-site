import './trips.css';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from './SignOutButton';

export const metadata = {
  title: 'Vialoure — Trip Planning',
  description: 'Plan trips with friends. Shared calendars, expenses, and logistics.',
};

export default async function TripsLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Login page renders without the header chrome
  if (!user) {
    return <>{children}</>;
  }

  // Fetch profile for display name/avatar
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  return (
    <div className="v-layout">
      <header className="v-header">
        <div className="v-header-brand">
          <Link href="/trips" className="v-header-logo">Vialoure</Link>
          <span className="v-header-tagline">For Friends</span>
        </div>
        <div className="v-header-user">
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="" className="v-header-avatar" />
          )}
          <span className="v-header-name">{profile?.display_name || user.email}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
