import { createClient } from './supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Load all features and their role permissions into a Map.
 * Returns Map<featureId, { enabled, permissions: { [role]: boolean } }>
 */
export async function loadFeatures() {
  const supabase = await createClient();

  const [{ data: features }, { data: permissions }] = await Promise.all([
    supabase.from('features').select('id, enabled'),
    supabase.from('feature_role_permissions').select('feature_id, role, enabled'),
  ]);

  const map = new Map();

  for (const f of features || []) {
    map.set(f.id, { enabled: f.enabled, permissions: {} });
  }

  for (const p of permissions || []) {
    const entry = map.get(p.feature_id);
    if (entry) {
      entry.permissions[p.role] = p.enabled;
    }
  }

  return map;
}

/**
 * Check if a feature is enabled for a given role.
 *
 * Logic:
 * 1. Feature not found → true (don't block unknown)
 * 2. features.enabled === false → false (global kill switch)
 * 3. Permission row for (feature, role) exists → use that value
 * 4. No permission row → true (default enabled)
 */
export function isFeatureEnabled(featureMap, featureId, role) {
  const feature = featureMap.get(featureId);
  if (!feature) return true;
  if (!feature.enabled) return false;

  const rolePerm = feature.permissions[role];
  if (rolePerm !== undefined) return rolePerm;

  return true;
}

/**
 * Single-feature check for API routes.
 * Uses service role client to bypass RLS (works in webhook contexts without user session).
 * Only checks the global enabled flag (no user role context in webhooks).
 */
export async function checkFeature(featureId) {
  const supabase = getServiceSupabase();

  const { data } = await supabase
    .from('features')
    .select('enabled')
    .eq('id', featureId)
    .single();

  // Feature not found → allow
  if (!data) return true;
  return data.enabled;
}
