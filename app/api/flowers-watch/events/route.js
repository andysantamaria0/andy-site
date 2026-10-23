import { NextResponse } from 'next/server';
import { readToken } from '../../../../lib/flowers-watch/core.mjs';
import { requestAccess, sameOrigin, sanitizeEvent, writeJSON, PRIVATE_HEADERS } from '../../../../lib/flowers-watch/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 403, headers: PRIVATE_HEADERS });
  try {
    const access = await requestAccess(request);
    if (!access) return NextResponse.json({ error: 'Password required' }, { status: 401, headers: PRIVATE_HEADERS });
    const raw = await request.text();
    if (raw.length > 16384) return NextResponse.json({ error: 'Invalid event' }, { status: 400, headers: PRIVATE_HEADERS });
    const body = JSON.parse(raw);
    const view = readToken(body.token, access.config.secret, 'view');
    if (!view || view.recipientId !== access.recipient.id || view.version !== access.recipient.version || !/^[a-f0-9-]{36}$/i.test(view.id)) return NextResponse.json({ error: 'Invalid viewing session' }, { status: 403, headers: PRIVATE_HEADERS });
    const event = sanitizeEvent(body, access.config.media.duration);
    if (!event) return NextResponse.json({ error: 'Invalid event' }, { status: 400, headers: PRIVATE_HEADERS });
    await writeJSON(`events/${view.id}/${String(event.seq).padStart(6, '0')}.json`, event);
    return NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Unable to record viewing activity' }, { status: 503, headers: PRIVATE_HEADERS }); }
}
