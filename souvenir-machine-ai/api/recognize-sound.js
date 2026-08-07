// Vercel serverless function. Keeps HF_TOKEN server-side only — the
// browser posts a base64 WAV clip, never the token.

import { recognizeSound } from '../lib/recognizeSound.js';

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

  const { audio } = req.body || {};
  if (!audio || typeof audio !== 'string') {
    res.status(400).json({ error: 'Missing audio (base64-encoded WAV)' });
    return;
  }

  try {
    const audioBuffer = Buffer.from(audio, 'base64');
    const results = await recognizeSound({ audioBuffer, apiKey });
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
