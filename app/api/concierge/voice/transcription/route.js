import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../../../lib/utils/parsePrompt';
import { validateTwilioSignature } from '../../../../../lib/utils/twilioAuth';
import { createRateLimit } from '../../../../../lib/utils/rateLimit';
import { generateSpeech, uploadAudioAndGetUrl } from '../../../../../lib/utils/elevenlabs';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();
const limit = createRateLimit({ windowMs: 60_000, max: 20 });

export async function POST(request) {
  try {
    const limited = limit(request);
    if (limited) return limited;
    const body = await request.text();
    if (body.length > 100_000) {
      return new NextResponse('OK', { status: 200 });
    }
    const params = Object.fromEntries(new URLSearchParams(body));

    // Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature') || '';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://andysantamaria.com';
    const url = `${baseUrl}/api/concierge/voice/transcription`;

    if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
      process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
    )) {
      console.error('Voice transcription webhook: Twilio signature validation failed', { url });
      return new NextResponse('OK', { status: 200 });
    }

    const { TranscriptionText, TranscriptionStatus, From: from, CallSid, RecordingSid } = params;

    if (TranscriptionStatus !== 'completed' || !TranscriptionText?.trim()) {
      return new NextResponse('OK', { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Find the existing inbound_emails record for this call
    const { data: existing } = await supabase
      .from('inbound_emails')
      .select('id, trip_id, sender_member_id, sender_profile_id')
      .eq('message_id', CallSid)
      .eq('channel', 'voice')
      .single();

    if (!existing?.trip_id) {
      console.error('Transcription callback: no matching record for CallSid', CallSid);
      return new NextResponse('OK', { status: 200 });
    }

    // Get trip and members for parsing
    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', existing.trip_id)
      .single();

    if (!trip) {
      return new NextResponse('OK', { status: 200 });
    }

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
      .eq('trip_id', trip.id);

    const memberContext = (members || []).map((m) => ({
      member_id: m.id,
      user_id: m.user_id,
      name: m.profiles?.display_name || m.display_name || m.profiles?.email || m.email || 'Unknown',
      email: m.profiles?.email || m.email,
      is_manual: !m.user_id,
      current_stay_start: m.stay_start,
      current_stay_end: m.stay_end,
    }));

    // Parse with Claude
    let parsedData = null;
    let parseError = null;

    try {
      const promptText = buildParsePrompt({
        trip,
        memberContext,
        text: `Voice note transcription: "${TranscriptionText}"`,
      });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: promptText }],
      });

      const responseText = message.content?.[0]?.text || '';
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        parsedData = JSON.parse(responseText.slice(jsonStart, jsonEnd + 1));
      } else {
        parsedData = JSON.parse(responseText);
      }
    } catch (e) {
      parseError = e.message || 'Failed to parse voice transcription';
    }

    // Generate a conversational voice reply
    let replyText = null;
    let replyAudioUrl = null;
    try {
      const senderName = existing.sender_member_id
        ? (members || []).find((m) => m.id === existing.sender_member_id)?.profiles?.display_name || 'there'
        : 'there';

      const replyPrompt = parsedData
        ? `You are the Vialoure concierge for the trip "${trip.name}" to ${trip.destination}. A trip member named ${senderName} just left a voice note saying: "${TranscriptionText}". You extracted this data: ${JSON.stringify(parsedData.summary || parsedData)}. Give a brief, warm spoken acknowledgment (1-2 sentences) confirming what you understood and that it's been noted. Speak naturally as if leaving a voice message back.`
        : `You are the Vialoure concierge for the trip "${trip.name}" to ${trip.destination}. A trip member named ${senderName} just left a voice note saying: "${TranscriptionText}". You couldn't extract structured data from it. Give a brief, warm spoken reply (1-2 sentences) acknowledging their message and asking them to clarify if needed. Speak naturally as if leaving a voice message back.`;

      const replyMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{ role: 'user', content: replyPrompt }],
      });

      replyText = replyMsg.content?.[0]?.text || null;

      if (replyText) {
        const audioBuffer = await generateSpeech(replyText);
        replyAudioUrl = await uploadAudioAndGetUrl(supabase, audioBuffer, `voice-reply-${CallSid}.mp3`);

        // Call the user back with the audio reply
        if (from && replyAudioUrl) {
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;
          const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
          const twiml = `<Response><Play>${replyAudioUrl}</Play></Response>`;

          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ From: twilioFrom, To: from, Twiml: twiml }).toString(),
            }
          );
        }
      }
    } catch (voiceReplyErr) {
      console.error('Voice reply generation/delivery failed:', voiceReplyErr);
    }

    // Update the existing record with parsed data
    await supabase
      .from('inbound_emails')
      .update({
        text_body: TranscriptionText,
        parsed_data: parsedData,
        parse_error: parseError,
        reply_sent: !!replyAudioUrl,
      })
      .eq('id', existing.id);

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('Voice transcription webhook error:', err);
    return new NextResponse('OK', { status: 200 });
  }
}
