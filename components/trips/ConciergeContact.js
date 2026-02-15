'use client';

import { useState } from 'react';

const CONCIERGE_EMAIL = 'concierge@andysantamaria.com';
const CONCIERGE_PHONE = process.env.NEXT_PUBLIC_TELNYX_PHONE_NUMBER || '+1XXXXXXXXXX';
const CONCIERGE_WHATSAPP = process.env.NEXT_PUBLIC_TELNYX_WHATSAPP_NUMBER || null;

export default function ConciergeContact({ tripCode }) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

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

  return (
    <div className="v-concierge-contact">
      <div className="v-forwarding-address-label">Vialoure Concierge</div>

      {tripCode && (
        <div className="v-concierge-contact-row v-concierge-code-row">
          <div className="v-trip-code">{tripCode}</div>
          <button
            className="v-btn v-btn-secondary v-forwarding-address-copy"
            onClick={() => copyToClipboard(tripCode, setCopiedCode)}
          >
            {copiedCode ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      )}

      <div className="v-concierge-contact-row">
        <code className="v-forwarding-address-email">{CONCIERGE_EMAIL}</code>
        <button
          className="v-btn v-btn-secondary v-forwarding-address-copy"
          onClick={() => copyToClipboard(CONCIERGE_EMAIL, setCopiedEmail)}
        >
          {copiedEmail ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="v-concierge-contact-row">
        <code className="v-forwarding-address-email">{CONCIERGE_PHONE}</code>
        <button
          className="v-btn v-btn-secondary v-forwarding-address-copy"
          onClick={() => copyToClipboard(CONCIERGE_PHONE, setCopiedPhone)}
        >
          {copiedPhone ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {CONCIERGE_WHATSAPP && (
        <div className="v-concierge-contact-row">
          <code className="v-forwarding-address-email">{CONCIERGE_WHATSAPP} (WhatsApp)</code>
          <button
            className="v-btn v-btn-secondary v-forwarding-address-copy"
            onClick={() => copyToClipboard(CONCIERGE_WHATSAPP, setCopiedWhatsApp)}
          >
            {copiedWhatsApp ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <div className="v-concierge-contact-row" style={{ marginTop: 4 }}>
        <span style={{ color: 'var(--v-pearl-dim)', fontSize: '0.8125rem', flex: 1 }}>
          Mention &ldquo;{tripCode || 'trip code'}&rdquo; in your message so I know which trip
        </span>
        <button
          className="v-btn v-btn-secondary v-forwarding-address-copy"
          onClick={downloadVcard}
        >
          Save Contact
        </button>
      </div>
    </div>
  );
}
