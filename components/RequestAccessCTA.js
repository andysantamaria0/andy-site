'use client';

import { useState } from 'react';

export default function RequestAccessCTA() {
  const [state, setState] = useState('initial'); // initial | form | submitting | done
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setState('submitting');
    try {
      await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      setState('done');
    } catch {
      setState('form');
    }
  }

  if (state === 'done') {
    return (
      <p className="v-landing-cta-confirm" style={{ color: '#C4A77D', fontSize: '1rem', fontWeight: 600 }}>
        Request sent — we&apos;ll be in touch!
      </p>
    );
  }

  if (state === 'initial') {
    return (
      <button
        onClick={() => setState('form')}
        className="v-btn v-btn-google v-landing-cta"
      >
        Request Access
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="v-request-access-form" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', maxWidth: 320 }}>
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="v-form-input"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="v-form-input"
      />
      <button
        type="submit"
        disabled={state === 'submitting'}
        className="v-btn v-btn-primary v-landing-cta"
      >
        {state === 'submitting' ? 'Sending...' : 'Submit'}
      </button>
    </form>
  );
}
