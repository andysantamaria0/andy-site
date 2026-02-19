'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp';

function extFromType(mime) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg';
}

export default function TripHeaderEditor({ trip }) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(trip.name || '');
  const [destination, setDestination] = useState(trip.destination || '');
  const [description, setDescription] = useState(trip.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);

  // Generate / revoke preview URL
  useEffect(() => {
    if (!coverFile) { setCoverPreview(null); return; }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setRemoveCover(false);
  }

  async function handleSave() {
    if (!name.trim() || !destination.trim()) return;
    setSaving(true);
    setError(null);

    const updates = {
      name: name.trim(),
      destination: destination.trim(),
      description: description.trim() || null,
    };

    try {
      // Handle cover image upload
      if (coverFile) {
        const ext = extFromType(coverFile.type);
        const storagePath = `${trip.id}/cover.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('trip-photos')
          .upload(storagePath, coverFile, { contentType: coverFile.type, upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from('trip-photos')
          .getPublicUrl(storagePath);
        updates.cover_image_url = urlData.publicUrl;
      } else if (removeCover) {
        updates.cover_image_url = null;
        // Best-effort delete old file from storage
        if (trip.cover_image_url) {
          const oldPath = trip.cover_image_url.split('/trip-photos/')[1];
          if (oldPath) {
            await supabase.storage.from('trip-photos').remove([decodeURIComponent(oldPath)]);
          }
        }
      }

      const { error: updateError } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', trip.id);

      if (updateError) throw updateError;

      setCoverFile(null);
      setRemoveCover(false);
      setSaving(false);
      setEditing(false);
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  }

  if (!editing) {
    return (
      <>
        <div className="v-trip-header-top">
          <h1 className="v-trip-name">
            {trip.name}
            <button
              className="v-btn-link"
              onClick={() => setEditing(true)}
              style={{ marginLeft: 10, fontSize: '0.75rem' }}
            >
              edit
            </button>
          </h1>
          <a href="/trips" className="v-back">&larr; All Trips</a>
        </div>
        <div className="v-trip-destination">{trip.destination}</div>
      </>
    );
  }

  return (
    <>
      <div className="v-trip-header-top">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            className="v-form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Trip name"
            style={{ fontSize: '1.25rem', fontWeight: 700 }}
          />
          <input
            className="v-form-input"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
          />
          <textarea
            className="v-form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
          />
          {/* Cover image controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(coverPreview || (trip.cover_image_url && !removeCover)) && (
              <img
                src={coverPreview || trip.cover_image_url}
                alt="Cover preview"
                style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 3 }}
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_TYPES}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="v-btn v-btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              {trip.cover_image_url || coverFile ? 'Change Cover' : 'Add Cover'}
            </button>
            {(coverFile || (trip.cover_image_url && !removeCover)) && (
              <button
                type="button"
                className="v-btn v-btn-secondary"
                onClick={() => { setCoverFile(null); setRemoveCover(true); }}
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--v-cinnabar)' }}
              >
                Remove
              </button>
            )}
          </div>
          {error && <div className="v-error-sm">{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="v-btn v-btn-primary" onClick={handleSave} disabled={saving || !name.trim() || !destination.trim()} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              {saving ? '...' : 'Save'}
            </button>
            <button className="v-btn v-btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              Cancel
            </button>
          </div>
        </div>
        <a href="/trips" className="v-back">&larr; All Trips</a>
      </div>
    </>
  );
}
