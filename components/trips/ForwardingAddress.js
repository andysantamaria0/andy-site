'use client';

import { useState } from 'react';

export default function ForwardingAddress({ email }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = email;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="v-forwarding-address">
      <div className="v-forwarding-address-label">Forward emails to this address</div>
      <div className="v-forwarding-address-row">
        <code className="v-forwarding-address-email">{email}</code>
        <button
          className="v-btn v-btn-secondary v-forwarding-address-copy"
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
