import { createClient } from '../../../../lib/supabase/server';
import { buildParsePrompt } from '../../../../lib/utils/parsePrompt';
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
    name: m.profiles?.display_name || m.display_name || m.profiles?.email || m.email || 'Unknown',
    email: m.profiles?.email || m.email,
    is_manual: !m.user_id,
    current_stay_start: m.stay_start,
    current_stay_end: m.stay_end,
  }));

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: buildParsePrompt({ trip, memberContext, text }),
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
