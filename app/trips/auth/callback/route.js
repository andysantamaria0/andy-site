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
        const { data: members } = await service
          .from('trip_members')
          .select('id, user_id')
          .ilike('email', user.email)
          .limit(1);

        if (!members || members.length === 0) {
          // Not invited — sign out and redirect
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/trips/not-invited`);
        }

        // Check if there's an unclaimed membership to claim
        const unclaimed = members.find((m) => !m.user_id);
        if (unclaimed) {
          return NextResponse.redirect(`${origin}/trips/claim`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/trips/login`);
}
