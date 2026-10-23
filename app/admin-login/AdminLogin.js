'use client';

import { useState } from 'react';

export default function AdminLogin({ next, denied }) {
  const [email, setEmail] = useState(''), [code, setCode] = useState('');
  const [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function requestCode(event) {
    event?.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin-auth/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSent(true); setCode('');
    } catch (cause) { setError(cause.message || 'Unable to send a code. Please try again.'); }
    finally { setBusy(false); }
  }
  async function verifyCode(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin-auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, next }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign(result.next);
    } catch (cause) { setError(cause.message || 'Unable to sign in. Please try again.'); setBusy(false); }
  }
  return <main className="site-admin-login"><section>
    <a className="admin-login-home" href="/">Andrew Santamaria</a>
    <p className="admin-login-eyebrow">Site admin</p>
    <h1>{sent ? 'Check your email.' : 'Sign in to your dashboard.'}</h1>
    <p>{sent ? <>If <strong>{email}</strong> has admin access, we’ve sent it a one-time code. Enter the newest code below.</> : 'Use your admin email to receive a one-time sign-in code. No password needed.'}</p>
    {denied && !sent && <p className="admin-login-error">Your current account does not have admin access. Sign in with your admin email.</p>}
    <form onSubmit={sent ? verifyCode : requestCode}>
      {!sent ? <><label htmlFor="admin-email">Email address</label><input id="admin-email" name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></> : <><label htmlFor="admin-code">Sign-in code</label><input key="code" id="admin-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required autoFocus value={code} onChange={e => setCode(e.target.value.replace(/\s/g, ''))} disabled={busy} /></>}
      {error && <p className="admin-login-error" role="alert">{error}</p>}
      <button className="admin-login-submit" disabled={busy}>{busy ? 'Please wait…' : sent ? 'Open admin' : 'Email me a sign-in code'}</button>
    </form>
    {sent && <div className="admin-login-actions"><button disabled={busy} onClick={requestCode}>Send a new code</button><button disabled={busy} onClick={() => { setSent(false); setCode(''); setError(''); }}>Use a different email</button></div>}
    <p className="admin-login-note">Admin access only. Video viewing passwords are used on the screening page.</p>
  </section></main>;
}
