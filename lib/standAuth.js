/**
 * Shared password gate for everything under /stand.
 *
 * The password lives in the STAND_PASSWORD environment variable and is
 * deliberately NOT hardcoded — this repo is public. If the variable is missing
 * the gate fails closed: nobody gets in, rather than everybody.
 */

export const STAND_COOKIE = 'stand_access';
export const STAND_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const STAND_UNLOCK_PATH = '/stand/unlock';

const PASSWORD = process.env.STAND_PASSWORD || '';
const PAYLOAD = 'stand-access-v1';

let cachedToken;

export function standConfigured() {
  return PASSWORD.length > 0;
}

/**
 * The cookie stores an HMAC of a fixed payload keyed by the password, so it
 * can't be forged by anyone who doesn't know the password. Uses Web Crypto so
 * the same function works in middleware (Edge) and in server actions (Node).
 *
 * Returns null when no password is configured, so callers deny by default.
 */
export async function standToken() {
  if (!standConfigured()) return null;
  if (cachedToken) return cachedToken;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PASSWORD),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(PAYLOAD));

  cachedToken = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return cachedToken;
}

export function isStandPassword(input) {
  return standConfigured() && typeof input === 'string' && input.trim() === PASSWORD;
}

/** Only allow post-unlock redirects back into /stand, never off-site. */
export function safeStandTarget(next) {
  if (typeof next !== 'string') return '/stand';
  if (!next.startsWith('/stand')) return '/stand';
  if (next.startsWith(STAND_UNLOCK_PATH)) return '/stand';
  return next;
}
