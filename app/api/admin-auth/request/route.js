import { NextResponse } from 'next/server';
import { adminEmail, sameOrigin, requestAdminCode, PRIVATE_AUTH_HEADERS } from '../../../../lib/admin-auth/core.mjs';
import { findAdmin, generateCode, deliverCode, takeAdminAttempt } from '../../../../lib/admin-auth/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: PRIVATE_AUTH_HEADERS });

export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'Request not allowed.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: 'Enter a valid email address.' }, 400);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: 'Enter a valid email address.' }, 400); }
    const email = adminEmail(body?.email);
    if (!email) return reply({ error: 'Enter a valid email address.' }, 400);
    if (!await takeAdminAttempt(request, email, 'request')) return reply({ error: 'Too many requests. Please try again in ten minutes.' }, 429);
    await requestAdminCode(email, { findAdmin, generateCode, deliverCode });
    return reply({ ok: true });
  } catch {
    return reply({ error: 'Unable to send a sign-in code right now. Please try again shortly.' }, 503);
  }
}
