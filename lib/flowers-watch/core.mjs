import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export const COOKIE = 'flowers_watch_access';
export const ACCESS_SECONDS = 7 * 24 * 60 * 60;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return { salt, hash: key.toString('hex') };
}

export async function checkPassword(password, record) {
  if (!/^[a-f0-9]{32}$/.test(record.salt || '') || !/^[a-f0-9]{128}$/.test(record.hash || '')) return false;
  const actual = await scrypt(password, record.salt, 64);
  return timingSafeEqual(actual, Buffer.from(record.hash, 'hex'));
}

export function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${createHmac('sha256', secret).update(body).digest('base64url')}`;
}

export function readToken(token, secret, purpose, now = Date.now() / 1000) {
  try {
    if (typeof token !== 'string' || token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const expected = createHmac('sha256', secret).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;
    const value = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (value.purpose !== purpose || !Number.isFinite(value.exp) || value.exp <= now || !Number.isFinite(value.iat) || value.iat > now + 60) return null;
    return value;
  } catch { return null; }
}

export function validRecipient(config, token) {
  return config.recipients.find(r => r.id === token?.recipientId && r.active && r.version === token.version) || null;
}

export function mergeRanges(ranges, duration) {
  const sorted = (Array.isArray(ranges) ? ranges : []).slice(0, 100)
    .filter(r => Array.isArray(r) && r.length === 2 && r.every(Number.isFinite))
    .map(([a, b]) => [Math.max(0, Math.min(a, duration)), Math.max(0, Math.min(b, duration))])
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range[0] <= last[1] + 0.05) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  return merged;
}

export function summarizePlayback(event, duration) {
  const ranges = mergeRanges(event?.playedRanges, duration);
  const uniqueSeconds = Math.min(duration, ranges.reduce((sum, [a, b]) => sum + b - a, 0));
  return {
    uniqueSeconds, percent: duration ? Math.round(uniqueSeconds / duration * 100) : 0,
    activeSeconds: Math.max(0, Math.min(Number(event?.activeSeconds) || 0, 86400)),
    started: uniqueSeconds > 0.1 || !!event?.hasPlayed,
    completed: duration > 0 && uniqueSeconds / duration >= 0.9,
  };
}

export function deviceDescription(agent = '') {
  const device = /iPhone/i.test(agent) ? 'iPhone' : /iPad/i.test(agent) ? 'iPad' : /Android/i.test(agent) ? 'Android' : /Macintosh/i.test(agent) ? 'Mac' : /Windows/i.test(agent) ? 'Windows' : 'Other device';
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Browser';
  return `${device} · ${browser}`;
}
