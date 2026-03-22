import React from 'react';
import { Route } from 'lucide-react';
import FileSection from './FileSection';
import SettingsSection from './SettingsSection';
import ToolSection from './ToolSection';
import LegDrawingPanel from './LegDrawingPanel';
import LegAnalysis from './LegAnalysis';

export default function Sidebar({
  // file
  onLoadMap, onLoadData, onSaveData, fileInputRef, loadDataRef,
  // settings
  scale, setScale, dpi, setDpi, drawingScale, setDrawingScale,
  // mode
  mode, setMode, mapImage,
  // calibrate
  onStartCalibrate,
  // controls / legs
  controls, legs,
  // variants
  variants, deleteVariant,
  // drawing
  currentDrawing, selectedLegIndex, setSelectedLegIndex, onUndoPoint, onSaveVariant,
}) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg z-10 flex-shrink-0">
      <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
        <Route className="text-pink-500" />
        <h1 className="font-bold text-lg tracking-wide">2DRerun Clone</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <FileSection
          onLoadMap={onLoadMap}
          onLoadData={onLoadData}
          onSaveData={onSaveData}
          hasControls={controls.length > 0}
          fileInputRef={fileInputRef}
          loadDataRef={loadDataRef}
        />

        <SettingsSection
          scale={scale} setScale={setScale}
          dpi={dpi} setDpi={setDpi}
          drawingScale={drawingScale} setDrawingScale={setDrawingScale}
          mode={mode}
          onStartCalibrate={onStartCalibrate}
        />

        {mapImage && (
          <ToolSection
            mode={mode}
            setMode={setMode}
            controlsCount={controls.length}
          />
        )}

        {mapImage && mode === 'variants' && legs.length > 0 && (
          <LegDrawingPanel
            legs={legs}
            selectedLegIndex={selectedLegIndex}
            setSelectedLegIndex={setSelectedLegIndex}
            currentDrawing={currentDrawing}
            onUndo={onUndoPoint}
            onSave={onSaveVariant}
            dpi={dpi}
            scale={scale}
          />
        )}

        {legs.length > 0 && (
          <LegAnalysis
            legs={legs}
            variants={variants}
            selectedLegIndex={selectedLegIndex}
            setSelectedLegIndex={setSelectedLegIndex}
            setMode={setMode}
            deleteVariant={deleteVariant}
            dpi={dpi}
            scale={scale}
          />
        )}
      </div>
    </div>
  );
}
