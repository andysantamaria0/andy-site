import { randomUUID } from 'crypto';

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'Xb7hH8MSUJpSbSDYk0k2';

/**
 * Generate speech audio from text using the ElevenLabs API.
 * Returns a Buffer of MP3 audio bytes.
 */
export async function generateSpeech(text, { model = 'eleven_flash_v2_5', format = 'mp3_44100_128', speed = 1.0 } = {}) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${format}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model,
        speed,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload an audio buffer to Supabase Storage and return its public URL.
 * Files are stored in the `concierge-audio` bucket.
 */
export async function uploadAudioAndGetUrl(supabase, audioBuffer, filename) {
  const path = `${filename || randomUUID() + '.mp3'}`;

  const { error: uploadError } = await supabase.storage
    .from('concierge-audio')
    .upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase upload error: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('concierge-audio')
    .getPublicUrl(path);

  return urlData?.publicUrl;
}
