'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConciergePill } from './ConciergePillProvider';

const CONCIERGE_EMAIL = 'concierge@andysantamaria.com';
const CONCIERGE_PHONE = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+1XXXXXXXXXX';

export default function ConciergePill() {
  const ctx = useConciergePill();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!ctx || ctx.isConciergeTab) return null;

  const { isExpanded, setIsExpanded, tripId } = ctx;

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

  function formatPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
  }

  return (
    <div className={`v-concierge-pill${isExpanded ? ' v-concierge-pill-expanded' : ''}`}>
      <button
        className="v-concierge-pill-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="v-concierge-pill-avatar">V</span>
        <span className="v-concierge-pill-label">Concierge</span>
        <span className={`v-concierge-pill-chevron${isExpanded ? ' v-concierge-pill-chevron-up' : ''}`}>
          &#x2039;
        </span>
      </button>

      <div className="v-concierge-pill-body">
        <div className="v-concierge-pill-content">
          <a href={`tel:${CONCIERGE_PHONE}`} className="v-concierge-pill-phone">
            {formatPhone(CONCIERGE_PHONE)}
          </a>
          <div className="v-concierge-pill-email">{CONCIERGE_EMAIL}</div>
          <div className="v-concierge-pill-actions">
            <button
              className="v-btn v-btn-secondary v-concierge-pill-btn"
              onClick={() => copyToClipboard(CONCIERGE_PHONE, setCopiedPhone)}
            >
              {copiedPhone ? 'Copied!' : 'Copy Phone'}
            </button>
            <button
              className="v-btn v-btn-secondary v-concierge-pill-btn"
              onClick={() => copyToClipboard(CONCIERGE_EMAIL, setCopiedEmail)}
            >
              {copiedEmail ? 'Copied!' : 'Copy Email'}
            </button>
          </div>
          <Link
            href={`/trips/${tripId}/concierge`}
            className="v-concierge-pill-link"
            onClick={() => setIsExpanded(false)}
          >
            Go to Concierge &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
