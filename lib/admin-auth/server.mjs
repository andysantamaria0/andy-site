import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

let client;
export function adminService() {
  client ||= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export async function findAdmin(email) {
  const { data, error } = await adminService().from('profiles').select('role').eq('email', email).maybeSingle();
  if (error) throw new Error('Unable to check admin access');
  return data?.role === 'super_admin';
}

export async function generateCode(email) {
  const { data, error } = await adminService().auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw new Error('Unable to create sign-in code');
  return data.properties.email_otp;
}

export async function deliverCode(email, token) {
  const apiKey = process.env.ADMIN_LOGIN_RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email delivery unavailable');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ADMIN_LOGIN_EMAIL_FROM || 'Andy Santamaria Admin <concierge@andysantamaria.com>', to: [email],
      subject: 'Your site admin sign-in code',
      text: `Your sign-in code for andysantamaria.com is:\n\n${token}\n\nEnter it on the admin sign-in page you opened. Use the newest code if you requested more than one.\n\nIf you did not request this code, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Unable to deliver sign-in code');
}

// Atomic storage slots work across server instances. No email, IP or code is stored here.
async function takeSlots(scope, identifier, maximum) {
  const key = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update(identifier).digest('hex');
  const prefix = `admin-auth/limits/${Math.floor(Date.now() / 600000)}/${scope}/${key}`;
  const store = adminService().storage.from('private-showcases');
  const { data, error } = await store.list(prefix, { limit: maximum });
  if (error) throw new Error('Unable to check sign-in limits');
  const used = new Set((data || []).map(x => x.name));
  for (let slot = 0; slot < maximum; slot++) {
    if (used.has(`${slot}.json`)) continue;
    const { error: claimError } = await store.upload(`${prefix}/${slot}.json`, JSON.stringify({ at: new Date().toISOString() }), { contentType: 'application/json', upsert: false, cacheControl: '0' });
    if (!claimError) return true;
    const detail = typeof claimError.originalError?.json === 'function' ? await claimError.originalError.clone().json().catch(() => ({})) : claimError;
    if (String(claimError.statusCode || detail.statusCode) !== '409' && !/already exists|duplicate/i.test(detail.message || claimError.message)) throw new Error('Unable to record sign-in attempt');
  }
  return false;
}

export async function takeAdminAttempt(request, email, action) {
  const address = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (!await takeSlots(`${action}-address`, address, action === 'request' ? 6 : 24)) return false;
  return takeSlots(`${action}-email`, email, action === 'request' ? 3 : 10);
}
