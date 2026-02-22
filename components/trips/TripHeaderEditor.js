'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp';
const COVER_MAX_WIDTH = 1600;
const COVER_QUALITY = 0.8;

function extFromType(mime) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg';
}

function resizeImage(file, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth) {
        resolve(file);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export default function TripHeaderEditor({ trip, legs = [] }) {
  const isMultiLeg = legs.length > 1;
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

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file, COVER_MAX_WIDTH, COVER_QUALITY);
    setCoverFile(resized);
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
      // Handle cover image via API route (uses service role server-side)
      if (coverFile) {
        const formData = new FormData();
        formData.append('file', coverFile);
        const res = await fetch(`/api/trips/${trip.id}/cover`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
      } else if (removeCover) {
        const res = await fetch(`/api/trips/${trip.id}/cover`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Remove failed');
        }
      }

      // Update name/destination/description
      const { error: updateError } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', trip.id);

      if (updateError) throw updateError;

      // Sync single-leg destination with trip destination
      if (!isMultiLeg && legs.length === 1) {
        await supabase
          .from('trip_legs')
          .update({ destination: destination.trim() })
          .eq('id', legs[0].id);
      }

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
          {isMultiLeg ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--v-pearl-dim)', padding: '6px 0' }}>
              {destination}
              <div style={{ fontSize: '0.75rem', fontStyle: 'italic', marginTop: 2 }}>
                Managed via trip legs
              </div>
            </div>
          ) : (
            <input
              className="v-form-input"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination"
            />
          )}
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
