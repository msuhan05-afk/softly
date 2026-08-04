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
npm run dev:api   # terminal 1 — generate-image + generate-sound APIs on :5175
npm run dev        # terminal 2 — Vite dev server on :5173, proxies /api to :5175
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
https://huggingface.co/docs/api-inference. ElevenLabs' sound-generation
API is metered against your account's character/credit quota — check
current pricing at https://elevenlabs.io/pricing. There's no caching, no
rate limiting, and no cap in this build for either provider — add one
before exposing this publicly (e.g. a request counter, a server-side rate
limit in `api/generate-image.js` / `api/generate-sound.js`, or gating
behind auth).

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
| `dev-api-server.js` | Local stand-in for both Vercel functions during `npm run dev` |
| `public/calibration.json` | Same placeholder calibration data as the sibling engine — see its README for recalibration steps |

## Deploying to Vercel

Same pattern as `souvenir-machine/`: import this repo, set **Root
Directory** to `souvenir-machine-ai`, and add both **Environment
Variables** — `HF_TOKEN` and `ELEVENLABS_API_KEY` — in the project
settings (Settings → Environment Variables). Enter real values directly
in the Vercel dashboard, not anywhere in the repo or in chat. Both
serverless functions read their key server-side, so neither is ever sent
to the browser. `vercel.json` pins the Vite build; Vercel picks up
`api/generate-image.js` and `api/generate-sound.js` as serverless
functions automatically.

## Testing status

The record → aggregate → build-prompts pipeline has been verified
end-to-end (headless browser, fake mic input, correct prompt text
produced for both the image and sound prompts, and both requests fire
with the right payloads). **Neither the Hugging Face nor the ElevenLabs
call has been tested against the real APIs** in this session — no valid
keys were available in the build environment. Before relying on this, set
real keys and confirm `POST /api/generate-image` and
`POST /api/generate-sound` each return usable output.

## Ethics note

Same as the sibling engine: raw audio is never stored, only the extracted
numeric features. The prompt text sent to each model is derived from
those features and is visible in the transparency panel after each
generation.
