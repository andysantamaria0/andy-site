import { createClient } from '@supabase/supabase-js';
import { buildParsePrompt } from '../../../../../lib/utils/parsePrompt';
import { detectTripForSms } from '../../../../../lib/utils/tripDetection';
import { validateTwilioSignature } from '../../../../../lib/utils/twilioAuth';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(request) {
  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = (process.env.TWILIO_VOICE_RECORDING_WEBHOOK_URL || new URL(request.url).toString().split('?')[0]).trim();

  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
  )) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const { RecordingUrl, From: from, CallSid } = params;
  if (!RecordingUrl || !from) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Detect trip by phone number
  const detection = await detectTripForSms(supabase, {
    senderPhone: from,
    messageText: '',
  });

  const trip = detection.trip;
  if (!trip) {
    // Can't route — still store with null trip_id for manual review
    console.error('Voice recording from unknown sender:', from);
  }

  // Fetch the recording audio from Twilio
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const auth = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  let audioBase64 = null;
  try {
    // Twilio recordings are available as .wav
    const res = await fetch(`${RecordingUrl}.wav`, {
      headers: { 'Authorization': auth },
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      audioBase64 = Buffer.from(buffer).toString('base64');
    }
  } catch (e) {
    console.error('Failed to fetch recording:', e);
  }

  // Parse with Claude if we have audio and a trip
  let parsedData = null;
  let parseError = null;

  if (audioBase64 && trip) {
    try {
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

      const promptText = buildParsePrompt({
        trip,
        memberContext,
        text: '(see attached voice recording)',
      });

      const content = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'audio/wav', data: audioBase64 },
        },
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
      parseError = e.message || 'Failed to parse voice recording';
    }
  } else if (!audioBase64) {
    parseError = 'Could not retrieve recording audio';
  } else {
    parseError = 'Could not determine trip for this caller';
  }

  // Store in inbound_emails
  const { error: insertError } = await supabase
    .from('inbound_emails')
    .insert({
      trip_id: trip?.id || null,
      from_email: from,
      from_name: null,
      subject: 'Voice Note',
      text_body: null,
      message_id: CallSid || null,
      raw_payload: params,
      sender_member_id: detection.member?.id || null,
      sender_profile_id: detection.member?.user_id || null,
      parsed_data: parsedData,
      parse_error: parseError,
      status: 'pending',
      channel: 'voice',
      reply_to: from,
    });

  if (insertError) {
    console.error('Failed to insert voice recording:', insertError);
  }

  // Return empty TwiML (call is already recorded)
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Thanks! We got your message.</Say></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
