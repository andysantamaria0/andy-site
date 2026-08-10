'use client';

import { useActionState } from 'react';
import { unlockStand } from './actions';

export default function UnlockForm({ next }) {
  const [state, formAction, pending] = useActionState(unlockStand, { error: null });

  return (
    <div className="unlock">
      <div className="unlock-card">
        <svg viewBox="0 0 120 48" className="unlock-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>

        <h1 className="unlock-title">Stand</h1>
        <p className="unlock-note">
          This work is shared privately. Enter the password to continue.
        </p>

        <form action={formAction} className="unlock-form">
          <input type="hidden" name="next" value={next} />

          <label className="unlock-label" htmlFor="stand-password">
            Password
          </label>
          <input
            id="stand-password"
            className="unlock-input"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            aria-describedby={state?.error ? 'stand-password-error' : undefined}
          />

          {state?.error && (
            <p className="unlock-error" id="stand-password-error" role="alert">
              {state.error}
            </p>
          )}

          <button className="unlock-btn" type="submit" disabled={pending}>
            {pending ? 'Checking…' : 'Continue'}
          </button>
        </form>

        <a className="unlock-back" href="/">
          &larr; andysantamaria.com
        </a>
      </div>
    </div>
  );
}
