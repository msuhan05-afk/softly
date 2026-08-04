// Orchestration: record -> aggregate -> build prompt -> call the AI
// image-generation endpoint -> display. Unlike the sibling no-ML engine,
// there is no local rendering step here — the actual pixels come back
// from POST /api/generate-image.

import { recordAmbience, RECORD_SECONDS } from './audio.js';
import { aggregateFrames, loadCalibration, normaliseFeatures } from './features.js';
import { buildPrompt } from './prompt.js';

const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const progressWrap = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const imageHost = document.getElementById('imageHost');
const promptPanel = document.getElementById('promptPanel');

let calibration = null;

function setStatus(text) {
  statusEl.textContent = text;
}

async function ensureCalibration() {
  if (!calibration) calibration = await loadCalibration();
  return calibration;
}

function renderPromptPanel(promptText, rows) {
  promptPanel.hidden = false;
  promptPanel.innerHTML = '';

  const heading = document.createElement('p');
  heading.textContent = 'Exact prompt sent to the image model:';
  heading.style.color = '#9aa';
  heading.style.marginBottom = '0.25rem';
  promptPanel.appendChild(heading);

  const promptEl = document.createElement('p');
  promptEl.className = 'prompt-text';
  promptEl.textContent = promptText;
  promptPanel.appendChild(promptEl);

  const table = document.createElement('table');
  table.className = 'prompt-table';
  table.innerHTML = `
    <thead>
      <tr><th>Feature</th><th>Raw</th><th>Normalised</th><th>Drove phrase</th></tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `
        <tr>
          <td>${r.feature}</td>
          <td>${typeof r.raw === 'number' ? r.raw.toFixed(3) : r.raw}</td>
          <td>${typeof r.normalised === 'number' ? r.normalised.toFixed(3) : r.normalised}</td>
          <td>${r.drove}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  `;
  promptPanel.appendChild(table);
}

async function requestImage(prompt) {
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed with ${res.status}`);
  return data; // { image: base64, contentType }
}

recordBtn.addEventListener('click', async () => {
  try {
    recordBtn.disabled = true;
    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    setStatus('Listening… recording 30 seconds of ambient sound.');

    const cal = await ensureCalibration();
    const frames = await recordAmbience({
      onProgress: (t) => {
        progressBar.style.width = `${Math.round(t * 100)}%`;
      },
    });

    setStatus('Building prompt from audio features…');
    const aggregate = aggregateFrames(frames);
    const bundle = normaliseFeatures(aggregate, cal);
    const { prompt, rows } = buildPrompt(aggregate, bundle);
    renderPromptPanel(prompt, rows);

    setStatus('Generating image (calls the FLUX.1-schnell model on Hugging Face — may take a moment on a cold start)…');
    const { image, contentType } = await requestImage(prompt);
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    imageHost.innerHTML = '';
    const img = document.createElement('img');
    img.src = `data:${contentType};base64,${image}`;
    img.alt = 'AI-generated image of this place, from its sound';
    imageHost.appendChild(img);

    const downloadLink = document.createElement('a');
    downloadLink.href = img.src;
    downloadLink.download = `souvenir-ai-${Date.now()}.${ext}`;
    downloadLink.textContent = `Download ${ext.toUpperCase()}`;
    downloadLink.style.display = 'block';
    downloadLink.style.marginTop = '0.75rem';
    downloadLink.style.color = 'var(--accent)';
    imageHost.appendChild(downloadLink);

    setStatus('Done.');
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`);
  } finally {
    recordBtn.disabled = false;
    progressWrap.hidden = true;
  }
});

setStatus(
  `Ready. Recording captures ${RECORD_SECONDS} seconds of audio; nothing is saved except the extracted numeric features and the prompt built from them.`
);
