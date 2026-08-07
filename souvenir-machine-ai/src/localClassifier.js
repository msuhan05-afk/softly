// On-device audio classification via MediaPipe Tasks Audio + YAMNet.
// https://developers.google.com/edge/mediapipe/solutions/audio/audio_classifier
//
// Unlike every other model in this project, this one runs *entirely in the
// browser* — WASM runtime + a ~4MB TFLite model, both served from public/.
// No API key, no serverless function, no network call at inference time.
// That makes it the one pipeline here that can be tested end-to-end
// locally without provisioning any credentials.
//
// YAMNet emits scores over the same AudioSet ontology (~521 categories)
// that the hosted AST model on /recognize.html uses, so the two pages are
// directly comparable: same taxonomy, one hosted and one on-device.

import { AudioClassifier, FilesetResolver } from '@mediapipe/tasks-audio';

const WASM_DIR = '/mediapipe-wasm';
const MODEL_PATH = '/models/yamnet.tflite';

const SETUP_HINT =
  'the on-device assets are missing. Run `npm run setup:local` in souvenir-machine-ai/, then reload. ' +
  '(They are gitignored — ~24MB of model + WASM — so a fresh clone has to fetch them once.)';

// MediaPipe rejects with a bare Event or a string in some failure paths,
// not an Error, so `err.message` can be undefined — which previously
// surfaced to the user as the useless "Error: undefined". Always produce
// something readable.
function describeError(err) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (err instanceof Event) return `failed to load ${err.target?.src || 'a required asset'}`;
  return 'unknown error while loading the on-device model';
}

// The assets are gitignored and fetched by `npm run setup:local`, so the
// single most likely failure is that step not having been run. Check for
// it up front and say so plainly, rather than letting MediaPipe fail deep
// inside its loader with an opaque message.
async function assertAssetsPresent() {
  const checks = await Promise.all(
    [`${WASM_DIR}/audio_wasm_internal.js`, MODEL_PATH].map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (!res.ok) return false;
        // A plain !res.ok check isn't enough: Vite's dev server answers
        // unknown paths with the SPA fallback (200 + text/html), so a
        // missing asset still looks like a hit. Treat an HTML response as
        // "not actually there".
        return !(res.headers.get('content-type') || '').includes('text/html');
      } catch {
        return false;
      }
    })
  );
  if (checks.some((ok) => !ok)) {
    throw new Error(SETUP_HINT);
  }
}

let classifierPromise = null;

// Lazily created and cached — loading the WASM runtime and model takes a
// moment, so we do it once and reuse the instance across recordings.
export function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      await assertAssetsPresent();
      try {
        const fileset = await FilesetResolver.forAudioTasks(WASM_DIR);
        return await AudioClassifier.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_PATH },
          maxResults: 8,
        });
      } catch (err) {
        throw new Error(`could not initialise the on-device model — ${describeError(err)}`);
      }
    })().catch((err) => {
      // Don't cache a failed init — let the next attempt retry cleanly.
      classifierPromise = null;
      throw err;
    });
  }
  return classifierPromise;
}

// YAMNet expects 16kHz mono. The mic's AudioContext usually runs at 44.1
// or 48kHz, so resample before classifying or the model reads the clip as
// the wrong duration/pitch and scores are garbage.
const TARGET_SAMPLE_RATE = 16000;

async function resampleTo16k(float32, sourceRate) {
  if (sourceRate === TARGET_SAMPLE_RATE) return float32;
  const frames = Math.round((float32.length * TARGET_SAMPLE_RATE) / sourceRate);
  const offline = new OfflineAudioContext(1, frames, TARGET_SAMPLE_RATE);
  const buffer = offline.createBuffer(1, float32.length, sourceRate);
  buffer.copyToChannel(float32, 0);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

// Returns [{ label, score }] aggregated across the clip. MediaPipe scores
// the audio in ~1s windows and returns one result per window; we average
// each category across windows so a single ranked list describes the whole
// clip rather than just its final second.
export async function classifyClip(float32, sampleRate) {
  const classifier = await getClassifier();
  const samples = await resampleTo16k(float32, sampleRate);
  const windows = classifier.classify(samples, TARGET_SAMPLE_RATE);

  const totals = new Map();
  let windowCount = 0;

  for (const window of windows) {
    const categories = window?.classifications?.[0]?.categories;
    if (!categories?.length) continue;
    windowCount++;
    for (const { categoryName, displayName, score } of categories) {
      const label = displayName || categoryName;
      totals.set(label, (totals.get(label) ?? 0) + score);
    }
  }

  if (!windowCount) return [];

  // Averaging across windows surfaces a long tail of categories that only
  // registered in one window and round to 0% — drop those and cap the
  // list, so the UI shows a readable ranking rather than 20 empty bars.
  return [...totals.entries()]
    .map(([label, total]) => ({ label, score: total / windowCount }))
    .filter(({ score }) => score >= 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
