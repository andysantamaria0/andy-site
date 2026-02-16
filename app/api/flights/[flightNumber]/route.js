import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '../../../../lib/supabase/server';
import { NextResponse } from 'next/server';
import { fetchFlightStatus, normalizeFlightResponse } from '../../../../lib/flightaware';
import { checkFeature } from '../../../../lib/features';
import { createRateLimit } from '../../../../lib/utils/rateLimit';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

const limit = createRateLimit({ windowMs: 60_000, max: 30 });

export async function GET(request, { params }) {
  const limited = limit(request);
  if (limited) return limited;

  // Require authentication
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await checkFeature('flight_tracking'))) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const { flightNumber } = await params;

  if (!flightNumber || flightNumber.length > 10 || !/^[A-Za-z0-9]+$/.test(flightNumber)) {
    return NextResponse.json({ error: 'Invalid flight number' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Missing or invalid ?date=YYYY-MM-DD' }, { status: 400 });
  }

  const supabase = getSupabase();

  // 1. Check cache
  const { data: cached } = await supabase
    .from('flight_status_cache')
    .select('*')
    .eq('flight_number', flightNumber)
    .eq('flight_date', date)
    .single();

  const isFresh = cached && (Date.now() - new Date(cached.fetched_at).getTime()) < CACHE_TTL_MS;

  if (isFresh) {
    return NextResponse.json(toCacheResponse(cached));
  }

  // 2. Fetch from FlightAware
  const raw = await fetchFlightStatus(flightNumber, date);

  if (!raw) {
    // API failed — fall back to stale cache if available
    if (cached) {
      return NextResponse.json(toCacheResponse(cached));
    }
    return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
  }

  // 3. Normalize and upsert cache
  const normalized = normalizeFlightResponse(raw, flightNumber, date);

  const { data: upserted, error } = await supabase
    .from('flight_status_cache')
    .upsert(normalized, { onConflict: 'flight_number,flight_date' })
    .select()
    .single();

  if (error) {
    console.error('[flights API] Cache upsert error:', error);
    // Still return the normalized data even if cache write failed
    return NextResponse.json(toCacheResponse(normalized));
  }

  return NextResponse.json(toCacheResponse(upserted));
}

/**
 * Shape the cache row into the client-facing response.
 * Strips raw_response to keep payload small.
 */
function toCacheResponse(row) {
  return {
    flightNumber: row.flight_number,
    flightDate: row.flight_date,
    status: row.status,
    departureAirport: row.departure_airport,
    arrivalAirport: row.arrival_airport,
    scheduledDeparture: row.scheduled_departure,
    estimatedDeparture: row.estimated_departure,
    actualDeparture: row.actual_departure,
    scheduledArrival: row.scheduled_arrival,
    estimatedArrival: row.estimated_arrival,
    actualArrival: row.actual_arrival,
    delayMinutes: row.delay_minutes || 0,
    gateDeparture: row.gate_departure,
    gateArrival: row.gate_arrival,
    terminalDeparture: row.terminal_departure,
    terminalArrival: row.terminal_arrival,
    progressPercent: row.progress_percent || 0,
    latitude: row.latitude,
    longitude: row.longitude,
    fetchedAt: row.fetched_at,
  };
}
