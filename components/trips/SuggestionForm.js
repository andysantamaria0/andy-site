'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const TYPES = [
  { value: 'logistics', label: 'Logistics' },
  { value: 'event', label: 'Event' },
  { value: 'expense', label: 'Expense' },
];

export default function SuggestionForm({ tripId, legs, existingGroups, onClose, suggestion }) {
  const isEditing = !!suggestion;
  const router = useRouter();
  const titleRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [form, setForm] = useState({
    suggestion_type: suggestion?.suggestion_type || 'logistics',
    title: suggestion?.title || '',
    subtitle: suggestion?.subtitle || '',
    leg_id: suggestion?.leg_id || '',
    group_key: suggestion?.group_key || '',
    price_amount: suggestion?.price_amount ? String(suggestion.price_amount) : '',
    price_currency: suggestion?.price_currency || 'USD',
    price_note: suggestion?.price_note || '',
    url: suggestion?.url || '',
    notes: suggestion?.notes || '',
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    if (titleRef.current) titleRef.current.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Derive group_key from leg + type when creating a new group
  function getGroupKey() {
    if (form.group_key && form.group_key !== '__new__') return form.group_key;
    if (form.group_key === '__new__' && form.leg_id && newGroupLabel) {
      return `${form.leg_id}:${newGroupLabel.toLowerCase().replace(/\s+/g, '_')}`;
    }
    return null;
  }

  function getGroupLabel() {
    if (form.group_key === '__new__') return newGroupLabel || null;
    const existing = (existingGroups || []).find((g) => g.key === form.group_key);
    return existing?.label || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.suggestion_type) return;
    setSaving(true);

    const payload = {
      suggestion_type: form.suggestion_type,
      title: form.title,
      subtitle: form.subtitle || undefined,
      leg_id: form.leg_id || undefined,
      group_key: getGroupKey() || undefined,
      group_label: getGroupLabel() || undefined,
      price_amount: form.price_amount ? parseFloat(form.price_amount) : undefined,
      price_currency: form.price_amount ? form.price_currency : undefined,
      price_note: form.price_note || undefined,
      url: form.url || undefined,
      notes: form.notes || undefined,
      payload: {},
    };

    if (isEditing) {
      await fetch(`/api/trips/${tripId}/suggestions/${suggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/trips/${tripId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="v-suggestion-form-overlay" onClick={onClose}>
      <div
        className="v-suggestion-form"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit Suggestion' : 'Add Suggestion'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="v-expense-modal-title">
          {isEditing ? 'Edit Suggestion' : 'Add Suggestion'}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="v-expense-form-row">
            <label>Type *</label>
            <select
              className="v-form-select"
              value={form.suggestion_type}
              onChange={(e) => update('suggestion_type', e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="v-expense-form-row">
            <label>Title *</label>
            <input
              ref={titleRef}
              className="v-form-input"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Villa Athena"
              required
            />
          </div>

          <div className="v-expense-form-row">
            <label>Subtitle</label>
            <input
              className="v-form-input"
              value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder="e.g. 3BR with pool, near port"
            />
          </div>

          {legs && legs.length > 0 && (
            <div className="v-expense-form-row">
              <label>Leg</label>
              <select
                className="v-form-select"
                value={form.leg_id}
                onChange={(e) => update('leg_id', e.target.value)}
              >
                <option value="">No specific leg</option>
                {legs.map((l) => (
                  <option key={l.id} value={l.id}>{l.destination}</option>
                ))}
              </select>
            </div>
          )}

          <div className="v-expense-form-row">
            <label>Group</label>
            <select
              className="v-form-select"
              value={form.group_key}
              onChange={(e) => update('group_key', e.target.value)}
            >
              <option value="">No group (standalone)</option>
              {(existingGroups || []).map((g) => (
                <option key={g.key} value={g.key}>{g.label || g.key}</option>
              ))}
              <option value="__new__">+ New group...</option>
            </select>
          </div>

          {form.group_key === '__new__' && (
            <div className="v-expense-form-row">
              <label>Group Name</label>
              <input
                className="v-form-input"
                value={newGroupLabel}
                onChange={(e) => setNewGroupLabel(e.target.value)}
                placeholder="e.g. Sifnos Accommodation"
              />
            </div>
          )}

          <div className="v-expense-form-row v-expense-form-row-split">
            <div style={{ flex: 1 }}>
              <label>Price</label>
              <input
                className="v-form-input"
                type="number"
                step="0.01"
                value={form.price_amount}
                onChange={(e) => update('price_amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div style={{ width: 80 }}>
              <label>Currency</label>
              <input
                className="v-form-input"
                value={form.price_currency}
                onChange={(e) => update('price_currency', e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>

          {form.price_amount && (
            <div className="v-expense-form-row">
              <label>Price Note</label>
              <input
                className="v-form-input"
                value={form.price_note}
                onChange={(e) => update('price_note', e.target.value)}
                placeholder="e.g. per night, total for 5 nights"
              />
            </div>
          )}

          <div className="v-expense-form-row">
            <label>URL</label>
            <input
              className="v-form-input"
              type="url"
              value={form.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="v-expense-form-row">
            <label>Notes</label>
            <textarea
              className="v-form-textarea"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Any additional details..."
            />
          </div>

          <div className="v-expense-form-actions">
            <button type="submit" className="v-btn v-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Suggestion'}
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
