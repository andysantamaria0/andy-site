import { verify, createPublicKey } from 'crypto';

/**
 * Validate a Telnyx webhook signature (ed25519).
 * See: https://developers.telnyx.com/docs/api/v2/overview#webhook-signing
 */
export function validateTelnyxSignature(publicKeyBase64, signature, timestamp, rawBody) {
  const signatureBuffer = Buffer.from(signature, 'base64');
  const payload = Buffer.from(`${timestamp}|${rawBody}`);

  // Wrap the raw 32-byte ed25519 public key in DER format
  const rawKey = Buffer.from(publicKeyBase64, 'base64');
  const derPrefix = Buffer.from('302a300506032b6570032100', 'hex');
  const derKey = Buffer.concat([derPrefix, rawKey]);

  const publicKey = createPublicKey({
    key: derKey,
    format: 'der',
    type: 'spki',
  });

  return verify(null, payload, publicKey, signatureBuffer);
}
