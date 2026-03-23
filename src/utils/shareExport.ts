import { Control, Leg, Variant, MapDimensions } from '../types';
import { BASE_CONTROL_RADIUS, BASE_LINE_WIDTH, BASE_TEXT_SIZE, BASE_VARIANT_TEXT_SIZE } from '../constants';
import { calcPixelDistance, calcTotalPixelDistance, pixelsToMeters } from './geometry';
import { computeLegLayout } from '../components/LegPreviewMap';

export interface ShareExportOptions {
  mapImage: string;
  mapDimensions: MapDimensions;
  controls: Control[];
  legs: Leg[];
  variants: Variant[];
  dpi: number;
  scale: number;
  drawingScale: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateLegSvg(
  mapImage: string,
  mapDimensions: MapDimensions,
  controls: Control[],
  legVariants: Variant[],
  legIndex: number,
  dpi: number,
  scale: number,
  drawingScale: number,
  svgW: number,
  svgH: number,
): string {
  const { rotDeg, zoom, pan } = computeLegLayout(controls, legVariants, legIndex, svgW, svgH, 60, drawingScale);
  const cx = svgW / 2;
  const cy = svgH / 2;
  const c1 = controls[legIndex];
  const c2 = controls[legIndex + 1];
  if (!c1 || !c2) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}"><rect width="${svgW}" height="${svgH}" fill="#1e293b"/></svg>`;

  const circleRadius = BASE_CONTROL_RADIUS * drawingScale;
  const lw = BASE_LINE_WIDTH * drawingScale;
  const isStartControl = legIndex === 0;
  const isFinishControl = legIndex === controls.length - 2;

  // Straight leg line
  let lineSvg = '';
  const dist = calcPixelDistance(c1, c2);
  const startMargin = isStartControl ? circleRadius * 1.1 : circleRadius;
  const endMargin = isFinishControl ? circleRadius * 1.2 : circleRadius;
  if (dist > startMargin + endMargin) {
    const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
    lineSvg = `<line x1="${c1.x + Math.cos(angle) * startMargin}" y1="${c1.y + Math.sin(angle) * startMargin}" x2="${c2.x - Math.cos(angle) * endMargin}" y2="${c2.y - Math.sin(angle) * endMargin}" stroke="#ec4899" stroke-width="${lw}"/>`;
  }

  // Start control
  let startSvg = '';
  if (isStartControl) {
    const size = circleRadius * 1.3;
    const startRot = Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI) + 90;
    startSvg = `<polygon points="0,${-size} ${-size * 0.866},${size * 0.5} ${size * 0.866},${size * 0.5}" fill="none" stroke="#ec4899" stroke-width="${lw}" transform="translate(${c1.x},${c1.y}) rotate(${startRot})"/>`;
  } else {
    const lp = { x: circleRadius * 1.5, y: -circleRadius * 1.5 };
    const lx = c1.x + lp.x, ly = c1.y + lp.y;
    const fs = BASE_TEXT_SIZE * drawingScale;
    startSvg = `<circle cx="${c1.x}" cy="${c1.y}" r="${circleRadius}" fill="none" stroke="#ec4899" stroke-width="${lw}"/><text x="${lx}" y="${ly}" fill="#ec4899" font-size="${fs}" font-weight="bold" stroke="white" stroke-width="${4 * drawingScale}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${-rotDeg},${lx},${ly})">${legIndex}</text>`;
  }

  // End control
  let endSvg = '';
  if (isFinishControl) {
    endSvg = `<circle cx="${c2.x}" cy="${c2.y}" r="${circleRadius * 0.7}" fill="none" stroke="#ec4899" stroke-width="${lw}"/><circle cx="${c2.x}" cy="${c2.y}" r="${circleRadius * 1.1}" fill="none" stroke="#ec4899" stroke-width="${lw}"/>`;
  } else {
    const lp = { x: circleRadius * 1.5, y: -circleRadius * 1.5 };
    const lx = c2.x + lp.x, ly = c2.y + lp.y;
    const fs = BASE_TEXT_SIZE * drawingScale;
    endSvg = `<circle cx="${c2.x}" cy="${c2.y}" r="${circleRadius}" fill="none" stroke="#ec4899" stroke-width="${lw}"/><text x="${lx}" y="${ly}" fill="#ec4899" font-size="${fs}" font-weight="bold" stroke="white" stroke-width="${4 * drawingScale}" paint-order="stroke" text-anchor="middle" dominant-baseline="middle" transform="rotate(${-rotDeg},${lx},${ly})">${legIndex + 1}</text>`;
  }

  // Variants
  let variantsSvg = '';
  for (const v of legVariants) {
    const isChosen = v.chosen === true;
    const pts = v.points.map(p => `${p.x},${p.y}`).join(' ');
    variantsSvg += `<polyline points="${pts}" fill="none" stroke="${v.color}" stroke-width="${lw * (isChosen ? 2.5 : 1)}"/>`;

    if (v.points.length > 0) {
      const midPoint = v.points[Math.floor(v.points.length / 2)];
      const labelOffset = v.labelOffset ?? { x: 0, y: 0 };
      const lx = midPoint.x + labelOffset.x;
      const ly = midPoint.y + labelOffset.y;
      const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
      const fontSize = BASE_VARIANT_TEXT_SIZE * drawingScale * (isChosen ? 1.4 : 1);
      const fw = isChosen ? 'bold' : 'normal';
      const strokeWidth = isChosen ? 3 * drawingScale : 2 * drawingScale;
      const label = `${isChosen ? '\u2605 ' : ''}${v.name}: ${actualLen.toFixed(0)}m`;
      variantsSvg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="${v.color}" font-size="${fontSize}" font-weight="${fw}" stroke="white" stroke-width="${strokeWidth}" paint-order="stroke" transform="rotate(${-rotDeg},${lx},${ly})">${escapeHtml(label)}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" style="display:block;width:100%;height:100%">
  <rect width="${svgW}" height="${svgH}" fill="#1e293b"/>
  <g transform="rotate(${rotDeg},${cx},${cy})">
    <g transform="translate(${pan.x},${pan.y}) scale(${zoom})">
      <image x="0" y="0" width="${mapDimensions.width}" height="${mapDimensions.height}" href="${mapImage}" preserveAspectRatio="none"/>
      ${lineSvg}
      ${startSvg}
      ${endSvg}
      ${variantsSvg}
    </g>
  </g>
</svg>`;
}

function generateInfoPanel(leg: Leg, legVariants: Variant[], dpi: number, scale: number): string {
  const shortestLen =
    legVariants.length > 0
      ? Math.min(...legVariants.map(v => pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale)))
      : 0;

  let variantsHtml = '';
  if (legVariants.length === 0) {
    variantsHtml = '<p style="color:#94a3b8;font-style:italic;font-size:14px">No routechoices drawn</p>';
  } else {
    variantsHtml = '<div style="display:flex;flex-direction:column;gap:8px">';
    for (const v of legVariants) {
      const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
      const percentExtra = shortestLen > 0 ? ((actualLen / shortestLen) - 1) * 100 : 0;
      const isChosen = v.chosen === true;
      const bg = isChosen ? 'rgba(21,128,61,0.3)' : '#334155';
      const border = isChosen ? '#16a34a' : '#475569';
      const nameColor = isChosen ? '#86efac' : 'white';
      const chosenMark = isChosen ? '\u2605 ' : '';
      const pctHtml =
        percentExtra > 0
          ? `<span style="font-size:12px;font-weight:bold;color:${percentExtra > 10 ? '#fb923c' : '#94a3b8'}">+${percentExtra.toFixed(0)}%</span>`
          : '';
      const checkHtml = isChosen ? '<span style="color:#4ade80;margin-left:4px;font-size:14px">&#10003;</span>' : '';
      variantsHtml += `<div style="display:flex;align-items:center;gap:8px;background:${bg};border:1px solid ${border};border-radius:8px;padding:8px 12px">
        <div style="width:12px;height:12px;border-radius:50%;background:${v.color};flex-shrink:0"></div>
        <span style="font-weight:bold;font-size:14px;color:${nameColor}">${chosenMark}${escapeHtml(v.name)}</span>
        <span style="font-size:13px;font-family:monospace;margin-left:auto">${actualLen.toFixed(0)}m</span>
        ${pctHtml}${checkHtml}
      </div>`;
    }
    variantsHtml += '</div>';
  }

  const notesHtml = leg.notes
    ? `<div>
        <div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Notes</div>
        <div style="background:#334155;border-radius:8px;padding:12px;font-size:13px;color:#cbd5e1;line-height:1.6;white-space:pre-wrap">${escapeHtml(leg.notes)}</div>
      </div>`
    : '';

  return `<div style="padding:24px;overflow-y:auto;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:16px">
    <div>
      <h3 style="font-size:20px;font-weight:bold;margin:0 0 4px">${escapeHtml(leg.label)}</h3>
      <p style="font-size:13px;color:#94a3b8;margin:0">Straight-line: ${leg.straightLength.toFixed(0)}m</p>
    </div>
    <div>
      <div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">Routechoices</div>
      ${variantsHtml}
    </div>
    ${notesHtml}
  </div>`;
}

export function exportShareHtml({
  mapImage,
  mapDimensions,
  controls,
  legs,
  variants,
  dpi,
  scale,
  drawingScale,
}: ShareExportOptions): void {
  const SVG_W = 720;
  const SVG_H = 600;

  let slidesHtml = '';
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const legVariants = variants.filter(v => v.legIndex === leg.index);
    const mapSvg = generateLegSvg(mapImage, mapDimensions, controls, legVariants, leg.index, dpi, scale, drawingScale, SVG_W, SVG_H);
    const infoHtml = generateInfoPanel(leg, legVariants, dpi, scale);
    slidesHtml += `<div class="slide" id="slide-${i}" style="display:${i === 0 ? 'flex' : 'none'};width:100%;height:100%">
      <div style="flex:1;min-width:0;overflow:hidden">${mapSvg}</div>
      <div style="width:380px;border-left:1px solid #334155;background:#1e293b;overflow-y:auto;color:white;flex-shrink:0">${infoHtml}</div>
    </div>`;
  }

  const dotsHtml = legs
    .map(
      (_, i) =>
        `<button onclick="goTo(${i})" id="dot-${i}" style="width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;padding:0;background:${i === 0 ? '#60a5fa' : '#475569'};transition:background 0.2s"></button>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Routechoice Analysis</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: white; height: 100vh; overflow: hidden; }
    .container { display: flex; flex-direction: column; height: 100vh; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #0f172a; border-bottom: 1px solid #334155; flex-shrink: 0; }
    .slides { flex: 1; overflow: hidden; position: relative; }
    .footer { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #0f172a; border-top: 1px solid #334155; flex-shrink: 0; }
    .nav-btn { background: transparent; color: white; border: 1px solid #475569; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .nav-btn:hover:not(:disabled) { background: #334155; }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span style="color:#f472b6;font-weight:bold;font-size:16px">&#9971; Routechoice Analysis</span>
      <span id="slide-title" style="font-size:18px;font-weight:bold">${escapeHtml(legs[0]?.label ?? '')}</span>
      <span style="color:#64748b;font-size:13px">${legs.length} leg${legs.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="slides">${slidesHtml}</div>
    <div class="footer">
      <button class="nav-btn" id="prev-btn" onclick="prev()" disabled>&#8592; Prev</button>
      <div style="display:flex;gap:6px;align-items:center" id="dots">${dotsHtml}</div>
      <button class="nav-btn" id="next-btn" onclick="next()"${legs.length <= 1 ? ' disabled' : ''}>Next &#8594;</button>
    </div>
  </div>
  <script>
    var current = 0;
    var total = ${legs.length};
    var titles = ${JSON.stringify(legs.map(l => l.label))};
    function goTo(i) {
      if (i < 0 || i >= total) return;
      var oldSlide = document.getElementById('slide-' + current);
      if (oldSlide) oldSlide.style.display = 'none';
      var oldDot = document.getElementById('dot-' + current);
      if (oldDot) oldDot.style.background = '#475569';
      current = i;
      var newSlide = document.getElementById('slide-' + current);
      if (newSlide) newSlide.style.display = 'flex';
      var newDot = document.getElementById('dot-' + current);
      if (newDot) newDot.style.background = '#60a5fa';
      document.getElementById('slide-title').textContent = titles[current] || '';
      document.getElementById('prev-btn').disabled = current === 0;
      document.getElementById('next-btn').disabled = current === total - 1;
    }
    function prev() { goTo(current - 1); }
    function next() { goTo(current + 1); }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
    });
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'routechoice-analysis.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
