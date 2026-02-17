import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import InboxItem from '../../../../components/trips/InboxItem';
import ConciergeContact from '../../../../components/trips/ConciergeContact';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';

export default async function InboxPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/trips/login');

  const [featureMap, { data: userProfile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user.email).single(),
  ]);
  const userRole = userProfile?.role || 'user';

  if (!isFeatureEnabled(featureMap, 'inbox', userRole)) {
    redirect(`/trips/${tripId}`);
  }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/trips');

  const isOwner = membership.role === 'owner';

  // Get trip for concierge info
  const { data: trip } = await supabase
    .from('trips')
    .select('inbound_email, trip_code')
    .eq('id', tripId)
    .single();

  // Get all inbound emails, pending first
  const { data: emails } = await supabase
    .from('inbound_emails')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  const pending = (emails || []).filter((e) => e.status === 'pending');
  const processed = (emails || []).filter((e) => e.status !== 'pending');

  return (
    <div className="v-page">
      {isOwner && (
        <ConciergeContact tripCode={trip?.trip_code} />
      )}

      <h2 className="v-section-title" style={{ marginTop: isOwner ? 24 : 0 }}>
        Pending {pending.length > 0 && `(${pending.length})`}
      </h2>

      {pending.length === 0 ? (
        <p className="v-hint">
          The inbox awaits its first correspondence. Send the concierge your booking confirmations, flight details, or travel plans.
        </p>
      ) : (
        <div className="v-inbox-list">
          {pending.map((email) => (
            <InboxItem key={email.id} email={email} tripId={tripId} isOwner={isOwner} />
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <>
          <h2 className="v-section-title" style={{ marginTop: 32 }}>History</h2>
          <div className="v-inbox-list">
            {processed.map((email) => (
              <InboxItem key={email.id} email={email} tripId={tripId} isOwner={isOwner} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
