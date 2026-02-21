import { validateTwilioSignature } from '../../../../lib/utils/twilioAuth';
import { checkFeature } from '../../../../lib/features';
import { createRateLimit } from '../../../../lib/utils/rateLimit';
import { NextResponse } from 'next/server';

const limit = createRateLimit({ windowMs: 60_000, max: 20 });

function twimlResponse(twiml) {
  return new NextResponse(twiml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
}

function twimlError(message) {
  return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">${message}</Say></Response>`);
}

export async function POST(request) {
  try {
    const limited = limit(request);
    if (limited) return limited;
    if (!(await checkFeature('concierge_voice'))) {
      return twimlError('This feature is currently disabled.');
    }

    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body));

    // Validate Twilio signature
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = (process.env.TWILIO_VOICE_WEBHOOK_URL || new URL(request.url).toString().split('?')[0]).trim();

    if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
      process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
    )) {
      console.error('Voice webhook: Twilio signature validation failed', { url });
      return twimlError('Sorry, we could not verify this request.');
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://andysantamaria.com';
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${baseUrl}/audio/concierge-greeting.mp3</Play>
  <Record maxLength="120" timeout="10" action="${(process.env.TWILIO_VOICE_RECORDING_WEBHOOK_URL || '/api/concierge/voice/recording')}" transcribe="true" transcribeCallback="${baseUrl}/api/concierge/voice/transcription" />
  <Play>${baseUrl}/audio/concierge-fallback.mp3</Play>
</Response>`;

    return twimlResponse(twiml);
  } catch (err) {
    console.error('Voice webhook error:', err);
    return twimlError('Sorry, something went wrong. Please try again later.');
  }
}
