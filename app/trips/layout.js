import './trips.css';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from './SignOutButton';
import { Toaster } from 'react-hot-toast';

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

  // Fetch profile for display name/avatar/role
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, role')
    .eq('email', user.email)
    .single();

  return (
    <div className="v-layout">
      <header className="v-header">
        <div className="v-header-brand">
          <Link href="/trips" className="v-header-logo">
            <svg viewBox="0 0 120 48" className="v-header-mark" aria-hidden="true">
              <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
            </svg>
            Vialoure
          </Link>
          <span className="v-header-tagline">For Andy's Friends</span>
        </div>
        <div className="v-header-user">
          {profile?.avatar_url && (
            <img src={profile.avatar_url} alt="" className="v-header-avatar" />
          )}
          {profile?.role === 'super_admin' && (
            <Link href="/admin" className="v-admin-header-link">Admin</Link>
          )}
          <span className="v-header-name">{profile?.display_name || user.email}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--v-surface)',
            color: 'var(--v-pearl)',
            border: '1px solid var(--v-croisette)',
            borderRadius: '2px',
            fontFamily: "'DM Sans', sans-serif",
          },
        }}
      />
    </div>
  );
}
