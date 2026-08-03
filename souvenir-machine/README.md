# Souvenir Machine — Audio-to-Image Ambience Engine

Captures 30 seconds of ambient sound, extracts a fixed set of Meyda audio
features, and maps them through explicit, documented functions to a
generative still image. No machine learning — every translation from sound
to image is a hand-written, commented mapping (`src/mappings.js`) so it can
be explained and defended to a marker. See `src/mappings.js` for the
rationale behind each choice.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
```

Needs `https` or `localhost` for microphone access, and a user gesture
(the "Start 30s recording" button) to start — iOS Safari suspends new
`AudioContext`s until then, which `src/audio.js` resumes explicitly.

## Recalibrate before real use

`public/calibration.json` ships with **placeholder** min/max/median values
per feature — they are guesses, not real recordings. Before running the
actual study:

1. Record 5+ genuinely different places (quiet room, busy street, park,
   café, transport) with this app running. Open devtools: after each
   recording, `currentResult` in `src/main.js`'s module scope isn't
   exposed globally by default, so temporarily add
   `window.lastAggregate = aggregate;` inside `computeFromFrames` (or just
   `console.log(aggregate)`) to read off the raw numbers.
2. Note the min, max, and median your recordings produced for each feature.
3. Update `public/calibration.json` with those real numbers.
4. Re-test the five-places distinctness criterion (build spec section 5):
   five different places should produce five visibly, obviously different
   images. If they don't, raise `EXPANSION_K` in `src/features.js`
   (currently `0.6`, lower = more spread) and re-test before moving on to
   the study.

## Structure

| File | Responsibility |
|---|---|
| `src/audio.js` | Mic capture, Meyda setup, per-frame feature callback |
| `src/features.js` | 30s aggregation (mean + std-dev), calibration-based normalisation, expansion curve |
| `src/mappings.js` | The documented sound → `VisualParams` mapping layer |
| `src/render.js` | p5 instance-mode sketch: `VisualParams` in, image out |
| `src/debug.js` | Transparency panel (raw → normalised → param, plus plain-English readout) |
| `src/main.js` | Orchestration + UI state |
| `public/calibration.json` | Per-feature `{min, max, median}` — placeholder until recalibrated from real recordings |

## Modes

- **Machine pick** — the engine renders one image straight from the
  computed `VisualParams`.
- **Curate** — perturbs `VisualParams` six ways (bounded nudges + distinct
  seeds) and lets the visitor pick one; the selection is logged to the
  console as study data (`src/main.js`, `curateSelections`).

## Transparency panel

Toggle "Show transparency panel" after a recording to see, per feature: the
raw value, the normalised value, which visual parameter it drove, and the
resulting parameter value — plus a one-line plain-English readout. Both are
exportable (JSON or PNG) as portfolio documentation / viva evidence.

## Ethics note

Raw audio is never stored — only the numeric features extracted per frame
are kept in memory, and they're discarded once the image is rendered
(build spec section 11).

## Deploying to Vercel

This is a static Vite app, but it lives in a subdirectory of the repo
alongside the unrelated Buzzora Next.js app — so when importing into
Vercel, point it at this subdirectory:

1. In the Vercel dashboard, **Add New… → Project** and import this GitHub
   repo (`msuhan05-afk/Namans-Project`).
2. Under **Root Directory**, click Edit and select `souvenir-machine`.
3. Framework Preset should auto-detect as **Vite** (Build Command
   `npm run build`, Output Directory `dist` — also pinned in
   `vercel.json` in this folder so they're correct even if
   auto-detection doesn't kick in).
4. Deploy. No environment variables are needed — calibration data ships
   in `public/calibration.json` and is served as a static file.
5. Vercel serves everything over HTTPS by default, which satisfies the
   microphone-access requirement (`getUserMedia` needs `https` or
   `localhost`) with no extra config.

To deploy from the CLI instead:

```bash
cd souvenir-machine
npx vercel        # first run links/creates the project and deploys a preview
npx vercel --prod # promotes to production
```

## Out of scope here

Music (Tone.js), printing, QR codes, and scent layers are separate stages
of the wider Souvenir Machine project and aren't part of this engine.
