import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ONBOARDING_STEPS } from '@/lib/onboarding/steps';

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET = 'onboarding-audio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const stepId = searchParams.get('stepId');

  const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
  if (!step) {
    return NextResponse.json({ error: 'Unknown step' }, { status: 400 });
  }

  // Build the text — personalize welcome step with tripName/name
  let text = step.message;
  if (stepId === 'welcome') {
    const tripName = searchParams.get('tripName') || 'your trip';
    const name = searchParams.get('name') || '';
    text = name
      ? `Welcome to ${tripName}, ${name}! I'm your concierge — I'll show you around so you feel right at home.`
      : `Welcome to ${tripName}! I'm your concierge — I'll show you around so you feel right at home.`;
  }

  const cacheKey = `step-${stepId}-${Buffer.from(text).toString('base64url').slice(0, 48)}.mp3`;

  // Try to serve from Supabase storage cache
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: cached } = await service.storage.from(BUCKET).download(cacheKey);
  if (cached) {
    const buffer = Buffer.from(await cached.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Generate via ElevenLabs
  if (!API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 });
  }

  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!ttsRes.ok) {
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 502 });
  }

  const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

  // Cache to Supabase storage (best-effort)
  service.storage.from(BUCKET).upload(cacheKey, audioBuffer, {
    contentType: 'audio/mpeg',
    upsert: true,
  }).catch(() => {});

  return new NextResponse(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
