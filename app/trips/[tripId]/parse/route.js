import { createClient } from '../../../../lib/supabase/server';
import { buildParsePrompt } from '../../../../lib/utils/parsePrompt';
import { checkFeature } from '../../../../lib/features';
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

  if (!(await checkFeature('smart_paste'))) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
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

  // Accept both JSON (text only) and FormData (text + images)
  const contentType = request.headers.get('content-type') || '';
  let text = '';
  const imageBlocks = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    text = formData.get('text') || '';
    const imageFiles = formData.getAll('images');

    for (const file of imageFiles) {
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mediaType = file.type || 'image/png';
        imageBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        });
      }
    }
  } else {
    const body = await request.json();
    text = body.text || '';
  }

  if (!text.trim() && imageBlocks.length === 0) {
    return NextResponse.json({ error: 'No content provided' }, { status: 400 });
  }

  // Get trip details and current members
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  const [{ data: members }, { data: legs }] = await Promise.all([
    supabase
      .from('trip_members')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('trip_id', tripId),
    supabase
      .from('trip_legs')
      .select('id, destination, start_date, end_date, leg_order')
      .eq('trip_id', tripId)
      .order('leg_order', { ascending: true }),
  ]);

  const memberContext = (members || []).map((m) => ({
    member_id: m.id,
    user_id: m.user_id,
    name: m.profiles?.display_name || m.display_name || m.profiles?.email || m.email || 'Unknown',
    email: m.profiles?.email || m.email,
    is_manual: !m.user_id,
    current_stay_start: m.stay_start,
    current_stay_end: m.stay_end,
  }));

  const promptText = buildParsePrompt({
    trip,
    memberContext,
    text: text.trim() || '(see attached screenshot)',
    legs: legs || [],
  });

  // Build content blocks: images first, then text prompt
  const content = [
    ...imageBlocks,
    { type: 'text', text: promptText },
  ];

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content }],
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
