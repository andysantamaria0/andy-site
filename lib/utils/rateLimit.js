/**
 * In-memory sliding window rate limiter.
 *
 * Usage:
 *   const limiter = createRateLimit({ windowMs: 60_000, max: 10 });
 *
 *   export async function POST(request) {
 *     const limited = limiter(request);
 *     if (limited) return limited;
 *     // ... handle request
 *   }
 */

const stores = new Map();

// Periodic cleanup to prevent memory leaks — runs at most once per minute
let cleanupTimer = null;
function scheduleCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setTimeout(() => {
    cleanupTimer = null;
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, timestamps] of store.entries()) {
        const valid = timestamps.filter(t => t > now - store._windowMs);
        if (valid.length === 0) {
          store.delete(key);
        } else {
          store.set(key, valid);
        }
      }
    }
  }, 60_000);
  // Don't block Node from exiting
  if (cleanupTimer.unref) cleanupTimer.unref();
}

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Create a rate limiter that returns a 429 Response if the limit is exceeded,
 * or null if the request is allowed.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000)
 * @param {number} options.max - Max requests per window (default: 30)
 * @param {Function} [options.keyFn] - Custom function to derive the rate limit key from a request
 */
export function createRateLimit({ windowMs = 60_000, max = 30, keyFn } = {}) {
  const store = new Map();
  store._windowMs = windowMs;
  stores.set(store, store);
  scheduleCleanup();

  return function rateLimit(request) {
    const key = keyFn ? keyFn(request) : getClientIp(request);
    const now = Date.now();
    const timestamps = (store.get(key) || []).filter(t => t > now - windowMs);

    if (timestamps.length >= max) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(windowMs / 1000)),
        },
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);
    return null;
  };
}
