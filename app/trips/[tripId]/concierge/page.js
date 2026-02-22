import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import ConciergeHero from '../../../../components/trips/ConciergeHero';
import SmartPaste from '../../../../components/trips/SmartPaste';
import SuggestionsPanel from '../../../../components/trips/SuggestionsPanel';
import InboxItem from '../../../../components/trips/InboxItem';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';

export default async function ConciergePage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/trips/login');

  const [featureMap, { data: userProfile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user.email).single(),
  ]);
  const userRole = userProfile?.role || 'user';

  if (!isFeatureEnabled(featureMap, 'concierge', userRole)) {
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

  const { data: trip } = await supabase
    .from('trips')
    .select('inbound_email, trip_code')
    .eq('id', tripId)
    .single();

  const showSmartPaste = isOwner && isFeatureEnabled(featureMap, 'smart_paste', userRole);

  // Fetch legs and members for suggestions
  const [{ data: tripLegs }, { data: tripMembers }] = await Promise.all([
    supabase.from('trip_legs').select('id, destination').eq('trip_id', tripId).order('leg_order', { ascending: true }),
    supabase.from('trip_members').select('id, user_id, display_name, email, profiles:user_id(display_name, email)').eq('trip_id', tripId),
  ]);

  // Only fetch emails for owners
  let pending = [];
  let processed = [];
  if (isOwner) {
    const { data: emails } = await supabase
      .from('inbound_emails')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    pending = (emails || []).filter((e) => e.status === 'pending');
    processed = (emails || []).filter((e) => e.status !== 'pending');
  }

  return (
    <div className="v-page">
      <ConciergeHero tripCode={trip?.trip_code} />

      {showSmartPaste && (
        <div style={{ marginTop: 24 }}>
          <SmartPaste tripId={tripId} legs={tripLegs || []} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <SuggestionsPanel
          tripId={tripId}
          legs={tripLegs || []}
          members={tripMembers || []}
          isOwner={isOwner}
        />
      </div>

      {isOwner && (
        <>
          <h2 className="v-section-title" style={{ marginTop: 32 }}>
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
        </>
      )}
    </div>
  );
}
