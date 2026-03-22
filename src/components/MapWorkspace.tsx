import React from 'react';
import { Map } from 'lucide-react';
import MapOverlay from './MapOverlay';
import { Control, Variant, Point, MapDimensions, PanState, AppMode } from '../types';

interface MapWorkspaceProps {
  workspaceRef: React.RefObject<HTMLDivElement | null>;
  mapImage: string | null;
  mapDimensions: MapDimensions;
  pan: PanState;
  zoom: number;
  cursor: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  controls: Control[];
  variants: Variant[];
  currentDrawing: Point[];
  selectedLegIndex: number | null;
  calibrationPoints: Point[];
  draggedControlId: number | null;
  drawingScale: number;
  mode: AppMode;
  draggedVariantId: number | null;
  isAltDraggingLabel: boolean;
}

export default function MapWorkspace({
  workspaceRef,
  mapImage,
  mapDimensions,
  pan,
  zoom,
  cursor,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onContextMenu,
  svgRef,
  controls,
  variants,
  currentDrawing,
  selectedLegIndex,
  calibrationPoints,
  draggedControlId,
  drawingScale,
  mode,
  draggedVariantId,
  isAltDraggingLabel,
}: MapWorkspaceProps) {return (
    <div
      ref={workspaceRef}
      className="flex-1 bg-slate-800 overflow-hidden relative transition-colors"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
    >
      {mode === 'calibrate' && mapImage && (
        <div className="absolute top-0 left-0 right-0 bg-orange-100 border-b-2 border-orange-300 p-4 z-50 no-drag pointer-events-none">
          <div className="text-sm font-semibold text-orange-900 flex items-center gap-2">
            <span>📏</span>
            <span>Click two points on the map to calculate DPI. You'll then enter the distance between them in meters.</span>
          </div>
        </div>
      )}
      {!mapImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">          <Map size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-slate-400">No Map Loaded</h2>
          <p className="max-w-xs mt-2 text-sm">
            Upload an orienteering map image to start planning your course and analyzing routechoices.
          </p>
        </div>
      )}

      {mapImage && (
        <div
          className="absolute top-0 left-0 bg-white origin-top-left shadow-2xl"
          style={{
            width: mapDimensions.width,
            height: mapDimensions.height,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <img src={mapImage} alt="Map" className="absolute inset-0 pointer-events-none select-none" />          <MapOverlay
            svgRef={svgRef}
            zoom={zoom}
            controls={controls}
            variants={variants}
            currentDrawing={currentDrawing}
            selectedLegIndex={selectedLegIndex}
            calibrationPoints={calibrationPoints}
            draggedControlId={draggedControlId}
            drawingScale={drawingScale}
            isVariantMode={mode === 'variants'}
            draggedVariantId={draggedVariantId}
            isAltDraggingLabel={isAltDraggingLabel}
          />
        </div>
      )}
    </div>
  );
}
