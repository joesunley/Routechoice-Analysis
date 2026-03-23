import React from 'react';
import {
  BASE_CONTROL_RADIUS, BASE_LINE_WIDTH, BASE_TEXT_SIZE, BASE_VARIANT_TEXT_SIZE
} from '../constants';
import { calcPixelDistance, calcTotalPixelDistance, pixelsToMeters } from '../utils/geometry';
import { Control, Variant, Point } from '../types';

interface MapOverlayProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
  zoom: number;
  controls: Control[];
  variants: Variant[];
  currentDrawing: Point[];
  selectedLegIndex: number | null;
  calibrationPoints: Point[];
  draggedControlId: number | null;
  drawingScale: number;
  isVariantMode: boolean;
  draggedVariantId: number | null;
  isAltDraggingLabel: boolean;
  dpi?: number;
  scale?: number;
  editingVariantId: number | null;
}

export default function MapOverlay({
  svgRef,
  zoom,
  controls,
  variants,
  currentDrawing,
  selectedLegIndex,
  calibrationPoints,
  draggedControlId,
  drawingScale,
  isVariantMode,
  draggedVariantId,
  isAltDraggingLabel,
  dpi = 150,
  scale = 4000,
  editingVariantId,
}: MapOverlayProps) {
  const circleRadius = BASE_CONTROL_RADIUS * drawingScale;

  return (
    <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">

      {/* Calibration Points */}
      {calibrationPoints.map((p, i) => (
        <g key={`calib-${i}`}>
          <circle cx={p.x} cy={p.y} r={8 / zoom} fill="#f97316" stroke="white" strokeWidth={2 / zoom} />
          <text
            x={p.x + 10 / zoom} y={p.y - 10 / zoom}
            fill="#f97316" fontSize={14 / zoom} fontWeight="bold"
            stroke="white" strokeWidth={4 / zoom} paintOrder="stroke"
          >
            {i + 1}
          </text>
        </g>
      ))}

      {/* Course Controls */}
      {controls.map((c, i) => {
        const isStart = i === 0;
        const isFinish = i === controls.length - 1 && i !== 0;
        const isBeingDragged = draggedControlId === c.id;
        const isDimmed = isVariantMode && selectedLegIndex !== null && i !== selectedLegIndex && i !== selectedLegIndex + 1; // Refined logic to exclude first control in the leg

        if (isStart) {
          const size = circleRadius * 1.3;
          const p1 = `${0},${-size}`;
          const p2 = `${-size * 0.866},${size * 0.5}`;
          const p3 = `${size * 0.866},${size * 0.5}`;
          let rotation = 0;
          if (controls.length > 1) {
            const next = controls[1];
            rotation = Math.atan2(next.y - c.y, next.x - c.x) * (180 / Math.PI) + 90;
          }
          return (
            <g key={c.id} opacity={isDimmed ? 0.3 : isBeingDragged ? 0.6 : 1}>
              <polygon
                points={`${p1} ${p2} ${p3}`}
                fill="none" stroke="#ec4899"
                strokeWidth={BASE_LINE_WIDTH * drawingScale}
                transform={`translate(${c.x}, ${c.y}) rotate(${rotation})`}
              />
              <text
                x={c.x + size} y={c.y - size}
                fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
                stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
              >S</text>
            </g>
          );
        }

        if (isFinish) {
          return (
            <g key={c.id} opacity={isDimmed ? 0.3 : isBeingDragged ? 0.6 : 1}>
              <circle cx={c.x} cy={c.y} r={circleRadius * 0.7} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
              <circle cx={c.x} cy={c.y} r={circleRadius * 1.1} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
              <text
                x={c.x + circleRadius * 1.1} y={c.y - circleRadius * 1.1}
                fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
                stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
              >F</text>
            </g>
          );
        }

        return (
          <g key={c.id} opacity={isDimmed ? 0.3 : isBeingDragged ? 0.6 : 1}>
            <circle cx={c.x} cy={c.y} r={circleRadius} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
            <text
              x={c.x + circleRadius} y={c.y - circleRadius}
              fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
              stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
            >{i}</text>
          </g>
        );
      })}

      {/* Leg Lines */}
      {controls.length >= 2 && controls.map((c, i) => {
        if (i === 0) return null;
        const p1 = controls[i - 1];
        const p2 = c;
        const dist = calcPixelDistance(p1, p2);
        const startMargin = (i - 1 === 0) ? circleRadius * 1.1 : circleRadius;
        const endMargin = (i === controls.length - 1) ? circleRadius * 1.2 : circleRadius;
        if (dist < startMargin + endMargin) return null;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const isDimmed = isVariantMode && selectedLegIndex !== null && selectedLegIndex !== i - 1; // Ensure dimming only in variant mode
        return (
          <line
            key={`line-${i}`}
            x1={p1.x + Math.cos(angle) * startMargin} y1={p1.y + Math.sin(angle) * startMargin}
            x2={p2.x - Math.cos(angle) * endMargin} y2={p2.y - Math.sin(angle) * endMargin}
            stroke="#ec4899"
            strokeWidth={BASE_LINE_WIDTH * drawingScale}
            opacity={isDimmed ? 0.3 : 1}
          />
        );      })}      {/* Route Variants */}      {isVariantMode && variants.map(v => {
        // Skip rendering the variant that's currently being edited
        if (v.id === editingVariantId) return null;
        if (v.legIndex !== selectedLegIndex) return null;
        const midPoint = v.points[Math.floor(v.points.length / 2)];
        const labelOffset = v.labelOffset || { x: 0, y: 0 };
        const isBeingDragged = isAltDraggingLabel && draggedVariantId === v.id;
        const variantDistance = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
        return (
          <g key={v.id} opacity={isBeingDragged ? 0.6 : 1}>
            <polyline
              points={v.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={v.color}
              strokeWidth={BASE_LINE_WIDTH * drawingScale}
              strokeDasharray={v.legIndex === selectedLegIndex ? 'none' : '10,10'}
              opacity={v.legIndex === selectedLegIndex ? 1 : 0.3}
            />
            {v.legIndex === selectedLegIndex && (
              <>                {/* Invisible hit target for easier grabbing */}
                <circle
                  cx={midPoint.x + labelOffset.x}
                  cy={midPoint.y + labelOffset.y}
                  r={BASE_VARIANT_TEXT_SIZE * drawingScale}
                  fill="transparent"
                  pointerEvents="none"
                />
                <text
                  x={midPoint.x + labelOffset.x}
                  y={midPoint.y + labelOffset.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={v.color}
                  fontSize={BASE_VARIANT_TEXT_SIZE * drawingScale}
                  fontWeight="bold"
                  stroke="white"
                  strokeWidth={2 * drawingScale}
                  paintOrder="stroke"
                >
                  {v.name}: {variantDistance.toFixed(0)}m
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Drawing Preview */}
      {currentDrawing.length > 0 && (
        <g>
          {currentDrawing.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={3 / zoom}
              fill="#3b82f6"
            />
          ))}
          <polyline
            points={currentDrawing.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="#3b82f6"
            strokeWidth={BASE_LINE_WIDTH * drawingScale}
          />
        </g>
      )}
    </svg>
  );
}
