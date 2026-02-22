'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_LABELS = { logistics: 'Logistics', event: 'Event', expense: 'Expense' };

export default function SuggestionCard({ suggestion, tripId, members, isOwner, onEdit }) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPayerSelect, setShowPayerSelect] = useState(false);
  const [payerMemberId, setPayerMemberId] = useState('');

  const isPending = suggestion.status === 'pending';
  const hasPrice = suggestion.price_amount > 0;
  const creatorName = suggestion.created_by_profile?.display_name;

  async function handleApprove() {
    // If price exists and no payer selected yet, show the dropdown
    if (hasPrice && !showPayerSelect && suggestion.suggestion_type !== 'expense') {
      setShowPayerSelect(true);
      return;
    }

    setApproving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/suggestions/${suggestion.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense_payer_member_id: payerMemberId || undefined,
          dismiss_group: true,
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      // ignore
    }
    setApproving(false);
  }

  async function handleDismiss() {
    setDismissing(true);
    try {
      await fetch(`/api/trips/${tripId}/suggestions/${suggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      router.refresh();
    } catch (e) {
      // ignore
    }
    setDismissing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/trips/${tripId}/suggestions/${suggestion.id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (e) {
      // ignore
    }
    setDeleting(false);
  }

  return (
    <div className={`v-suggestion-card v-suggestion-card-${suggestion.status}`}>
      <div className="v-suggestion-card-header">
        <span className={`v-badge v-badge-member`}>
          {TYPE_LABELS[suggestion.suggestion_type] || suggestion.suggestion_type}
        </span>
        {suggestion.leg?.destination && (
          <span className="v-leg-badge">{suggestion.leg.destination}</span>
        )}
        {suggestion.status !== 'pending' && (
          <span className={`v-badge ${suggestion.status === 'approved' ? 'v-badge-owner' : ''}`}>
            {suggestion.status}
          </span>
        )}
      </div>

      <div className="v-suggestion-card-title">{suggestion.title}</div>
      {suggestion.subtitle && (
        <div className="v-suggestion-card-subtitle">{suggestion.subtitle}</div>
      )}

      {hasPrice && (
        <div className="v-suggestion-card-price">
          {suggestion.price_currency || 'USD'} {Number(suggestion.price_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          {suggestion.price_note && <span className="v-suggestion-card-price-note"> — {suggestion.price_note}</span>}
        </div>
      )}

      {suggestion.url && (
        <a
          href={suggestion.url}
          target="_blank"
          rel="noopener noreferrer"
          className="v-suggestion-card-link"
        >
          View link &rarr;
        </a>
      )}

      {suggestion.notes && (
        <div className="v-suggestion-card-notes">{suggestion.notes}</div>
      )}

      {creatorName && (
        <div className="v-suggestion-card-meta">Added by {creatorName}</div>
      )}

      {showPayerSelect && (
        <div className="v-suggestion-card-payer">
          <label className="v-suggestion-card-payer-label">Who pays?</label>
          <select
            className="v-form-select"
            value={payerMemberId}
            onChange={(e) => setPayerMemberId(e.target.value)}
          >
            <option value="">Select member...</option>
            {(members || []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.profiles?.display_name || m.display_name || m.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {isPending && isOwner && (
        <div className="v-suggestion-card-actions">
          <button
            className="v-btn v-btn-primary v-btn-sm"
            onClick={handleApprove}
            disabled={approving || (showPayerSelect && !payerMemberId)}
          >
            {approving ? 'Approving...' : 'Greenlight'}
          </button>
          {onEdit && (
            <button
              className="v-btn v-btn-secondary v-btn-sm"
              onClick={() => onEdit(suggestion)}
            >
              Edit
            </button>
          )}
          <button
            className="v-btn v-btn-secondary v-btn-sm"
            onClick={handleDismiss}
            disabled={dismissing}
          >
            {dismissing ? '...' : 'Dismiss'}
          </button>
          <button
            className="v-btn v-btn-danger v-btn-sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '...' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
