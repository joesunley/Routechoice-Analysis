import React, { useState, useRef, useMemo } from 'react';
import { useViewport } from './hooks/useViewport';
import { useControls } from './hooks/useControls';
import { useVariants } from './hooks/useVariants';
import { useVariantLabels } from './hooks/useVariantLabels';
import { calcPixelDistance, calculateDpiFromPoints, pixelsToMeters } from './utils/geometry';
import Sidebar from './components/Sidebar/index';
import MapWorkspace from './components/MapWorkspace';
import CalibrationModal from './components/CalibrationModal';
import { AppMode, MapDimensions, PanState, Point } from './types';

export default function App() {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState<MapDimensions>({ width: 0, height: 0 });

  const [scale, setScale] = useState<number>(4000);
  const [dpi, setDpi] = useState<number>(150);
  const [drawingScale, setDrawingScale] = useState<number>(1.0);

  const [mode, setMode] = useState<AppMode>('controls');

  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [tempCalibrationValue, setTempCalibrationValue] = useState('500');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<PanState>({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState<PanState>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadDataRef = useRef<HTMLInputElement>(null);
  const { zoom, setZoom, pan, setPan, workspaceRef, viewportState, resetZoom, zoomToCenter } = useViewport(mapDimensions);  const {
    controls, setControls,
    isAltDragging, draggedControlId,
    addControl, tryStartAltDrag, moveAltDraggedControl, endAltDrag,
  } = useControls();
  const {
    variants, setVariants,
    currentDrawing, setCurrentDrawing,
    selectedLegIndex, setSelectedLegIndex,
    addDrawingPoint, undoLastPoint, handleFinishVariant, deleteVariant, editVariant,
  } = useVariants();
  const {
    isAltDraggingLabel, draggedVariantId,
    tryStartAltDragLabel, moveAltDraggedLabel, endAltDragLabel,
  } = useVariantLabels();

  // --- Numeric input helpers ---
  const handleSetScale = (v: string) => setScale(Number(v) || scale);
  const handleSetDpi = (v: string) => setDpi(Number(v) || dpi);

  // --- Map Loading ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setMapDimensions({ width: img.width, height: img.height });
        setMapImage(event.target?.result as string);
        const availableWidth = window.innerWidth - 320;
        const availableHeight = window.innerHeight;
        const fitZoom = Math.min(availableWidth / img.width, availableHeight / img.height) * 0.90;
        const z = fitZoom > 0 ? fitZoom : 1;
        setZoom(z);
        setPan({ x: (availableWidth - img.width * z) / 2, y: (availableHeight - img.height * z) / 2 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- Calibration ---
  const finalizeCalibration = () => {
    const pxDist = calcPixelDistance(calibrationPoints[0], calibrationPoints[1]);
    const meters = parseFloat(tempCalibrationValue);
    if (!isNaN(meters) && meters > 0) {
      setDpi(Math.round(calculateDpiFromPoints(pxDist, meters, scale)));
      setMode('controls');
    }
    setCalibrationPoints([]);
    setShowCalibrationModal(false);
  };

  // --- Save / Load ---
  const exportData = () => {
    const data = { scale, dpi, drawingScale, controls, variants };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'course_planning_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.scale) setScale(data.scale);
        if (data.dpi) setDpi(data.dpi);
        if (data.drawingScale) setDrawingScale(data.drawingScale);
        if (data.controls) setControls(data.controls);
        if (data.variants) setVariants(data.variants);
      } catch (_) {}
    };
    reader.readAsText(file);
  };

  // --- Reset Functionality ---
  const confirmResetCourseData = () => {
    setShowResetConfirmation(true);
  };

  const handleResetConfirm = () => {
    setControls([]);
    setVariants([]);
    setCurrentDrawing([]);
    setCalibrationPoints([]);
    setMode('controls');
    setShowResetConfirmation(false);
  };

  const handleResetCancel = () => {
    setShowResetConfirmation(false);
  };

  // --- Legs (derived) ---
  const legs = useMemo(() => {
    return controls.slice(0, -1).map((p1, i) => {
      const p2 = controls[i + 1];
      const getLabel = (idx: number) => {
        if (idx === 0) return 'S';
        if (idx === controls.length - 1) return 'F';
        return idx.toString();
      };
      return {
        index: i,
        start: p1,
        end: p2,
        label: `Leg ${getLabel(i)}-${getLabel(i + 1)}`,
        straightLength: pixelsToMeters(calcPixelDistance(p1, p2), dpi, scale),
      };
    });
  }, [controls, dpi, scale]);

  // --- Map Click ---
  const handleShiftClick = (e: React.MouseEvent): boolean => {
    if (e.shiftKey) {
      if (mode === 'controls' && controls.length > 0) {
        setControls(prev => prev.slice(0, -1));
        return true;
      } else if (mode === 'variants' && currentDrawing.length > 0) {
        setCurrentDrawing(prev => prev.slice(0, -1));
        return true;
      }
    }
    return false;
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!svgRef.current || !mapImage || showCalibrationModal || e.altKey) return;
    if (handleShiftClick(e)) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    if (x < 0 || x > mapDimensions.width || y < 0 || y > mapDimensions.height) return;

    if (mode === 'controls') {
      addControl(x, y);
    } else if (mode === 'variants') {
      if (controls.length < 2) return;
      addDrawingPoint(x, y);
    } else if (mode === 'calibrate') {
      const newPoints = [...calibrationPoints, { x, y }];
      setCalibrationPoints(newPoints);
      if (newPoints.length === 2) setShowCalibrationModal(true);
    }
  };  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    const rect = svgRef.current?.getBoundingClientRect();
    const mapX = rect ? (e.clientX - rect.left) / zoom : 0;
    const mapY = rect ? (e.clientY - rect.top) / zoom : 0;
    if (e.altKey) {
      // Try dragging variant label first if in variants mode
      if (mode === 'variants' && tryStartAltDragLabel(mapX, mapY, zoom, variants, selectedLegIndex)) return;
      // Otherwise try dragging control
      if (tryStartAltDrag(mapX, mapY, zoom)) return;
    }
    setDragStart({ x: e.clientX - viewportState.current.pan.x, y: e.clientY - viewportState.current.pan.y });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };
    const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'controls' && mode !== 'variants') return;
    if (isAltDraggingLabel && draggedVariantId !== null) {
      const rect = svgRef.current!.getBoundingClientRect();
      const updatedVariants = moveAltDraggedLabel((e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom, variants);
      setVariants(updatedVariants);
      return;
    }
    if (isAltDragging && draggedControlId !== null) {
      const rect = svgRef.current!.getBoundingClientRect();
      moveAltDraggedControl((e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom);
      return;
    }
    // Check if mouse has moved and we should start dragging
    const hasMoved = isMouseDownRef.current && (mouseDownPos.x !== e.clientX || mouseDownPos.y !== e.clientY);
    if (hasMoved || isDragging) {
      setIsDragging(true);
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
    const handleMouseUp = (e: React.MouseEvent) => {
    isMouseDownRef.current = false;
    if (isAltDraggingLabel || isAltDragging) { 
      if (isAltDraggingLabel) endAltDragLabel();
      else endAltDrag();
      setIsDragging(false);
      return; 
    }
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    if (dist < 5) {
      handleMapClick(e);
    }
    setIsDragging(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'variants' && currentDrawing.length >= 1) {
      const rect = svgRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const last = currentDrawing[currentDrawing.length - 1];
      const dist = calcPixelDistance(last, { x, y });
      const finalPoints = dist > 10 ? [...currentDrawing, { x, y }] : currentDrawing;
      if (finalPoints.length >= 2) handleFinishVariant(finalPoints);
      else setCurrentDrawing([]);
    }
  };  const getCursor = (): string => {
    if (isAltDraggingLabel) return 'grabbing';
    if (isAltDragging) return 'grabbing';
    if (isDragging) return 'grabbing';
    return 'crosshair';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">      <Sidebar
        onLoadMap={handleImageUpload}
        onLoadData={importData}
        onSaveData={exportData}
        fileInputRef={fileInputRef}
        loadDataRef={loadDataRef}
        scale={scale} setScale={handleSetScale}        dpi={dpi} setDpi={handleSetDpi}
        drawingScale={drawingScale} setDrawingScale={setDrawingScale}
        mode={mode} setMode={setMode}
        mapImage={mapImage}
        onStartCalibrate={() => { setMode('calibrate'); setCalibrationPoints([]); }}
        onCancelCalibrate={() => { setMode('controls'); setCalibrationPoints([]); setShowCalibrationModal(false); }}
        controls={controls}
        legs={legs}
        variants={variants}
        deleteVariant={deleteVariant}
        editVariant={editVariant}
        currentDrawing={currentDrawing}
        selectedLegIndex={selectedLegIndex}
        setSelectedLegIndex={setSelectedLegIndex}
        onUndoPoint={undoLastPoint}
        onSaveVariant={handleFinishVariant}
        resetCourseData={confirmResetCourseData}
      />      <MapWorkspace
        workspaceRef={workspaceRef}
        mapImage={mapImage}
        mapDimensions={mapDimensions}
        pan={pan}
        zoom={zoom}
        cursor={getCursor()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        svgRef={svgRef}
        controls={controls}
        variants={variants}
        currentDrawing={currentDrawing}
        selectedLegIndex={selectedLegIndex}
        calibrationPoints={calibrationPoints}
        draggedControlId={draggedControlId}        drawingScale={drawingScale}
        mode={mode}
        draggedVariantId={draggedVariantId}
        isAltDraggingLabel={isAltDraggingLabel}
        resetZoom={resetZoom}
        zoomToCenter={zoomToCenter}
      />
      {showCalibrationModal && (
        <CalibrationModal
          value={tempCalibrationValue}
          onChange={setTempCalibrationValue}
          onApply={finalizeCalibration}
          onCancel={() => { setShowCalibrationModal(false); setCalibrationPoints([]); setMode('controls'); }}
        />
      )}

      {showResetConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h2 className="text-lg font-bold mb-4">Confirm Reset</h2>
            <p className="mb-4">Are you sure you want to reset all course data? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleResetConfirm}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={handleResetCancel}
                className="bg-gray-300 py-2 px-4 rounded hover:bg-gray-400 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
