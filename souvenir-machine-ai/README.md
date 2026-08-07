# Souvenir Machine (AI) — Audio-to-Image + Audio-to-Ambience via Generative Models

A second version of the audio-to-image engine, built alongside
[`souvenir-machine/`](../souvenir-machine) for comparison. Same 30-second
mic capture and Meyda feature extraction, same 8 audio features, same
calibration + contrast-expansion normalisation — but instead of a
hand-written p5.js renderer, the audio features are turned into two text
prompts and handed to open-weight/hosted AI models:

- An **image** from
  [FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell)
  (Apache-2.0) via the Hugging Face Inference API
- A companion **ambient sound clip** from ElevenLabs' sound-generation API

Both are generated from the same 30 seconds of audio, in parallel, and
shown together — an AI-reinterpreted visual and audio postcard of the same
recorded moment.

## How this differs from `souvenir-machine/`

The original engine's core rule is "every translation from sound to image
must be an explicit, hand-written, commented mapping — never a machine
learning black box" (see its build spec, section 0). This version
deliberately breaks that rule, as the second half of a comparison: the
audio → words steps (`src/prompt.js` for the image, `src/soundPrompt.js`
for the sound) are still documented per-feature, the same way
`souvenir-machine/src/mappings.js` is — but what the models do with those
words to produce pixels or audio is not inspectable. The transparency
panel here can only show *the exact prompts sent*, not *why the models
produced what they produced*. That gap is the point of building both
versions.

## Why FLUX.1-schnell / Hugging Face, not OpenAI

This started as a wrapper around OpenAI's closed `gpt-image-1`, then was
swapped to an open-weight model on request. FLUX.1-schnell is
Apache-2.0 licensed (weights are public, self-hostable, no vendor
lock-in), and the Hugging Face Inference API serves it without needing to
run your own GPU. The trade-off: Hugging Face's serverless Inference API
**cold-starts** models that haven't been called recently — the first
request after a while can return a 503 with an `estimated_time` while it
loads, which `lib/generateImage.js` surfaces as an error telling you to
retry shortly rather than failing silently.

If you'd rather run the model yourself instead of depending on Hugging
Face's hosted inference (e.g. via `diffusers` on your own GPU box, or a
local ComfyUI instance exposing an HTTP API), swap the implementation in
`lib/generateImage.js` — `api/generate-image.js` and `dev-api-server.js`
only depend on it returning `{ base64, contentType }`.

## The sound-generation add-on (ElevenLabs)

`src/soundPrompt.js` derives a *different* text prompt from the same 8
audio features — described in audio-texture language ("shimmering high
frequencies", "a heavy bass presence") rather than the image prompt's
visual language, since that's what a text-to-sound-effect model expects.
`lib/generateSound.js` sends it to ElevenLabs' sound-generation endpoint
and gets back a ~10 second MP3, base64-encoded the same way the image is.

The image and sound requests fire in parallel (`Promise.allSettled` in
`src/main.js`) and are rendered independently — if one provider fails
(rate limit, bad key, cold start) the other still displays, with an
inline error where the failed one would be.

## Sound recognition page (`/recognize.html`)

A separate, unrelated page: it doesn't generate anything, it *classifies*.
Records a short (6s) clip and asks a fine-tuned Audio Spectrogram
Transformer — [`MIT/ast-finetuned-audioset-10-10-0.4593`](https://huggingface.co/MIT/ast-finetuned-audioset-10-10-0.4593)
— what it hears, via the Hugging Face Inference API's standard
`audio-classification` pipeline. Reuses `HF_TOKEN`, no separate key
needed.

**Why this model and not BEATs or CLAP** (in case you're wondering why
this changed): this page was originally requested against
[Microsoft's BEATs](https://github.com/microsoft/unilm/tree/master/beats),
then briefly ran on [LAION's CLAP](https://github.com/LAION-AI/CLAP)
(zero-shot, free-typed labels) before landing here. BEATs turned out to
have no official Hugging Face model — Microsoft only distributes
checkpoints via OneDrive — and is itself a fixed AudioSet classifier
under the hood, not zero-shot, so it wouldn't have kept CLAP's "type any
label" behavior even if it were hosted somewhere. AST-on-AudioSet is the
practical equivalent: a real, reliably-hosted, well-established
(800k+ downloads) classifier trained on the same AudioSet ontology BEATs
targets. The trade-off versus the CLAP version: **no more free-text
labels** — this scores against AudioSet's fixed ~527-category vocabulary
only, whatever the model returns is whatever you get.

This is still a genuinely different capability from the two generation
pages — it takes an actual audio waveform, not hand-extracted numeric
features feeding a prompt template. So it gets its own capture path:

- `src/wavRecorder.js` — records via `ScriptProcessorNode` and encodes raw
  PCM into a 16-bit WAV blob client-side, no library. This is separate
  from `src/audio.js` (which only extracts Meyda features, never keeps
  actual audio) because this page needs the waveform itself.
- `src/recognize.js` — records, encodes, POSTs `{ audio }` to
  `/api/recognize-sound`, renders the returned `{ label, score }[]` as a
  ranked bar list.
- `lib/recognizeSound.js` / `api/recognize-sound.js` — mirrors the other
  two pipelines' shared-lib pattern, but the request itself is simpler
  than CLAP's: raw WAV bytes with an `audio/wav` content type, no
  JSON-wrapped `candidate_labels` parameter, since there's nothing to
  parameterize.

`vite.config.js` lists `recognize.html` as an additional Rollup entry
point — without that, `vite build` only bundles `index.html` and this page
404s in production even though it works fine in dev.

## On-device recognition page (`/local.html`) — no API key

The one page here that needs **no credentials at all**. Same job as
`/recognize.html`, but the model runs entirely in the browser via
[MediaPipe Audio Classifier](https://developers.google.com/edge/mediapipe/solutions/audio/audio_classifier)
with YAMNet — WASM runtime plus a ~4MB on-device TFLite model, both served
from `public/`. No API key, no serverless function, no network call at
inference time, and the audio never leaves the machine.

YAMNet scores against the same AudioSet ontology the hosted AST model
uses, so the two recognition pages are directly comparable: same taxonomy,
one hosted and one on-device.

**This is also the only pipeline in the project verified against a real
model rather than a mock.** Because it needs no keys, it runs end-to-end
in a sandbox — confirmed with a headless browser and a fake mic device:
TFLite XNNPACK delegate initialises, real category scores come back
(Chromium's synthetic beep classifies as *Beep bleep / Ding / Sound
effect*, as you'd hope), and a request-level assertion confirms **zero
non-localhost requests** during inference.

Setup — the model and WASM are gitignored, not committed (~24MB total),
but a `postinstall` hook fetches them automatically:

```bash
npm install    # also fetches YAMNet + copies the WASM runtime into public/
npm run dev    # then open /local.html
```

If the postinstall step was skipped (offline install, `--ignore-scripts`),
run `npm run setup:local` to fetch them explicitly. The page detects
missing assets up front and says exactly that, rather than failing deep
inside MediaPipe's loader — that path is deliberately tested, since the
assets not being committed makes it the most likely first-run problem.

- `scripts/fetch-mediapipe-assets.js` — the fetch/copy step above
- `src/localClassifier.js` — loads the classifier (lazily, cached across
  recordings), resamples to the 16kHz YAMNet expects, and averages scores
  across MediaPipe's ~1s windows so one ranked list describes the whole
  clip
- `src/local.js` — page orchestration; `src/wavRecorder.js` gained a
  `recordClipSamples()` export returning raw Float32 + sample rate, since
  this path feeds the model directly and needs no WAV encoding

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in HF_TOKEN and ELEVENLABS_API_KEY
```

- Hugging Face token: https://huggingface.co/settings/tokens (a free
  "Read" token is enough for the Inference API)
- ElevenLabs key: https://elevenlabs.io/app/settings/api-keys

Needs two processes in dev — one for the frontend, one standing in for the
Vercel serverless functions locally:

```bash
npm run dev:api   # terminal 1 — generate-image + generate-sound + recognize-sound APIs on :5175
npm run dev        # terminal 2 — Vite dev server on :5173, proxies /api to :5175 — visit /recognize.html for sound recognition
```

Both `HF_TOKEN` and `ELEVENLABS_API_KEY` must be set in the environment
`dev-api-server.js` runs in (e.g.
`export HF_TOKEN=... ELEVENLABS_API_KEY=... && npm run dev:api`, or use a
tool like `dotenv-cli` / your shell's `.env` loading — none is bundled
here to keep dependencies at zero).

**Never commit real key values** — `.env.example` only holds the variable
names, and `.env*` is gitignored at the repo root. If a real key is ever
pasted somewhere it shouldn't be (chat, a commit, a log), treat it as
compromised and rotate it at the source rather than trying to "undo" the
exposure.

## Cost / rate limits

Hugging Face's free Inference API tier has rate limits (and usage-based
paid tiers beyond that) — check current limits at
https://huggingface.co/docs/api-inference. This applies to
`/recognize.html` too, since it shares `HF_TOKEN` and the Inference API
with the image pipeline. ElevenLabs' sound-generation API is metered
against your account's character/credit quota — check current pricing at
https://elevenlabs.io/pricing. There's no caching, no rate limiting, and
no cap in this build for any of the three endpoints — add one before
exposing this publicly (e.g. a request counter, a server-side rate limit
in each `api/*.js` function, or gating behind auth).

## Structure

| File | Responsibility |
|---|---|
| `src/audio.js` | Mic capture, Meyda setup — identical to the sibling engine |
| `src/features.js` | 30s aggregation + calibration normalisation — identical to the sibling engine |
| `src/prompt.js` | Audio → image-prompt mapping (this version's equivalent of `mappings.js`) |
| `src/soundPrompt.js` | Audio → sound-effect-prompt mapping, same features described in audio-texture language |
| `src/main.js` | Orchestration: record → build both prompts → call both APIs in parallel → display |
| `api/generate-image.js` | Vercel serverless function — calls the Hugging Face Inference API, keeps `HF_TOKEN` server-side |
| `api/generate-sound.js` | Vercel serverless function — calls ElevenLabs, keeps `ELEVENLABS_API_KEY` server-side |
| `lib/generateImage.js` | Shared image-model call, used by both the Vercel function and local dev |
| `lib/generateSound.js` | Shared sound-model call, used by both the Vercel function and local dev |
| `dev-api-server.js` | Local stand-in for all three Vercel functions during `npm run dev` |
| `public/calibration.json` | Same placeholder calibration data as the sibling engine — see its README for recalibration steps |
| `recognize.html` | The AudioSet sound-recognition page — separate from `index.html` |
| `src/wavRecorder.js` | Client-side mic → 16-bit WAV encoder, used only by the recognition page |
| `src/recognize.js` | Orchestration for the recognition page: record → encode → classify → render ranked scores |
| `api/recognize-sound.js` | Vercel serverless function — calls the AST audio-classification pipeline, keeps `HF_TOKEN` server-side |
| `lib/recognizeSound.js` | Shared AST model call, used by both the Vercel function and local dev |
| `local.html` | The on-device (MediaPipe/YAMNet) recognition page — no API key needed |
| `src/localClassifier.js` | Loads YAMNet in-browser, resamples to 16kHz, averages scores across windows |
| `src/local.js` | Orchestration for the on-device page: record → classify locally → render |
| `scripts/fetch-mediapipe-assets.js` | Fetches the model + WASM into `public/` (both gitignored); runs automatically via `postinstall`, or manually via `npm run setup:local` |

## Deploying to Vercel

Same pattern as `souvenir-machine/`: import this repo, set **Root
Directory** to `souvenir-machine-ai`, and add both **Environment
Variables** — `HF_TOKEN` and `ELEVENLABS_API_KEY` — in the project
settings (Settings → Environment Variables). Enter real values directly
in the Vercel dashboard, not anywhere in the repo or in chat. All three
serverless functions read their key server-side, so none is ever sent to
the browser. `vercel.json` pins the Vite build; Vercel picks up
`api/generate-image.js`, `api/generate-sound.js`, and
`api/recognize-sound.js` as serverless functions automatically —
`vite.config.js`'s multi-entry build makes sure `recognize.html` ships in
`dist/` alongside `index.html`.

## Testing status

The record → aggregate → build-prompts pipeline (both generation pages)
and the record → encode → classify pipeline (`/recognize.html`) have both
been verified end-to-end in a headless browser with a fake mic device:
correct prompt payloads built, all three `/api/*` requests fire with the
right bodies. **None of the three hosted provider calls (Hugging Face
image, ElevenLabs sound, Hugging Face AST/AudioSet) have been tested
against the real APIs** in this session — no valid keys were available in
the build environment. Before relying on those, set real keys and confirm
`POST /api/generate-image`, `POST /api/generate-sound`, and
`POST /api/recognize-sound` each return usable output.

The exception is **`/local.html`, which *has* been verified against the
real model** — it needs no credentials, so it runs fully in a sandbox.
See that section above for what was confirmed.

## Ethics note

Same as the sibling engine: raw audio is never stored, only the extracted
numeric features. The prompt text sent to each model is derived from
those features and is visible in the transparency panel after each
generation.
