import { NextResponse } from 'next/server';
import { COOKIE, ACCESS_SECONDS, checkPassword, signToken } from '../../../../lib/flowers-watch/core.mjs';
import { getConfig, sameOrigin, takeAttempt, writeJSON, requestInfo, randomUUID, PRIVATE_HEADERS } from '../../../../lib/flowers-watch/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status) => NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'Request not allowed.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: 'Enter a valid password.' }, 400);
    const { password } = JSON.parse(raw);
    if (typeof password !== 'string' || !password.trim() || password.length > 256) return reply({ error: 'Enter your password.' }, 400);
    const config = await getConfig();
    if (!await takeAttempt(request, config)) return reply({ error: 'Too many attempts. Please try again in ten minutes.' }, 429);
    let recipient;
    for (const candidate of config.recipients) {
      if (candidate.active && await checkPassword(password.trim(), candidate)) { recipient = candidate; break; }
    }
    if (!recipient) return reply({ error: 'That password was not recognized.' }, 401);
    const now = Math.floor(Date.now() / 1000), grantId = randomUUID();
    await writeJSON(`unlocks/${grantId}.json`, { id: grantId, recipientId: recipient.id, label: recipient.label, test: !!recipient.test, at: new Date().toISOString(), ...requestInfo(request) });
    const token = signToken({ purpose: 'access', recipientId: recipient.id, version: recipient.version, grantId, iat: now, exp: now + ACCESS_SECONDS }, config.secret);
    const response = reply({ ok: true }, 200);
    response.cookies.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: ACCESS_SECONDS });
    return response;
  } catch { return reply({ error: 'The screening is temporarily unavailable. Please try again.' }, 503); }
}
