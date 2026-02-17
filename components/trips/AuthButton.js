'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function AuthButton() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('google'); // 'google' | 'email'

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/trips/auth/callback`,
      },
    });
  }

  async function handleEmailSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Try sign in first, then sign up if user doesn't exist
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If invalid credentials, check invite status before creating account
      if (signInError.message.includes('Invalid login credentials')) {
        const res = await fetch('/api/check-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const { invited } = await res.json();
        if (!invited) {
          setError('Vialoure is invite-only. Ask Andy for an invite.');
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: email.split('@')[0] },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
      } else {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    router.push('/trips');
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <button className="v-btn v-btn-google" onClick={handleGoogleSignIn} style={{ width: '100%', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 8 }}>
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#2D8659"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--v-pearl-dim)', fontSize: '0.75rem' }}>
        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--v-pearl-faint)' }} />
        <span>or</span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'var(--v-pearl-faint)' }} />
      </div>

      <form onSubmit={handleEmailSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && (
          <div className="v-error">{error}</div>
        )}
        <input
          className="v-form-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="v-form-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button
          type="submit"
          className="v-btn v-btn-primary"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {loading ? 'Signing in...' : 'Sign in with Email'}
        </button>
      </form>
    </div>
  );
}
