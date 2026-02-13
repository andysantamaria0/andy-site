'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { CATEGORY_EMOJI } from './EventCard';
import { getMemberDisplayInfo } from '../../lib/utils/members';
import MemberAvatar from './MemberAvatar';
import PlacesAutocompleteInput from './PlacesAutocompleteInput';

const SPLIT_TYPES = [
  { key: 'host_covers', label: 'Host covers' },
  { key: 'equal', label: 'Split evenly' },
  { key: 'custom_amount', label: 'Custom amounts' },
  { key: 'custom_percent', label: 'Custom %' },
];

export default function EventForm({ tripId, members, event, initialDate, onClose, tripCurrency, tripDestination }) {
  const router = useRouter();
  const supabase = createClient();
  const overlayRef = useRef(null);

  const isEdit = !!event;
  const existingAttendeeIds = (event?.event_attendees || []).map((a) => a.member_id);
  const allMemberIds = (members || []).map((m) => m.id);

  const [title, setTitle] = useState(event?.title || '');
  const [category, setCategory] = useState(event?.category || 'other');
  const [eventDate, setEventDate] = useState(event?.event_date || initialDate || '');
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) || '');
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) || '');
  const [location, setLocation] = useState(event?.location || '');
  const [placeId, setPlaceId] = useState(event?.place_id || null);
  const [placeAddress, setPlaceAddress] = useState(event?.place_address || null);
  const [placeLat, setPlaceLat] = useState(event?.place_lat || null);
  const [placeLng, setPlaceLng] = useState(event?.place_lng || null);
  const [notes, setNotes] = useState(event?.notes || '');
  const [selectedMembers, setSelectedMembers] = useState(
    isEdit ? (existingAttendeeIds.length > 0 ? existingAttendeeIds : allMemberIds) : allMemberIds
  );
  const [everyoneInvited, setEveryoneInvited] = useState(
    isEdit ? existingAttendeeIds.length === 0 : true
  );

  // Cost fields
  const [hasCost, setHasCost] = useState(event?.has_cost || false);
  const [costAmount, setCostAmount] = useState(event?.cost_amount || '');
  const [costCurrency, setCostCurrency] = useState(event?.cost_currency || tripCurrency || 'EUR');
  const [costPaidBy, setCostPaidBy] = useState(event?.cost_paid_by || '');
  const [useFriendsCard, setUseFriendsCard] = useState(event?.use_friends_card || false);
  const [splitType, setSplitType] = useState(event?.split_type || 'equal');
  const [customSplits, setCustomSplits] = useState(() => {
    const splits = {};
    (members || []).forEach((m) => { splits[m.id] = ''; });
    if (event?.event_cost_splits) {
      event.event_cost_splits.forEach((s) => {
        if (splitType === 'custom_percent' || event?.split_type === 'custom_percent') {
          splits[s.member_id] = s.percentage || '';
        } else {
          splits[s.member_id] = s.amount || '';
        }
      });
    }
    return splits;
  });

  // External invites
  const [invites, setInvites] = useState(event?.event_invites || []);
  const [newInviteName, setNewInviteName] = useState('');
  const [newInviteContact, setNewInviteContact] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function toggleMember(memberId) {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  function handleEveryoneToggle(checked) {
    setEveryoneInvited(checked);
    if (!checked) {
      setSelectedMembers(allMemberIds);
    }
  }

  function addInvite() {
    if (!newInviteName.trim()) return;
    const contact = newInviteContact.trim();
    const isEmail = contact.includes('@');
    setInvites((prev) => [...prev, {
      name: newInviteName.trim(),
      email: isEmail ? contact : null,
      phone: !isEmail && contact ? contact : null,
    }]);
    setNewInviteName('');
    setNewInviteContact('');
  }

  function removeInvite(index) {
    setInvites((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCustomSplit(memberId, value) {
    setCustomSplits((prev) => ({ ...prev, [memberId]: value }));
  }

  function getCustomTotal() {
    return Object.values(customSplits).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setSaving(true);
    setError(null);

    const eventData = {
      trip_id: tripId,
      title: title.trim(),
      category,
      event_date: eventDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      place_id: placeId || null,
      place_address: placeAddress || null,
      place_lat: placeLat || null,
      place_lng: placeLng || null,
      notes: notes.trim() || null,
      has_cost: hasCost,
      cost_amount: hasCost && costAmount ? parseFloat(costAmount) : null,
      cost_currency: hasCost ? costCurrency : null,
      cost_paid_by: hasCost && costPaidBy ? costPaidBy : null,
      use_friends_card: hasCost ? useFriendsCard : false,
      split_type: hasCost ? splitType : 'equal',
    };

    let eventId = event?.id;

    if (isEdit) {
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      eventData.created_by = user.id;
      const { data, error: insertError } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      eventId = data.id;
    }

    // Sync attendees: delete all then re-insert
    if (isEdit) {
      await supabase.from('event_attendees').delete().eq('event_id', eventId);
    }

    if (!everyoneInvited && selectedMembers.length > 0) {
      const rows = selectedMembers.map((member_id) => ({
        event_id: eventId,
        member_id,
      }));
      const { error: attendeeError } = await supabase
        .from('event_attendees')
        .insert(rows);
      if (attendeeError) {
        setError(attendeeError.message);
        setSaving(false);
        return;
      }
    }

    // Sync cost splits
    if (isEdit) {
      await supabase.from('event_cost_splits').delete().eq('event_id', eventId);
    }
    if (hasCost && (splitType === 'custom_amount' || splitType === 'custom_percent')) {
      const splitRows = Object.entries(customSplits)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([member_id, v]) => ({
          event_id: eventId,
          member_id,
          amount: splitType === 'custom_amount' ? parseFloat(v) : null,
          percentage: splitType === 'custom_percent' ? parseFloat(v) : null,
        }));
      if (splitRows.length > 0) {
        await supabase.from('event_cost_splits').insert(splitRows);
      }
    }

    // Sync external invites
    if (isEdit) {
      await supabase.from('event_invites').delete().eq('event_id', eventId);
    }
    if (invites.length > 0) {
      const inviteRows = invites.map((inv) => ({
        event_id: eventId,
        name: inv.name,
        email: inv.email || null,
        phone: inv.phone || null,
      }));
      await supabase.from('event_invites').insert(inviteRows);
    }

    setSaving(false);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    setDeleting(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="v-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="v-modal">
        <div className="v-modal-header">
          <h3 className="v-section-title" style={{ marginBottom: 0 }}>
            {isEdit ? 'Edit Event' : 'Add Event'}
          </h3>
          <button className="v-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="v-form-group">
            <label className="v-form-label">Title</label>
            <input
              className="v-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at the harbor"
              required
            />
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Category</label>
              <select
                className="v-form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {Object.entries(CATEGORY_EMOJI).map(([key, { emoji, label }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div className="v-form-group">
              <label className="v-form-label">Date</label>
              <input
                className="v-form-input"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="v-form-row">
            <div className="v-form-group">
              <label className="v-form-label">Start time</label>
              <input
                className="v-form-input"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="v-form-group">
              <label className="v-form-label">End time</label>
              <input
                className="v-form-input"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="v-form-group">
            <label className="v-form-label">Location</label>
            <PlacesAutocompleteInput
              value={location}
              onChange={(val) => {
                setLocation(val);
                // Clear structured place data when user types manually
                setPlaceId(null);
                setPlaceAddress(null);
                setPlaceLat(null);
                setPlaceLng(null);
              }}
              onPlaceSelect={({ name, address, placeId: pid, lat, lng }) => {
                setLocation(name);
                setPlaceId(pid);
                setPlaceAddress(address);
                setPlaceLat(lat);
                setPlaceLng(lng);
              }}
              tripDestination={tripDestination}
              placeholder="e.g. Ristorante Da Mario"
            />

            {placeLat && placeLng ? (
              <div className="v-map-preview">
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${placeLng - 0.005},${placeLat - 0.003},${placeLng + 0.005},${placeLat + 0.003}&marker=${placeLat},${placeLng}&layer=mapnik`}
                  title="Map preview"
                />
                <a
                  className="v-map-preview-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeAddress || location || `${placeLat},${placeLng}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {placeAddress || location || 'View in Google Maps'} &rarr;
                </a>
              </div>
            ) : (
              <input
                className="v-form-input v-map-url-input"
                placeholder="Paste a Google Maps link to add coordinates"
                onPaste={async (e) => {
                  const text = (e.clipboardData || window.clipboardData).getData('text');
                  if (!text) return;
                  const urlMatch = text.match(/https?:\/\/\S+/);
                  if (!urlMatch) return;
                  const pastedUrl = urlMatch[0];

                  // Try client-side extraction for full URLs
                  const coordMatch = pastedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                  if (coordMatch) {
                    const lat = parseFloat(coordMatch[1]);
                    const lng = parseFloat(coordMatch[2]);
                    const placeMatch = pastedUrl.match(/\/place\/([^/@]+)/);
                    const name = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : null;
                    setPlaceLat(lat);
                    setPlaceLng(lng);
                    if (name) setPlaceAddress(name);
                    if (!location) setLocation(name || '');
                    e.target.value = '';
                    return;
                  }

                  // For short URLs, call the resolve endpoint
                  if (pastedUrl.includes('goo.gl') || pastedUrl.includes('maps.app')) {
                    try {
                      const res = await fetch('/api/resolve-place', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: pastedUrl }),
                      });
                      const data = await res.json();
                      if (data.lat && data.lng) {
                        setPlaceLat(data.lat);
                        setPlaceLng(data.lng);
                        if (data.name) setPlaceAddress(data.name);
                        if (!location) setLocation(data.name || '');
                      }
                    } catch {}
                    e.target.value = '';
                  }
                }}
              />
            )}
          </div>

          <div className="v-form-group">
            <label className="v-form-label">Notes</label>
            <textarea
              className="v-form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {/* Attendees — avatar chips */}
          <div className="v-form-group">
            <label className="v-form-label">Attendees</label>
            <label className="v-checkbox-row">
              <input
                type="checkbox"
                checked={everyoneInvited}
                onChange={(e) => handleEveryoneToggle(e.target.checked)}
              />
              <span>Everyone invited</span>
            </label>
            <div className="v-attendee-grid">
              {(members || []).map((m) => {
                const info = getMemberDisplayInfo(m);
                const isActive = everyoneInvited || selectedMembers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`v-attendee-chip ${isActive ? 'v-attendee-chip-active' : ''}`}
                    onClick={() => !everyoneInvited && toggleMember(m.id)}
                    disabled={everyoneInvited}
                  >
                    <MemberAvatar
                      member={{
                        display_name: info.name,
                        avatar_url: info.avatarUrl,
                        email: info.email,
                        color: info.color,
                      }}
                      size={24}
                    />
                    <span className="v-attendee-chip-name">{info.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost & billing */}
          <div className="v-form-group">
            <label className="v-checkbox-row">
              <input
                type="checkbox"
                checked={hasCost}
                onChange={(e) => setHasCost(e.target.checked)}
              />
              <span>This event costs money</span>
            </label>

            {hasCost && (
              <div className="v-cost-section">
                <div className="v-form-row" style={{ marginTop: 12 }}>
                  <div className="v-form-group">
                    <label className="v-form-label">Amount</label>
                    <input
                      className="v-form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="v-form-group">
                    <label className="v-form-label">Currency</label>
                    <select
                      className="v-form-input"
                      value={costCurrency}
                      onChange={(e) => setCostCurrency(e.target.value)}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="CHF">CHF</option>
                      <option value="SEK">SEK</option>
                      <option value="NOK">NOK</option>
                      <option value="DKK">DKK</option>
                    </select>
                  </div>
                </div>

                <div className="v-form-row">
                  <div className="v-form-group">
                    <label className="v-form-label">Paid by</label>
                    <select
                      className="v-form-input"
                      value={costPaidBy}
                      onChange={(e) => setCostPaidBy(e.target.value)}
                    >
                      <option value="">Select...</option>
                      {(members || []).map((m) => {
                        const info = getMemberDisplayInfo(m);
                        return (
                          <option key={m.id} value={m.id}>
                            {info.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="v-form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 24 }}>
                    <label className="v-checkbox-row">
                      <input
                        type="checkbox"
                        checked={useFriendsCard}
                        onChange={(e) => setUseFriendsCard(e.target.checked)}
                      />
                      <span>Friends Card</span>
                    </label>
                  </div>
                </div>

                <div className="v-form-group">
                  <label className="v-form-label">Split type</label>
                  <div className="v-split-pills">
                    {SPLIT_TYPES.map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        className={`v-split-pill ${splitType === st.key ? 'v-split-pill-active' : ''}`}
                        onClick={() => setSplitType(st.key)}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(splitType === 'custom_amount' || splitType === 'custom_percent') && (
                  <div className="v-custom-splits">
                    {(members || []).map((m) => {
                      const info = getMemberDisplayInfo(m);
                      return (
                        <div key={m.id} className="v-custom-split-row">
                          <span className="v-custom-split-name">{info.name}</span>
                          <input
                            className="v-form-input v-custom-split-input"
                            type="number"
                            step={splitType === 'custom_percent' ? '1' : '0.01'}
                            min="0"
                            value={customSplits[m.id] || ''}
                            onChange={(e) => updateCustomSplit(m.id, e.target.value)}
                            placeholder={splitType === 'custom_percent' ? '%' : '0.00'}
                          />
                        </div>
                      );
                    })}
                    <div className="v-custom-split-total">
                      Total: {getCustomTotal().toFixed(splitType === 'custom_percent' ? 0 : 2)}
                      {splitType === 'custom_percent' ? '%' : ` ${costCurrency}`}
                      {splitType === 'custom_percent' && getCustomTotal() !== 100 && (
                        <span className="v-split-warn"> (should be 100%)</span>
                      )}
                      {splitType === 'custom_amount' && costAmount && getCustomTotal() !== parseFloat(costAmount) && (
                        <span className="v-split-warn"> (should equal {costAmount})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* External invites */}
          <div className="v-form-group">
            <label className="v-form-label">External Guests</label>
            {invites.length > 0 && (
              <div className="v-invite-list">
                {invites.map((inv, i) => (
                  <div key={i} className="v-invite-row">
                    <span className="v-invite-name">{inv.name}</span>
                    <span className="v-invite-contact">{inv.email || inv.phone || ''}</span>
                    <button type="button" className="v-invite-remove" onClick={() => removeInvite(i)}>&times;</button>
                  </div>
                ))}
              </div>
            )}
            <div className="v-invite-add-row">
              <input
                className="v-form-input"
                value={newInviteName}
                onChange={(e) => setNewInviteName(e.target.value)}
                placeholder="Name"
                style={{ flex: 1 }}
              />
              <input
                className="v-form-input"
                value={newInviteContact}
                onChange={(e) => setNewInviteContact(e.target.value)}
                placeholder="Email or phone"
                style={{ flex: 1 }}
              />
              <button type="button" className="v-btn v-btn-secondary" onClick={addInvite} disabled={!newInviteName.trim()}>
                Add
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--v-cinnabar)', fontSize: '0.875rem', marginBottom: 12 }}>{error}</div>
          )}

          <div className="v-form-actions">
            <button className="v-btn v-btn-primary" type="submit" disabled={saving || !title.trim() || !eventDate}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </button>
            {isEdit && (
              <button
                className="v-btn v-btn-danger"
                type="button"
                onClick={handleDelete}
                onBlur={() => setConfirmingDelete(false)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : confirmingDelete ? 'Confirm delete?' : 'Delete'}
              </button>
            )}
            <button className="v-btn v-btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
