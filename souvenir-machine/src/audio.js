// Microphone capture + Meyda real-time feature extraction.
// Raw audio is never stored — only the numeric features Meyda computes per
// frame are kept, in line with the "extract features, discard audio" ethics
// position (see build spec section 11).

import Meyda from 'meyda';

export const BUFFER_SIZE = 1024; // must be a power of two for Meyda
export const RECORD_SECONDS = 30;

const FEATURE_EXTRACTORS = [
  'rms',
  'spectralCentroid',
  'zcr',
  'spectralFlatness',
  'spectralRolloff',
  'spectralSpread',
  'amplitudeSpectrum',
];

// Lowest ~10% of amplitudeSpectrum bins stand in for "bass weight" — Meyda
// has no built-in low-band-energy feature, so we sum it ourselves.
function lowBandEnergy(amplitudeSpectrum) {
  const bandSize = Math.max(1, Math.floor(amplitudeSpectrum.length * 0.1));
  let sum = 0;
  for (let i = 0; i < bandSize; i++) sum += amplitudeSpectrum[i];
  return sum;
}

// Frame-to-frame positive spectral change, i.e. how much the spectrum is
// moving. We compute this ourselves against the previous amplitudeSpectrum
// frame rather than relying on Meyda's internal flux state.
function spectralFlux(current, previous) {
  if (!previous) return 0;
  let sum = 0;
  for (let i = 0; i < current.length; i++) {
    const diff = current[i] - previous[i];
    if (diff > 0) sum += diff;
  }
  return sum;
}

export async function requestMicStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
}

// Records RECORD_SECONDS of per-frame features and resolves with the raw
// frame list (each frame is a small plain-number object, not audio).
export async function recordAmbience({ onProgress } = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();

  // iOS Safari suspends new AudioContexts until a user gesture resumes them.
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const stream = await requestMicStream();
  const source = audioContext.createMediaStreamSource(stream);

  const frames = [];
  let previousSpectrum = null;
  const startTime = audioContext.currentTime;

  return new Promise((resolve, reject) => {
    let analyzer;
    try {
      analyzer = Meyda.createMeydaAnalyzer({
        audioContext,
        source,
        bufferSize: BUFFER_SIZE,
        featureExtractors: FEATURE_EXTRACTORS,
        callback: (features) => {
          const flux = spectralFlux(features.amplitudeSpectrum, previousSpectrum);
          previousSpectrum = features.amplitudeSpectrum;

          frames.push({
            rms: features.rms,
            spectralCentroid: features.spectralCentroid,
            zcr: features.zcr,
            spectralFlatness: features.spectralFlatness,
            spectralRolloff: features.spectralRolloff,
            spectralSpread: features.spectralSpread,
            lowBandEnergy: lowBandEnergy(features.amplitudeSpectrum),
            spectralFlux: flux,
          });

          const elapsed = audioContext.currentTime - startTime;
          if (onProgress) onProgress(Math.min(1, elapsed / RECORD_SECONDS));

          if (elapsed >= RECORD_SECONDS) {
            analyzer.stop();
            source.disconnect();
            stream.getTracks().forEach((track) => track.stop());
            audioContext.close();
            resolve(frames);
          }
        },
      });
      analyzer.start();
    } catch (err) {
      reject(err);
    }
  });
}
