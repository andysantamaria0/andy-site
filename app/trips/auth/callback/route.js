import { createClient } from '../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') || '/trips';
  // Prevent open redirect — only allow relative paths
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/trips';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Check invite status using service role (bypasses RLS)
        const service = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        // Check by user_id first (already claimed), then by email (invited but unclaimed)
        const { data: byUserId } = await service
          .from('trip_members')
          .select('id, user_id')
          .eq('user_id', user.id)
          .limit(1);

        const { data: byEmail } = await service
          .from('trip_members')
          .select('id, user_id')
          .ilike('email', user.email)
          .limit(1);

        const members = (byUserId?.length ? byUserId : byEmail) || [];

        if (members.length === 0) {
          // Not invited — sign out and redirect
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/trips/not-invited`);
        }

        // Check if there's an unclaimed membership to claim (only from email matches)
        const unclaimed = (byEmail || []).find((m) => !m.user_id);
        if (unclaimed) {
          return NextResponse.redirect(`${origin}/trips/claim`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/trips/login`);
}
