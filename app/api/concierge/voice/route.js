import { validateTelnyxSignature } from '../../../../lib/utils/telnyxAuth';
import { checkFeature } from '../../../../lib/features';
import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!(await checkFeature('concierge_voice'))) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">This feature is currently disabled.</Say></Response>`;
    return new NextResponse(twiml, { status: 200, headers: { 'Content-Type': 'text/xml' } });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // Validate Telnyx signature
  const signature = request.headers.get('telnyx-signature-ed25519') || '';
  const timestamp = request.headers.get('telnyx-timestamp') || '';

  if (process.env.TELNYX_PUBLIC_KEY && !validateTelnyxSignature(
    process.env.TELNYX_PUBLIC_KEY.trim(), signature, timestamp, rawBody
  )) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi! This is the Vialoure concierge. Leave a message with your trip details and we'll pass it along.</Say>
  <Record maxLength="120" timeout="10" action="${(process.env.TELNYX_VOICE_RECORDING_WEBHOOK_URL || '/api/concierge/voice/recording')}" />
  <Say voice="alice">I didn't catch anything. Try texting this number instead.</Say>
</Response>`;

  return new NextResponse(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
