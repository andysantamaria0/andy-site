import './admin.css';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import SignOutButton from '../trips/SignOutButton';

export const metadata = {
  title: 'Admin — Vialoure',
  description: 'Super admin dashboard',
};

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/trips/login');

  // Use service role to bypass RLS for role check
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('display_name, avatar_url, role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'super_admin') redirect('/trips');

  return (
    <div className="v-layout">
      <header className="v-header">
        <div className="v-header-brand">
          <Link href="/admin" className="v-header-logo">Vialoure</Link>
          <span className="v-header-tagline">Admin</span>
        </div>
        <div className="v-header-user">
          <Link href="/trips" className="v-admin-back-link">Back to Trips</Link>
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
