// Identical to souvenir-machine/src/features.js — 30s aggregation
// (mean + std-dev) and calibration-based normalisation is shared between
// both versions. Only what happens after this (src/prompt.js vs.
// src/mappings.js in the sibling engine) differs.

const AGGREGATED_KEYS = [
  'rms',
  'spectralCentroid',
  'zcr',
  'spectralFlatness',
  'spectralRolloff',
  'spectralSpread',
  'lowBandEnergy',
  'spectralFlux',
];

const STD_KEYS_USED = ['rms', 'spectralCentroid'];

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values, avg) {
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

export function aggregateFrames(frames) {
  const aggregate = {};
  for (const key of AGGREGATED_KEYS) {
    const values = frames.map((f) => f[key]).filter((v) => Number.isFinite(v));
    const avg = values.length ? mean(values) : 0;
    aggregate[key] = avg;
    if (STD_KEYS_USED.includes(key)) {
      aggregate[`${key}Std`] = values.length ? stddev(values, avg) : 0;
    }
  }
  return aggregate;
}

export async function loadCalibration() {
  const res = await fetch('/calibration.json');
  if (!res.ok) throw new Error('Could not load calibration.json');
  return res.json();
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

export const EXPANSION_K = 0.6;

export function expand(x, k = EXPANSION_K) {
  const centred = x - 0.5;
  const sign = Math.sign(centred) || 1;
  return (sign * Math.pow(Math.abs(centred) * 2, k)) / 2 + 0.5;
}

export function normaliseFeatures(aggregate, calibration) {
  const normalised = {};
  const expanded = {};
  for (const key of Object.keys(aggregate)) {
    const cal = calibration[key];
    if (!cal) continue;
    const { min, max } = cal;
    const raw = aggregate[key];
    const n = max > min ? clamp01((raw - min) / (max - min)) : 0.5;
    normalised[key] = n;
    expanded[key] = clamp01(expand(n));
  }
  return { normalised, expanded };
}
