import { createClient } from '../../lib/supabase/server';
import FeatureList from './FeatureList';
import AccessRequestList from './AccessRequestList';

const CATEGORY_ORDER = ['core', 'ai', 'concierge', 'general'];
const CATEGORY_LABELS = {
  core: 'Core',
  ai: 'AI',
  concierge: 'Concierge',
  general: 'General',
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: features }, { data: permissions }, { data: accessRequests }] = await Promise.all([
    supabase.from('features').select('*').order('category').order('label'),
    supabase.from('feature_role_permissions').select('*'),
    supabase.from('access_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
  ]);

  // Group features by category
  const grouped = {};
  for (const f of features || []) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push({
      ...f,
      permissions: (permissions || [])
        .filter((p) => p.feature_id === f.id)
        .reduce((acc, p) => ({ ...acc, [p.role]: p.enabled }), {}),
    });
  }

  // Order categories
  const categories = CATEGORY_ORDER
    .filter((c) => grouped[c])
    .map((c) => ({
      key: c,
      label: CATEGORY_LABELS[c] || c,
      features: grouped[c],
    }));

  return (
    <div className="v-admin-page">
      <div className="v-admin-page-header">
        <h1 className="v-admin-page-title">Access Requests</h1>
        <p className="v-admin-page-subtitle">
          Approve or reject requests from the landing page.
        </p>
      </div>
      <AccessRequestList requests={accessRequests || []} />

      <div className="v-admin-page-header" style={{ marginTop: 48 }}>
        <h1 className="v-admin-page-title">Features</h1>
        <p className="v-admin-page-subtitle">
          Toggle features globally or per role. Disabled features are hidden throughout the app.
        </p>
      </div>
      <FeatureList categories={categories} />
    </div>
  );
}
