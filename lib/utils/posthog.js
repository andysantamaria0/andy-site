import { PostHog } from 'posthog-node';

let client = null;

function getClient() {
  if (!client) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) return null;
    client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
  }
  return client;
}

export function captureEvent(userId, event, properties = {}) {
  const ph = getClient();
  if (!ph) return;
  try {
    ph.capture({ distinctId: userId || 'anonymous', event, properties });
  } catch (e) {
    console.error('PostHog capture error:', e);
  }
}
