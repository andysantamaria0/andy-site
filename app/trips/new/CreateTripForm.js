'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

export default function CreateTripForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const destination = formData.get('destination');
    const description = formData.get('description');
    const start_date = formData.get('start_date');
    const end_date = formData.get('end_date');

    const { data: { user } } = await supabase.auth.getUser();

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        name,
        destination,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripError) {
      setError(tripError.message);
      setLoading(false);
      return;
    }

    // Add creator as owner member
    const { data: member, error: memberError } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'owner',
      stay_start: start_date || null,
      stay_end: end_date || null,
    }).select('id').single();

    if (memberError) {
      setError('Trip created but failed to add you as owner. Please try refreshing.');
      setLoading(false);
      return;
    }

    // Create default leg matching trip destination/dates
    const { data: leg } = await supabase.from('trip_legs').insert({
      trip_id: trip.id,
      destination,
      start_date: start_date || null,
      end_date: end_date || null,
      leg_order: 1,
    }).select('id').single();

    if (leg) {
      await supabase.from('trip_leg_members').insert({
        leg_id: leg.id,
        member_id: member.id,
      });
    }

    router.push(`/trips/${trip.id}`);
    router.refresh();
  }

  return (
    <form className="v-form" onSubmit={handleSubmit}>
      {error && (
        <div className="v-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="v-form-group">
        <label className="v-form-label" htmlFor="name">Trip Name</label>
        <input
          className="v-form-input"
          type="text"
          id="name"
          name="name"
          placeholder="e.g. San Miguel de Allende"
          required
        />
      </div>

      <div className="v-form-group">
        <label className="v-form-label" htmlFor="destination">Destination</label>
        <input
          className="v-form-input"
          type="text"
          id="destination"
          name="destination"
          placeholder="e.g. San Miguel de Allende, Mexico"
          required
        />
      </div>

      <div className="v-form-group">
        <label className="v-form-label" htmlFor="description">Description (optional)</label>
        <textarea
          className="v-form-textarea"
          id="description"
          name="description"
          placeholder="What's this trip about?"
          rows={3}
        />
      </div>

      <div className="v-form-row">
        <div className="v-form-group">
          <label className="v-form-label" htmlFor="start_date">Start Date</label>
          <input
            className="v-form-input"
            type="date"
            id="start_date"
            name="start_date"
            value={startDate}
            onChange={(e) => {
              const val = e.target.value;
              setStartDate(val);
              if (val && (!endDate || endDate < val)) {
                setEndDate(val);
              }
            }}
          />
        </div>
        <div className="v-form-group">
          <label className="v-form-label" htmlFor="end_date">End Date</label>
          <input
            className="v-form-input"
            type="date"
            id="end_date"
            name="end_date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="v-form-actions">
        <button
          type="submit"
          className="v-btn v-btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Trip'}
        </button>
        <a href="/trips" className="v-btn v-btn-secondary">Cancel</a>
      </div>
    </form>
  );
}
