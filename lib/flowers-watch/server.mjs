// Server-only storage and authorization. Never import this module into client components.
import { createClient } from '@supabase/supabase-js';
import { createHmac, randomUUID } from 'node:crypto';
import { createClient as createSessionClient } from '../supabase/server.js';
import { COOKIE, readToken, validRecipient, mergeRanges, summarizePlayback, recordedDuration, deviceDescription } from './core.mjs';

export const BUCKET = 'private-showcases';
export const PREFIX = 'flowers-please';
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, nosnippet', 'Referrer-Policy': 'no-referrer' };
export const EVENT_TYPES = new Set(['ready', 'play', 'pause', 'progress', 'seek', 'ended', 'visibility', 'leave', 'error']);
let service, configCache;

export function storage() {
  service ||= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return service.storage.from(BUCKET);
}

export async function readJSON(path) {
  const { data, error } = await storage().download(`${PREFIX}/${path}`);
  if (error) throw new Error(`Private storage read failed: ${error.message}`);
  return JSON.parse(await data.text());
}

export async function writeJSON(path, value, upsert = false) {
  const { error } = await storage().upload(`${PREFIX}/${path}`, JSON.stringify(value), { contentType: 'application/json', cacheControl: '0', upsert });
  if (error) {
    const response = error.originalError;
    const detail = typeof response?.json === 'function' ? await response.clone().json().catch(() => ({})) : error;
    if (String(error.statusCode || detail.statusCode) !== '409' && !/already exists|Duplicate/i.test(detail.message || error.message)) throw new Error(`Private storage write failed: ${error.message}`);
  }
  return !error;
}

export async function getConfig() {
  if (configCache && configCache.until > Date.now()) return configCache.value;
  const value = await readJSON('access.json');
  if (!value.secret || !Array.isArray(value.recipients) || !value.media?.video) throw new Error('Private screening configuration is incomplete');
  configCache = { value, until: Date.now() + 10000 };
  return value;
}

export async function accessFor(cookieValue) {
  const config = await getConfig();
  const token = readToken(cookieValue, config.secret, 'access');
  const recipient = validRecipient(config, token);
  return recipient ? { config, token, recipient } : null;
}

export function requestAccess(request) { return accessFor(request.cookies.get(COOKIE)?.value); }

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const protocol = (request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')).split(',')[0].trim();
  return !!origin && !!host && origin === `${protocol}://${host}`;
}

export function requestInfo(request) {
  const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);
  return { userAgent, device: deviceDescription(userAgent), country: (request.headers.get('x-vercel-ip-country') || '').slice(0, 4), region: (request.headers.get('x-vercel-ip-country-region') || '').slice(0, 80) };
}

// Atomic, distributed attempt slots. Password values and raw IP addresses are never stored.
export async function takeAttempt(request, config) {
  const address = (request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const key = createHmac('sha256', config.secret).update(address).digest('hex').slice(0, 32);
  const window = Math.floor(Date.now() / 600000);
  const prefix = `limits/${window}/${key}`;
  const { data, error } = await storage().list(`${PREFIX}/${prefix}`, { limit: 8 });
  if (error) throw new Error('Access rate limit unavailable');
  const used = new Set((data || []).map(x => x.name));
  for (let slot = 0; slot < 8; slot++) {
    if (used.has(`${slot}.json`)) continue;
    if (await writeJSON(`${prefix}/${slot}.json`, { at: new Date().toISOString() })) return true;
  }
  return false;
}

export function sanitizeEvent(input, duration) {
  if (!EVENT_TYPES.has(input.type) || !Number.isInteger(input.seq) || input.seq < 1 || input.seq > 10000) return null;
  const number = (v, max) => Math.max(0, Math.min(Number(v) || 0, max));
  return { type: input.type, seq: input.seq, at: new Date().toISOString(), position: number(input.position, duration), duration, playedRanges: mergeRanges(input.playedRanges, duration), activeSeconds: number(input.activeSeconds, 86400), hasPlayed: input.hasPlayed === true, muted: input.muted === true, playbackRate: Math.min(4, Math.max(0.25, Number(input.playbackRate) || 1)), visible: input.visible === true, error: input.type === 'error' ? String(input.error || '').slice(0, 100) : undefined };
}

export async function isOwner() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  storage();
  const { data } = await service.from('profiles').select('role').eq('email', user.email).maybeSingle();
  return data?.role === 'super_admin';
}

export async function report() {
  const config = await getConfig();
  const [sessionList, unlockList] = await Promise.all([
    storage().list(`${PREFIX}/sessions`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }),
    storage().list(`${PREFIX}/unlocks`, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }),
  ]);
  if (sessionList.error || unlockList.error) throw new Error('Viewing report unavailable');
  const sessions = [];
  // Bounded batches keep report requests small for this private screening.
  const files = (sessionList.data || []).filter(x => x.name.endsWith('.json'));
  for (let offset = 0; offset < files.length; offset += 8) {
    sessions.push(...await Promise.all(files.slice(offset, offset + 8).map(async file => {
      const session = await readJSON(`sessions/${file.name}`);
      const { data, error } = await storage().list(`${PREFIX}/events/${session.id}`, { limit: 1, sortBy: { column: 'name', order: 'desc' } });
      if (error) throw new Error('Viewing events unavailable');
      const event = data?.[0] ? await readJSON(`events/${session.id}/${data[0].name}`) : null;
      return { ...session, lastEvent: event?.type || 'opened', lastSeen: event?.at || session.at, ...summarizePlayback(event, recordedDuration(event, session, config.media.duration)) };
    })));
  }
  const unlocks = [];
  const accessFiles = (unlockList.data || []).filter(x => x.name.endsWith('.json'));
  for (let offset = 0; offset < accessFiles.length; offset += 8) unlocks.push(...await Promise.all(accessFiles.slice(offset, offset + 8).map(file => readJSON(`unlocks/${file.name}`))));
  return { sessions, unlocks, recipients: config.recipients.filter(r => !r.test).map(r => ({ id: r.id, label: r.label, active: r.active })), limit: 100 };
}

export { randomUUID };
