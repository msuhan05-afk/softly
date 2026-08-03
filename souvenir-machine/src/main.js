// Orchestration + UI state: record -> analyse -> render -> export.
// This file wires the other modules together; it contains no audio-feature
// math and no drawing code of its own (build spec section 3).

import { recordAmbience, RECORD_SECONDS } from './audio.js';
import { aggregateFrames, loadCalibration, normaliseFeatures } from './features.js';
import { computeVisualParams, nudgeParams } from './mappings.js';
import { createSketch, renderPrintPNG, seedFromParams, mulberry32, PREVIEW_SIZE } from './render.js';
import { renderDebugPanel } from './debug.js';

const recordBtn = document.getElementById('recordBtn');
const toggleDebugBtn = document.getElementById('toggleDebugBtn');
const exportBtn = document.getElementById('exportBtn');
const modeSelect = document.getElementById('modeSelect');
const statusEl = document.getElementById('status');
const progressWrap = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const canvasHost = document.getElementById('canvasHost');
const curateGrid = document.getElementById('curateGrid');
const debugPanel = document.getElementById('debugPanel');

let currentSketch = null;
let currentResult = null; // { aggregate, rows, params, seed }
let calibration = null;

// Selections made in curate mode are study data (build spec section 9) —
// kept in memory for this session and logged for the researcher to collect.
const curateSelections = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function clearCanvas() {
  if (currentSketch) {
    currentSketch.remove();
    currentSketch = null;
  }
  canvasHost.innerHTML = '';
  curateGrid.hidden = true;
  curateGrid.innerHTML = '';
}

async function ensureCalibration() {
  if (!calibration) calibration = await loadCalibration();
  return calibration;
}

function computeFromFrames(frames, cal) {
  const aggregate = aggregateFrames(frames);
  const bundle = normaliseFeatures(aggregate, cal);
  const { params, rows } = computeVisualParams(aggregate, bundle);
  return { aggregate, rows, params };
}

function runMachinePick(frames, cal) {
  const { aggregate, rows, params } = computeFromFrames(frames, cal);
  const seed = seedFromParams(params);

  clearCanvas();
  currentSketch = createSketch(canvasHost, params, seed, PREVIEW_SIZE);
  currentResult = { aggregate, rows, params, seed };

  toggleDebugBtn.disabled = false;
  exportBtn.disabled = false;
  updateDebugPanel();
}

function runCurateMode(frames, cal) {
  const { aggregate, rows, params } = computeFromFrames(frames, cal);
  const baseSeed = seedFromParams(params);
  const rng = mulberry32(baseSeed);

  clearCanvas();
  curateGrid.hidden = false;
  currentResult = { aggregate, rows, params, seed: baseSeed };

  const thumbSize = { w: Math.round(PREVIEW_SIZE.w / 2), h: Math.round(PREVIEW_SIZE.h / 2) };

  for (let i = 0; i < 6; i++) {
    const variantParams = nudgeParams(params, rng);
    const variantSeed = seedFromParams(variantParams, i + 1);

    const card = document.createElement('div');
    card.className = 'curate-card';
    const host = document.createElement('div');
    card.appendChild(host);
    const pickBtn = document.createElement('button');
    pickBtn.textContent = `Choose option ${i + 1}`;
    card.appendChild(pickBtn);
    curateGrid.appendChild(card);

    createSketch(host, variantParams, variantSeed, thumbSize);

    pickBtn.onclick = () => {
      curateSelections.push({
        timestamp: new Date().toISOString(),
        optionIndex: i,
        params: variantParams,
        seed: variantSeed,
      });
      console.log('Curate selection logged:', curateSelections.at(-1));
      setStatus(`Option ${i + 1} selected and logged as study data.`);

      currentResult = { aggregate, rows, params: variantParams, seed: variantSeed };
      clearCanvas();
      currentSketch = createSketch(canvasHost, variantParams, variantSeed, PREVIEW_SIZE);
      toggleDebugBtn.disabled = false;
      exportBtn.disabled = false;
      updateDebugPanel();
    };
  }
}

function updateDebugPanel() {
  if (!currentResult) return;
  renderDebugPanel(debugPanel, currentResult);
}

recordBtn.addEventListener('click', async () => {
  try {
    recordBtn.disabled = true;
    modeSelect.disabled = true;
    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    setStatus('Listening… recording 30 seconds of ambient sound.');

    const cal = await ensureCalibration();
    const frames = await recordAmbience({
      onProgress: (t) => {
        progressBar.style.width = `${Math.round(t * 100)}%`;
      },
    });

    setStatus('Analysing…');
    if (modeSelect.value === 'curate') {
      runCurateMode(frames, cal);
      setStatus('Pick the option that feels most like this place.');
    } else {
      runMachinePick(frames, cal);
      setStatus('Done.');
    }
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}. Mic access and https/localhost are required.`);
  } finally {
    recordBtn.disabled = false;
    modeSelect.disabled = false;
    progressWrap.hidden = true;
  }
});

toggleDebugBtn.addEventListener('click', () => {
  const willShow = debugPanel.hidden;
  debugPanel.hidden = !willShow;
  toggleDebugBtn.textContent = willShow ? 'Hide transparency panel' : 'Show transparency panel';
  if (willShow) updateDebugPanel();
});

exportBtn.addEventListener('click', async () => {
  if (!currentResult) return;
  exportBtn.disabled = true;
  setStatus('Rendering print-resolution PNG…');
  try {
    const dataUrl = await renderPrintPNG(currentResult.params, currentResult.seed);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `souvenir-${currentResult.seed}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setStatus('Exported.');
  } catch (err) {
    console.error(err);
    setStatus(`Export failed: ${err.message}`);
  } finally {
    exportBtn.disabled = false;
  }
});

setStatus(
  `Ready. Recording captures ${RECORD_SECONDS} seconds of audio; nothing is saved except the extracted numeric features.`
);
