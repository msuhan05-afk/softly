// THE mapping layer. Every function here is a documented design *choice*,
// not a learned weight — see build spec section 0 and 6. If a marker asks
// "why did this loud café become this image?", this file is the answer:
// read the comment above the relevant function.
//
// Input: the *expanded* (contrast-boosted, 0-1) normalised features from
// features.js. Output: a single VisualParams object with named 0-1 fields.
// render.js consumes only VisualParams — it never touches raw audio or
// feature names, which keeps the mapping swappable and testable on its own.

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// spectralCentroid (mean) -> palette temperature.
// Cross-modal brightness metaphor: a bright, high-pitched soundscape reads
// as a lighter, cooler (blue-leaning) palette; a deep, low soundscape reads
// as warmer and darker. 0 = warmest/darkest, 1 = coolest/lightest.
function paletteTempC(expanded) {
  return expanded.spectralCentroid ?? 0.5;
}

// rms (mean) -> visual density (render.js also derives saturation from it).
// A fuller/louder soundscape becomes a denser, more saturated image; a
// quiet one becomes sparse and desaturated. One feature, one param — kept
// deliberately simple so the causal line is easy to state out loud.
function density(expanded) {
  return expanded.rms ?? 0.5;
}

// zcr (mean) -> edge roughness / grain.
// A high zero-crossing-rate sound is noisy/hissy, which we render as
// rough, broken, grainy edges; a smooth/tonal sound gets clean continuous
// edges and placement.
function grain(expanded) {
  return expanded.zcr ?? 0.5;
}

// spectralFlatness (mean) -> form language.
// This is the single biggest driver of overall look (build spec section 6).
// Flatness near 0 = tonal/structured (a clear pitch or hum) -> flowing
// organic curves. Flatness near 1 = noisy/broadband (washy, textureless
// hiss) -> fractured angular geometry.
function formOrganicness(expanded) {
  return expanded.spectralFlatness ?? 0.5;
}

// low-band energy -> weight & vertical composition.
// Heavy bass reads as physical weight: large, dark forms anchored low in
// the frame, echoing how we perceive low frequencies as "heavier".
function weight(expanded) {
  return expanded.lowBandEnergy ?? 0.5;
}

// spectralRolloff & spectralSpread -> fine detail vs simplicity.
// Averaged because both describe how much of the spectrum is spread into
// fine high-frequency content vs concentrated into a simple, narrow band.
function detail(expanded) {
  const rolloff = expanded.spectralRolloff ?? 0.5;
  const spread = expanded.spectralSpread ?? 0.5;
  return (rolloff + spread) / 2;
}

// spectralFlux (mean) -> motion.
// High frame-to-frame spectral change means the soundscape is actively
// moving (traffic passing, voices overlapping); we bake that into the
// still image as directional streaking / motion blur. Low flux (a settled,
// steady room tone) stays static.
function motion(expanded) {
  return expanded.spectralFlux ?? 0.5;
}

// std-dev of rms and centroid -> dynamism / contrast.
// A place whose loudness and brightness *vary* a lot over the 30s (bursts
// of conversation, footsteps, an espresso machine) gets more internal
// contrast and variety than a place that sounds the same throughout.
// Averaged because both describe "how much does this place change".
function contrast(expanded) {
  const rmsStd = expanded.rmsStd ?? 0.5;
  const centroidStd = expanded.spectralCentroidStd ?? 0.5;
  return (rmsStd + centroidStd) / 2;
}

// Ordered table driving both computeVisualParams() and the transparency
// panel (debug.js): which normalised feature(s) feed which VisualParams
// field, and the function that does it.
const MAPPING_TABLE = [
  { param: 'paletteTempC', features: ['spectralCentroid'], fn: paletteTempC },
  { param: 'density', features: ['rms'], fn: density },
  { param: 'grain', features: ['zcr'], fn: grain },
  { param: 'formOrganicness', features: ['spectralFlatness'], fn: formOrganicness },
  { param: 'weight', features: ['lowBandEnergy'], fn: weight },
  { param: 'detail', features: ['spectralRolloff', 'spectralSpread'], fn: detail },
  { param: 'motion', features: ['spectralFlux'], fn: motion },
  { param: 'contrast', features: ['rmsStd', 'spectralCentroidStd'], fn: contrast },
];

// Turns normalised+expanded features into VisualParams, plus a `rows` list
// (raw, normalised, which param it drove, resulting value) for the
// transparency panel in debug.js.
export function computeVisualParams(aggregate, normalisedBundle) {
  const { normalised, expanded } = normalisedBundle;
  const params = {};
  const rows = [];

  for (const entry of MAPPING_TABLE) {
    const value = clamp01(entry.fn(expanded));
    params[entry.param] = value;
    for (const feature of entry.features) {
      rows.push({
        feature,
        raw: aggregate[feature],
        normalised: normalised[feature],
        drove: entry.param,
        paramValue: value,
      });
    }
  }

  return { params, rows };
}

// Bounded random nudge used by curate mode (build spec section 9): perturbs
// a few params within +/-range so all six options stay recognisably "this
// place" but are visibly distinct from each other and from the machine pick.
export function nudgeParams(params, rng, { keys = ['density', 'grain', 'motion'], range = 0.15 } = {}) {
  const nudged = { ...params };
  for (const key of keys) {
    const delta = (rng() * 2 - 1) * range;
    nudged[key] = clamp01(nudged[key] + delta);
  }
  return nudged;
}
