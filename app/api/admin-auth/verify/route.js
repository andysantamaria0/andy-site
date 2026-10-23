import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { adminDestination, adminEmail, sameOrigin, PRIVATE_AUTH_HEADERS } from '../../../../lib/admin-auth/core.mjs';
import { findAdmin, takeAdminAttempt } from '../../../../lib/admin-auth/server.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body, status = 200) => NextResponse.json(body, { status, headers: PRIVATE_AUTH_HEADERS });
const invalid = () => reply({ error: 'That code is invalid or expired. Request a new code and try again.' }, 401);

export async function POST(request) {
  if (!sameOrigin(request)) return reply({ error: 'Request not allowed.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 2048) return reply({ error: 'Enter a valid email and sign-in code.' }, 400);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: 'Enter a valid email and sign-in code.' }, 400); }
    const email = adminEmail(body?.email), token = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!email || !/^\d{6,10}$/.test(token)) return reply({ error: 'Enter a valid email and sign-in code.' }, 400);
    if (!await takeAdminAttempt(request, email, 'verify')) return reply({ error: 'Too many attempts. Please try again in ten minutes.' }, 429);
    if (!await findAdmin(email)) return invalid();
    const pendingCookies = [];
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { getAll: () => request.cookies.getAll(), setAll: values => pendingCookies.push(...values) },
    });
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error || !data.user || adminEmail(data.user.email) !== email || !await findAdmin(email)) return invalid();
    const response = reply({ ok: true, next: adminDestination(body.next) });
    for (const { name, value, options } of pendingCookies) response.cookies.set(name, value, { ...options, secure: process.env.NODE_ENV === 'production' });
    return response;
  } catch {
    return reply({ error: 'Unable to sign in right now. Please try again shortly.' }, 503);
  }
}
