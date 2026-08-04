// Thin wrapper around a hosted open-weight image-generation model, via the
// Hugging Face Inference API. FLUX.1-schnell is Apache-2.0 licensed (open
// weights), unlike OpenAI's closed gpt-image-1 — this is the open-source
// counterpart to that same code path. Shared by the Vercel serverless
// function (api/generate-image.js) and the local dev server
// (dev-api-server.js) so both entry points call the exact same code.

const HF_MODEL = 'black-forest-labs/FLUX.1-schnell';
const HF_INFERENCE_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// Returns { base64, contentType } — the Inference API responds with raw
// image bytes on success (no JSON envelope like OpenAI's), so the content
// type has to be read off the response and passed through to the browser.
export async function generateImage({ prompt, apiKey }) {
  const res = await fetch(HF_INFERENCE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: prompt }),
  });

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    if (data.error) {
      // The serverless Inference API cold-starts models on first use and
      // returns 503 + estimated_time while it loads — surface that
      // distinctly so the UI can tell the user to just try again shortly.
      const wait = data.estimated_time
        ? ` (estimated ${Math.ceil(data.estimated_time)}s to load — try again shortly)`
        : '';
      throw new Error(`Hugging Face Inference API: ${data.error}${wait}`);
    }
    throw new Error(`Unexpected JSON response from Hugging Face Inference API (status ${res.status})`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Hugging Face Inference API error ${res.status}: ${text}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString('base64'), contentType: contentType || 'image/jpeg' };
}
