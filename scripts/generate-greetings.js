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
    filename: 'concierge-greeting.mp3',
    text: "Hi! This is the Vialoure concierge. Leave a message with your trip details and we'll take care of it.",
  },
  {
    filename: 'concierge-thanks.mp3',
    text: "Thanks! We got your message.",
  },
  {
    filename: 'concierge-fallback.mp3',
    text: "I didn't catch anything. Try texting this number instead.",
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
