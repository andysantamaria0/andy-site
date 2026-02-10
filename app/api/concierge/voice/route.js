import { validateTwilioSignature } from '../../../../lib/utils/twilioAuth';
import { checkFeature } from '../../../../lib/features';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!(await checkFeature('concierge_voice'))) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">This feature is currently disabled.</Say></Response>`;
    return new NextResponse(twiml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
  }

  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = (process.env.TWILIO_VOICE_WEBHOOK_URL || new URL(request.url).toString().split('?')[0]).trim();

  if (process.env.TWILIO_AUTH_TOKEN && !validateTwilioSignature(
    process.env.TWILIO_AUTH_TOKEN.trim(), signature, url, params
  )) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi! This is the Vialoure concierge. Leave a message with your trip details and we'll pass it along.</Say>
  <Record maxLength="120" timeout="10" action="${(process.env.TWILIO_VOICE_RECORDING_WEBHOOK_URL || '/api/concierge/voice/recording')}" />
  <Say voice="alice">I didn't catch anything. Try texting this number instead.</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
