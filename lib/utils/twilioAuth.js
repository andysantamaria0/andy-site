import { createHmac } from 'crypto';

/**
 * Validate a Twilio webhook signature.
 * See: https://www.twilio.com/docs/usage/security#validating-requests
 */
export function validateTwilioSignature(authToken, signature, url, params) {
  // Build the data string: URL + sorted param key/value pairs
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const expected = createHmac('sha1', authToken)
    .update(data, 'utf-8')
    .digest('base64');

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}
