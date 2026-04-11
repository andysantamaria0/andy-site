import { createClient } from '../../../../../lib/supabase/server';
import { computeHappeningNow } from '../../../../../lib/utils/happeningNow';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: membership } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

  const { data: trip } = await supabase
    .from('trips')
    .select('start_date, end_date')
    .eq('id', tripId)
    .single();

  const today = new Date().toISOString().split('T')[0];

  const [{ data: events }, { data: logistics }, { data: members }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, category, event_date, start_time, end_time, location, event_attendees(member_id)')
      .eq('trip_id', tripId)
      .eq('event_date', today),
    supabase
      .from('logistics')
      .select('id, type, title, details, start_time, end_time, profiles:user_id(display_name, avatar_url), logistics_travelers(member_id)')
      .eq('trip_id', tripId)
      .gte('end_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`),
    supabase
      .from('trip_members')
      .select('id, stay_start, stay_end, color, display_name, email, profiles:user_id(display_name, avatar_url)')
      .eq('trip_id', tripId),
  ]);

  // For any in-progress flights, fetch live status from FlightAware cache
  const flightLogistics = (logistics || []).filter((l) => l.type === 'flight');
  const flightUpdates = {};

  for (const fl of flightLogistics) {
    const flightNumber = fl.details?.flight_number || fl.details?.flightNumber;
    if (!flightNumber) continue;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'https://andysantamaria.com'}/api/flights/${encodeURIComponent(flightNumber)}?date=${today}`,
        { headers: { cookie: request.headers.get('cookie') || '' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status) {
          flightUpdates[fl.id] = data;
        }
      }
    } catch {
      // skip failed flight lookups
    }
  }

  const items = computeHappeningNow({
    events: events || [],
    logistics: logistics || [],
    members: members || [],
    trip: trip || {},
    now: new Date(),
  });

  // Enrich flight items with live data
  for (const item of items) {
    if (item.type === 'flight' && item.flightStatus) {
      const logisticsId = item.id.replace('logistics-', '');
      const live = flightUpdates[logisticsId];
      if (live) {
        item.flightStatus.status = live.status || item.flightStatus.status;
        item.flightStatus.progress = live.progressPercent ?? item.flightStatus.progress;
        item.flightStatus.delay = live.delayMinutes ?? 0;
        item.flightStatus.gate = live.gateArrival || live.gateDeparture || item.flightStatus.gate;
        item.flightStatus.terminal = live.terminalArrival || item.flightStatus.terminal;
        if (live.estimatedArrival) {
          item.flightStatus.estimatedArrival = live.estimatedArrival;
        }
      }
    }
  }

  return NextResponse.json({ items });
}
