import { createClient } from '../../../../lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a trip owner
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can use Smart Paste' }, { status: 403 });
  }

  const { text } = await request.json();
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  // Get trip details and current members
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  const { data: members } = await supabase
    .from('trip_members')
    .select(`
      *,
      profiles:user_id (
        display_name,
        avatar_url,
        email
      )
    `)
    .eq('trip_id', tripId);

  const memberContext = (members || []).map((m) => ({
    member_id: m.id,
    user_id: m.user_id,
    name: m.profiles?.display_name || m.profiles?.email || 'Unknown',
    email: m.profiles?.email,
    current_stay_start: m.stay_start,
    current_stay_end: m.stay_end,
  }));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are helping manage a group trip. Extract structured information from the raw text below.

TRIP CONTEXT:
- Trip: "${trip.name}"
- Destination: ${trip.destination}
- Trip dates: ${trip.start_date || 'not set'} to ${trip.end_date || 'not set'}
- Current members: ${JSON.stringify(memberContext)}

RAW TEXT TO PARSE:
"""
${text}
"""

Extract any of the following you can find:
1. **Member updates**: arrival/departure dates for people (match to existing members by name if possible)
2. **New travelers**: people mentioned who aren't current members (with whatever info is available)
3. **Logistics**: flights, trains, accommodations, car rentals — with dates, confirmation numbers, airlines, etc.
4. **Events**: dinners, parties, activities, outings, sightseeing plans — with dates, times, locations, and who's attending
5. **Notes**: anything else relevant to the trip

Respond with ONLY valid JSON in this exact format:
{
  "member_updates": [
    {
      "member_id": "uuid or null if new person",
      "name": "person's name",
      "stay_start": "YYYY-MM-DD or null",
      "stay_end": "YYYY-MM-DD or null",
      "matched_existing": true
    }
  ],
  "new_travelers": [
    {
      "name": "person's name",
      "email": "email or null",
      "stay_start": "YYYY-MM-DD or null",
      "stay_end": "YYYY-MM-DD or null"
    }
  ],
  "logistics": [
    {
      "person_name": "who this is for",
      "type": "flight|train|bus|car|accommodation|other",
      "title": "short description",
      "details": {
        "airline": "...",
        "flight_number": "...",
        "confirmation_code": "...",
        "departure_city": "...",
        "arrival_city": "...",
        "address": "..."
      },
      "start_time": "ISO datetime or null",
      "end_time": "ISO datetime or null",
      "notes": "any additional info"
    }
  ],
  "events": [
    {
      "title": "short description",
      "category": "dinner_out|dinner_home|activity|outing|party|sightseeing|other",
      "event_date": "YYYY-MM-DD",
      "start_time": "HH:MM or null",
      "end_time": "HH:MM or null",
      "location": "venue/place name or null",
      "notes": "any additional info or null",
      "attendee_names": ["name1", "name2"]
    }
  ],
  "notes": "any other relevant info extracted",
  "summary": "1-2 sentence human-readable summary of what was extracted"
}

If a field can't be determined, use null. For dates, use the trip year (${trip.start_date ? trip.start_date.slice(0, 4) : new Date().getFullYear()}) if only month/day are given. For event attendee_names, list the names of people attending (empty array means everyone). For event times, use 24-hour HH:MM format.`
      }
    ],
  });

  const responseText = message.content[0].text;

  // Extract JSON from the response (handle potential markdown wrapping)
  let parsed;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    return NextResponse.json({
      error: 'Failed to parse AI response',
      raw: responseText,
    }, { status: 500 });
  }

  return NextResponse.json({ parsed, trip_id: tripId });
}
