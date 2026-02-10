import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../../lib/utils/parsePrompt';
import { detectTripForSms, buildDisambiguationMessage } from '../../../../lib/utils/tripDetection';
import { sendDisambiguationReply } from '../../../../lib/utils/sendReply';
import { validateTwilioSignature } from '../../../../lib/utils/twilioAuth';
import { checkFeature } from '../../../../lib/features';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

function twiml(message) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function emptyTwiml() {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function POST(request) {
  if (!(await checkFeature('concierge_sms'))) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Message>This feature is currently disabled.</Message></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = (process.env.TWILIO_SMS_WEBHOOK_URL || new URL(request.url).toString().split('?')[0]).trim();

  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
  )) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const { From: from, Body: messageBody, NumMedia, MessageSid } = params;
  const numMedia = parseInt(NumMedia || '0', 10);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Dedup by MessageSid
  if (MessageSid) {
    const { data: existing } = await supabase
      .from('inbound_emails')
      .select('id')
      .eq('twilio_message_sid', MessageSid)
      .single();

    if (existing) {
      return emptyTwiml();
    }
  }

  // Detect trip
  const detection = await detectTripForSms(supabase, {
    senderPhone: from,
    messageText: messageBody || '',
  });

  // Handle "switch to" command
  if (detection.switched) {
    return twiml(`Switched to ${detection.trip.name}. Send your message now!`);
  }

  if (detection.ambiguous) {
    await sendDisambiguationReply('sms', from, detection.candidates);
    return emptyTwiml();
  }

  if (!detection.trip) {
    return twiml("I couldn't find a trip for your number. Ask the trip organizer to add your phone number.");
  }

  const trip = detection.trip;

  // Get trip members for context
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

  // Build content blocks for Claude
  const contentBlocks = [];
  const channel = numMedia > 0 ? 'mms' : 'sms';

  // Fetch media attachments (MMS)
  if (numMedia > 0) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const auth = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = params[`MediaUrl${i}`];
      const mediaType = (params[`MediaContentType${i}`] || '').toLowerCase();
      if (!mediaUrl) continue;

      try {
        const res = await fetch(mediaUrl, {
          headers: { 'Authorization': auth },
        });
        if (!res.ok) continue;

        const buffer = await res.arrayBuffer();
        const data = Buffer.from(buffer).toString('base64');

        if (mediaType.startsWith('image/')) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data },
          });
        } else if (mediaType === 'application/pdf') {
          contentBlocks.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data },
          });
        } else if (mediaType.startsWith('audio/')) {
          contentBlocks.push({
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data },
          });
        }
      } catch (e) {
        console.error(`Failed to fetch media ${i}:`, e);
      }
    }
  }

  // Add text body
  const text = (messageBody || '').trim();
  if (text) {
    contentBlocks.push({ type: 'text', text });
  }

  const hasContent = contentBlocks.length > 0;

  // Parse with Claude
  let parsedData = null;
  let parseError = null;

  if (hasContent) {
    try {
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
        text: text || '(see attached media)',
      });

      const content = [
        ...contentBlocks.filter((b) => b.type !== 'text'),
        { type: 'text', text: promptText },
      ];

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
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
      parseError = e.message || 'Failed to parse message content';
    }
  } else {
    parseError = 'No text or media content found';
  }

  // Store in inbound_emails
  const { error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      trip_id: trip.id,
      from_email: from,
      from_name: null,
      subject: text ? text.slice(0, 60) : (channel === 'mms' ? 'MMS Message' : null),
      text_body: text || null,
      message_id: MessageSid || null,
      raw_payload: params,
      sender_member_id: detection.member?.id || null,
      sender_profile_id: detection.member?.user_id || null,
      parsed_data: parsedData,
      parse_error: parseError,
      status: 'pending',
      channel,
      reply_to: from,
      twilio_message_sid: MessageSid || null,
    });

  if (insertError) {
    console.error('Failed to insert SMS inbound:', insertError);
    return twiml("Something went wrong. Please try again.");
  }

  return twiml("Got it! I'll pass this to the trip organizer.");
}
