import { createClient } from '../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { formatDateRange } from '../../../../lib/utils/dates';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { tripCode } = await params;
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: trip } = await service
    .from('trips')
    .select('name, destination')
    .eq('trip_code', tripCode)
    .single();

  const title = trip ? `Join ${trip.name} — Vialoure` : 'Join Trip — Vialoure';
  const description = trip?.destination
    ? `You're invited to ${trip.name} in ${trip.destination}`
    : 'You\'re invited to a trip on Vialoure';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'Vialoure',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function JoinTripPage({ params }) {
  const { tripCode } = await params;

  // Use service role to bypass RLS for public lookup
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: trip } = await service
    .from('trips')
    .select('id, name, destination, start_date, end_date, cover_image_url, trip_code')
    .eq('trip_code', tripCode)
    .single();

  if (!trip) {
    return (
      <div className="v-login">
        <div className="v-login-brand">
          <svg viewBox="0 0 120 48" className="v-login-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
          <div className="v-login-logo">Vialoure</div>
        </div>
        <div className="v-login-card">
          <p>This invite link is invalid or the trip no longer exists.</p>
          <Link href="/trips/login" className="v-btn v-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Get member count
  const { count: memberCount } = await service
    .from('trip_members')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip.id);

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check if already a member
    const { data: membership } = await service
      .from('trip_members')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .single();

    if (membership) {
      redirect(`/trips/${trip.id}`);
    }

    // Check if invited by email but unclaimed
    const { data: emailMembership } = await service
      .from('trip_members')
      .select('id')
      .eq('trip_id', trip.id)
      .ilike('email', user.email)
      .is('user_id', null)
      .single();

    if (emailMembership) {
      // Claim the membership
      await service
        .from('trip_members')
        .update({ user_id: user.id })
        .eq('id', emailMembership.id);
      redirect(`/trips/${trip.id}?onboard=1`);
    }

    // Logged in but not a member
    return (
      <div className="v-login">
        <div className="v-login-brand">
          <svg viewBox="0 0 120 48" className="v-login-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
          <div className="v-login-logo">Vialoure</div>
        </div>
        <div className="v-login-card">
          <JoinTripPreview trip={trip} memberCount={memberCount || 0} />
          <p style={{ marginTop: 16, fontSize: '0.875rem', color: 'var(--v-pearl-dim)' }}>
            You weren&apos;t invited to this trip. Ask the trip organizer to add you as a member.
          </p>
          <Link href="/trips" className="v-btn v-btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', marginTop: 12 }}>
            Go to My Trips
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in — show sign-in prompt
  return (
    <div className="v-login">
      <div className="v-login-brand">
        <svg viewBox="0 0 120 48" className="v-login-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>
        <div className="v-login-logo">Vialoure</div>
        <div className="v-login-tagline">You&apos;re Invited</div>
      </div>
      <div className="v-login-card">
        <JoinTripPreview trip={trip} memberCount={memberCount || 0} />
        <JoinAuthButton tripCode={tripCode} />
      </div>
    </div>
  );
}

function JoinTripPreview({ trip, memberCount }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {trip.cover_image_url && (
        <div
          style={{
            height: 120,
            borderRadius: 4,
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url(${trip.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-end',
            padding: 12,
          }}
        >
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '1.25rem', color: '#F0EDE6', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {trip.name}
          </span>
        </div>
      )}
      {!trip.cover_image_url && (
        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>{trip.name}</h2>
      )}
      <div style={{ fontSize: '0.875rem', color: 'var(--v-champagne)', marginBottom: 4 }}>{trip.destination}</div>
      {trip.start_date && trip.end_date && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--v-pearl-dim)', marginBottom: 4 }}>
          {formatDateRange(trip.start_date, trip.end_date)}
        </div>
      )}
      <div style={{ fontSize: '0.8125rem', color: 'var(--v-pearl-dim)' }}>
        {memberCount} {memberCount === 1 ? 'person' : 'people'} going
      </div>
    </div>
  );
}

function JoinAuthButton({ tripCode }) {
  return (
    <Link
      href={`/trips/login?next=/trips/join/${tripCode}`}
      className="v-btn v-btn-primary"
      style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
    >
      Sign in to Join
    </Link>
  );
}
