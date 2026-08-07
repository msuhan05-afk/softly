// Records a short microphone clip, entirely client-side — no server
// round-trip, no extra library. The recognition pages need an actual audio
// waveform, not the Meyda-extracted numeric features src/audio.js produces
// for the generation pages, so this is a separate, simpler capture path.
//
// Two consumers with different needs:
//   recordClip()        -> 16-bit PCM WAV blob, for the hosted AST model
//                          on /recognize.html (posted as bytes to the API)
//   recordClipSamples() -> raw Float32 + sampleRate, for the on-device
//                          MediaPipe/YAMNet model on /local.html (fed
//                          straight to the classifier, no encoding needed)
//
// Uses ScriptProcessorNode, which is deprecated in favor of AudioWorklet
// but still broadly supported and far simpler to set up for a one-off
// short clip like this.

// Shared capture core — resolves with the merged Float32 samples and the
// AudioContext's sample rate. Both public recorders wrap this.
async function captureSamples(seconds, { onProgress } = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  if (audioContext.state === 'suspended') await audioContext.resume();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  const chunks = [];
  const startTime = audioContext.currentTime;

  source.connect(processor);
  // ScriptProcessorNode only fires onaudioprocess while connected to a
  // destination; this connection doesn't audibly play the mic back
  // because nothing is routed to speakers by default in most setups, but
  // if it ever does, muting the output tab is the workaround.
  processor.connect(audioContext.destination);

  return new Promise((resolve, reject) => {
    processor.onaudioprocess = (event) => {
      try {
        chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
        const elapsed = audioContext.currentTime - startTime;
        if (onProgress) onProgress(Math.min(1, elapsed / seconds));

        if (elapsed >= seconds) {
          processor.disconnect();
          source.disconnect();
          stream.getTracks().forEach((track) => track.stop());
          const sampleRate = audioContext.sampleRate;
          audioContext.close();
          resolve({ samples: mergeChunks(chunks), sampleRate });
        }
      } catch (err) {
        reject(err);
      }
    };
  });
}

// Returns a 16-bit PCM WAV Blob.
export async function recordClip(seconds, options) {
  const { samples, sampleRate } = await captureSamples(seconds, options);
  return encodeWav(samples, sampleRate);
}

// Returns { samples: Float32Array, sampleRate } — no encoding step, for
// consumers that want the raw waveform (the on-device classifier).
export async function recordClipSamples(seconds, options) {
  return captureSamples(seconds, options);
}

function mergeChunks(chunks) {
  const length = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Float32Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate (mono, 16-bit)
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
