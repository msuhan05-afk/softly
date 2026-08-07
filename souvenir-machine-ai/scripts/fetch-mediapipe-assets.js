// Fetches the MediaPipe assets the local (no-API-key) recognition page
// needs into public/, so the page runs fully offline in the browser with
// no CDN dependency at runtime:
//
//   public/models/yamnet.tflite   — the on-device classifier (~4MB,
//                                   downloaded from Google's model host)
//   public/mediapipe-wasm/*       — the WASM runtime, copied out of
//                                   node_modules/@mediapipe/tasks-audio
//
// Both are gitignored rather than committed — run `npm run setup:local`
// after `npm install` to populate them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const YAMNET_URL =
  'https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite';
const modelDir = path.join(root, 'public', 'models');
const modelPath = path.join(modelDir, 'yamnet.tflite');

const wasmSrc = path.join(root, 'node_modules', '@mediapipe', 'tasks-audio', 'wasm');
const wasmDest = path.join(root, 'public', 'mediapipe-wasm');

async function fetchModel() {
  if (fs.existsSync(modelPath)) {
    console.log(`✓ model already present at ${path.relative(root, modelPath)}`);
    return;
  }
  fs.mkdirSync(modelDir, { recursive: true });
  console.log('Downloading YAMNet model (~4MB)…');
  const res = await fetch(YAMNET_URL);
  if (!res.ok) throw new Error(`Failed to download YAMNet model: ${res.status}`);
  fs.writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ saved ${path.relative(root, modelPath)}`);
}

function copyWasm() {
  if (!fs.existsSync(wasmSrc)) {
    throw new Error('node_modules/@mediapipe/tasks-audio/wasm not found — run `npm install` first.');
  }
  fs.mkdirSync(wasmDest, { recursive: true });
  for (const file of fs.readdirSync(wasmSrc)) {
    fs.copyFileSync(path.join(wasmSrc, file), path.join(wasmDest, file));
  }
  console.log(`✓ copied MediaPipe WASM runtime to ${path.relative(root, wasmDest)}`);
}

await fetchModel();
copyWasm();
console.log('\nDone. `npm run dev` and open /local.html — no API key needed.');
