'use client';

import { useState } from 'react';

const CONCIERGE_EMAIL = 'concierge@andysantamaria.com';
const CONCIERGE_PHONE = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1XXXXXXXXXX';

export default function ConciergeHero({ tripCode }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  async function copyToClipboard(text, setter) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  function downloadVcard() {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:Vialoure Concierge',
      `EMAIL:${CONCIERGE_EMAIL}`,
      `TEL:${CONCIERGE_PHONE}`,
      'END:VCARD',
    ].join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vialoure-concierge.vcf';
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }

  return (
    <div className="v-concierge-hero">
      <div className="v-concierge-hero-label">Vialoure Concierge</div>

      <a href={`tel:${CONCIERGE_PHONE}`} className="v-concierge-hero-phone">
        {formatPhone(CONCIERGE_PHONE)}
      </a>

      <div className="v-concierge-hero-email">{CONCIERGE_EMAIL}</div>

      {tripCode && (
        <div className="v-concierge-hero-code">{tripCode}</div>
      )}

      <div className="v-concierge-hero-actions">
        <a href={`tel:${CONCIERGE_PHONE}`} className="v-btn v-btn-primary v-concierge-hero-btn">
          Call
        </a>
        <button
          className="v-btn v-btn-secondary v-concierge-hero-btn"
          onClick={() => copyToClipboard(CONCIERGE_PHONE, setCopiedPhone)}
        >
          {copiedPhone ? 'Copied!' : 'Copy Phone'}
        </button>
        <button
          className="v-btn v-btn-secondary v-concierge-hero-btn"
          onClick={() => copyToClipboard(CONCIERGE_EMAIL, setCopiedEmail)}
        >
          {copiedEmail ? 'Copied!' : 'Copy Email'}
        </button>
        <button
          className="v-btn v-btn-secondary v-concierge-hero-btn"
          onClick={downloadVcard}
        >
          Save Contact
        </button>
      </div>

      {tripCode && (
        <div className="v-concierge-hero-hint">
          Mention &ldquo;{tripCode}&rdquo; in your message so I know which trip
        </div>
      )}
    </div>
  );
}
