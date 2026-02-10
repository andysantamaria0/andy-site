import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';

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

  return (
    <div className="v-page">
      <div className="v-placeholder">
        <div className="v-placeholder-title">Expenses</div>
        <p>Coming soon — track shared expenses and see who owes whom.</p>
      </div>
    </div>
  );
}
