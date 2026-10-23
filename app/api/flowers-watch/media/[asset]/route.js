import { NextResponse } from 'next/server';
import { requestAccess, storage, PREFIX, PRIVATE_HEADERS } from '../../../../../lib/flowers-watch/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  try {
    const access = await requestAccess(request);
    if (!access) return new NextResponse(null, { status: 401, headers: PRIVATE_HEADERS });
    const { asset } = await params;
    if (!['video', 'captions', 'poster'].includes(asset)) return new NextResponse(null, { status: 404, headers: PRIVATE_HEADERS });
    const { data, error } = await storage().createSignedUrl(`${PREFIX}/${access.config.media[asset]}`, 600);
    if (error) throw error;
    return NextResponse.redirect(data.signedUrl, { status: 307, headers: PRIVATE_HEADERS });
  } catch { return new NextResponse(null, { status: 503, headers: PRIVATE_HEADERS }); }
}
