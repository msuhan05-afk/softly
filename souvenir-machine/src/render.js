// p5 instance-mode sketch. Draws deterministically from a VisualParams
// object only — it never touches raw audio or feature names, which is what
// keeps the mapping layer (mappings.js) swappable and testable on its own
// (build spec section 6).

import p5 from 'p5';

export const PREVIEW_SIZE = { w: 500, h: 750 };
export const PRINT_SIZE = { w: 1200, h: 1800 };

// Small deterministic PRNG (mulberry32) used to seed curate-mode variant
// nudges independently of p5's own RNG state.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Same VisualParams should always produce the same image (needed for the
// A/B study and for reproducibility, build spec section 8) — derive an
// integer seed from the params themselves rather than the wall clock.
export function seedFromParams(params, salt = 0) {
  const values = Object.values(params);
  let seed = salt * 104729; // large prime offset so salts don't collide
  values.forEach((v, i) => {
    seed += Math.round(v * 1e6) * (i + 1);
  });
  return Math.abs(seed) || 1;
}

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

// Draws one still frame of the sketch at `size` into `container`, seeded so
// the same params + seed always produce the same pixels.
export function createSketch(container, params, seed, size = PREVIEW_SIZE) {
  const sketch = (p) => {
    p.setup = () => {
      const canvas = p.createCanvas(size.w, size.h);
      canvas.parent(container);
      p.pixelDensity(1);
      p.noLoop();
      p.randomSeed(seed);
      p.noiseSeed(seed);
      drawScene(p, params, size);
    };
  };
  return new p5(sketch);
}

function drawScene(p, params, size) {
  const { w, h } = size;
  const { paletteTempC, density, grain, formOrganicness, weight, detail, motion, contrast } = params;

  // Background gradient: paletteTempC picks warm (30deg, amber) vs cool
  // (210deg, blue) hue; contrast widens the lightness range top-to-bottom.
  const hueA = wrapHue(p.lerp(30, 210, paletteTempC));
  const lightTop = p.lerp(30, 55, 1 - contrast * 0.5);
  const lightBottom = p.lerp(8, 25, contrast);
  const satBg = p.lerp(35, 70, density);
  p.noStroke();
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const light = p.lerp(lightTop, lightBottom, t);
    const hue = wrapHue(p.lerp(hueA, hueA + 20, t));
    p.fill(`hsl(${hue}, ${satBg}%, ${light}%)`);
    p.rect(0, y, w, 1);
  }

  // Particle/agent field: density -> count, weight -> size, grain ->
  // positional jitter (roughness of placement).
  const count = Math.round(p.lerp(20, 400, density));
  const baseSize = p.lerp(4, size.w * 0.05, weight);
  const jitter = p.lerp(0, 30, grain);
  const trailSteps = motion > 0.05 ? Math.round(p.lerp(1, 8, motion)) : 1;
  const trailLen = p.lerp(0, size.w * 0.06, motion);

  for (let i = 0; i < count; i++) {
    // Bias vertical position toward the bottom as `weight` increases —
    // "heavy bass -> large dark forms anchored low" (build spec section 6).
    const biasedY = Math.pow(p.random(), p.lerp(1, 0.35, weight));
    let x = p.random(w) + p.random(-jitter, jitter);
    let y = biasedY * h + p.random(-jitter, jitter);

    const elementSize = baseSize * p.random(0.5, 1.5);
    const light = p.lerp(75, 15, weight * 0.7 + (y / h) * 0.3);
    const sat = p.lerp(30, 85, density);
    const hue = wrapHue(p.lerp(hueA - 15, hueA + 25, p.random()));
    const alpha = p.lerp(0.35, 0.9, density);

    // motion: draw a short trail of offset, fading copies to suggest
    // movement baked into a still image (build spec section 6/8).
    const angle = seedAngle(x, y);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    for (let s = 0; s < trailSteps; s++) {
      const tstep = trailSteps > 1 ? s / (trailSteps - 1) : 0;
      const ox = x - dx * trailLen * tstep;
      const oy = y - dy * trailLen * tstep;
      const trailAlpha = alpha * (1 - tstep * 0.85);
      p.fill(`hsla(${hue}, ${sat}%, ${light}%, ${trailAlpha})`);
      drawForm(p, ox, oy, elementSize, formOrganicness);
    }
  }

  // Fine overlaid texture: detail controls density of small marks.
  const detailCount = Math.round(p.lerp(0, 900, detail));
  p.noStroke();
  for (let i = 0; i < detailCount; i++) {
    const x = p.random(w);
    const y = p.random(h);
    const light = p.random(10, 90);
    p.fill(`hsla(${hueA}, 20%, ${light}%, 0.25)`);
    p.circle(x, y, p.random(0.5, 1.8));
  }
}

// Deterministic pseudo-angle from position, so each particle's motion
// trail gets a stable direction without extra RNG draws.
function seedAngle(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * Math.PI * 2;
}

// formOrganicness < 0.5 -> flowing Perlin-noise curve; >= 0.5 -> angular
// fractured shape. This is the biggest visible driver of overall look,
// mirroring spectralFlatness (build spec section 6).
function drawForm(p, x, y, size, formOrganicness) {
  p.push();
  p.translate(x, y);
  if (formOrganicness < 0.5) {
    p.beginShape();
    const points = 8;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * p.TWO_PI;
      const n = p.noise(Math.cos(angle) + x * 0.01, Math.sin(angle) + y * 0.01);
      const r = size * (0.6 + n * 0.8);
      p.curveVertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
  } else {
    p.beginShape();
    const points = Math.round(p.lerp(5, 9, formOrganicness));
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * p.TWO_PI;
      const r = size * p.random(0.4, 1.3);
      p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    p.endShape(p.CLOSE);
  }
  p.pop();
}

// Renders at print resolution off-screen and returns a PNG data URL for
// download (build spec section 8).
export function renderPrintPNG(params, seed) {
  return new Promise((resolve) => {
    const offscreen = document.createElement('div');
    offscreen.style.position = 'fixed';
    offscreen.style.left = '-99999px';
    document.body.appendChild(offscreen);

    const instance = createSketch(offscreen, params, seed, PRINT_SIZE);
    // p5 draws synchronously inside setup() with noLoop(), so the canvas is
    // ready on the next tick.
    setTimeout(() => {
      const dataUrl = instance.canvas.toDataURL('image/png');
      instance.remove();
      offscreen.remove();
      resolve(dataUrl);
    }, 50);
  });
}
