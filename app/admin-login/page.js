import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { findAdmin } from '../../lib/admin-auth/server.mjs';
import { adminDestination } from '../../lib/admin-auth/core.mjs';
import AdminLogin from './AdminLogin';
import './login.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Site admin sign-in — Andrew Santamaria', robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }) {
  const params = await searchParams;
  const next = adminDestination(params.next);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email && await findAdmin(user.email)) redirect(next);
  return <AdminLogin next={next} denied={!!user || params.error === 'not-authorized'} />;
}
