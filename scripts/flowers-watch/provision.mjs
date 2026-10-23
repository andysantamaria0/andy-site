import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../../lib/flowers-watch/core.mjs';

process.loadEnvFile('.env.local');
process.on('uncaughtException', async error => {
  const response = error.originalError;
  console.error(JSON.stringify({ error: error.message, status: error.statusCode || response?.status, detail: typeof response?.text === 'function' ? (await response.text()).slice(0, 500) : undefined }));
  process.exit(1);
});
if (process.argv[2] === '--diagnose') {
  for (const endpoint of ['/storage/v1/bucket', '/rest/v1/profiles?select=role&limit=1']) {
    const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + endpoint, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } });
    const text = await response.text();
    console.log(JSON.stringify({ endpoint, status: response.status, type: response.headers.get('content-type'), body: text.slice(0, 400) }));
  }
  process.exit(0);
}
const [inputFile, mediaDirectory] = process.argv.slice(2);
if (!inputFile || !mediaDirectory) throw new Error('Usage: node scripts/flowers-watch/provision.mjs <private-access-input.json> <media-directory>');
const input = JSON.parse(await fs.readFile(inputFile, 'utf8'));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'private-showcases', prefix = 'flowers-please';
const { data: existingBucket, error: lookupError } = await client.storage.getBucket(bucket);
console.log('Private bucket lookup:', existingBucket ? 'exists' : 'not found', lookupError?.statusCode || '');
if (!existingBucket) {
  const { error } = await client.storage.createBucket(bucket, { public: false, fileSizeLimit: 50 * 1024 * 1024, allowedMimeTypes: ['video/mp4', 'image/jpeg', 'text/vtt', 'application/json'] });
  if (error) throw error;
} else if (existingBucket.public) throw new Error('Refusing to use a public media bucket.');
const store = client.storage.from(bucket);
const { data: previous, error: previousError } = await store.download(`${prefix}/access.json`);
console.log('Access configuration lookup:', previous ? 'exists' : 'not found', previousError?.statusCode || '');
const config = previous ? JSON.parse(await previous.text()) : { secret: randomBytes(48).toString('base64url'), recipients: [] };
if (previousError) {
  const response = previousError.originalError;
  const detail = typeof response?.json === 'function' ? await response.clone().json().catch(() => ({})) : previousError;
  if (!(detail.code === 'NoSuchKey' || detail.message === 'Object not found' || String(previousError.statusCode) === '404')) throw previousError;
}
for (const item of input.recipients || []) {
  if (!item.label || !item.password || item.password.length > 256) throw new Error('Invalid recipient input');
  const existing = config.recipients.find(r => r.label === item.label);
  const replacement = { id: existing?.id || randomUUID(), label: item.label, active: true, test: !!item.test, version: (existing?.version || 0) + 1, ...await hashPassword(item.password.trim()) };
  if (existing) Object.assign(existing, replacement); else config.recipients.push(replacement);
}
const revision = input.mediaRevision || 'narration-2';
if (!/^[a-z0-9-]{1,60}$/.test(revision)) throw new Error('Invalid media revision');
for (const [source, name, type] of [['pip-flowers-please-final.mp4', 'film.mp4', 'video/mp4'], ['pip-flowers-please-final.vtt', 'captions.vtt', 'text/vtt'], ['poster-final.jpg', 'poster.jpg', 'image/jpeg']]) {
  const data = await fs.readFile(path.join(mediaDirectory, source));
  const { error } = await store.upload(`${prefix}/media/${revision}/${name}`, data, { contentType: type, cacheControl: '0', upsert: true });
  if (error) throw error;
  console.log(`Uploaded private ${name} (${data.length} bytes)`);
}
const timeline = JSON.parse(await fs.readFile(path.join(mediaDirectory, 'timeline-final.json'), 'utf8'));
// Media-only updates preserve any access changes made while the upload ran.
if (!(input.recipients || []).length && previous) {
  const { data: latest, error: latestError } = await store.download(`${prefix}/access.json`);
  if (latestError) throw latestError;
  Object.assign(config, JSON.parse(await latest.text()));
}
config.media = { revision, video: `media/${revision}/film.mp4`, captions: `media/${revision}/captions.vtt`, poster: `media/${revision}/poster.jpg`, duration: timeline.reduce((sum, s) => sum + s.duration, 0), chapters: timeline.map(({ id, title, start }) => ({ id, title, start })) };
const { error } = await store.upload(`${prefix}/access.json`, JSON.stringify(config), { contentType: 'application/json', cacheControl: '0', upsert: true });
if (error) throw error;
console.log(JSON.stringify({ privateBucket: bucket, recipients: config.recipients.map(({ label, active, test }) => ({ label, active, test })), duration: config.media.duration }));
