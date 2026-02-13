import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';
import ExpensesView from '../../../../components/trips/ExpensesView';

export default async function ExpensesPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [featureMap, { data: userProfile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user?.email).single(),
  ]);
  const userRole = userProfile?.role || 'user';

  if (!isFeatureEnabled(featureMap, 'expenses', userRole)) {
    redirect(`/trips/${tripId}`);
  }

  const [
    { data: trip },
    { data: members },
    { data: expenses },
    { data: eventCosts },
    { data: settlements },
  ] = await Promise.all([
    supabase
      .from('trips')
      .select('id, name, currency')
      .eq('id', tripId)
      .single(),
    supabase
      .from('trip_members')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('expense_date', { ascending: false }),
    supabase
      .from('events')
      .select(`
        id, title, event_date, has_cost, cost_amount, cost_currency,
        cost_paid_by, split_type,
        event_cost_splits (id, member_id, amount, percentage),
        event_attendees (id, member_id)
      `)
      .eq('trip_id', tripId)
      .eq('has_cost', true)
      .order('event_date', { ascending: false }),
    supabase
      .from('settlements')
      .select(`
        *,
        settlement_shares (*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  // Determine current user's membership
  const myMember = (members || []).find(m => m.user_id === user?.id);
  const isOwner = myMember?.role === 'owner';
  const latestSettlement = settlements && settlements.length > 0 ? settlements[0] : null;

  return (
    <ExpensesView
      tripId={tripId}
      trip={trip || { currency: 'USD' }}
      members={members || []}
      expenses={expenses || []}
      eventCosts={eventCosts || []}
      latestSettlement={latestSettlement}
      isOwner={isOwner}
      myMemberId={myMember?.id || null}
    />
  );
}
