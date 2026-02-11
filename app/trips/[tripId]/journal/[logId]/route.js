import { createClient } from '../../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { buildTravelLogPrompt } from '../../../../../lib/utils/travelLogPrompt';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

/** PATCH — edit the journal entry body */
export async function PATCH(request, { params }) {
  const { tripId, logId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify owner
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { edited_body } = await request.json();

  const { error } = await supabase
    .from('travel_logs')
    .update({ edited_body, edited_by: user.id })
    .eq('id', logId)
    .eq('trip_id', tripId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** POST — regenerate the journal entry */
export async function POST(request, { params }) {
  const { tripId, logId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify owner
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get existing log
  const { data: log } = await supabase
    .from('travel_logs')
    .select('*')
    .eq('id', logId)
    .eq('trip_id', tripId)
    .single();

  if (!log) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Gather data for the log date
  const logDate = log.log_date;
  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  const [
    { data: events },
    { data: logistics },
    { data: messages },
    { data: photos },
    { data: members },
  ] = await Promise.all([
    serviceSupabase.from('events').select('*').eq('trip_id', tripId).eq('event_date', logDate),
    serviceSupabase.from('logistics').select('*').eq('trip_id', tripId)
      .gte('start_time', `${logDate}T00:00:00`).lte('start_time', `${logDate}T23:59:59`),
    serviceSupabase.from('inbound_emails').select('*').eq('trip_id', tripId)
      .gte('created_at', `${logDate}T00:00:00`).lte('created_at', `${logDate}T23:59:59`),
    serviceSupabase.from('trip_photos').select('*').eq('trip_id', tripId)
      .gte('uploaded_at', `${logDate}T00:00:00`).lte('uploaded_at', `${logDate}T23:59:59`),
    serviceSupabase.from('trip_members')
      .select('*, profiles:user_id(display_name, avatar_url, email)').eq('trip_id', tripId),
  ]);

  const arrivals = (members || []).filter((m) => m.stay_start === logDate);
  const departures = (members || []).filter((m) => m.stay_end === logDate);

  const prompt = buildTravelLogPrompt({
    trip,
    events: events || [],
    logistics: logistics || [],
    messages: messages || [],
    photos: photos || [],
    arrivals,
    departures,
    members: members || [],
    date: logDate,
  });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content?.[0]?.text || '';
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');

    let logData;
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      logData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
    } else {
      logData = JSON.parse(responseText);
    }

    const photoIds = (photos || []).map((p) => p.id);
    const eventIds = (events || []).map((e) => e.id);

    await serviceSupabase
      .from('travel_logs')
      .update({
        title: logData.title || null,
        body: logData.body,
        edited_body: null,
        edited_by: null,
        photo_ids: photoIds,
        event_ids: eventIds,
      })
      .eq('id', logId);

    return NextResponse.json({ ok: true, title: logData.title, body: logData.body });
  } catch (e) {
    console.error('Failed to regenerate travel log:', e);
    return NextResponse.json({ error: 'Failed to regenerate' }, { status: 500 });
  }
}
