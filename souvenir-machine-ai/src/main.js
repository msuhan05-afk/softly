// Orchestration: record -> aggregate -> build prompts -> call the AI
// image + sound endpoints -> display. Unlike the sibling no-ML engine,
// there is no local rendering step here — the actual pixels/audio come
// back from POST /api/generate-image and POST /api/generate-sound.

import { recordAmbience, RECORD_SECONDS } from './audio.js';
import { aggregateFrames, loadCalibration, normaliseFeatures } from './features.js';
import { buildPrompt } from './prompt.js';
import { buildSoundPrompt } from './soundPrompt.js';

const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const progressWrap = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const imageHost = document.getElementById('imageHost');
const soundHost = document.getElementById('soundHost');
const promptPanel = document.getElementById('promptPanel');

let calibration = null;

function setStatus(text) {
  statusEl.textContent = text;
}

async function ensureCalibration() {
  if (!calibration) calibration = await loadCalibration();
  return calibration;
}

function renderPromptSection(container, title, promptText, rows) {
  const section = document.createElement('div');
  section.className = 'prompt-section';

  const heading = document.createElement('p');
  heading.textContent = title;
  heading.style.color = '#9aa';
  heading.style.marginBottom = '0.25rem';
  section.appendChild(heading);

  const promptEl = document.createElement('p');
  promptEl.className = 'prompt-text';
  promptEl.textContent = promptText;
  section.appendChild(promptEl);

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
  section.appendChild(table);

  container.appendChild(section);
}

function renderPromptPanel({ imagePrompt, imageRows, soundPrompt, soundRows }) {
  promptPanel.hidden = false;
  promptPanel.innerHTML = '';
  renderPromptSection(promptPanel, 'Exact prompt sent to the image model:', imagePrompt, imageRows);
  renderPromptSection(promptPanel, 'Exact prompt sent to the sound model:', soundPrompt, soundRows);
}

async function requestJSON(url, prompt) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed with ${res.status}`);
  return data;
}

function renderImageResult({ image, contentType }) {
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
  downloadLink.className = 'download-link';
  imageHost.appendChild(downloadLink);
}

function renderImageError(message) {
  imageHost.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'result-error';
  p.textContent = `Image generation failed: ${message}`;
  imageHost.appendChild(p);
}

function renderSoundResult({ audio, contentType }) {
  const ext = contentType.includes('wav') ? 'wav' : 'mp3';

  soundHost.innerHTML = '';
  const audioEl = document.createElement('audio');
  audioEl.controls = true;
  audioEl.src = `data:${contentType};base64,${audio}`;
  soundHost.appendChild(audioEl);

  const downloadLink = document.createElement('a');
  downloadLink.href = audioEl.src;
  downloadLink.download = `souvenir-ai-ambience-${Date.now()}.${ext}`;
  downloadLink.textContent = `Download ${ext.toUpperCase()}`;
  downloadLink.className = 'download-link';
  soundHost.appendChild(downloadLink);
}

function renderSoundError(message) {
  soundHost.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'result-error';
  p.textContent = `Sound generation failed: ${message}`;
  soundHost.appendChild(p);
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

    setStatus('Building prompts from audio features…');
    const aggregate = aggregateFrames(frames);
    const bundle = normaliseFeatures(aggregate, cal);
    const { prompt: imagePrompt, rows: imageRows } = buildPrompt(aggregate, bundle);
    const { prompt: soundPrompt, rows: soundRows } = buildSoundPrompt(aggregate, bundle);
    renderPromptPanel({ imagePrompt, imageRows, soundPrompt, soundRows });

    setStatus(
      'Generating image (FLUX.1-schnell via Hugging Face) and ambience (ElevenLabs) — may take a moment, especially on a cold start…'
    );
    imageHost.innerHTML = '';
    soundHost.innerHTML = '';

    const [imageResult, soundResult] = await Promise.allSettled([
      requestJSON('/api/generate-image', imagePrompt),
      requestJSON('/api/generate-sound', soundPrompt),
    ]);

    if (imageResult.status === 'fulfilled') {
      renderImageResult(imageResult.value);
    } else {
      renderImageError(imageResult.reason.message);
    }

    if (soundResult.status === 'fulfilled') {
      renderSoundResult(soundResult.value);
    } else {
      renderSoundError(soundResult.reason.message);
    }

    const failures = [imageResult, soundResult].filter((r) => r.status === 'rejected').length;
    setStatus(failures === 0 ? 'Done.' : `Done, with ${failures} of 2 generations failing (see above).`);
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`);
  } finally {
    recordBtn.disabled = false;
    progressWrap.hidden = true;
  }
});

setStatus(
  `Ready. Recording captures ${RECORD_SECONDS} seconds of audio; nothing is saved except the extracted numeric features and the prompts built from them.`
);
