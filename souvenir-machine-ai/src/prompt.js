// The audio -> words mapping. This is the AI-generation counterpart to
// souvenir-machine/src/mappings.js (the no-ML engine's documented
// audio -> VisualParams layer): same 8 features, same explicit per-feature
// design choices, but the output here is a natural-language prompt handed
// to a black-box image model instead of numeric parameters consumed by a
// hand-written renderer.
//
// That's the core difference between the two Souvenir Machine versions —
// see souvenir-machine-ai/README.md. Once the prompt is built, what the
// model does with it is not inspectable or explainable the way the sibling
// engine's pixel-by-pixel mapping is. Exposing the exact prompt text sent
// (done in src/main.js) is the only transparency this version can offer.

function pick(value, low, mid, high) {
  if (value < 0.34) return low;
  if (value < 0.67) return mid;
  return high;
}

// spectralCentroid (mean) -> palette description.
// Same cross-modal brightness metaphor as the sibling engine's
// paletteTempC mapping: bright/high sound -> light/cool palette words,
// deep/low sound -> warm/dark palette words.
function describePalette(expanded) {
  return pick(
    expanded.spectralCentroid ?? 0.5,
    'a deep, warm, low-toned palette',
    'a balanced, natural palette',
    'a bright, airy, cool-toned palette'
  );
}

// rms (mean) -> compositional density words.
function describeDensity(expanded) {
  return pick(
    expanded.rms ?? 0.5,
    'sparse and quiet, mostly empty space',
    'moderately full',
    'dense, busy, richly layered'
  );
}

// zcr (mean) -> surface roughness words.
function describeRoughness(expanded) {
  return pick(
    expanded.zcr ?? 0.5,
    'smooth, clean edges',
    'a mix of smooth and textured surfaces',
    'rough, grainy, textured surfaces'
  );
}

// spectralFlatness (mean) -> form-language words. Biggest driver of overall
// look in the sibling engine too.
function describeForm(expanded) {
  return pick(
    expanded.spectralFlatness ?? 0.5,
    'flowing organic curves',
    'a blend of organic and geometric shapes',
    'fractured angular geometric shapes'
  );
}

// low-band energy -> weight/composition words.
function describeWeight(expanded) {
  return pick(
    expanded.lowBandEnergy ?? 0.5,
    'light, floating elements',
    'a balanced sense of weight',
    'heavy, large forms anchored toward the bottom of the frame'
  );
}

// spectralRolloff & spectralSpread -> fine-detail words.
function describeDetail(expanded) {
  const rolloff = expanded.spectralRolloff ?? 0.5;
  const spread = expanded.spectralSpread ?? 0.5;
  return pick(
    (rolloff + spread) / 2,
    'minimal fine detail',
    'a moderate amount of fine detail',
    'intricate fine detail and texture'
  );
}

// spectralFlux (mean) -> motion words.
function describeMotion(expanded) {
  return pick(
    expanded.spectralFlux ?? 0.5,
    'a still, settled composition',
    'a gently shifting composition',
    'a dynamic composition with motion streaks and blur'
  );
}

// std-dev of rms and centroid -> internal-variety words.
function describeVariety(expanded) {
  const rmsStd = expanded.rmsStd ?? 0.5;
  const centroidStd = expanded.spectralCentroidStd ?? 0.5;
  return pick(
    (rmsStd + centroidStd) / 2,
    'very uniform and consistent throughout',
    'somewhat varied',
    'highly varied, with strong internal contrast'
  );
}

// Ordered table driving both buildPrompt() and the transparency readout in
// src/main.js: which feature(s) produced which prompt phrase.
const PROMPT_TABLE = [
  { phraseKey: 'palette', features: ['spectralCentroid'], fn: describePalette },
  { phraseKey: 'density', features: ['rms'], fn: describeDensity },
  { phraseKey: 'roughness', features: ['zcr'], fn: describeRoughness },
  { phraseKey: 'form', features: ['spectralFlatness'], fn: describeForm },
  { phraseKey: 'weight', features: ['lowBandEnergy'], fn: describeWeight },
  { phraseKey: 'detail', features: ['spectralRolloff', 'spectralSpread'], fn: describeDetail },
  { phraseKey: 'motion', features: ['spectralFlux'], fn: describeMotion },
  { phraseKey: 'variety', features: ['rmsStd', 'spectralCentroidStd'], fn: describeVariety },
];

// Turns normalised+expanded features into a prompt string, plus a `rows`
// list (raw, normalised, which phrase it drove) so main.js can show the
// same kind of transparency table as the sibling no-ML engine.
export function buildPrompt(aggregate, normalisedBundle) {
  const { normalised, expanded } = normalisedBundle;
  const phrases = {};
  const rows = [];

  for (const entry of PROMPT_TABLE) {
    const value = entry.fn(expanded);
    phrases[entry.phraseKey] = value;
    for (const feature of entry.features) {
      rows.push({
        feature,
        raw: aggregate[feature],
        normalised: normalised[feature],
        drove: entry.phraseKey,
        phraseValue: value,
      });
    }
  }

  const prompt = [
    'An abstract generative artwork representing the sound of a physical place, captured over 30 seconds.',
    `Palette: ${phrases.palette}.`,
    `Composition: ${phrases.density}, ${phrases.weight}.`,
    `Surface quality: ${phrases.roughness}, ${phrases.detail}.`,
    `Form language: ${phrases.form}.`,
    `Sense of movement: ${phrases.motion}.`,
    `Internal variety: ${phrases.variety}.`,
    'No text, no recognisable objects, no people — pure abstract composition, portrait aspect ratio, suitable for a printed souvenir card.',
  ].join(' ');

  return { prompt, rows };
}
