import React from 'react';
import {
  BASE_CONTROL_RADIUS, BASE_LINE_WIDTH, BASE_TEXT_SIZE, BASE_VARIANT_TEXT_SIZE
} from '../constants';
import { calcPixelDistance, calcTotalPixelDistance, pixelsToMeters } from '../utils/geometry';
import { Control, Variant, Point, IndependentLeg, WorkflowMode } from '../types';

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
  mapRotation: number;
  // Independent legs mode
  workflowMode: WorkflowMode;
  independentLegs: IndependentLeg[];
  pendingStart: Control | null;
  indVariants: Variant[];
  indSelectedLegId: number;
  indDraggedLegId: number | null;
  indDraggedEndpoint: 'start' | 'end' | null;
  indDraggedVariantId: number | null;
  isIndAltDraggingLabel: boolean;
  indEditingVariantId: number | null;
}

/**
 * Calculates the best position for a control label by checking adjacent controls
 * and returning the quadrant (offset) that least interferes with the course
 */
function calculateLabelPosition(
  controlIndex: number,
  control: Control,
  controls: Control[],
  radius: number
): { x: number; y: number } {
  // Quadrants: [top-left, top-right, bottom-right, bottom-left]
  // Using 1.5x radius to ensure sufficient distance from circle
  const offset = radius * 1.5;
  const quadrants = [
    { x: -offset, y: -offset }, // top-left
    { x: offset, y: -offset },  // top-right
    { x: offset, y: offset },   // bottom-right
    { x: -offset, y: offset },  // bottom-left
  ];

  // If it's the start or end, default to top-right
  if (controlIndex === 0 || controlIndex === controls.length - 1) {
    return quadrants[1]; // top-right
  }

  const prevControl = controls[controlIndex - 1];
  const nextControl = controls[controlIndex + 1];

  // Calculate angles to adjacent controls
  const angleToPrev = Math.atan2(prevControl.y - control.y, prevControl.x - control.x);
  const angleToNext = Math.atan2(nextControl.y - control.y, nextControl.x - control.x);

  // Score each quadrant based on how far it is from adjacent controls
  let bestQuadrant = 1; // default to top-right
  let bestScore = -Infinity;

  quadrants.forEach((quad, i) => {
    const quadAngle = Math.atan2(quad.y, quad.x);
    
    // Calculate angular distance to the nearest adjacent control
    let minAngularDistance = Math.PI * 2;
    
    const angleDiffToPrev = Math.abs(angleToPrev - quadAngle);
    const normalizedDiffPrev = Math.min(angleDiffToPrev, Math.PI * 2 - angleDiffToPrev);
    minAngularDistance = Math.min(minAngularDistance, normalizedDiffPrev);
    
    const angleDiffToNext = Math.abs(angleToNext - quadAngle);
    const normalizedDiffNext = Math.min(angleDiffToNext, Math.PI * 2 - angleDiffToNext);
    minAngularDistance = Math.min(minAngularDistance, normalizedDiffNext);
    
    // Prefer quadrants that are furthest from both adjacent controls
    if (minAngularDistance > bestScore) {
      bestScore = minAngularDistance;
      bestQuadrant = i;
    }
  });

  return quadrants[bestQuadrant];
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
  mapRotation,
  workflowMode,
  independentLegs,
  pendingStart,
  indVariants,
  indSelectedLegId,
  indDraggedLegId,
  indDraggedEndpoint,
  indDraggedVariantId,
  isIndAltDraggingLabel,
  indEditingVariantId,
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

      {/* ── COURSE WORKFLOW ─────────────────────────────────── */}
      {/* Course Controls */}
      {workflowMode === 'course' && controls.map((c, i) => {
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
            </g>
          );
        }

        if (isFinish) {
          return (
            <g key={c.id} opacity={isDimmed ? 0.3 : isBeingDragged ? 0.6 : 1}>
              <circle cx={c.x} cy={c.y} r={circleRadius * 0.7} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
              <circle cx={c.x} cy={c.y} r={circleRadius * 1.1} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
            </g>
          );
        }

        return (
          <g key={c.id} opacity={isDimmed ? 0.3 : isBeingDragged ? 0.6 : 1}>
            <circle cx={c.x} cy={c.y} r={circleRadius} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
            {(() => {
              const labelPos = calculateLabelPosition(i, c, controls, circleRadius);
              return (
                <text
                  x={c.x + labelPos.x} y={c.y + labelPos.y}
                  fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold"
                  stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke"
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${-mapRotation}, ${c.x + labelPos.x}, ${c.y + labelPos.y})`}
                >{i}</text>
              );
            })()}
          </g>
        );
      })}

      {/* Leg Lines */}
      {workflowMode === 'course' && controls.length >= 2 && controls.map((c, i) => {
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
        );      })}      {/* Route Variants (course) */}
      {workflowMode === 'course' && isVariantMode && variants.map(v => {
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
              <>
                {/* Invisible hit target for easier grabbing */}
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
                  transform={`rotate(${-mapRotation}, ${midPoint.x + labelOffset.x}, ${midPoint.y + labelOffset.y})`}
                >
                  {v.name}: {variantDistance.toFixed(0)}m
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* ── INDEPENDENT LEGS WORKFLOW ───────────────────────── */}
      {workflowMode === 'independent' && (
        <>
          {/* Pending start – ghost circle */}
          {pendingStart && (
            <circle
              cx={pendingStart.x} cy={pendingStart.y}
              r={circleRadius}
              fill="none" stroke="#a855f7"
              strokeWidth={BASE_LINE_WIDTH * drawingScale}
              strokeDasharray={`${8 * drawingScale},${4 * drawingScale}`}
              opacity={0.75}
            />
          )}

          {independentLegs.map(leg => {
            const isSelected = leg.id === indSelectedLegId;
            const isDimmed = isVariantMode && !isSelected;
            const dist = calcPixelDistance(leg.start, leg.end);
            const angle = Math.atan2(leg.end.y - leg.start.y, leg.end.x - leg.start.x);
            const midX = (leg.start.x + leg.end.x) / 2;
            const midY = (leg.start.y + leg.end.y) / 2;
            const labelOffY = circleRadius * 1.6;
            const isStartDragged = indDraggedLegId === leg.id && indDraggedEndpoint === 'start';
            const isEndDragged = indDraggedLegId === leg.id && indDraggedEndpoint === 'end';
            return (
              <g key={leg.id} opacity={isDimmed ? 0.3 : 1}>
                {/* Start circle */}
                <circle
                  cx={leg.start.x} cy={leg.start.y} r={circleRadius}
                  fill="none" stroke="#8b5cf6"
                  strokeWidth={BASE_LINE_WIDTH * drawingScale}
                  opacity={isStartDragged ? 0.5 : 1}
                />
                {/* End circle */}
                <circle
                  cx={leg.end.x} cy={leg.end.y} r={circleRadius}
                  fill="none" stroke="#8b5cf6"
                  strokeWidth={BASE_LINE_WIDTH * drawingScale}
                  opacity={isEndDragged ? 0.5 : 1}
                />
                {/* Connecting line */}
                {dist > circleRadius * 2 && (
                  <line
                    x1={leg.start.x + Math.cos(angle) * circleRadius}
                    y1={leg.start.y + Math.sin(angle) * circleRadius}
                    x2={leg.end.x - Math.cos(angle) * circleRadius}
                    y2={leg.end.y - Math.sin(angle) * circleRadius}
                    stroke="#8b5cf6"
                    strokeWidth={BASE_LINE_WIDTH * drawingScale}
                  />
                )}
                {/* Leg label above midpoint */}
                <text
                  x={midX} y={midY - labelOffY}
                  fill="#8b5cf6"
                  fontSize={BASE_TEXT_SIZE * drawingScale * 0.65}
                  fontWeight="bold"
                  stroke="white"
                  strokeWidth={3.5 * drawingScale}
                  paintOrder="stroke"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${-mapRotation}, ${midX}, ${midY - labelOffY})`}
                >
                  {leg.label}
                </text>
              </g>
            );
          })}

          {/* Independent variants */}
          {isVariantMode && indVariants.map(v => {
            if (v.id === indEditingVariantId) return null;
            if (v.legIndex !== indSelectedLegId) return null;
            const midPoint = v.points[Math.floor(v.points.length / 2)];
            const labelOffset = v.labelOffset || { x: 0, y: 0 };
            const isBeingDragged = isIndAltDraggingLabel && indDraggedVariantId === v.id;
            const variantDistance = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
            return (
              <g key={v.id} opacity={isBeingDragged ? 0.6 : 1}>
                <polyline
                  points={v.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={v.color}
                  strokeWidth={BASE_LINE_WIDTH * drawingScale}
                />
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
                  transform={`rotate(${-mapRotation}, ${midPoint.x + labelOffset.x}, ${midPoint.y + labelOffset.y})`}
                >
                  {v.name}: {variantDistance.toFixed(0)}m
                </text>
              </g>
            );
          })}
        </>
      )}

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
