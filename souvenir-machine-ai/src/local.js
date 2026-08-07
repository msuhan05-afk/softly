// Orchestration for the on-device recognition page: record a clip ->
// classify it in the browser with MediaPipe/YAMNet -> show ranked scores.
//
// No network call at inference time, no API key, no serverless function.
// This is the one page in the project that works with zero credentials,
// which also makes it the only one fully testable in a sandbox without
// provisioning secrets.

import { recordClipSamples } from './wavRecorder.js';
import { classifyClip, getClassifier } from './localClassifier.js';

const RECORD_SECONDS = 6;

const recordBtn = document.getElementById('recordBtn');
const statusEl = document.getElementById('status');
const statusPill = document.getElementById('statusPill');
const progressWrap = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const resultsHost = document.getElementById('resultsHost');

// state: 'idle' | 'recording' | 'working' | 'done' | 'error' — drives the
// status-pill dot color/pulse in src/style.css.
function setStatus(text, state = 'idle') {
  statusEl.textContent = text;
  statusPill.dataset.state = state;
}

function renderResults(results) {
  resultsHost.innerHTML = '';

  if (!results.length) {
    const p = document.createElement('p');
    p.className = 'placeholder';
    p.textContent = 'The model returned no categories for that clip.';
    resultsHost.appendChild(p);
    return;
  }

  const list = document.createElement('div');
  list.className = 'results-list';
  for (const { label, score } of results) {
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
    resultsHost.innerHTML = '';

    // First click pays the model-load cost (~4MB + WASM runtime); say so
    // rather than looking frozen.
    setStatus('Loading the on-device model (first run only)…', 'working');
    await getClassifier();

    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    setStatus(`Listening… recording ${RECORD_SECONDS} seconds of sound.`, 'recording');

    const { samples, sampleRate } = await recordClipSamples(RECORD_SECONDS, {
      onProgress: (t) => {
        progressBar.style.width = `${Math.round(t * 100)}%`;
      },
    });

    setStatus('Classifying on-device…', 'working');
    const results = await classifyClip(samples, sampleRate);

    renderResults(results);
    setStatus('Done — classified entirely in your browser, no data sent anywhere.', 'done');
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
  `Ready. Recording captures ${RECORD_SECONDS} seconds; everything runs locally in your browser.`,
  'idle'
);
