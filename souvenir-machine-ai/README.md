# Souvenir Machine (AI) — Audio-to-Image via a Generative Model

A second version of the audio-to-image engine, built alongside
[`souvenir-machine/`](../souvenir-machine) for comparison. Same 30-second
mic capture and Meyda feature extraction, same 8 audio features, same
calibration + contrast-expansion normalisation — but instead of a
hand-written p5.js renderer, the audio features are turned into a text
prompt and handed to an AI image-generation model (OpenAI's `gpt-image-1`)
to produce the picture.

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

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in OPENAI_API_KEY
```

Needs two processes in dev — one for the frontend, one standing in for the
Vercel serverless function locally:

```bash
npm run dev:api   # terminal 1 — generate-image API on :5175
npm run dev        # terminal 2 — Vite dev server on :5173, proxies /api to :5175
```

`OPENAI_API_KEY` must be set in the environment `dev-api-server.js` runs
in (e.g. `export OPENAI_API_KEY=... && npm run dev:api`, or use a tool like
`dotenv-cli` / your shell's `.env` loading — none is bundled here to keep
dependencies at zero).

## Cost warning

Every "Start 30s recording" press that completes calls OpenAI's image API
**once**, which costs money per image (check OpenAI's current pricing for
`gpt-image-1`). There's no caching, no rate limiting, and no cap in this
build — add one before exposing this publicly (e.g. a request counter, a
server-side rate limit in `api/generate-image.js`, or gating behind auth).

## Structure

| File | Responsibility |
|---|---|
| `src/audio.js` | Mic capture, Meyda setup — identical to the sibling engine |
| `src/features.js` | 30s aggregation + calibration normalisation — identical to the sibling engine |
| `src/prompt.js` | THE audio → text-prompt mapping (this version's equivalent of `mappings.js`) |
| `src/main.js` | Orchestration: record → build prompt → call the API → display |
| `api/generate-image.js` | Vercel serverless function — calls OpenAI, keeps the API key server-side |
| `lib/generateImage.js` | Shared OpenAI call, used by both the Vercel function and local dev |
| `dev-api-server.js` | Local stand-in for the Vercel function during `npm run dev` |
| `public/calibration.json` | Same placeholder calibration data as the sibling engine — see its README for recalibration steps |

## Deploying to Vercel

Same pattern as `souvenir-machine/`: import this repo, set **Root
Directory** to `souvenir-machine-ai`, and add an **Environment Variable**
`OPENAI_API_KEY` in the project settings (Settings → Environment
Variables) — the serverless function reads it server-side, so it's never
sent to the browser. `vercel.json` pins the Vite build; Vercel picks up
`api/generate-image.js` as a serverless function automatically.

## Testing status

The record → aggregate → build-prompt pipeline has been verified end-to-end
(headless browser, fake mic input, correct prompt text produced). **The
actual call to OpenAI's image API has not been tested** in this session —
no `OPENAI_API_KEY` was available. Before relying on this, set a real key
and confirm `POST /api/generate-image` returns a usable image.

## Ethics note

Same as the sibling engine: raw audio is never stored, only the extracted
numeric features. The prompt text sent to OpenAI is derived from those
features and is visible in the transparency panel after each generation.
