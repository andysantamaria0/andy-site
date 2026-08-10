'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  STAND_COOKIE,
  STAND_MAX_AGE,
  isStandPassword,
  safeStandTarget,
  standConfigured,
  standToken,
} from '../../../lib/standAuth';

export async function unlockStand(_prevState, formData) {
  const password = formData.get('password');

  // Distinguish "wrong password" from "nobody set STAND_PASSWORD" — only the
  // site owner should ever see the second one.
  if (!standConfigured()) {
    return { error: 'No password is configured for this site yet.' };
  }

  if (!isStandPassword(password)) {
    return { error: 'That password isn’t right.' };
  }

  // Secure only over HTTPS — keying this off NODE_ENV would make the cookie
  // silently fail on a local `next start`, which runs production over http.
  const proto = (await headers()).get('x-forwarded-proto') || '';

  const store = await cookies();
  store.set(STAND_COOKIE, await standToken(), {
    httpOnly: true,
    secure: proto.includes('https'),
    sameSite: 'lax',
    path: '/',
    maxAge: STAND_MAX_AGE,
  });

  redirect(safeStandTarget(formData.get('next')));
}
