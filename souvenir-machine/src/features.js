// Aggregates the 30s of per-frame features into one number per feature
// (mean + standard deviation), then normalises those numbers against
// calibration data so different places produce visibly different images.
// See build spec section 5 for why this step exists.

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

// Only these two carry a std-dev into the mapping layer today (they drive
// "dynamism / contrast" per build spec section 6), computed here alongside
// the means for every other feature.
const STD_KEYS_USED = ['rms', 'spectralCentroid'];

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values, avg) {
  const variance = mean(values.map((v) => (v - avg) ** 2));
  return Math.sqrt(variance);
}

// Averages the 30s of per-frame numbers into one mean + std-dev per feature.
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

// Signed power curve centred on 0.5 (the calibration median maps to ~0.5
// after the min/max step). k < 1 spreads values near the middle toward the
// extremes so a café and a park don't collapse into the same grey mush —
// see build spec section 5. Tune this during week-2 distinctness testing.
export const EXPANSION_K = 0.6;

export function expand(x, k = EXPANSION_K) {
  const centred = x - 0.5;
  const sign = Math.sign(centred) || 1;
  return (sign * Math.pow(Math.abs(centred) * 2, k)) / 2 + 0.5;
}

// Normalises one raw aggregate object against calibration.json, returning
// both the plain 0-1 normalisation and the expanded (contrast-boosted)
// version, keyed the same as `aggregate`.
export function normaliseFeatures(aggregate, calibration) {
  const normalised = {};
  const expanded = {};
  for (const key of Object.keys(aggregate)) {
    const cal = calibration[key];
    if (!cal) continue; // no calibration entry -> not used by the mappings
    const { min, max } = cal;
    const raw = aggregate[key];
    const n = max > min ? clamp01((raw - min) / (max - min)) : 0.5;
    normalised[key] = n;
    expanded[key] = clamp01(expand(n));
  }
  return { normalised, expanded };
}
