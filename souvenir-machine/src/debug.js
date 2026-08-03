// Transparency panel (build spec section 7) — not a debug tool, it's
// assessment evidence. Renders the raw -> normalised -> mapping -> param
// chain for the current image, plus a plain-English one-liner, and can
// export both as PNG and JSON.

const FEATURE_LABELS = {
  rms: 'Loudness / energy (rms)',
  spectralCentroid: 'Brightness (spectral centroid)',
  zcr: 'Noisiness (zcr)',
  spectralFlatness: 'Tonal vs noise (spectral flatness)',
  spectralRolloff: 'High-frequency presence (rolloff)',
  spectralSpread: 'Spectral spread',
  lowBandEnergy: 'Low-band energy (bass weight)',
  spectralFlux: 'Change over time (flux)',
  rmsStd: 'Loudness variability (rms std-dev)',
  spectralCentroidStd: 'Brightness variability (centroid std-dev)',
};

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(3) : String(n);
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// One-line plain-English readout, e.g. "Bright, busy, changeable -> light
// cool palette, dense, motion-streaked." (build spec section 7).
export function describeReadout(params) {
  const descriptors = [
    params.paletteTempC > 0.6 ? 'bright' : params.paletteTempC < 0.4 ? 'deep' : 'balanced',
    params.density > 0.6 ? 'busy' : params.density < 0.4 ? 'sparse' : 'moderate',
    params.contrast > 0.6 ? 'changeable' : params.contrast < 0.4 ? 'steady' : 'somewhat variable',
  ];

  const outcomes = [
    params.paletteTempC > 0.5 ? 'light cool palette' : 'warm dark palette',
    params.density > 0.5 ? 'dense' : 'sparse',
    params.formOrganicness > 0.5 ? 'angular, fractured forms' : 'flowing organic forms',
  ];
  if (params.motion > 0.5) outcomes.push('motion-streaked');
  if (params.grain > 0.5) outcomes.push('grainy edges');

  return `${capitalise(descriptors.join(', '))} → ${outcomes.join(', ')}.`;
}

// Renders the panel into `container` (an existing DOM element) as an HTML
// table + readout, and wires the export buttons.
export function renderDebugPanel(container, { aggregate, rows, params, seed }) {
  container.innerHTML = '';

  const readout = document.createElement('p');
  readout.className = 'debug-readout';
  readout.textContent = describeReadout(params);
  container.appendChild(readout);

  const table = document.createElement('table');
  table.className = 'debug-table';
  table.innerHTML = `
    <thead>
      <tr><th>Feature</th><th>Raw</th><th>Normalised</th><th>Drove &rarr;</th><th>Param value</th></tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `
        <tr>
          <td>${FEATURE_LABELS[r.feature] || r.feature}</td>
          <td>${fmt(r.raw)}</td>
          <td>${fmt(r.normalised)}</td>
          <td>${r.drove}</td>
          <td>${fmt(r.paramValue)}</td>
        </tr>`
        )
        .join('')}
    </tbody>
  `;
  container.appendChild(table);

  const exportRow = document.createElement('div');
  exportRow.className = 'debug-export-row';

  const jsonBtn = document.createElement('button');
  jsonBtn.textContent = 'Export JSON';
  jsonBtn.onclick = () =>
    downloadJSON({ aggregate, rows, params, seed, readout: describeReadout(params) });

  const pngBtn = document.createElement('button');
  pngBtn.textContent = 'Export panel PNG';
  pngBtn.onclick = () => downloadPanelPNG(describeReadout(params), rows);

  exportRow.appendChild(jsonBtn);
  exportRow.appendChild(pngBtn);
  container.appendChild(exportRow);
}

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(URL.createObjectURL(blob), `transparency-panel-${Date.now()}.json`);
}

// Draws the same table onto a plain <canvas> so the transparency panel can
// be exported as a standalone PNG alongside the image (build spec section 7).
function downloadPanelPNG(readoutText, rows) {
  const canvas = document.createElement('canvas');
  const rowHeight = 24;
  const width = 760;
  const height = 90 + rowHeight * (rows.length + 1);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#f2f2f2';
  ctx.font = '14px system-ui, sans-serif';
  wrapText(ctx, readoutText, 16, 28, width - 32, 18);

  const cols = [16, 300, 430, 540, 650];
  const headers = ['Feature', 'Raw', 'Norm.', 'Drove', 'Value'];
  let y = 80;
  ctx.font = 'bold 13px system-ui, sans-serif';
  headers.forEach((hLabel, i) => ctx.fillText(hLabel, cols[i], y));
  ctx.font = '13px system-ui, sans-serif';
  rows.forEach((r) => {
    y += rowHeight;
    ctx.fillText(String(r.feature), cols[0], y);
    ctx.fillText(fmt(r.raw), cols[1], y);
    ctx.fillText(fmt(r.normalised), cols[2], y);
    ctx.fillText(String(r.drove), cols[3], y);
    ctx.fillText(fmt(r.paramValue), cols[4], y);
  });

  triggerDownload(canvas.toDataURL('image/png'), `transparency-panel-${Date.now()}.png`);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}

function triggerDownload(href, filename) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
