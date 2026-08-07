// Wrapper around a fixed-vocabulary AudioSet tagging model, via the
// Hugging Face Inference API's standard audio-classification pipeline.
//
// This was originally requested as Microsoft's BEATs
// (https://github.com/microsoft/unilm/tree/master/beats), but BEATs has
// no official Hugging Face model -- Microsoft distributes checkpoints via
// OneDrive only -- and is itself a fixed AudioSet classifier, not a
// zero-shot model, so swapping it in wouldn't have preserved the "type
// any label you want" behavior this page used to have (via CLAP) anyway.
// MIT/ast-finetuned-audioset is the practical equivalent in spirit: a
// widely-used, reliably-hosted, AudioSet-fine-tuned classifier. See
// README.md for the full reasoning.
//
// Unlike CLAP, there are no candidate labels to supply here -- this model
// always scores against its fixed ~527-category AudioSet vocabulary and
// returns whatever it thinks the top matches are.

const AST_MODEL = 'MIT/ast-finetuned-audioset-10-10-0.4593';
const AST_URL = `https://api-inference.huggingface.co/models/${AST_MODEL}`;

// audioBuffer: raw WAV bytes. Returns an array of { label, score } for
// whichever AudioSet categories the model ranked highest.
export async function recognizeSound({ audioBuffer, apiKey }) {
  const res = await fetch(AST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBuffer,
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    // Response wasn't JSON — data stays null, raw text used below.
  }

  if (!res.ok) {
    if (data?.error) {
      // Same cold-start behavior as the other Hugging Face-hosted models
      // — see lib/generateImage.js for why this is surfaced distinctly.
      const wait = data.estimated_time
        ? ` (estimated ${Math.ceil(data.estimated_time)}s to load — try again shortly)`
        : '';
      throw new Error(`Hugging Face Inference API: ${data.error}${wait}`);
    }
    throw new Error(`Hugging Face Inference API error ${res.status}: ${data ? JSON.stringify(data) : text}`);
  }

  if (!Array.isArray(data)) {
    throw new Error('Unexpected response shape from AudioSet audio-classification model');
  }

  return data;
}
