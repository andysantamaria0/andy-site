export const DEFAULT_ADMIN_PAGE = '/admin/flowers-please';

export function adminDestination(value) {
  return ['/admin', DEFAULT_ADMIN_PAGE].includes(value) ? value : DEFAULT_ADMIN_PAGE;
}

export function adminEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const PRIVATE_AUTH_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' };

export function sameOrigin(request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}

// Both functions are injected in tests; no test emails need to be sent.
export async function requestAdminCode(email, { findAdmin, generateCode, deliverCode }) {
  if (!await findAdmin(email)) return;
  const token = await generateCode(email);
  if (!/^\d{6,10}$/.test(token)) throw new Error('Invalid sign-in code');
  await deliverCode(email, token);
}
