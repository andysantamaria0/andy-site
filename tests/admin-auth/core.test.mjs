import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adminDestination, adminEmail, requestAdminCode, sameOrigin } from '../../lib/admin-auth/core.mjs';

test('email codes cannot be issued to a non-admin address', async () => {
  await requestAdminCode('viewer@example.com', {
    findAdmin: async () => false,
    generateCode: () => assert.fail('must not generate a code'),
    deliverCode: () => assert.fail('must not send an email'),
  });
});

test('an authorized code is delivered but never returned to the caller', async () => {
  const calls = [];
  const result = await requestAdminCode('owner@example.com', {
    findAdmin: async email => { assert.equal(email, 'owner@example.com'); return true; },
    generateCode: async () => '12345678',
    deliverCode: async (email, token) => calls.push({ email, token }),
  });
  assert.equal(result, undefined);
  assert.deepEqual(calls, [{ email: 'owner@example.com', token: '12345678' }]);
});

test('delivery failures propagate instead of reporting that an email was sent', async () => {
  await assert.rejects(() => requestAdminCode('owner@example.com', {
    findAdmin: async () => true, generateCode: async () => '123456',
    deliverCode: async () => { throw new Error('delivery unavailable'); },
  }), /delivery unavailable/);
});

test('redirects stay on known admin pages', () => {
  for (const value of ['https://example.com', '//example.com', '/admin/../../trips', '/admin\\evil', '/admin/%2e%2e/trips', '/admin/api/access-requests', null]) assert.equal(adminDestination(value), '/admin/flowers-please');
  assert.equal(adminDestination('/admin'), '/admin');
});

test('normalizes addresses and rejects cross-origin authentication requests', () => {
  assert.equal(adminEmail(' Owner@Example.com '), 'owner@example.com');
  for (const value of ['bad', 'x\ny@example.com', null, { email: 'x@example.com' }]) assert.equal(adminEmail(value), null);
  assert.equal(sameOrigin(new Request('https://andysantamaria.com/api/admin-auth/request', { headers: { origin: 'https://evil.example' } })), false);
  assert.equal(sameOrigin(new Request('https://andysantamaria.com/api/admin-auth/request', { headers: { origin: 'https://andysantamaria.com' } })), true);
});
