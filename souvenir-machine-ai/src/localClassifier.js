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

let classifierPromise = null;

// Lazily created and cached — loading the WASM runtime and model takes a
// moment, so we do it once and reuse the instance across recordings.
export function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const fileset = await FilesetResolver.forAudioTasks('/mediapipe-wasm');
      return AudioClassifier.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/models/yamnet.tflite' },
        maxResults: 8,
      });
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
