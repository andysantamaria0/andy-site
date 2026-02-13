import { NextResponse } from 'next/server';
import { extractPlaceFromUrl } from '../../../lib/utils/placeFromUrl';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
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
