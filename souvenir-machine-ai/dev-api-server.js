// Local dev counterpart to api/generate-image.js, api/generate-sound.js,
// and api/recognize-sound.js — same shared lib/*.js logic, just running
// as a plain Node http server instead of Vercel serverless functions. Run
// alongside `npm run dev` (Vite proxies /api/* here — see vite.config.js).

import http from 'node:http';
import { generateImage } from './lib/generateImage.js';
import { generateSound } from './lib/generateSound.js';
import { recognizeSound } from './lib/recognizeSound.js';

const PORT = process.env.API_PORT || 5175;

// The two prompt -> generated-media routes share a request/response shape
// ({ prompt } in, { [responseKey]: base64, contentType } out).
const PROMPT_ROUTES = {
  '/api/generate-image': {
    envVar: 'HF_TOKEN',
    responseKey: 'image',
    run: (prompt, apiKey) => generateImage({ prompt, apiKey }),
  },
  '/api/generate-sound': {
    envVar: 'ELEVENLABS_API_KEY',
    responseKey: 'audio',
    run: (prompt, apiKey) => generateSound({ prompt, apiKey }),
  },
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  if (req.url === '/api/recognize-sound') {
    try {
      const { audio } = await readBody(req);
      const apiKey = process.env.HF_TOKEN;
      if (!apiKey) return sendJson(res, 500, { error: 'Set HF_TOKEN in your environment before running this locally.' });
      if (!audio) return sendJson(res, 400, { error: 'Missing audio (base64-encoded WAV)' });

      const audioBuffer = Buffer.from(audio, 'base64');
      const results = await recognizeSound({ audioBuffer, apiKey });
      sendJson(res, 200, { results });
    } catch (err) {
      sendJson(res, 502, { error: err.message });
    }
    return;
  }

  const route = PROMPT_ROUTES[req.url];
  if (!route) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  try {
    const { prompt } = await readBody(req);
    const apiKey = process.env[route.envVar];
    if (!apiKey) return sendJson(res, 500, { error: `Set ${route.envVar} in your environment before running this locally.` });
    if (!prompt) return sendJson(res, 400, { error: 'Missing prompt' });

    const { base64, contentType } = await route.run(prompt, apiKey);
    sendJson(res, 200, { [route.responseKey]: base64, contentType });
  } catch (err) {
    sendJson(res, 502, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
});
