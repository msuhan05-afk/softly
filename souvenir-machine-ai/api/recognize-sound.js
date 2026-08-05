// Vercel serverless function. Keeps HF_TOKEN server-side only — the
// browser posts a base64 WAV clip and label list, never the token.

import { recognizeSound, DEFAULT_LABELS } from '../lib/recognizeSound.js';

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

  const { audio, labels } = req.body || {};
  if (!audio || typeof audio !== 'string') {
    res.status(400).json({ error: 'Missing audio (base64-encoded WAV)' });
    return;
  }

  const candidateLabels = Array.isArray(labels) && labels.length >= 2 ? labels : DEFAULT_LABELS;

  try {
    const results = await recognizeSound({ audioBase64: audio, candidateLabels, apiKey });
    res.status(200).json({ results });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
