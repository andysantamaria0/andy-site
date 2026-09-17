import './trips.css';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from './SignOutButton';
import HeaderAvatar from './HeaderAvatar';
import { Toaster } from 'react-hot-toast';
import PostHogProvider from '../../components/trips/PostHogProvider';

const TITLE = 'Vialoure — Trip Planning';
const DESCRIPTION = 'Plan trips with friends. Shared calendars, expenses, and logistics.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // The app carries its own identity; the root domain is Andy's.
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: 'Vialoure', type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  manifest: '/vialoure.webmanifest',
  appleWebApp: { capable: true, title: 'Vialoure', statusBarStyle: 'black-translucent' },
  // Invite-only app: keep every /trips page out of search results.
  robots: { index: false, follow: false },
};

export default async function TripsLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Login page renders without the header chrome
  if (!user) {
    return <PostHogProvider>{children}</PostHogProvider>;
  }

  // Fetch profile for display name/avatar/role
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, role')
    .eq('email', user.email)
    .single();

  return (
    <PostHogProvider userId={user.id} userEmail={user.email}>
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
          <HeaderAvatar src={profile?.avatar_url} />
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
    </PostHogProvider>
  );
}
