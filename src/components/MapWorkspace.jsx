import React from 'react';
import { Map } from 'lucide-react';
import MapOverlay from './MapOverlay';

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
  // overlay props
  svgRef,
  controls,
  variants,
  currentDrawing,
  selectedLegIndex,
  calibrationPoints,
  draggedControlId,
  drawingScale,
}) {
  return (
    <div
      ref={workspaceRef}
      className="flex-1 bg-slate-800 overflow-hidden relative transition-colors"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={onContextMenu}
    >
      {!mapImage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
          <Map size={64} className="mb-4 opacity-20" />
          <h2 className="text-xl font-bold text-slate-400">No Map Loaded</h2>
          <p className="max-w-xs mt-2 text-sm">
            Upload an orienteering map image to start planning your course and analyzing route variants.
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
          <img src={mapImage} alt="Map" className="absolute inset-0 pointer-events-none select-none" />
          <MapOverlay
            svgRef={svgRef}
            zoom={zoom}
            controls={controls}
            variants={variants}
            currentDrawing={currentDrawing}
            selectedLegIndex={selectedLegIndex}
            calibrationPoints={calibrationPoints}
            draggedControlId={draggedControlId}
            drawingScale={drawingScale}
          />
        </div>
      )}
    </div>
  );
}
