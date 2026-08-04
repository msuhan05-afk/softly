// Vercel serverless function. Keeps HF_TOKEN server-side only — the
// browser never sees it, it only ever posts a text prompt here.

import { generateImage } from '../lib/generateImage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with HF_TOKEN.' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const { base64, contentType } = await generateImage({ prompt, apiKey });
    res.status(200).json({ image: base64, contentType });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
