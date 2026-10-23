import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../../lib/flowers-watch/core.mjs';

process.loadEnvFile('.env.local');
const inputFile = process.argv[2];
if (!inputFile) throw new Error('Pass a private JSON file with recipients:[{label,password}] and/or disableLabels:[label]. Passwords must not be supplied as command-line arguments.');
const input = JSON.parse(await fs.readFile(inputFile, 'utf8'));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const store = client.storage.from('private-showcases');
const key = 'flowers-please/access.json';
const { data, error } = await store.download(key);
if (error) throw error;
const config = JSON.parse(await data.text());
for (const item of input.recipients || []) {
  if (typeof item.label !== 'string' || !item.label.trim() || typeof item.password !== 'string' || !item.password.trim() || item.password.length > 256) throw new Error('A label and password are required for each recipient');
  const existing = config.recipients.find(r => r.label === item.label.trim());
  const updated = { id: existing?.id || randomUUID(), label: item.label.trim(), active: true, test: !!item.test, version: (existing?.version || 0) + 1, ...await hashPassword(item.password.trim()) };
  if (existing) Object.assign(existing, updated); else config.recipients.push(updated);
}
for (const label of input.disableLabels || []) {
  const recipient = config.recipients.find(r => r.label === label);
  if (!recipient) throw new Error(`Unknown label: ${label}`);
  recipient.active = false; recipient.version++;
}
const { error: writeError } = await store.upload(key, JSON.stringify(config), { contentType: 'application/json', cacheControl: '0', upsert: true });
if (writeError) throw writeError;
console.log(JSON.stringify({ recipients: config.recipients.map(({ label, active, test }) => ({ label, active, test })) }));
