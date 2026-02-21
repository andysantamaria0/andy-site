import { createClient } from '@supabase/supabase-js';
import { detectTripForSms } from '../../../../../lib/utils/tripDetection';
import { validateTwilioSignature } from '../../../../../lib/utils/twilioAuth';
import { createRateLimit } from '../../../../../lib/utils/rateLimit';
import { NextResponse } from 'next/server';

const limit = createRateLimit({ windowMs: 60_000, max: 20 });

function twimlResponse(twiml) {
  return new NextResponse(twiml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

export async function POST(request) {
  try {
    const limited = limit(request);
    if (limited) return limited;
    const body = await request.text();
    if (body.length > 100_000) {
      return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    const params = Object.fromEntries(new URLSearchParams(body));

    // Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = (process.env.TWILIO_VOICE_RECORDING_WEBHOOK_URL || new URL(request.url).toString().split('?')[0]).trim();

    if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
      process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
    )) {
      console.error('Voice recording webhook: Twilio signature validation failed', { url });
      return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Sorry, we could not verify this request.</Say></Response>');
    }

    const { RecordingUrl, From: from, CallSid } = params;
    if (!RecordingUrl || !from) {
      return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
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
      console.error('Voice recording from unknown sender:', from);
      return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Sorry, we couldn\'t find a trip for your number. Ask the trip organizer to add your phone number.</Say></Response>');
    }

    // Save the recording metadata — parsing happens in the transcription callback
    // once Twilio finishes transcribing the audio
    const { error: insertError } = await supabase
      .from('inbound_emails')
      .insert({
        trip_id: trip?.id || null,
        from_email: from,
        from_name: null,
        subject: 'Voice Note',
        text_body: null,
        message_id: CallSid || null,
        raw_payload: { ...params, recording_url: RecordingUrl },
        sender_member_id: detection.member?.id || null,
        sender_profile_id: detection.member?.user_id || null,
        parsed_data: null,
        parse_error: null,
        status: 'pending',
        channel: 'voice',
        reply_to: from,
      });

    if (insertError) {
      console.error('Failed to insert voice recording:', insertError);
    }

    // Return TwiML with pre-generated thanks audio
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://andysantamaria.com';
    return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Play>${baseUrl}/audio/concierge-thanks.mp3</Play></Response>`);
  } catch (err) {
    console.error('Voice recording webhook error:', err);
    return twimlResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Sorry, something went wrong. Please try again later.</Say></Response>');
  }
}
