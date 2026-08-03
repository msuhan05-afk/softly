// Thin wrapper around OpenAI's image-generation endpoint. Shared by the
// Vercel serverless function (api/generate-image.js) and the local dev
// server (dev-server.js) so both entry points call the exact same code.

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export async function generateImage({ prompt, apiKey }) {
  const res = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1536', // portrait, closest supported size to a print card
      quality: 'medium',
      n: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`OpenAI image API error ${res.status}: ${text}`);
    err.status = res.status >= 400 && res.status < 500 ? 502 : 502;
    throw err;
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI response did not include image data');
  return b64;
}
