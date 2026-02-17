'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import AddExpenseForm from './AddExpenseForm';
import SettlementPanel from './SettlementPanel';

const CATEGORY_EMOJI = {
  food: '\uD83C\uDF7D\uFE0F',
  drinks: '\uD83C\uDF78',
  transport: '\uD83D\uDE95',
  accommodation: '\uD83C\uDFE8',
  activities: '\uD83C\uDFAB',
  groceries: '\uD83D\uDED2',
  supplies: '\uD83D\uDCE6',
  other: '\uD83D\uDCB3',
};

function getMemberName(members, memberId) {
  const m = members.find(m => m.id === memberId);
  if (!m) return 'Unknown';
  return m.profiles?.display_name || m.display_name || m.email || 'Unknown';
}

export default function ExpensesView({ tripId, trip, members, expenses, eventCosts, latestSettlement, isOwner, myMemberId }) {
  const router = useRouter();
  const supabase = createClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [paymentHandles, setPaymentHandles] = useState(() => {
    const me = members.find(m => m.id === myMemberId);
    return {
      venmo_username: me?.venmo_username || '',
      cashapp_tag: me?.cashapp_tag || '',
      zelle_identifier: me?.zelle_identifier || '',
    };
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Merge standalone expenses + event costs into a unified running tab
  const standaloneItems = (expenses || []).map(exp => ({
    id: exp.id,
    type: 'expense',
    description: exp.vendor ? `${exp.vendor} — ${exp.description}` : exp.description,
    category: exp.category || 'other',
    date: exp.expense_date,
    payer: getMemberName(members, exp.paid_by_member_id),
    amount: Number(exp.amount),
    currency: exp.currency || 'USD',
    raw: exp,
  }));

  const eventItems = (eventCosts || []).map(ev => ({
    id: ev.id,
    type: 'event',
    description: ev.title,
    category: 'activities',
    date: ev.event_date,
    payer: ev.cost_paid_by ? getMemberName(members, ev.cost_paid_by) : 'TBD',
    amount: Number(ev.cost_amount),
    currency: ev.cost_currency || trip.currency || 'USD',
  }));

  const allItems = [...standaloneItems, ...eventItems].sort((a, b) =>
    new Date(b.date) - new Date(a.date)
  );

  const totalSpent = allItems.reduce((sum, item) => sum + item.amount, 0);

  // Per-person breakdown of who has paid
  const paidByPerson = {};
  for (const exp of (expenses || [])) {
    const name = getMemberName(members, exp.paid_by_member_id);
    paidByPerson[name] = (paidByPerson[name] || 0) + Number(exp.amount);
  }
  for (const ev of (eventCosts || [])) {
    if (ev.cost_paid_by) {
      const name = getMemberName(members, ev.cost_paid_by);
      paidByPerson[name] = (paidByPerson[name] || 0) + Number(ev.cost_amount);
    }
  }

  const hasEmptyPaymentInfo = !paymentHandles.venmo_username && !paymentHandles.cashapp_tag && !paymentHandles.zelle_identifier;

  async function savePaymentHandle(field, value) {
    setSavingPayment(true);
    setPaymentHandles(prev => ({ ...prev, [field]: value }));
    await supabase
      .from('trip_members')
      .update({ [field]: value })
      .eq('id', myMemberId);
    setSavingPayment(false);
    router.refresh();
  }

  return (
    <div className="v-page">
      <div className="v-page-header">
        <h1 className="v-page-title">Expenses</h1>
      </div>

      {/* Payment Info Card */}
      <div className="v-payment-card">
        <div className="v-payment-card-title">Your Payment Info</div>
        <PaymentField
          label="Venmo"
          placeholder="@username"
          value={paymentHandles.venmo_username}
          onSave={val => savePaymentHandle('venmo_username', val)}
        />
        <PaymentField
          label="Cash App"
          placeholder="$cashtag"
          value={paymentHandles.cashapp_tag}
          onSave={val => savePaymentHandle('cashapp_tag', val)}
        />
        <PaymentField
          label="Zelle"
          placeholder="email or phone"
          value={paymentHandles.zelle_identifier}
          onSave={val => savePaymentHandle('zelle_identifier', val)}
        />
        {hasEmptyPaymentInfo && (
          <div className="v-payment-prompt">Add your payment info so friends can pay you</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="v-expense-summary">
        <div className="v-expense-summary-card">
          <div className="v-expense-summary-label">Total Spent</div>
          <div className="v-expense-summary-value">{trip.currency || 'USD'} {totalSpent.toFixed(2)}</div>
        </div>
        {Object.entries(paidByPerson).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
          <div key={name} className="v-expense-summary-card">
            <div className="v-expense-summary-label">{name}</div>
            <div className="v-expense-summary-value v-expense-summary-value-sm">{trip.currency || 'USD'} {amount.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="v-expense-actions">
        <button className="v-btn v-btn-primary" onClick={() => setShowAdd(true)}>
          Add Expense
        </button>
        {isOwner && (
          <button className="v-btn v-btn-secondary" onClick={() => setShowSettle(true)}>
            Settle Up
          </button>
        )}
      </div>

      {/* Running Tab */}
      {allItems.length === 0 ? (
        <div className="v-expense-empty">
          No expenses yet. Add one manually or forward a receipt to the trip inbox.
        </div>
      ) : (
        <div className="v-expense-list">
          {allItems.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="v-expense-row"
              style={isOwner && item.type === 'expense' ? { cursor: 'pointer' } : undefined}
              onClick={isOwner && item.type === 'expense' ? () => setEditingExpense(item.raw) : undefined}
            >
              <span className="v-expense-emoji">{CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.other}</span>
              <div className="v-expense-info">
                <div className="v-expense-title">
                  {item.description}
                  {item.type === 'event' && (
                    <span className="v-badge v-badge-member" style={{ marginLeft: 8, fontSize: '0.625rem' }}>event</span>
                  )}
                </div>
                <div className="v-expense-meta">
                  {item.date ? format(parseISO(item.date), 'MMM d') : ''} &middot; {item.payer}
                </div>
              </div>
              <span className="v-expense-amount">{item.currency} {item.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddExpenseForm
          tripId={tripId}
          members={members}
          myMemberId={myMemberId}
          currency={trip.currency}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showSettle && (
        <SettlementPanel
          tripId={tripId}
          members={members}
          expenses={expenses}
          eventCosts={eventCosts}
          existingSettlement={latestSettlement}
          onClose={() => setShowSettle(false)}
        />
      )}
      {editingExpense && (
        <AddExpenseForm
          tripId={tripId}
          members={members}
          myMemberId={myMemberId}
          currency={trip.currency}
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}

function PaymentField({ label, placeholder, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  }

  return (
    <div className="v-payment-row">
      <span className="v-payment-label">{label}</span>
      {editing ? (
        <input
          className="v-form-input v-payment-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
        />
      ) : (
        <span
          className="v-payment-input"
          style={{ cursor: 'pointer', color: value ? 'var(--v-pearl)' : 'var(--v-pearl-dim)', fontSize: '0.875rem' }}
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          {value || placeholder}
        </span>
      )}
    </div>
  );
}
