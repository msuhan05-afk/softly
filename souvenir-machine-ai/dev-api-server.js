// Local dev counterpart to api/generate-image.js — same shared
// lib/generateImage.js logic, just running as a plain Node http server
// instead of a Vercel serverless function. Run alongside `npm run dev`
// (Vite proxies /api/* here — see vite.config.js).

import http from 'node:http';
import { generateImage } from './lib/generateImage.js';

const PORT = process.env.API_PORT || 5175;

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/generate-image') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      const { prompt } = JSON.parse(body || '{}');
      const apiKey = process.env.HF_TOKEN;
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Set HF_TOKEN in your environment before running this locally.' }));
        return;
      }
      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing prompt' }));
        return;
      }
      const { base64, contentType } = await generateImage({ prompt, apiKey });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ image: base64, contentType }));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`generate-image API dev server running at http://localhost:${PORT}`);
});
