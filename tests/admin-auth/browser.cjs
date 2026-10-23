const { chromium } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');
const assert = require('node:assert/strict');
const fs = require('node:fs');
process.loadEnvFile('.env.local');
const base = process.argv[2] || 'http://localhost:3242';
const email = 'andyjsantamaria@gmail.com';
const output = '/private/tmp/pip-film-work';
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const checks = [], errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000); page.on('pageerror', e => errors.push(e.message));
    const response = await page.goto(base + '/admin/flowers-please');
    assert.equal(response.status(), 200);
    assert.equal(new URL(page.url()).pathname, '/admin-login');
    assert.equal(new URL(page.url()).searchParams.get('next'), '/admin/flowers-please');
    await page.getByRole('heading', { name: 'Sign in to your dashboard.' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Google/ }).count(), 0);
    assert.match(response.headers()['cache-control'], /no-store/);
    await page.screenshot({ path: output + '/admin-login-desktop.png', fullPage: true });
    checks.push('Report redirects to dedicated admin login; no Google dependency');
    for (const action of ['request', 'verify']) {
      const blocked = await context.request.post(base + '/api/admin-auth/' + action, { headers: { Origin: 'https://example.com' }, data: { email, code: '123456' } });
      assert.equal(blocked.status(), 403);
    }
    const unknown = await context.request.post(base + '/api/admin-auth/request', { headers: { Origin: base }, data: { email: 'not-an-admin@example.invalid' } });
    assert.equal(unknown.status(), 200); assert.deepEqual(await unknown.json(), { ok: true });
    const denied = await context.request.post(base + '/api/admin-auth/verify', { headers: { Origin: base }, data: { email: 'not-an-admin@example.invalid', code: '123456' } });
    assert.equal(denied.status(), 401);
    assert.equal((await context.cookies()).some(c => c.name.startsWith('sb-')), false);
    checks.push('Cross-origin requests rejected; non-admin cannot obtain a session');

    // Exercise the UI and real verification endpoint without sending a test email.
    // Only delivery is intercepted; Supabase generates and verifies the real one-time code.
    let issued;
    await page.route('**/api/admin-auth/request', async route => {
      assert.equal(route.request().postDataJSON().email, email);
      const { data, error } = await service.auth.admin.generateLink({ type: 'magiclink', email });
      if (error) throw error;
      issued = data.properties.email_otp;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Email me a sign-in code' }).click();
    await page.getByRole('heading', { name: 'Check your email.' }).waitFor();
    await page.getByLabel('Sign-in code', { exact: true }).fill(issued === '000000' ? '111111' : '000000');
    await page.getByRole('button', { name: 'Open admin', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'invalid or expired' }).waitFor();
    await page.getByLabel('Sign-in code', { exact: true }).fill(issued);
    await page.getByRole('button', { name: 'Open admin', exact: true }).click();
    await page.getByRole('heading', { name: 'Pip viewing activity' }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/admin/flowers-please');
    await page.getByRole('heading', { name: 'Browser Company', exact: true }).waitFor();
    const cookies = (await context.cookies()).filter(c => c.name.startsWith('sb-'));
    assert.ok(cookies.length);
    if (base.startsWith('https:')) assert.ok(cookies.every(c => c.secure));
    await page.reload(); await page.getByRole('heading', { name: 'Pip viewing activity' }).waitFor();
    checks.push('Wrong code rejected; real one-time code opens report and survives reload');
    await page.screenshot({ path: output + '/admin-email-code-report.png', fullPage: true });
    const fresh = await browser.newContext();
    const replay = await fresh.request.post(base + '/api/admin-auth/verify', { headers: { Origin: base }, data: { email, code: issued, next: 'https://example.com' } });
    assert.equal(replay.status(), 401);
    assert.equal((await fresh.cookies()).some(c => c.name.startsWith('sb-')), false);
    await fresh.close();
    checks.push('Used code cannot be replayed to create another session');
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
    await page.getByRole('heading', { name: 'Sign in to your dashboard.' }).waitFor();
    await page.goto(base + '/admin/flowers-please');
    assert.equal(new URL(page.url()).pathname, '/admin-login');
    checks.push('Sign out removes admin access and returns to admin login');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: output + '/admin-login-mobile.png', fullPage: true });
    checks.push('Mobile login fits without horizontal scrolling');
    assert.deepEqual(errors, []);
    const result = { base, checks, errors, realEmailSent: false };
    fs.writeFileSync(output + '/admin-login-qa.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
