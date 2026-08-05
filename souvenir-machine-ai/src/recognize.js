// Orchestration for the sound-recognition page: record a short clip ->
// encode as WAV -> POST to /api/recognize-sound -> show CLAP's scores
// against the candidate labels. No image/sound generation here — this
// page only classifies.

import { recordClip, blobToBase64 } from './wavRecorder.js';

const RECORD_SECONDS = 6;

// Keep in sync with lib/recognizeSound.js's DEFAULT_LABELS — this is just
// the pre-filled UI value, the backend falls back to its own copy if the
// labels field is ever missing or too short.
const DEFAULT_LABELS = [
  'rain',
  'wind',
  'birds chirping',
  'traffic noise',
  'human speech',
  'music',
  'footsteps',
  'water or stream',
  'crowd noise',
  'silence',
  'machinery or engine noise',
  'dog barking',
  'construction noise',
  'keyboard typing',
  'applause',
  'laughter',
];

const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const statusPill = document.getElementById('statusPill');
const progressWrap = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const labelsInput = document.getElementById('labelsInput');
const resultsHost = document.getElementById('resultsHost');

labelsInput.value = DEFAULT_LABELS.join(', ');

// state: 'idle' | 'recording' | 'working' | 'done' | 'error' — drives the
// status-pill dot color/pulse in src/style.css.
function setStatus(text, state = 'idle') {
  statusEl.textContent = text;
  statusPill.dataset.state = state;
}

function parseLabels(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function renderResults(results) {
  resultsHost.innerHTML = '';
  const sorted = [...results].sort((a, b) => b.score - a.score);

  const list = document.createElement('div');
  list.className = 'results-list';
  for (const { label, score } of sorted) {
    const pct = Math.round(score * 100);
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `
      <div class="result-label">${label}</div>
      <div class="result-bar-track"><div class="result-bar-fill" style="width:${pct}%"></div></div>
      <div class="result-pct">${pct}%</div>
    `;
    list.appendChild(row);
  }
  resultsHost.appendChild(list);
}

function renderResultsError(message) {
  resultsHost.innerHTML = '';
  const p = document.createElement('p');
  p.className = 'result-error';
  p.textContent = `Recognition failed: ${message}`;
  resultsHost.appendChild(p);
}

recordBtn.addEventListener('click', async () => {
  try {
    recordBtn.disabled = true;
    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    resultsHost.innerHTML = '';

    const labels = parseLabels(labelsInput.value);
    if (labels.length < 2) {
      throw new Error('Enter at least two candidate labels, comma-separated.');
    }

    setStatus(`Listening… recording ${RECORD_SECONDS} seconds of sound.`, 'recording');
    const wavBlob = await recordClip(RECORD_SECONDS, {
      onProgress: (t) => {
        progressBar.style.width = `${Math.round(t * 100)}%`;
      },
    });

    setStatus('Encoding clip and asking CLAP what it hears (may take a moment on a cold start)…', 'working');
    const audioBase64 = await blobToBase64(wavBlob);

    const res = await fetch('/api/recognize-sound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64, labels }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed with ${res.status}`);

    renderResults(data.results);
    setStatus('Done.', 'done');
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`, 'error');
    renderResultsError(err.message);
  } finally {
    recordBtn.disabled = false;
    progressWrap.hidden = true;
  }
});

setStatus(
  `Ready. Recording captures ${RECORD_SECONDS} seconds; edit the candidate labels below before recording if you like.`,
  'idle'
);
