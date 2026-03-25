import React from 'react';
import { Route } from 'lucide-react';
import FileSection from './FileSection';
import SettingsSection from './SettingsSection';
import ToolSection from './ToolSection';
import LegDrawingPanel from './LegDrawingPanel';
import LegAnalysis from './LegAnalysis';
import IndependentLegDrawingPanel from './IndependentLegDrawingPanel';
import IndependentLegAnalysis from './IndependentLegAnalysis';
import { Control, Leg, Variant, Point, AppMode, IndependentLeg, WorkflowMode } from '../../types';

interface SidebarProps {
  onLoadMap: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveData: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadDataRef: React.RefObject<HTMLInputElement | null>;
  scale: number;
  setScale: (v: string) => void;
  dpi: number;
  setDpi: (v: string) => void;
  drawingScale: number;
  setDrawingScale: (v: number) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  mapImage: string | null;
  onStartCalibrate: () => void;
  onCancelCalibrate: () => void;
  // Course workflow
  controls: Control[];
  legs: Leg[];
  variants: Variant[];
  deleteVariant: (id: number) => void;
  editVariant: (id: number) => void;
  selectVariant: (id: number) => void;
  currentDrawing: Point[];
  selectedLegIndex: number;
  setSelectedLegIndex: (i: number) => void;
  onUndoPoint: () => void;
  onSaveVariant: () => void;
  onUpdateLegNotes: (legIndex: number, notes: string) => void;
  resetCourseData: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onOpenShare: () => void;
  eventName: string;
  setEventName: (name: string) => void;
  // Workflow mode
  workflowMode: WorkflowMode;
  setWorkflowMode: (m: WorkflowMode) => void;
  // Independent legs workflow
  independentLegs: IndependentLeg[];
  pendingStart: Control | null;
  indVariants: Variant[];
  indSelectedLegId: number | null;
  onSelectIndLeg: (id: number) => void;
  onDeleteIndLeg: (id: number) => void;
  indCurrentDrawing: Point[];
  onUndoIndPoint: () => void;
  onSaveIndVariant: () => void;
  deleteIndVariant: (id: number) => void;
  editIndVariant: (id: number) => void;
  selectIndVariant: (id: number) => void;
  onUpdateIndLegNotes: (id: number, notes: string) => void;
  resetIndependentData: () => void;
  onIndExportShare: () => void;
}

export default function Sidebar({
  onLoadMap, onLoadData, onSaveData, fileInputRef, loadDataRef,
  scale, setScale, dpi, setDpi, drawingScale, setDrawingScale,
  mode, setMode, mapImage,
  onStartCalibrate, onCancelCalibrate,
  controls, legs,
  variants, deleteVariant, editVariant, selectVariant,
  currentDrawing, selectedLegIndex, setSelectedLegIndex, onUndoPoint, onSaveVariant, onUpdateLegNotes, resetCourseData,
  autoRotate, onToggleAutoRotate, onOpenShare, eventName, setEventName,
  workflowMode, setWorkflowMode,
  independentLegs, pendingStart, indVariants, indSelectedLegId,
  onSelectIndLeg, onDeleteIndLeg,
  indCurrentDrawing, onUndoIndPoint, onSaveIndVariant,
  deleteIndVariant, editIndVariant, selectIndVariant,
  onUpdateIndLegNotes, resetIndependentData, onIndExportShare,
}: SidebarProps) {
  const canDrawVariants = workflowMode === 'course'
    ? controls.length >= 2
    : independentLegs.length > 0;

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg z-10 shrink-0">
      <div className="p-4 bg-slate-900 text-white flex items-center gap-2 w-80">
        <Route className="text-pink-500" />
        <h1 className="font-bold text-lg tracking-wide">Routechoice Analysis</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <FileSection
          onLoadMap={onLoadMap}
          onLoadData={onLoadData}
          onSaveData={onSaveData}
          hasControls={controls.length > 0 || independentLegs.length > 0}
          fileInputRef={fileInputRef}
          loadDataRef={loadDataRef}
          eventName={eventName}
          setEventName={setEventName}
        />
        <SettingsSection
          scale={scale} setScale={setScale}
          dpi={dpi} setDpi={setDpi}
          drawingScale={drawingScale} setDrawingScale={setDrawingScale}
          mode={mode}
          onStartCalibrate={onStartCalibrate}
          onCancelCalibrate={onCancelCalibrate}
        />

        {mapImage && (
          <ToolSection
            mode={mode}
            setMode={setMode}
            workflowMode={workflowMode}
            setWorkflowMode={setWorkflowMode}
            canDrawVariants={canDrawVariants}
          />
        )}

        {/* ── COURSE WORKFLOW PANELS ── */}
        {mapImage && workflowMode === 'course' && mode === 'variants' && legs.length > 0 && (
          <LegDrawingPanel
            legs={legs}
            selectedLegIndex={selectedLegIndex}
            setSelectedLegIndex={setSelectedLegIndex}
            currentDrawing={currentDrawing}
            onUndo={onUndoPoint}
            onSave={onSaveVariant}
            dpi={dpi}
            scale={scale}
            autoRotate={autoRotate}
            onToggleAutoRotate={onToggleAutoRotate}
          />
        )}

        {workflowMode === 'course' && legs.length > 0 && (
          <LegAnalysis
            legs={legs}
            variants={variants}
            selectedLegIndex={selectedLegIndex}
            setSelectedLegIndex={setSelectedLegIndex}
            setMode={setMode}
            deleteVariant={deleteVariant}
            editVariant={editVariant}
            dpi={dpi}
            scale={scale}
            onUpdateLegNotes={onUpdateLegNotes}
            onSelectVariant={selectVariant}
            onOpenShare={onOpenShare}
          />
        )}

        {workflowMode === 'course' && (
          <button
            onClick={resetCourseData}
            className="w-full bg-red-400 text-white py-2 px-4 rounded hover:bg-red-600 cursor-pointer"
          >
            Reset Course Data
          </button>
        )}

        {/* ── INDEPENDENT LEGS WORKFLOW PANELS ── */}
        {mapImage && workflowMode === 'independent' && (
          <IndependentLegDrawingPanel
            independentLegs={independentLegs}
            pendingStart={pendingStart}
            selectedLegId={indSelectedLegId}
            onSelectLeg={onSelectIndLeg}
            onDeleteLeg={onDeleteIndLeg}
            currentDrawing={indCurrentDrawing}
            onUndo={onUndoIndPoint}
            onSave={onSaveIndVariant}
            dpi={dpi}
            scale={scale}
            autoRotate={autoRotate}
            onToggleAutoRotate={onToggleAutoRotate}
            isVariantsMode={mode === 'variants'}
          />
        )}

        {workflowMode === 'independent' && independentLegs.length > 0 && (
          <IndependentLegAnalysis
            independentLegs={independentLegs}
            variants={indVariants}
            selectedLegId={indSelectedLegId}
            onSelectLeg={onSelectIndLeg}
            setMode={setMode}
            deleteVariant={deleteIndVariant}
            editVariant={editIndVariant}
            dpi={dpi}
            scale={scale}
            onUpdateLegNotes={onUpdateIndLegNotes}
            onSelectVariant={selectIndVariant}
            onExportShare={onIndExportShare}
          />
        )}

        {workflowMode === 'independent' && (
          <button
            onClick={resetIndependentData}
            className="w-full bg-red-400 text-white py-2 px-4 rounded hover:bg-red-600 cursor-pointer"
          >
            Reset Independent Legs
          </button>
        )}
      </div>
    </div>
  );
}

