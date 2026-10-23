import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, checkPassword, signToken, readToken, validRecipient, mergeRanges, summarizePlayback } from '../../lib/flowers-watch/core.mjs';

test('passwords are salted and checked without storing plaintext', async () => {
  const a = await hashPassword('example-pass'), b = await hashPassword('example-pass');
  assert.notEqual(a.hash, b.hash);
  assert.equal(await checkPassword('example-pass', a), true);
  assert.equal(await checkPassword('wrong', a), false);
  assert.equal(await checkPassword('example-pass', { salt: 'invalid', hash: '' }), false);
});

test('signed grants reject tampering, expiry, wrong purpose and invalid times', () => {
  const secret = 'test-secret', payload = { purpose: 'access', recipientId: 'a', version: 1, iat: 100, exp: 200 };
  const token = signToken(payload, secret);
  assert.deepEqual(readToken(token, secret, 'access', 150), payload);
  assert.equal(readToken(token + 'x', secret, 'access', 150), null);
  assert.equal(readToken(token, 'wrong-secret', 'access', 150), null);
  assert.equal(readToken(token, secret, 'access', 200), null);
  assert.equal(readToken(token, secret, 'view', 150), null);
  assert.equal(readToken(signToken({ ...payload, exp: 'forever' }, secret), secret, 'access', 150), null);
  assert.equal(readToken(signToken({ ...payload, iat: 1000 }, secret), secret, 'access', 150), null);
});

test('revoked or changed passwords invalidate old access grants', () => {
  const recipient = { id: 'a', active: true, version: 2 }, config = { recipients: [recipient] };
  assert.equal(validRecipient(config, { recipientId: 'a', version: 1 }), null);
  assert.equal(validRecipient(config, { recipientId: 'b', version: 2 }), null);
  assert.equal(validRecipient(config, { recipientId: 'a', version: 2 }), recipient);
  recipient.active = false;
  assert.equal(validRecipient(config, { recipientId: 'a', version: 2 }), null);
});

test('watch coverage merges repeats but does not count skipped footage', () => {
  assert.deepEqual(mergeRanges([[90, 100], [0, 10], [5, 15], [NaN, 200], [-10, 3]], 100), [[0, 15], [90, 100]]);
  const skipped = summarizePlayback({ playedRanges: [[0, 10], [98, 100]], activeSeconds: 12, hasPlayed: true }, 100);
  assert.equal(skipped.percent, 12); assert.equal(skipped.completed, false);
  const complete = summarizePlayback({ playedRanges: [[0, 70], [60, 95]], activeSeconds: 100 }, 100);
  assert.equal(complete.uniqueSeconds, 95); assert.equal(complete.completed, true);
  assert.equal(summarizePlayback(null, 100).started, false);
});
