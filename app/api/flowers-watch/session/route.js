import { NextResponse } from 'next/server';
import { signToken } from '../../../../lib/flowers-watch/core.mjs';
import { requestAccess, sameOrigin, requestInfo, writeJSON, randomUUID, PRIVATE_HEADERS } from '../../../../lib/flowers-watch/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 403, headers: PRIVATE_HEADERS });
  try {
    const access = await requestAccess(request);
    if (!access) return NextResponse.json({ error: 'Password required' }, { status: 401, headers: PRIVATE_HEADERS });
    const raw = await request.text();
    if (raw.length > 2048) return NextResponse.json({ error: 'Invalid session' }, { status: 400, headers: PRIVATE_HEADERS });
    const body = JSON.parse(raw), id = randomUUID(), now = Math.floor(Date.now() / 1000);
    const visitorId = /^[a-f0-9-]{36}$/i.test(body.visitorId || '') ? body.visitorId : null;
    let referrer = '';
    try { referrer = new URL(body.referrer).origin; } catch {}
    const duration = access.config.media.duration, mediaRevision = access.config.media.revision || access.config.media.video;
    await writeJSON(`sessions/${id}.json`, { id, grantId: access.token.grantId, recipientId: access.recipient.id, label: access.recipient.label, test: !!access.recipient.test, visitorId, duration, mediaRevision, at: new Date().toISOString(), referrer, ...requestInfo(request) });
    const token = signToken({ purpose: 'view', id, recipientId: access.recipient.id, version: access.recipient.version, duration, mediaRevision, iat: now, exp: Math.min(access.token.exp, now + 86400) }, access.config.secret);
    return NextResponse.json({ id, token }, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'Unable to start viewing session' }, { status: 503, headers: PRIVATE_HEADERS }); }
}
