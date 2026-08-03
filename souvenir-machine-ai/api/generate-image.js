// Vercel serverless function. Keeps OPENAI_API_KEY server-side only — the
// browser never sees it, it only ever posts a text prompt here.

import { generateImage } from '../lib/generateImage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with OPENAI_API_KEY.' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const image = await generateImage({ prompt, apiKey });
    res.status(200).json({ image });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
