/**
 * Build the Claude prompt for generating a daily travel log entry.
 */
export function buildTravelLogPrompt({ trip, events, logistics, messages, photos, arrivals, departures, members, date, legs = [] }) {
  const dateStr = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const memberNames = (members || [])
    .map((m) => m.profiles?.display_name || m.display_name || m.email || 'a guest')
    .filter(Boolean);

  const eventLines = (events || []).map((e) => {
    let line = `- ${e.title}`;
    if (e.start_time) line += ` at ${e.start_time}`;
    if (e.location) line += ` (${e.location})`;
    if (e.category) line += ` [${e.category}]`;
    return line;
  }).join('\n');

  const logisticsLines = (logistics || []).map((l) => {
    let line = `- ${l.type}: ${l.title}`;
    if (l.details) line += ` — ${typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}`;
    return line;
  }).join('\n');

  const messageLines = (messages || []).map((m) => {
    const sender = m.whatsapp_sender_name || m.from_name || m.from_email || 'someone';
    const text = m.text_body ? m.text_body.slice(0, 200) : '(media)';
    return `- ${sender}: "${text}"`;
  }).join('\n');

  const arrivalLines = (arrivals || []).map((a) =>
    `- ${a.profiles?.display_name || a.display_name || a.email} arrived`
  ).join('\n');

  const departureLines = (departures || []).map((d) =>
    `- ${d.profiles?.display_name || d.display_name || d.email} departed`
  ).join('\n');

  const photoCount = (photos || []).length;

  return `You are the voice of a private travel journal for a group of friends. Write a single diary entry for ${dateStr}.

VOICE & STYLE:
- Literary but warm — think Paul Bowles meets a telegram from the Riviera
- First-person plural ("we")
- Use specific names of people, places, restaurants, streets
- 150–300 words
- No bullet points, no headers — flowing prose with short paragraphs
- Understated wit; never gushing or generic
- If nothing much happened, be brief and atmospheric ("The day passed in linen and shade.")

TRIP CONTEXT:
- Trip: "${trip.name}"
- Destination: ${trip.destination || 'unknown'}${legs.length > 1 ? `\n- Trip legs: ${legs.map((l) => `${l.destination} (${l.start_date || '?'}–${l.end_date || '?'})`).join(' → ')}` : ''}${legs.length > 1 ? `\n- Current leg: ${(() => { const leg = legs.find((l) => l.start_date && l.end_date && date >= l.start_date && date <= l.end_date); return leg ? leg.destination : 'between legs'; })()}` : ''}
- Members on this trip: ${memberNames.join(', ') || 'the group'}

DATA FOR ${dateStr}:
${eventLines ? `\nEvents:\n${eventLines}` : ''}
${logisticsLines ? `\nLogistics:\n${logisticsLines}` : ''}
${messageLines ? `\nConversations:\n${messageLines}` : ''}
${arrivalLines ? `\nArrivals:\n${arrivalLines}` : ''}
${departureLines ? `\nDepartures:\n${departureLines}` : ''}
${photoCount > 0 ? `\n${photoCount} photo${photoCount !== 1 ? 's' : ''} taken today.` : ''}

Respond with ONLY valid JSON:
{
  "title": "A short evocative title (3-8 words)",
  "body": "The journal entry text"
}`;
}
