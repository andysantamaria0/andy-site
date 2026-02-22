import { createClient } from '@supabase/supabase-js';
import { createRateLimit } from '../../../lib/utils/rateLimit';
import { NextResponse } from 'next/server';

const limit = createRateLimit({ windowMs: 60_000, max: 10 });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const limited = limit(request);
  if (limited) return limited;
  const { email } = await request.json();

  if (!email || typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ invited: false });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [{ data: members }, { data: accessApproved }] = await Promise.all([
    supabase
      .from('trip_members')
      .select('id')
      .ilike('email', email)
      .limit(1),
    supabase
      .from('access_requests')
      .select('id')
      .ilike('email', email)
      .eq('status', 'approved')
      .limit(1),
  ]);

  const invited = (members && members.length > 0) || (accessApproved && accessApproved.length > 0);
  return NextResponse.json({ invited });
}
