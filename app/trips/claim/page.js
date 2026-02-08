import { createClient } from '../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import ClaimForm from '../../../components/trips/ClaimForm';

export const metadata = {
  title: 'Claim Your Spot — Vialoure',
};

export default async function ClaimPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/trips/login');
  }

  // Find all unclaimed memberships matching this email
  const { data: claimable } = await supabase
    .from('trip_members')
    .select('id, trip_id, display_name, trips:trip_id(name, destination)')
    .is('user_id', null)
    .ilike('email', user.email);

  if (!claimable || claimable.length === 0) {
    redirect('/trips');
  }

  return (
    <div className="v-page" style={{ maxWidth: 480, margin: '0 auto', paddingTop: 48 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.75rem', marginBottom: 8 }}>
          You&apos;ve been invited!
        </h1>
        <p style={{ color: 'var(--v-ivory-dim)', fontSize: '0.95rem' }}>
          {claimable.length === 1
            ? 'Someone added you to a trip. Claim your spot to join.'
            : `You've been added to ${claimable.length} trips. Claim your spots below.`}
        </p>
      </div>

      {claimable.map((membership) => (
        <div key={membership.id} className="v-overview-card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
            {membership.trips?.name || 'Trip'}
          </div>
          <div style={{ color: 'var(--v-ivory-dim)', fontSize: '0.85rem', marginBottom: 12 }}>
            {membership.trips?.destination || 'Destination TBD'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--v-ivory-dim)', marginBottom: 12 }}>
            Added as: <strong style={{ color: 'var(--v-ivory)' }}>{membership.display_name}</strong>
          </div>
          <ClaimForm membershipId={membership.id} tripId={membership.trip_id} />
        </div>
      ))}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a href="/trips" style={{ color: 'var(--v-ivory-dim)', fontSize: '0.8rem' }}>
          Skip for now &rarr;
        </a>
      </div>
    </div>
  );
}
