'use client';

import { useState } from 'react';

export default function InviteLinkButton({ tripCode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `https://andysantamaria.com/trips/join/${tripCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!tripCode) return null;

  return (
    <button className="v-btn v-btn-secondary" onClick={handleCopy} style={{ fontSize: '0.8125rem' }}>
      {copied ? 'Invite link copied!' : 'Copy Invite Link'}
    </button>
  );
}
