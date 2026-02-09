import { createClient } from '../../../../lib/supabase/server';
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
      // Check if this user's email matches any unclaimed manual members
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: claimable } = await supabase
          .from('trip_members')
          .select('id')
          .is('user_id', null)
          .ilike('email', user.email)
          .limit(1);

        if (claimable && claimable.length > 0) {
          return NextResponse.redirect(`${origin}/trips/claim`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/trips/login`);
}
