'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'drinks', label: 'Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'activities', label: 'Activities' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' },
];

export default function AddExpenseForm({ tripId, members, myMemberId, currency, onClose }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: '',
    vendor: '',
    amount: '',
    currency: currency || 'USD',
    expense_date: new Date().toISOString().slice(0, 10),
    category: 'other',
    paid_by_member_id: myMemberId || '',
    notes: '',
  });

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description || !form.amount || !form.paid_by_member_id) return;

    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      paid_by_member_id: form.paid_by_member_id,
      description: form.description,
      vendor: form.vendor || null,
      amount: parseFloat(form.amount),
      currency: form.currency,
      expense_date: form.expense_date,
      category: form.category,
      notes: form.notes || null,
    });

    setSaving(false);
    if (!error) {
      router.refresh();
      onClose();
    }
  }

  return (
    <div className="v-expense-modal-overlay" onClick={onClose}>
      <div className="v-expense-modal" onClick={e => e.stopPropagation()}>
        <div className="v-expense-modal-title">Add Expense</div>
        <form onSubmit={handleSubmit}>
          <div className="v-expense-form-row">
            <label>Description *</label>
            <input
              className="v-form-input"
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="What was purchased"
              required
            />
          </div>
          <div className="v-expense-form-row">
            <label>Vendor</label>
            <input
              className="v-form-input"
              value={form.vendor}
              onChange={e => update('vendor', e.target.value)}
              placeholder="Store or restaurant name"
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="v-expense-form-row" style={{ flex: 1 }}>
              <label>Amount *</label>
              <input
                className="v-form-input"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => update('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="v-expense-form-row" style={{ width: 100 }}>
              <label>Currency</label>
              <select
                className="v-form-input"
                value={form.currency}
                onChange={e => update('currency', e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="MXN">MXN</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="v-expense-form-row" style={{ flex: 1 }}>
              <label>Date *</label>
              <input
                className="v-form-input"
                type="date"
                value={form.expense_date}
                onChange={e => update('expense_date', e.target.value)}
                required
              />
            </div>
            <div className="v-expense-form-row" style={{ flex: 1 }}>
              <label>Category</label>
              <select
                className="v-form-input"
                value={form.category}
                onChange={e => update('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="v-expense-form-row">
            <label>Paid by *</label>
            <select
              className="v-form-input"
              value={form.paid_by_member_id}
              onChange={e => update('paid_by_member_id', e.target.value)}
              required
            >
              <option value="">Select member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.profiles?.display_name || m.display_name || m.email || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
          <div className="v-expense-form-row">
            <label>Notes</label>
            <input
              className="v-form-input"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          <div className="v-expense-form-actions">
            <button type="submit" className="v-btn v-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
            <button type="button" className="v-btn v-btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
