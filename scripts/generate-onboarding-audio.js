import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'audio');

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('Set ELEVENLABS_API_KEY before running this script.');
  process.exit(1);
}

const clips = [
  {
    filename: 'onboarding-overview.mp3',
    text: "This is your trip overview — dates, destination, and who's going at a glance.",
  },
  {
    filename: 'onboarding-calendar.mp3',
    text: "The calendar shows your day-by-day plan. Tap any day to see what's happening.",
  },
  {
    filename: 'onboarding-members.mp3',
    text: "Here's everyone on the trip — you can see when they're arriving and departing.",
  },
  {
    filename: 'onboarding-concierge.mp3',
    text: 'Text or call me anytime to add flights, restaurants, or anything else to the trip.',
  },
  {
    filename: 'onboarding-done.mp3',
    text: "You're all set! Enjoy the trip.",
  },
];

async function generate(text, format = 'mp3_44100_128') {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${format}`,
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

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

mkdirSync(outDir, { recursive: true });

for (const clip of clips) {
  console.log(`Generating ${clip.filename}...`);
  const buffer = await generate(clip.text);
  const outPath = join(outDir, clip.filename);
  writeFileSync(outPath, buffer);
  console.log(`  Wrote ${outPath} (${buffer.length} bytes)`);
}

console.log('Done!');
