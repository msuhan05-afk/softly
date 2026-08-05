// Wrapper around LAION's CLAP model (https://github.com/LAION-AI/CLAP —
// Contrastive Language-Audio Pretraining), served via the Hugging Face
// Inference API's zero-shot-audio-classification pipeline. Unlike a fixed
// classifier, CLAP scores a clip against whatever text labels are supplied
// at request time — that's the whole point of using it here.

const CLAP_MODEL = 'laion/clap-htsat-unfused';
const CLAP_URL = `https://api-inference.huggingface.co/models/${CLAP_MODEL}`;

// Fallback candidate labels if none are supplied — a generic set of
// environmental-sound categories. The recognize.html page pre-fills its
// input with the same list (kept in sync manually, see src/recognize.js).
export const DEFAULT_LABELS = [
  'rain',
  'wind',
  'birds chirping',
  'traffic noise',
  'human speech',
  'music',
  'footsteps',
  'water or stream',
  'crowd noise',
  'silence',
  'machinery or engine noise',
  'dog barking',
  'construction noise',
  'keyboard typing',
  'applause',
  'laughter',
];

// audioBase64: base64-encoded WAV clip. candidateLabels: text labels to
// score against. Returns an array of { label, score }.
export async function recognizeSound({ audioBase64, candidateLabels, apiKey }) {
  const res = await fetch(CLAP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: audioBase64,
      parameters: { candidate_labels: candidateLabels },
    }),
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    if (data?.error) {
      // Same cold-start behavior as the image model — see
      // lib/generateImage.js for why this is surfaced distinctly.
      const wait = data.estimated_time
        ? ` (estimated ${Math.ceil(data.estimated_time)}s to load — try again shortly)`
        : '';
      throw new Error(`Hugging Face Inference API: ${data.error}${wait}`);
    }
    const detail = data ? JSON.stringify(data) : await res.text().catch(() => '');
    throw new Error(`Hugging Face Inference API error ${res.status}: ${detail}`);
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response shape from CLAP zero-shot-audio-classification');
  }

  return data;
}
