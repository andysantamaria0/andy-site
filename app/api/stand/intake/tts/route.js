import { generateSpeech } from '../../../../../lib/utils/elevenlabs';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const audioBuffer = await generateSpeech(text, { model: 'eleven_flash_v2_5', speed: 1.1 });

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate speech' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
