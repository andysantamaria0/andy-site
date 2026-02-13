'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { splitEqual, calculateBalances, minimizeTransactions } from '../../lib/utils/expenses';

function getMemberName(members, memberId) {
  const m = members.find(m => m.id === memberId);
  if (!m) return 'Unknown';
  return m.profiles?.display_name || m.display_name || m.email || 'Unknown';
}

function getMemberPaymentHandles(members, memberId) {
  const m = members.find(m => m.id === memberId);
  if (!m) return {};
  return {
    venmo: m.venmo_username || null,
    cashapp: m.cashapp_tag || null,
    zelle: m.zelle_identifier || null,
  };
}

function buildPaymentLinks(handles, amount, note) {
  const links = [];
  if (handles.venmo) {
    const encodedNote = encodeURIComponent(note);
    links.push({
      label: 'Venmo',
      url: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(handles.venmo)}&amount=${amount}&note=${encodedNote}`,
    });
  }
  if (handles.cashapp) {
    const tag = handles.cashapp.replace(/^\$/, '');
    links.push({
      label: 'Cash App',
      url: `https://cash.app/$${tag}/${amount}`,
    });
  }
  if (handles.zelle) {
    links.push({
      label: `Zelle: ${handles.zelle}`,
      url: null,
    });
  }
  return links;
}

export default function SettlementPanel({ tripId, members, expenses, eventCosts, existingSettlement, onClose }) {
  const router = useRouter();
  const [splitType, setSplitType] = useState('equal');
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(null);

  const memberIds = members.map(m => m.id);

  // Build unified expense records for balance calculation
  // Standalone expenses: split equally among all members
  const standaloneRecords = (expenses || []).map(exp => {
    const splits = splitEqual(Number(exp.amount), memberIds);
    return {
      paid_by: exp.paid_by_member_id,
      amount: Number(exp.amount),
      splits: splits.map(s => ({ user_id: s.userId, amount: s.amount })),
    };
  });

  // Event costs: use their own split data
  const eventRecords = (eventCosts || []).map(ev => {
    const paidBy = ev.cost_paid_by;
    const amount = Number(ev.cost_amount);

    let splits;
    if (ev.split_type === 'host_covers') {
      splits = [{ user_id: paidBy, amount }];
    } else if (ev.split_type === 'custom_amount' && ev.event_cost_splits?.length > 0) {
      splits = ev.event_cost_splits.map(s => ({ user_id: s.member_id, amount: Number(s.amount) }));
    } else {
      // equal split among attendees or all members
      const attendeeIds = ev.event_attendees?.length > 0
        ? ev.event_attendees.map(a => a.member_id)
        : memberIds;
      const equalSplits = splitEqual(amount, attendeeIds);
      splits = equalSplits.map(s => ({ user_id: s.userId, amount: s.amount }));
    }

    return { paid_by: paidBy, amount, splits };
  });

  const allRecords = [...standaloneRecords, ...eventRecords];
  const balances = calculateBalances(allRecords);
  const transactions = minimizeTransactions(balances);

  async function handleSave() {
    setSaving(true);

    // Build shares from transactions: each debtor owes their transaction amount
    const shares = transactions.map(t => ({
      member_id: t.from,
      amount_owed: t.amount,
    }));

    // Also add creditors with 0 owed (they're owed money, not owing)
    const debtorIds = new Set(shares.map(s => s.member_id));
    for (const m of members) {
      if (!debtorIds.has(m.id)) {
        shares.push({ member_id: m.id, amount_owed: 0 });
      }
    }

    const res = await fetch(`/api/trips/${tripId}/settle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ split_type: splitType, shares }),
    });

    setSaving(false);
    if (res.ok) {
      router.refresh();
      onClose();
    }
  }

  async function handleMarkPaid(shareId, paid) {
    setMarkingPaid(shareId);
    await fetch(`/api/trips/${tripId}/settle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_id: shareId, paid }),
    });
    setMarkingPaid(null);
    router.refresh();
  }

  const totalSpent = allRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="v-expense-modal-overlay" onClick={onClose}>
      <div className="v-settlement-panel" onClick={e => e.stopPropagation()}>
        <div className="v-settlement-title">Settle Up</div>

        {existingSettlement && (
          <div className="v-settlement-existing">
            <div className="v-settlement-existing-title">
              Previous Settlement ({new Date(existingSettlement.settled_at).toLocaleDateString()})
            </div>
            {existingSettlement.settlement_shares?.map(share => {
              const name = getMemberName(members, share.member_id);
              return (
                <div key={share.id} className="v-settlement-transaction">
                  <span className="v-settlement-from">{name}</span>
                  <span className="v-settlement-amount">
                    ${share.amount_owed.toFixed(2)}
                  </span>
                  {share.paid ? (
                    <span className="v-settlement-paid">Paid</span>
                  ) : (
                    <button
                      className="v-btn v-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => handleMarkPaid(share.id, true)}
                      disabled={markingPaid === share.id}
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div className="v-expense-summary-label">Total Trip Spending</div>
          <div className="v-expense-summary-value">${totalSpent.toFixed(2)}</div>
        </div>

        {transactions.length === 0 ? (
          <p style={{ color: 'var(--v-pearl-dim)', fontSize: '0.875rem' }}>
            All settled up — no payments needed.
          </p>
        ) : (
          <>
            <div className="v-expense-section-title">Who Owes Whom</div>
            {transactions.map((t, i) => {
              const fromName = getMemberName(members, t.from);
              const toName = getMemberName(members, t.to);
              const handles = getMemberPaymentHandles(members, t.to);
              const links = buildPaymentLinks(handles, t.amount.toFixed(2), `Trip settlement`);

              return (
                <div key={i}>
                  <div className="v-settlement-transaction">
                    <span className="v-settlement-from">{fromName}</span>
                    <span className="v-settlement-arrow">&rarr;</span>
                    <span className="v-settlement-to">{toName}</span>
                    <span className="v-settlement-amount">${t.amount.toFixed(2)}</span>
                  </div>
                  {links.length > 0 && (
                    <div className="v-settlement-links">
                      {links.map((link, j) => link.url ? (
                        <a key={j} href={link.url} className="v-settlement-link" target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      ) : (
                        <span key={j} className="v-settlement-link">{link.label}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        <div className="v-settlement-actions">
          {transactions.length > 0 && (
            <button className="v-btn v-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settlement'}
            </button>
          )}
          <button className="v-btn v-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
