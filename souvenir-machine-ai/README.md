# Souvenir Machine (AI) — Audio-to-Image via a Generative Model

A second version of the audio-to-image engine, built alongside
[`souvenir-machine/`](../souvenir-machine) for comparison. Same 30-second
mic capture and Meyda feature extraction, same 8 audio features, same
calibration + contrast-expansion normalisation — but instead of a
hand-written p5.js renderer, the audio features are turned into a text
prompt and handed to an open-weight AI image-generation model
([FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell),
Apache-2.0) via the Hugging Face Inference API to produce the picture.

## How this differs from `souvenir-machine/`

The original engine's core rule is "every translation from sound to image
must be an explicit, hand-written, commented mapping — never a machine
learning black box" (see its build spec, section 0). This version
deliberately breaks that rule, as the second half of a comparison: the
audio → words step (`src/prompt.js`) is still documented per-feature, the
same way `souvenir-machine/src/mappings.js` is — but what the model does
with those words to produce pixels is not inspectable. The transparency
panel here can only show *the exact prompt sent*, not *why the model drew
what it drew*. That gap is the point of building both versions.

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

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in HF_TOKEN
```

Get a token at https://huggingface.co/settings/tokens — a free "Read"
token is enough for the Inference API.

Needs two processes in dev — one for the frontend, one standing in for the
Vercel serverless function locally:

```bash
npm run dev:api   # terminal 1 — generate-image API on :5175
npm run dev        # terminal 2 — Vite dev server on :5173, proxies /api to :5175
```

`HF_TOKEN` must be set in the environment `dev-api-server.js` runs in
(e.g. `export HF_TOKEN=... && npm run dev:api`, or use a tool like
`dotenv-cli` / your shell's `.env` loading — none is bundled here to keep
dependencies at zero).

## Cost / rate limits

Hugging Face's free Inference API tier has rate limits (and usage-based
paid tiers beyond that) — check current limits at
https://huggingface.co/docs/api-inference before relying on this for a
public installation. There's no caching, no rate limiting, and no cap in
this build — add one before exposing this publicly (e.g. a request
counter, a server-side rate limit in `api/generate-image.js`, or gating
behind auth).

## Structure

| File | Responsibility |
|---|---|
| `src/audio.js` | Mic capture, Meyda setup — identical to the sibling engine |
| `src/features.js` | 30s aggregation + calibration normalisation — identical to the sibling engine |
| `src/prompt.js` | THE audio → text-prompt mapping (this version's equivalent of `mappings.js`) |
| `src/main.js` | Orchestration: record → build prompt → call the API → display |
| `api/generate-image.js` | Vercel serverless function — calls the Hugging Face Inference API, keeps `HF_TOKEN` server-side |
| `lib/generateImage.js` | Shared model call, used by both the Vercel function and local dev — swap this to point at a different provider/self-hosted model |
| `dev-api-server.js` | Local stand-in for the Vercel function during `npm run dev` |
| `public/calibration.json` | Same placeholder calibration data as the sibling engine — see its README for recalibration steps |

## Deploying to Vercel

Same pattern as `souvenir-machine/`: import this repo, set **Root
Directory** to `souvenir-machine-ai`, and add an **Environment Variable**
`HF_TOKEN` in the project settings (Settings → Environment Variables) —
the serverless function reads it server-side, so it's never sent to the
browser. `vercel.json` pins the Vite build; Vercel picks up
`api/generate-image.js` as a serverless function automatically.

## Testing status

The record → aggregate → build-prompt pipeline has been verified end-to-end
(headless browser, fake mic input, correct prompt text produced, and the
request to `/api/generate-image` fires with the right payload). **The
actual call to the Hugging Face Inference API has not been tested** in
this session — no `HF_TOKEN` was available in the build environment.
Before relying on this, set a real token and confirm
`POST /api/generate-image` returns a usable image (and check whether the
model needs a cold-start retry on first call).

## Ethics note

Same as the sibling engine: raw audio is never stored, only the extracted
numeric features. The prompt text sent to the model is derived from those
features and is visible in the transparency panel after each generation.
