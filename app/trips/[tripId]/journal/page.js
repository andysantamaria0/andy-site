import { createClient } from '../../../../lib/supabase/server';
import { redirect } from 'next/navigation';
import TravelLogEntry from '../../../../components/trips/TravelLogEntry';
import NotchReveal from '../../../../components/NotchReveal';
import { loadFeatures, isFeatureEnabled } from '../../../../lib/features';

export default async function JournalPage({ params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [featureMap, { data: userProfile }] = await Promise.all([
    loadFeatures(),
    supabase.from('profiles').select('role').eq('email', user.email).single(),
  ]);
  const userRole = userProfile?.role || 'user';

  if (!isFeatureEnabled(featureMap, 'travel_log', userRole)) {
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

  // Get trip info
  const { data: trip } = await supabase
    .from('trips')
    .select('name, destination')
    .eq('id', tripId)
    .single();

  // Get all travel logs, newest first
  const { data: logs } = await supabase
    .from('travel_logs')
    .select('*')
    .eq('trip_id', tripId)
    .order('log_date', { ascending: false });

  // Get photos for entries that reference them
  const allPhotoIds = (logs || []).flatMap((l) => l.photo_ids || []);
  let photosMap = {};
  if (allPhotoIds.length > 0) {
    const { data: photos } = await supabase
      .from('trip_photos')
      .select('id, storage_url, caption, mime_type')
      .in('id', allPhotoIds);

    for (const p of photos || []) {
      photosMap[p.id] = p;
    }
  }

  return (
    <div className="v-page">
      <h2 className="v-section-title">Journal</h2>

      {(!logs || logs.length === 0) ? (
        <p style={{ color: 'var(--v-pearl-dim)', fontSize: '0.9375rem' }}>
          No entries yet. The journal writes itself each morning — a quiet record of the days as they pass.
        </p>
      ) : (
        <div className="v-journal-list">
          {logs.map((log, i) => (
            <div key={log.id}>
              {i > 0 && <NotchReveal compact />}
              <TravelLogEntry
                log={log}
                photos={(log.photo_ids || []).map((id) => photosMap[id]).filter(Boolean)}
                tripId={tripId}
                isOwner={isOwner}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
