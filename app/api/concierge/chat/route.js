import { createClient } from '../../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { checkFeature } from '../../../../lib/features';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export const maxDuration = 60;

function getServiceSupabase() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function buildChatSystemPrompt({ trip, members, legs, events, logistics, expenses }) {
  const memberList = members.map((m) => {
    const name = m.profiles?.display_name || m.display_name || m.email || 'Unknown';
    const dates = m.stay_start && m.stay_end ? `${m.stay_start} to ${m.stay_end}` : 'dates TBD';
    return `  - ${name} (${m.role}, ${dates})`;
  }).join('\n');

  const legsContext = legs.length > 0
    ? `\nTrip legs:\n${legs.map((l, i) => `  ${i + 1}. ${l.destination} (${l.start_date || '?'} to ${l.end_date || '?'})`).join('\n')}`
    : '';

  const upcomingEvents = (events || []).slice(0, 10).map((e) => {
    const date = e.event_date || '';
    const time = e.start_time ? ` at ${e.start_time}` : '';
    const loc = e.location ? ` — ${e.location}` : '';
    return `  - ${e.title}${date ? ` (${date}${time})` : ''}${loc}`;
  }).join('\n');

  const recentLogistics = (logistics || []).slice(0, 10).map((l) => {
    const type = l.type || 'other';
    const flight = l.flight_number ? ` ${l.flight_number}` : '';
    const dep = l.departure_city || '';
    const arr = l.arrival_city || '';
    const route = dep && arr ? ` ${dep} to ${arr}` : '';
    return `  - [${type}]${flight}${route} — ${l.title || 'untitled'}`;
  }).join('\n');

  const expenseSummary = (expenses || []).length > 0
    ? `\nExpenses (${expenses.length} total, latest 5):\n${expenses.slice(0, 5).map((e) =>
      `  - ${e.vendor || e.description || 'expense'}: ${e.currency || ''} ${e.amount || '?'} (paid by ${e.paid_by_name || 'unknown'})`
    ).join('\n')}`
    : '';

  return `You are the Vialoure concierge — a knowledgeable, warm, and efficient travel assistant for a group trip. You have access to all the trip details below.

Be concise and helpful. Answer questions about the trip, suggest activities, help with logistics. You know every member, flight, event, and expense. When asked about people's arrival times, check the logistics for their flights. When asked about plans, check the events.

TRIP: "${trip.name}"
Destination: ${trip.destination}
Dates: ${trip.start_date || 'TBD'} to ${trip.end_date || 'TBD'}
Currency: ${trip.currency || 'USD'}
${legsContext}

Members:
${memberList}

${upcomingEvents ? `Events:\n${upcomingEvents}` : 'No events yet.'}

${recentLogistics ? `Logistics:\n${recentLogistics}` : 'No logistics yet.'}
${expenseSummary}

Keep responses brief and natural — like a real concierge texting you. No markdown headers or bullet lists unless specifically useful. Use the trip data to give precise answers.`;
}

export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const tripId = url.searchParams.get('tripId');
  if (!tripId) return Response.json({ error: 'tripId required' }, { status: 400 });

  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return Response.json({ error: 'Not a member' }, { status: 403 });

  const { data: messages } = await supabase
    .from('concierge_messages')
    .select('id, sender_type, body, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })
    .limit(100);

  return Response.json({ messages: messages || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await checkFeature('concierge'))) {
    return Response.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const { tripId, message } = await request.json();
  if (!tripId || !message?.trim()) {
    return Response.json({ error: 'tripId and message required' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('id, role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership) return Response.json({ error: 'Not a member' }, { status: 403 });

  const serviceDb = getServiceSupabase();

  // Save user message
  await serviceDb.from('concierge_messages').insert({
    trip_id: tripId,
    sender_type: 'user',
    sender_member_id: membership.id,
    body: message.trim(),
  });

  // Load trip context
  const [{ data: trip }, { data: members }, { data: legs }, { data: events }, { data: logistics }, { data: expenses }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('trip_members').select('*, profiles:user_id(display_name, email)').eq('trip_id', tripId),
    supabase.from('trip_legs').select('*').eq('trip_id', tripId).order('leg_order', { ascending: true }),
    supabase.from('events').select('*').eq('trip_id', tripId).order('event_date', { ascending: true }),
    supabase.from('logistics').select('*').eq('trip_id', tripId).order('start_time', { ascending: true }),
    supabase.from('expenses').select('*, paid_by:paid_by_member_id(id, display_name, profiles:user_id(display_name))').eq('trip_id', tripId).order('expense_date', { ascending: false }).limit(20),
  ]);

  const expensesWithNames = (expenses || []).map((e) => ({
    ...e,
    paid_by_name: e.paid_by?.profiles?.display_name || e.paid_by?.display_name || 'unknown',
  }));

  const systemPrompt = buildChatSystemPrompt({
    trip: trip || {},
    members: members || [],
    legs: legs || [],
    events: events || [],
    logistics: logistics || [],
    expenses: expensesWithNames,
  });

  // Load recent chat history for context
  const { data: history } = await supabase
    .from('concierge_messages')
    .select('sender_type, body')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(20);

  const chatHistory = (history || []).reverse().map((m) => ({
    role: m.sender_type === 'user' ? 'user' : 'assistant',
    content: m.body,
  }));

  // Add current message (it's already in DB but might not be in the history query yet)
  const messagesForClaude = [
    ...chatHistory.filter((m) => m.content !== message.trim()),
    { role: 'user', content: message.trim() },
  ];

  // Stream response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messagesForClaude,
          stream: true,
        });

        let fullReply = '';

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullReply += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        // Save concierge reply
        await serviceDb.from('concierge_messages').insert({
          trip_id: tripId,
          sender_type: 'concierge',
          body: fullReply,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        console.error('Chat stream error:', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
