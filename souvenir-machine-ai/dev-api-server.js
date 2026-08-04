// Local dev counterpart to api/generate-image.js and api/generate-sound.js
// — same shared lib/*.js logic, just running as a plain Node http server
// instead of Vercel serverless functions. Run alongside `npm run dev`
// (Vite proxies /api/* here — see vite.config.js).

import http from 'node:http';
import { generateImage } from './lib/generateImage.js';
import { generateSound } from './lib/generateSound.js';

const PORT = process.env.API_PORT || 5175;

const ROUTES = {
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

const server = http.createServer(async (req, res) => {
  const route = req.method === 'POST' ? ROUTES[req.url] : undefined;
  if (!route) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      const { prompt } = JSON.parse(body || '{}');
      const apiKey = process.env[route.envVar];
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Set ${route.envVar} in your environment before running this locally.` }));
        return;
      }
      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing prompt' }));
        return;
      }
      const { base64, contentType } = await route.run(prompt, apiKey);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ [route.responseKey]: base64, contentType }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
});
