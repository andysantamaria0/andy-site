import { createClient } from '@supabase/supabase-js';
import { buildTravelLogPrompt } from '../../../../lib/utils/travelLogPrompt';
import { checkFeature } from '../../../../lib/features';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await checkFeature('travel_log'))) {
    return NextResponse.json({ message: 'Travel log feature disabled' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Find active trips (today between start_date and end_date + 7 days)
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', yesterday);

  if (!trips || trips.length === 0) {
    return NextResponse.json({ message: 'No active trips', generated: 0 });
  }

  let generated = 0;

  for (const trip of trips) {
    // Skip if log already exists for yesterday
    const { data: existingLog } = await supabase
      .from('travel_logs')
      .select('id')
      .eq('trip_id', trip.id)
      .eq('log_date', yesterday)
      .single();

    if (existingLog) continue;

    // Gather yesterday's data
    const [
      { data: events },
      { data: logistics },
      { data: messages },
      { data: photos },
      { data: members },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('*')
        .eq('trip_id', trip.id)
        .eq('event_date', yesterday),
      supabase
        .from('logistics')
        .select('*')
        .eq('trip_id', trip.id)
        .gte('start_time', `${yesterday}T00:00:00`)
        .lte('start_time', `${yesterday}T23:59:59`),
      supabase
        .from('inbound_emails')
        .select('*')
        .eq('trip_id', trip.id)
        .gte('created_at', `${yesterday}T00:00:00`)
        .lte('created_at', `${yesterday}T23:59:59`),
      supabase
        .from('trip_photos')
        .select('*')
        .eq('trip_id', trip.id)
        .gte('uploaded_at', `${yesterday}T00:00:00`)
        .lte('uploaded_at', `${yesterday}T23:59:59`),
      supabase
        .from('trip_members')
        .select('*, profiles:user_id(display_name, avatar_url, email)')
        .eq('trip_id', trip.id),
    ]);

    // Determine arrivals/departures
    const arrivals = (members || []).filter((m) => m.stay_start === yesterday);
    const departures = (members || []).filter((m) => m.stay_end === yesterday);

    // Skip if no data for yesterday
    const hasData = (events?.length > 0) || (logistics?.length > 0) ||
      (messages?.length > 0) || (photos?.length > 0) ||
      (arrivals.length > 0) || (departures.length > 0);

    if (!hasData) continue;

    // Build prompt and call Claude
    const prompt = buildTravelLogPrompt({
      trip,
      events: events || [],
      logistics: logistics || [],
      messages: messages || [],
      photos: photos || [],
      arrivals,
      departures,
      members: members || [],
      date: yesterday,
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

      await supabase
        .from('travel_logs')
        .insert({
          trip_id: trip.id,
          log_date: yesterday,
          title: logData.title || null,
          body: logData.body,
          photo_ids: photoIds,
          event_ids: eventIds,
          status: 'published',
        });

      generated++;
    } catch (e) {
      console.error(`Failed to generate travel log for trip ${trip.id}:`, e);
    }
  }

  return NextResponse.json({ message: 'Travel log generation complete', generated });
}
