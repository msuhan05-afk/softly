// The audio -> sound-effect-prompt mapping. Same 8 features and same
// documented, per-feature approach as src/prompt.js (the image prompt
// builder), but described in audio-texture language instead of visual
// language — "shimmering high frequencies" instead of "a bright, airy
// palette" — since that's what a text-to-sound-effect model expects.
//
// The result is an ElevenLabs-generated reinterpretation of the room's own
// ambience: not a recording of the space, a synthesized impression of it,
// the audio counterpart to the AI-generated image.

function pick(value, low, mid, high) {
  if (value < 0.34) return low;
  if (value < 0.67) return mid;
  return high;
}

// spectralCentroid (mean) -> pitch/brightness of the texture.
function describePitch(expanded) {
  return pick(
    expanded.spectralCentroid ?? 0.5,
    'deep, low-pitched rumbling tones',
    'mid-range, natural-sounding tones',
    'high-pitched, shimmering, bright tones'
  );
}

// rms (mean) -> loudness/density of layering.
function describeDensity(expanded) {
  return pick(
    expanded.rms ?? 0.5,
    'a sparse, quiet ambience with long stretches of near-silence',
    'a moderately full ambience',
    'a dense, loud ambience with many overlapping layers'
  );
}

// zcr (mean) -> tonal smoothness vs. noisiness.
function describeTexture(expanded) {
  return pick(
    expanded.zcr ?? 0.5,
    'a smooth, clean tonal quality',
    'a mix of smooth tones and light noise texture',
    'a rough, hissy, noisy texture'
  );
}

// spectralFlatness (mean) -> tonal/musical vs. noise-like character.
function describeCharacter(expanded) {
  return pick(
    expanded.spectralFlatness ?? 0.5,
    'a tonal, musical, drone-like character',
    'a blend of tonal and noise-like qualities',
    'an atonal, noise-like, unpitched character'
  );
}

// low-band energy -> weight of the low end.
function describeWeight(expanded) {
  return pick(
    expanded.lowBandEnergy ?? 0.5,
    'a light, airy quality with almost no bass',
    'a balanced amount of bass weight',
    'a heavy, deep bass presence underneath everything'
  );
}

// spectralRolloff & spectralSpread -> how much fine high-frequency detail.
function describeDetail(expanded) {
  const rolloff = expanded.spectralRolloff ?? 0.5;
  const spread = expanded.spectralSpread ?? 0.5;
  return pick(
    (rolloff + spread) / 2,
    'minimal high-frequency detail',
    'a moderate amount of fine high-frequency detail',
    'intricate, crackling high-frequency detail'
  );
}

// spectralFlux (mean) -> how much the texture changes moment to moment.
function describeMotion(expanded) {
  return pick(
    expanded.spectralFlux ?? 0.5,
    'a steady, sustained, unchanging drone',
    'a slowly evolving, gently shifting texture',
    'a rapidly pulsing, actively changing texture with sudden bursts'
  );
}

// std-dev of rms and centroid -> internal variety/dynamics over the clip.
function describeVariety(expanded) {
  const rmsStd = expanded.rmsStd ?? 0.5;
  const centroidStd = expanded.spectralCentroidStd ?? 0.5;
  return pick(
    (rmsStd + centroidStd) / 2,
    'very consistent and uniform throughout',
    'somewhat dynamic, with a few noticeable swells',
    'highly dynamic, with dramatic swells and contrasts throughout'
  );
}

const SOUND_PROMPT_TABLE = [
  { phraseKey: 'pitch', features: ['spectralCentroid'], fn: describePitch },
  { phraseKey: 'density', features: ['rms'], fn: describeDensity },
  { phraseKey: 'texture', features: ['zcr'], fn: describeTexture },
  { phraseKey: 'character', features: ['spectralFlatness'], fn: describeCharacter },
  { phraseKey: 'weight', features: ['lowBandEnergy'], fn: describeWeight },
  { phraseKey: 'detail', features: ['spectralRolloff', 'spectralSpread'], fn: describeDetail },
  { phraseKey: 'motion', features: ['spectralFlux'], fn: describeMotion },
  { phraseKey: 'variety', features: ['rmsStd', 'spectralCentroidStd'], fn: describeVariety },
];

// Turns normalised+expanded features into an ElevenLabs sound-effect
// prompt, plus a `rows` list (raw, normalised, which phrase it drove) for
// the same kind of transparency table src/prompt.js produces for images.
export function buildSoundPrompt(aggregate, normalisedBundle) {
  const { normalised, expanded } = normalisedBundle;
  const phrases = {};
  const rows = [];

  for (const entry of SOUND_PROMPT_TABLE) {
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
    'An abstract ambient soundscape reinterpreting a 30-second recording of a physical place.',
    `Pitch: ${phrases.pitch}.`,
    `Density: ${phrases.density}, ${phrases.weight}.`,
    `Texture: ${phrases.texture}, ${phrases.detail}.`,
    `Character: ${phrases.character}.`,
    `Movement: ${phrases.motion}.`,
    `Variety: ${phrases.variety}.`,
    'No speech, no music, no recognisable real-world sound effects — pure abstract ambience.',
  ].join(' ');

  return { prompt, rows };
}
