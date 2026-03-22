import React, { useState, useRef, useMemo } from 'react';
import { useViewport } from './hooks/useViewport';
import { useControls } from './hooks/useControls';
import { useVariants } from './hooks/useVariants';
import { calcPixelDistance, calculateDpiFromPoints, pixelsToMeters } from './utils/geometry';
import Sidebar from './components/Sidebar/index';
import MapWorkspace from './components/MapWorkspace';
import CalibrationModal from './components/CalibrationModal';

export default function App() {
  const [mapImage, setMapImage] = useState(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  const [scale, setScale] = useState(4000);
  const [dpi, setDpi] = useState(150);
  const [drawingScale, setDrawingScale] = useState(1.0);

  const [mode, setMode] = useState('controls');

  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [tempCalibrationValue, setTempCalibrationValue] = useState('500');

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadDataRef = useRef(null);

  const { zoom, setZoom, pan, setPan, workspaceRef, viewportState } = useViewport(mapDimensions);
  const {
    controls, setControls,
    isAltDragging, draggedControlId, altKeyPressed,
    addControl, tryStartAltDrag, moveAltDraggedControl, endAltDrag,
  } = useControls();
  const {
    variants, setVariants,
    currentDrawing, setCurrentDrawing,
    selectedLegIndex, setSelectedLegIndex,
    addDrawingPoint, undoLastPoint, handleFinishVariant, deleteVariant,
  } = useVariants();

  // --- Map Loading ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setMapDimensions({ width: img.width, height: img.height });
        setMapImage(event.target.result);
        const availableWidth = window.innerWidth - 320;
        const availableHeight = window.innerHeight;
        const fitZoom = Math.min(availableWidth / img.width, availableHeight / img.height) * 0.90;
        const z = fitZoom > 0 ? fitZoom : 1;
        setZoom(z);
        setPan({ x: (availableWidth - img.width * z) / 2, y: (availableHeight - img.height * z) / 2 });
      };
      img.src = event.target.result;
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

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.scale) setScale(data.scale);
        if (data.dpi) setDpi(data.dpi);
        if (data.drawingScale) setDrawingScale(data.drawingScale);
        if (data.controls) setControls(data.controls);
        if (data.variants) setVariants(data.variants);
      } catch (_) {}
    };
    reader.readAsText(file);
  };

  // --- Legs (derived) ---
  const legs = useMemo(() => {
    return controls.slice(0, -1).map((p1, i) => {
      const p2 = controls[i + 1];
      const getLabel = (idx) => {
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
  const handleMapClick = (e) => {
    if (!svgRef.current || !mapImage || showCalibrationModal || e.altKey) return;
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
  };

  // --- Mouse Handlers ---
  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    if (e.button !== 0) return;
    const rect = svgRef.current?.getBoundingClientRect();
    const mapX = rect ? (e.clientX - rect.left) / zoom : 0;
    const mapY = rect ? (e.clientY - rect.top) / zoom : 0;
    if (e.altKey && tryStartAltDrag(mapX, mapY, zoom)) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewportState.current.pan.x, y: e.clientY - viewportState.current.pan.y });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isAltDragging && draggedControlId !== null) {
      const rect = svgRef.current.getBoundingClientRect();
      moveAltDraggedControl((e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom);
      return;
    }
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (e) => {
    if (isAltDragging) { endAltDrag(); return; }
    if (!isDragging) return;
    setIsDragging(false);
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
    if (dist < 5) handleMapClick(e);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (mode === 'variants' && currentDrawing.length >= 1) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const last = currentDrawing[currentDrawing.length - 1];
      const dist = calcPixelDistance(last, { x, y });
      const finalPoints = dist > 10 ? [...currentDrawing, { x, y }] : currentDrawing;
      if (finalPoints.length >= 2) handleFinishVariant(finalPoints);
      else setCurrentDrawing([]);
    }
  };

  const getCursor = () => {
    if (isAltDragging) return 'grabbing';
    if (altKeyPressed) return 'crosshair';
    if (isDragging) return 'grabbing';
    if (mode === 'calibrate') return 'crosshair';
    return 'grab';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">
      <Sidebar
        onLoadMap={handleImageUpload}
        onLoadData={importData}
        onSaveData={exportData}
        fileInputRef={fileInputRef}
        loadDataRef={loadDataRef}
        scale={scale} setScale={setScale}
        dpi={dpi} setDpi={setDpi}
        drawingScale={drawingScale} setDrawingScale={setDrawingScale}
        mode={mode} setMode={setMode}
        mapImage={mapImage}
        onStartCalibrate={() => { setMode('calibrate'); setCalibrationPoints([]); }}
        controls={controls}
        legs={legs}
        variants={variants}
        deleteVariant={deleteVariant}
        currentDrawing={currentDrawing}
        selectedLegIndex={selectedLegIndex}
        setSelectedLegIndex={setSelectedLegIndex}
        onUndoPoint={undoLastPoint}
        onSaveVariant={handleFinishVariant}
      />

      <MapWorkspace
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
        draggedControlId={draggedControlId}
        drawingScale={drawingScale}
      />

      {showCalibrationModal && (
        <CalibrationModal
          value={tempCalibrationValue}
          onChange={setTempCalibrationValue}
          onApply={finalizeCalibration}
          onCancel={() => { setShowCalibrationModal(false); setCalibrationPoints([]); }}
        />
      )}
    </div>
  );
}