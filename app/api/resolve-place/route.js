import { NextResponse } from 'next/server';
import { extractPlaceFromUrl } from '../../../lib/utils/placeFromUrl';
import { createClient } from '../../../lib/supabase/server';
import { createRateLimit } from '../../../lib/utils/rateLimit';

const limit = createRateLimit({ windowMs: 60_000, max: 20 });

export async function POST(request) {
  const limited = limit(request);
  if (limited) return limited;

  // Require authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string' || url.length > 2000) {
      return NextResponse.json({ error: 'Missing or invalid url' }, { status: 400 });
    }

    const result = await extractPlaceFromUrl(url);
    if (!result) {
      return NextResponse.json({ error: 'Could not resolve place' }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
