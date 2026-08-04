// Thin wrapper around ElevenLabs' sound-generation endpoint. Shared by the
// Vercel serverless function (api/generate-sound.js) and the local dev
// server (dev-api-server.js), same pattern as lib/generateImage.js.

const ELEVENLABS_SOUND_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const DURATION_SECONDS = 10;

// Returns { base64, contentType } — like the Hugging Face Inference API,
// ElevenLabs responds with raw audio bytes on success, not a JSON envelope.
export async function generateSound({ prompt, apiKey }) {
  const res = await fetch(ELEVENLABS_SOUND_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: DURATION_SECONDS,
      prompt_influence: 0.3,
    }),
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let detail;
    if (contentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      detail = data?.detail?.message || JSON.stringify(data?.detail ?? data);
    } else {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`ElevenLabs sound-generation error ${res.status}: ${detail}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString('base64'), contentType: contentType || 'audio/mpeg' };
}
