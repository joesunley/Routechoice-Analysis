import { useRef, useEffect, useState } from 'react';
import { Control, Variant, MapDimensions } from '../types';
import { BASE_CONTROL_RADIUS, BASE_LINE_WIDTH, BASE_TEXT_SIZE, BASE_VARIANT_TEXT_SIZE } from '../constants';
import { calcPixelDistance, calcTotalPixelDistance, pixelsToMeters } from '../utils/geometry';

interface LegPreviewMapProps {
  mapImage: string;
  mapDimensions: MapDimensions;
  controls: Control[];
  legVariants: Variant[];
  legIndex: number;
  dpi: number;
  scale: number;
  drawingScale: number;
}

function getLabelPos(controlIndex: number, controls: Control[], radius: number): { x: number; y: number } {
  const offset = radius * 1.5;
  const quadrants = [
    { x: -offset, y: -offset },
    { x: offset, y: -offset },
    { x: offset, y: offset },
    { x: -offset, y: offset },
  ];
  if (controlIndex === 0 || controlIndex === controls.length - 1) return quadrants[1];
  const c = controls[controlIndex];
  const prev = controls[controlIndex - 1];
  const next = controls[controlIndex + 1];
  const aPrev = Math.atan2(prev.y - c.y, prev.x - c.x);
  const aNext = Math.atan2(next.y - c.y, next.x - c.x);
  let best = 1, bestScore = -Infinity;
  quadrants.forEach((q, i) => {
    const qa = Math.atan2(q.y, q.x);
    const d1 = Math.min(Math.abs(aPrev - qa), Math.PI * 2 - Math.abs(aPrev - qa));
    const d2 = Math.min(Math.abs(aNext - qa), Math.PI * 2 - Math.abs(aNext - qa));
    const score = Math.min(d1, d2);
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return quadrants[best];
}

interface Layout {
  rotDeg: number;
  zoom: number;
  pan: { x: number; y: number };
}

export function computeLegLayout(
  controls: Control[],
  legVariants: Variant[],
  legIndex: number,
  containerW: number,
  containerH: number,
  padding = 80,
  drawingScale = 1,
): Layout {
  const c1 = controls[legIndex];
  const c2 = controls[legIndex + 1];
  if (!c1 || !c2) return { rotDeg: 0, zoom: 1, pan: { x: 0, y: 0 } };

  const rotDeg = -(Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI) + 90);
  const theta = rotDeg * Math.PI / 180;

  // Include proxy points for control-number label extents so zoom never clips them.
  // Worst-case label reach from control centre: circleRadius*1.5 + half font size.
  const labelReach = (BASE_CONTROL_RADIUS * 1.5 + BASE_TEXT_SIZE * 0.5) * drawingScale;
  const labelProxies = [c1, c2].flatMap(c => [
    { x: c.x + labelReach, y: c.y },
    { x: c.x - labelReach, y: c.y },
    { x: c.x, y: c.y + labelReach },
    { x: c.x, y: c.y - labelReach },
  ]);

  const allPoints = [c1, c2, ...legVariants.flatMap(v => v.points), ...labelProxies];
  const midX = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
  const midY = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;

  let maxRx = 0;
  let maxRy = 0;
  for (const p of allPoints) {
    const dx = p.x - midX;
    const dy = p.y - midY;
    const rx = Math.abs(dx * Math.cos(theta) - dy * Math.sin(theta));
    const ry = Math.abs(dx * Math.sin(theta) + dy * Math.cos(theta));
    if (rx > maxRx) maxRx = rx;
    if (ry > maxRy) maxRy = ry;
  }

  const cx = containerW / 2;
  const cy = containerH / 2;
  const fitZoomX = maxRx > 0 ? (cx - padding) / maxRx : 1;
  const fitZoomY = maxRy > 0 ? (cy - padding) / maxRy : 1;
  const zoom = Math.max(0.01, Math.min(Math.min(fitZoomX, fitZoomY), 50));

  return {
    rotDeg,
    zoom,
    pan: { x: cx - midX * zoom, y: cy - midY * zoom },
  };
}

export default function LegPreviewMap({
  mapImage,
  mapDimensions,
  controls,
  legVariants,
  legIndex,
  dpi,
  scale,
  drawingScale,
}: LegPreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({ rotDeg: 0, zoom: 1, pan: { x: 0, y: 0 } });

  useEffect(() => {
    let raf: number;
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setLayout(computeLegLayout(controls, legVariants, legIndex, width, height, 80, drawingScale));
      } else {
        raf = requestAnimationFrame(measure);
      }
    };
    measure();
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { rotDeg, zoom, pan } = layout;
  const circleRadius = BASE_CONTROL_RADIUS * drawingScale;
  const lw = BASE_LINE_WIDTH * drawingScale;
  const c1 = controls[legIndex];
  const c2 = controls[legIndex + 1];

  if (!c1 || !c2) return <div ref={containerRef} className="w-full h-full bg-slate-800" />;

  const isStartControl = legIndex === 0;
  const isFinishControl = legIndex === controls.length - 2;

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-800">
      <div
        className="absolute inset-0"
        style={rotDeg !== 0 ? { transform: `rotate(${rotDeg}deg)`, transformOrigin: 'center center' } : undefined}
      >
        <div
          className="absolute top-0 left-0 bg-white origin-top-left shadow-2xl"
          style={{
            width: mapDimensions.width,
            height: mapDimensions.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <img
            src={mapImage}
            alt="map"
            className="absolute inset-0 w-full h-full block select-none"
            draggable={false}
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Straight leg line */}
            {(() => {
              const dist = calcPixelDistance(c1, c2);
              const startMargin = isStartControl ? circleRadius * 1.1 : circleRadius;
              const endMargin = isFinishControl ? circleRadius * 1.2 : circleRadius;
              if (dist < startMargin + endMargin) return null;
              const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
              return (
                <line
                  x1={c1.x + Math.cos(angle) * startMargin}
                  y1={c1.y + Math.sin(angle) * startMargin}
                  x2={c2.x - Math.cos(angle) * endMargin}
                  y2={c2.y - Math.sin(angle) * endMargin}
                  stroke="#ec4899"
                  strokeWidth={lw}
                />
              );
            })()}

            {/* Start control: triangle if first leg, otherwise circle + number */}
            {isStartControl ? (() => {
              const size = circleRadius * 1.3;
              const rotation = Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI) + 90;
              return (
                <polygon
                  points={`0,${-size} ${-size * 0.866},${size * 0.5} ${size * 0.866},${size * 0.5}`}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth={lw}
                  transform={`translate(${c1.x},${c1.y}) rotate(${rotation})`}
                />
              );
            })() : (() => {
              const lp = getLabelPos(legIndex, controls, circleRadius);
              return (
                <g>
                  <circle cx={c1.x} cy={c1.y} r={circleRadius} fill="none" stroke="#ec4899" strokeWidth={lw} />
                  <text
                    x={c1.x + lp.x} y={c1.y + lp.y}
                    fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
                    stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-rotDeg}, ${c1.x + lp.x}, ${c1.y + lp.y})`}
                  >{legIndex}</text>
                </g>
              );
            })()}

            {/* End control: double circle if final leg, otherwise circle + number */}
            {isFinishControl ? (
              <g>
                <circle cx={c2.x} cy={c2.y} r={circleRadius * 0.7} fill="none" stroke="#ec4899" strokeWidth={lw} />
                <circle cx={c2.x} cy={c2.y} r={circleRadius * 1.1} fill="none" stroke="#ec4899" strokeWidth={lw} />
              </g>
            ) : (() => {
              const lp = getLabelPos(legIndex + 1, controls, circleRadius);
              return (
                <g>
                  <circle cx={c2.x} cy={c2.y} r={circleRadius} fill="none" stroke="#ec4899" strokeWidth={lw} />
                  <text
                    x={c2.x + lp.x} y={c2.y + lp.y}
                    fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
                    stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
                    textAnchor="middle" dominantBaseline="middle"
                    transform={`rotate(${-rotDeg}, ${c2.x + lp.x}, ${c2.y + lp.y})`}
                  >{legIndex + 1}</text>
                </g>
              );
            })()}

            {/* Variant polylines and labels */}
            {legVariants.map(v => {
              const isChosen = v.chosen === true;
              const midPoint = v.points[Math.floor(v.points.length / 2)];
              const labelOffset = v.labelOffset ?? { x: 0, y: 0 };
              const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
              const fontSize = BASE_VARIANT_TEXT_SIZE * drawingScale * (isChosen ? 1.4 : 1);
              const label = `${isChosen ? '★ ' : ''}${v.name}: ${actualLen.toFixed(0)}m`;

              return (
                <g key={v.id}>
                  <polyline
                    points={v.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={v.color}
                    strokeWidth={lw * (isChosen ? 2.5 : 1)}
                  />
                  {midPoint && (
                    <text
                      x={midPoint.x + labelOffset.x}
                      y={midPoint.y + labelOffset.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={v.color}
                      fontSize={fontSize}
                      fontWeight={isChosen ? 'bold' : 'normal'}
                      stroke="white"
                      strokeWidth={isChosen ? 3 * drawingScale : 2 * drawingScale}
                      paintOrder="stroke"
                      transform={`rotate(${-rotDeg}, ${midPoint.x + labelOffset.x}, ${midPoint.y + labelOffset.y})`}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
