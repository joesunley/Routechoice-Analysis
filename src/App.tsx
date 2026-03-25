import React, { useState, useRef, useMemo } from 'react';
import { useViewport } from './hooks/useViewport';
import { useControls } from './hooks/useControls';
import { useVariants } from './hooks/useVariants';
import { useVariantLabels } from './hooks/useVariantLabels';
import { useIndependentLegs } from './hooks/useIndependentLegs';
import { calcPixelDistance, calculateDpiFromPoints, pixelsToMeters } from './utils/geometry';
import Sidebar from './components/Sidebar/index';
import MapWorkspace from './components/MapWorkspace';
import CalibrationModal from './components/CalibrationModal';
import BaseModal from './components/BaseModal';
import ShareView from './components/ShareView';
import { exportIndependentLegsHtml } from './utils/shareExport';
import { AppMode, MapDimensions, PanState, Point, WorkflowMode } from './types';

export default function App() {
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState<MapDimensions>({ width: 0, height: 0 });  const [scale, setScale] = useState<number>(4000);
  const [dpi, setDpi] = useState<number>(150);
  const [drawingScale, setDrawingScale] = useState<number>(1.0);

  const [mode, setMode] = useState<AppMode>('controls');
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('course');
  const [legNotes, setLegNotes] = useState<{ [key: number]: string | undefined }>({});
  const [eventName, setEventName] = useState<string>('');

  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [tempCalibrationValue, setTempCalibrationValue] = useState('500');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<PanState>({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState<PanState>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [showIndResetConfirmation, setShowIndResetConfirmation] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showShareView, setShowShareView] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadDataRef = useRef<HTMLInputElement>(null);
  const { zoom, setZoom, pan, setPan, workspaceRef, viewportState, resetZoom, zoomToCenter } = useViewport(mapDimensions);  const {
    controls, setControls,
    isAltDragging, draggedControlId,
    addControl, tryStartAltDrag, moveAltDraggedControl, endAltDrag,
  } = useControls();  const {
    variants, setVariants,
    currentDrawing, setCurrentDrawing,
    selectedLegIndex, setSelectedLegIndex,
    addDrawingPoint, undoLastPoint, handleFinishVariant, deleteVariant, editVariant,
    editingVariantId,
    isAltDraggingPoint, draggedPointIndex,
    tryStartAltDragPoint, moveAltDraggedPoint, endAltDragPoint,
  } = useVariants();
  const {
    isAltDraggingLabel, draggedVariantId,
    tryStartAltDragLabel, moveAltDraggedLabel, endAltDragLabel,
  } = useVariantLabels();

  // ── Independent legs state ──
  const indLegs = useIndependentLegs();
  const {
    variants: indVariants, setVariants: setIndVariants,
    currentDrawing: indCurrentDrawing, setCurrentDrawing: setIndCurrentDrawing,
    selectedLegIndex: indSelectedLegIndex, setSelectedLegIndex: setIndSelectedLegIndex,
    addDrawingPoint: indAddDrawingPoint, undoLastPoint: indUndoLastPoint,
    handleFinishVariant: indHandleFinishVariant,
    deleteVariant: indDeleteVariant, editVariant: indEditVariant,
    editingVariantId: indEditingVariantId,
    isAltDraggingPoint: isIndAltDraggingPoint, draggedPointIndex: indDraggedPointIndex,
    tryStartAltDragPoint: indTryStartAltDragPoint,
    moveAltDraggedPoint: indMoveAltDraggedPoint,
    endAltDragPoint: indEndAltDragPoint,
  } = useVariants();
  const {
    isAltDraggingLabel: isIndAltDraggingLabel, draggedVariantId: indDraggedVariantId,
    tryStartAltDragLabel: indTryStartAltDragLabel,
    moveAltDraggedLabel: indMoveAltDraggedLabel,
    endAltDragLabel: indEndAltDragLabel,
  } = useVariantLabels();

  const mapRotation = useMemo(() => {
    if (!autoRotate) return 0;
    if (workflowMode === 'course') {
      if (mode !== 'variants' || selectedLegIndex < 0 || selectedLegIndex >= controls.length - 1) return 0;
      const c1 = controls[selectedLegIndex];
      const c2 = controls[selectedLegIndex + 1];
      const dx = c2.x - c1.x;
      const dy = c2.y - c1.y;
      return -(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    } else {
      if (mode !== 'variants') return 0;
      const leg = indLegs.independentLegs.find(l => l.id === indSelectedLegIndex);
      if (!leg) return 0;
      const dx = leg.end.x - leg.start.x;
      const dy = leg.end.y - leg.start.y;
      return -(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    }
  }, [autoRotate, mode, workflowMode, selectedLegIndex, controls, indLegs.independentLegs, indSelectedLegIndex]);

  // --- Numeric input helpers ---
  const handleSetScale = (v: string) => setScale(Number(v) || scale);
  const handleSetDpi = (v: string) => setDpi(Number(v) || dpi);

  const zoomToLeg = (legIdx: number) => {
    const workspace = workspaceRef.current;
    if (!workspace || legIdx < 0 || legIdx >= controls.length - 1) return;
    const rect = workspace.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const c1 = controls[legIdx];
    const c2 = controls[legIdx + 1];
    // Compute the rotation that will be applied for this leg
    const rotDeg = -(Math.atan2(c2.y - c1.y, c2.x - c1.x) * (180 / Math.PI) + 90);
    const theta = rotDeg * Math.PI / 180;

    // Gather controls + all variant points for this leg
    const legVariants = variants.filter(v => v.legIndex === legIdx);
    const allPoints = [c1, c2, ...legVariants.flatMap(v => v.points)];

    // Centroid of all points (this will be centered on screen)
    const midX = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
    const midY = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;

    // Maximum extents in rotated screen space (for fitting zoom)
    const padding = 140;
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

    const fitZoomX = maxRx > 0 ? (cx - padding) / maxRx : 50;
    const fitZoomY = maxRy > 0 ? (cy - padding) / maxRy : 50;
    const newZoom = Math.max(0.01, Math.min(Math.min(fitZoomX, fitZoomY), 50));

    setZoom(newZoom);
    setPan({
      x: cx - midX * newZoom,
      y: cy - midY * newZoom,
    });
  };

  const zoomToIndependentLeg = (legId: number) => {
    const leg = indLegs.independentLegs.find(l => l.id === legId);
    if (!leg) return;
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const rect = workspace.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotDeg = -(Math.atan2(leg.end.y - leg.start.y, leg.end.x - leg.start.x) * (180 / Math.PI) + 90);
    const theta = rotDeg * Math.PI / 180;
    const legVariants = indVariants.filter(v => v.legIndex === legId);
    const allPoints = [leg.start, leg.end, ...legVariants.flatMap(v => v.points)];
    const midX = allPoints.reduce((s, p) => s + p.x, 0) / allPoints.length;
    const midY = allPoints.reduce((s, p) => s + p.y, 0) / allPoints.length;
    const padding = 140;
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
    const fitZoomX = maxRx > 0 ? (cx - padding) / maxRx : 50;
    const fitZoomY = maxRy > 0 ? (cy - padding) / maxRy : 50;
    const newZoom = Math.max(0.01, Math.min(Math.min(fitZoomX, fitZoomY), 50));
    setZoom(newZoom);
    setPan({ x: cx - midX * newZoom, y: cy - midY * newZoom });
  };

  const handleSetIndSelectedLeg = (legId: number) => {
    indLegs.setSelectedLegId(legId);
    setIndSelectedLegIndex(legId);
    if (autoRotate) zoomToIndependentLeg(legId);
  };

  const handleDeleteIndLeg = (id: number) => {
    indLegs.deleteLeg(id);
    setIndVariants(prev => prev.filter(v => v.legIndex !== id));
    if (indLegs.selectedLegId === id) {
      setIndSelectedLegIndex(0);
    }
  };

  const handleEditIndVariant = (id: number) => {
    const variant = indVariants.find(v => v.id === id);
    if (variant) {
      indLegs.setSelectedLegId(variant.legIndex);
    }
    indEditVariant(id);
    setMode('variants');
  };

  const handleSelectIndVariant = (variantId: number) => {
    setIndVariants(prev => {
      const variant = prev.find(v => v.id === variantId);
      if (!variant) return prev;
      const isCurrentlyChosen = variant.chosen === true;
      return prev.map(v =>
        v.legIndex === variant.legIndex
          ? { ...v, chosen: isCurrentlyChosen ? false : v.id === variantId }
          : v
      );
    });
  };

  const handleUpdateIndLegNotes = (id: number, notes: string) => {
    indLegs.updateLegNotes(id, notes);
  };

  const handleIndExportShare = () => {
    if (!mapImage) return;
    exportIndependentLegsHtml({
      mapImage,
      mapDimensions,
      independentLegs: indLegs.independentLegs,
      variants: indVariants,
      dpi,
      scale,
      drawingScale,
      eventName,
    });
  };

  const handleSetWorkflowMode = (m: WorkflowMode) => {
    setWorkflowMode(m);
    setMode('controls');
  };

  const handleToggleAutoRotate = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    if (next) {
      if (workflowMode === 'course') zoomToLeg(selectedLegIndex);
      else if (indLegs.selectedLegId !== null) zoomToIndependentLeg(indLegs.selectedLegId);
    }
  };

  const handleSetSelectedLegIndex = (i: number) => {
    setSelectedLegIndex(i);
    if (autoRotate) zoomToLeg(i);
  };

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
    const data = {
      scale, dpi, drawingScale, controls, variants, legNotes, eventName,
      independentLegs: indLegs.independentLegs,
      independentVariants: indVariants,
    };
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
        if (data.legNotes) setLegNotes(data.legNotes);
        if (data.eventName) setEventName(data.eventName);
        if (data.independentLegs) indLegs.setIndependentLegs(data.independentLegs);
        if (data.independentVariants) setIndVariants(data.independentVariants);
      } catch (_) {}
    };
    reader.readAsText(file);
  };

  // --- Reset Functionality ---
  const confirmResetCourseData = () => {
    setShowResetConfirmation(true);
  };
  const confirmResetIndependentData = () => {
    setShowIndResetConfirmation(true);
  };
  const handleResetConfirm = () => {
    setControls([]);
    setVariants([]);
    setCurrentDrawing([]);
    setCalibrationPoints([]);
    setLegNotes({});
    setEventName('');
    setMode('controls');
    setShowResetConfirmation(false);
  };
  const handleIndResetConfirm = () => {
    indLegs.deleteAllLegs();
    setIndVariants([]);
    setIndCurrentDrawing([]);
    setIndSelectedLegIndex(0);
    setMode('controls');
    setShowIndResetConfirmation(false);
  };
  const handleResetCancel = () => {
    setShowResetConfirmation(false);
    setShowIndResetConfirmation(false);
  };

  // --- Leg Notes Handler ---
  const handleUpdateLegNotes = (legIndex: number, notes: string) => {
    setLegNotes(prev => ({
      ...prev,
      [legIndex]: notes || undefined,
    }));
  };

  // --- Variant Selection Handler ---
  const handleSelectVariant = (variantId: number) => {
    setVariants(prev => {
      const variant = prev.find(v => v.id === variantId);
      if (!variant) return prev;
      
      // If already chosen, uncheck it. Otherwise, mark it and uncheck others in the same leg
      const isCurrentlyChosen = variant.chosen === true;
      return prev.map(v =>
        v.legIndex === variant.legIndex
          ? { ...v, chosen: isCurrentlyChosen ? false : v.id === variantId }
          : v
      );
    });
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
        notes: legNotes[i],
      };
    });
  }, [controls, dpi, scale, legNotes]);

  const screenToImageCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const workspace = workspaceRef.current;
    if (!workspace) return { x: 0, y: 0 };
    const rect = workspace.getBoundingClientRect();
    let wx = clientX - rect.left;
    let wy = clientY - rect.top;
    if (mapRotation !== 0) {
      const theta = mapRotation * Math.PI / 180;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const relX = wx - cx;
      const relY = wy - cy;
      wx = relX * Math.cos(theta) + relY * Math.sin(theta) + cx;
      wy = -relX * Math.sin(theta) + relY * Math.cos(theta) + cy;
    }
    return {
      x: (wx - pan.x) / zoom,
      y: (wy - pan.y) / zoom,
    };
  };

  // --- Map Click ---
  const handleShiftClick = (e: React.MouseEvent): boolean => {
    if (e.shiftKey) {
      if (mode === 'controls') {
        if (workflowMode === 'course' && controls.length > 0) {
          setControls(prev => prev.slice(0, -1));
          return true;
        } else if (workflowMode === 'independent' && indLegs.pendingStart) {
          indLegs.cancelPlacement();
          return true;
        }
      } else if (mode === 'variants') {
        if (workflowMode === 'course' && currentDrawing.length > 0) {
          setCurrentDrawing(prev => prev.slice(0, -1));
          return true;
        } else if (workflowMode === 'independent' && indCurrentDrawing.length > 0) {
          setIndCurrentDrawing(prev => prev.slice(0, -1));
          return true;
        }
      }
    }
    return false;
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!mapImage || showCalibrationModal || e.altKey) return;
    if (handleShiftClick(e)) return;

    const { x, y } = screenToImageCoords(e.clientX, e.clientY);
    if (x < 0 || x > mapDimensions.width || y < 0 || y > mapDimensions.height) return;

    if (workflowMode === 'course') {
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
    } else {
      // independent workflow
      if (mode === 'controls') {
        if (!indLegs.pendingStart) {
          indLegs.handleFirstClick(x, y);
        } else {
          const newId = indLegs.handleSecondClick(x, y);
          if (newId > 0) setIndSelectedLegIndex(newId);
        }
      } else if (mode === 'variants') {
        if (indLegs.independentLegs.length === 0) return;
        indAddDrawingPoint(x, y);
      } else if (mode === 'calibrate') {
        const newPoints = [...calibrationPoints, { x, y }];
        setCalibrationPoints(newPoints);
        if (newPoints.length === 2) setShowCalibrationModal(true);
      }
    }
  };
  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    const { x: mapX, y: mapY } = screenToImageCoords(e.clientX, e.clientY);
    if (e.altKey) {
      if (workflowMode === 'course') {
        if (mode === 'variants' && tryStartAltDragPoint(mapX, mapY, zoom)) return;
        if (mode === 'variants' && tryStartAltDragLabel(mapX, mapY, zoom, variants, selectedLegIndex)) return;
        if (tryStartAltDrag(mapX, mapY, zoom)) return;
      } else {
        if (mode === 'variants' && indTryStartAltDragPoint(mapX, mapY, zoom)) return;
        if (mode === 'variants' && indTryStartAltDragLabel(mapX, mapY, zoom, indVariants, indSelectedLegIndex)) return;
        if (indLegs.tryStartAltDrag(mapX, mapY, zoom)) return;
      }
    }
    setDragStart({ x: e.clientX, y: e.clientY });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };
    const handleMouseMove = (e: React.MouseEvent) => {
    if (mode !== 'controls' && mode !== 'variants') return;
    if (workflowMode === 'course') {
      if (isAltDraggingPoint && draggedPointIndex !== null) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        moveAltDraggedPoint(imgX, imgY, draggedPointIndex);
        return;
      }
      if (isAltDraggingLabel && draggedVariantId !== null) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        const updatedVariants = moveAltDraggedLabel(imgX, imgY, variants);
        setVariants(updatedVariants);
        return;
      }
      if (isAltDragging && draggedControlId !== null) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        moveAltDraggedControl(imgX, imgY);
        return;
      }
    } else {
      if (isIndAltDraggingPoint && indDraggedPointIndex !== null) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        indMoveAltDraggedPoint(imgX, imgY, indDraggedPointIndex);
        return;
      }
      if (isIndAltDraggingLabel && indDraggedVariantId !== null) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        const updated = indMoveAltDraggedLabel(imgX, imgY, indVariants);
        setIndVariants(updated);
        return;
      }
      if (indLegs.isAltDragging) {
        const { x: imgX, y: imgY } = screenToImageCoords(e.clientX, e.clientY);
        indLegs.moveAltDraggedControl(imgX, imgY);
        return;
      }
    }
    // Check if mouse has moved and we should start dragging
    const hasMoved = isMouseDownRef.current && (mouseDownPos.x !== e.clientX || mouseDownPos.y !== e.clientY);
    if (hasMoved || isDragging) {
      setIsDragging(true);
      const currentPan = viewportState.current.pan;
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      if (mapRotation !== 0) {
        const theta = mapRotation * Math.PI / 180;
        setPan({
          x: currentPan.x + deltaX * Math.cos(theta) + deltaY * Math.sin(theta),
          y: currentPan.y - deltaX * Math.sin(theta) + deltaY * Math.cos(theta),
        });
      } else {
        setPan({ x: currentPan.x + deltaX, y: currentPan.y + deltaY });
      }
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
    const handleMouseUp = (e: React.MouseEvent) => {
    isMouseDownRef.current = false;
    const isAnyCourseAltDrag = isAltDraggingPoint || isAltDraggingLabel || isAltDragging;
    const isAnyIndAltDrag = isIndAltDraggingPoint || isIndAltDraggingLabel || indLegs.isAltDragging;
    if (workflowMode === 'course' && isAnyCourseAltDrag) {
      if (isAltDraggingPoint) endAltDragPoint();
      else if (isAltDraggingLabel) endAltDragLabel();
      else endAltDrag();
      setIsDragging(false);
      return;
    }
    if (workflowMode === 'independent' && isAnyIndAltDrag) {
      if (isIndAltDraggingPoint) indEndAltDragPoint();
      else if (isIndAltDraggingLabel) indEndAltDragLabel();
      else indLegs.endAltDrag();
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
    if (mode !== 'variants') return;
    const activeDrawing = workflowMode === 'course' ? currentDrawing : indCurrentDrawing;
    if (activeDrawing.length >= 1) {
      const { x, y } = screenToImageCoords(e.clientX, e.clientY);
      const last = activeDrawing[activeDrawing.length - 1];
      const dist = calcPixelDistance(last, { x, y });
      const finalPoints = dist > 10 ? [...activeDrawing, { x, y }] : activeDrawing;
      if (finalPoints.length >= 2) {
        if (workflowMode === 'course') handleFinishVariant(finalPoints);
        else indHandleFinishVariant(finalPoints);
      } else {
        if (workflowMode === 'course') setCurrentDrawing([]);
        else setIndCurrentDrawing([]);
      }
    }
  };  const getCursor = (): string => {
    if (workflowMode === 'course') {
      if (isAltDraggingPoint || isAltDraggingLabel || isAltDragging) return 'grabbing';
    } else {
      if (isIndAltDraggingPoint || isIndAltDraggingLabel || indLegs.isAltDragging) return 'grabbing';
    }
    if (isDragging) return 'grabbing';
    return 'crosshair';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden select-none">      
    <Sidebar
        onLoadMap={handleImageUpload}
        onLoadData={importData}
        onSaveData={exportData}
        fileInputRef={fileInputRef}
        loadDataRef={loadDataRef}
        scale={scale} setScale={handleSetScale}
        dpi={dpi} setDpi={handleSetDpi}
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
        selectVariant={handleSelectVariant}
        onOpenShare={() => setShowShareView(true)}
        currentDrawing={currentDrawing}
        selectedLegIndex={selectedLegIndex}
        setSelectedLegIndex={handleSetSelectedLegIndex}
        onUndoPoint={undoLastPoint}
        onSaveVariant={handleFinishVariant}
        onUpdateLegNotes={handleUpdateLegNotes}
        resetCourseData={confirmResetCourseData}
        autoRotate={autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        eventName={eventName}
        setEventName={setEventName}
        workflowMode={workflowMode}
        setWorkflowMode={handleSetWorkflowMode}
        independentLegs={indLegs.independentLegs}
        pendingStart={indLegs.pendingStart}
        indVariants={indVariants}
        indSelectedLegId={indLegs.selectedLegId}
        onSelectIndLeg={handleSetIndSelectedLeg}
        onDeleteIndLeg={handleDeleteIndLeg}
        indCurrentDrawing={indCurrentDrawing}
        onUndoIndPoint={indUndoLastPoint}
        onSaveIndVariant={indHandleFinishVariant}
        deleteIndVariant={indDeleteVariant}
        editIndVariant={handleEditIndVariant}
        selectIndVariant={handleSelectIndVariant}
        onUpdateIndLegNotes={handleUpdateIndLegNotes}
        resetIndependentData={confirmResetIndependentData}
        onIndExportShare={handleIndExportShare}
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
        currentDrawing={workflowMode === 'course' ? currentDrawing : indCurrentDrawing}
        selectedLegIndex={selectedLegIndex}
        calibrationPoints={calibrationPoints}
        draggedControlId={draggedControlId}
        drawingScale={drawingScale}
        mode={mode}
        draggedVariantId={draggedVariantId}
        isAltDraggingLabel={isAltDraggingLabel}
        dpi={dpi}
        scale={scale}
        editingVariantId={workflowMode === 'course' ? editingVariantId : indEditingVariantId}
        mapRotation={mapRotation}
        resetZoom={resetZoom}
        zoomToCenter={zoomToCenter}
        workflowMode={workflowMode}
        independentLegs={indLegs.independentLegs}
        pendingStart={indLegs.pendingStart}
        indVariants={indVariants}
        indSelectedLegId={indSelectedLegIndex}
        indDraggedLegId={indLegs.draggedLegId}
        indDraggedEndpoint={indLegs.draggedEndpoint}
        indDraggedVariantId={indDraggedVariantId}
        isIndAltDraggingLabel={isIndAltDraggingLabel}
        indEditingVariantId={indEditingVariantId}
      />
      {showCalibrationModal && (
        <CalibrationModal
          value={tempCalibrationValue}
          onChange={setTempCalibrationValue}
          onApply={finalizeCalibration}
          onCancel={() => { setShowCalibrationModal(false); setCalibrationPoints([]); setMode('controls'); }}
        />
      )}      {showResetConfirmation && (
        <BaseModal
          isOpen={showResetConfirmation}
          title="Confirm Reset"
          onClose={handleResetCancel}
          footer={
            <div className="flex gap-2">
              <button
                onClick={handleResetConfirm}
                className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={handleResetCancel}
                className="flex-1 text-slate-700 hover:bg-slate-100 rounded-lg font-bold py-2 px-4 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          }
          maxWidth="max-w-sm"
        >
          <p className="text-slate-600">Are you sure you want to reset all course data? This action cannot be undone.</p>
        </BaseModal>
      )}
      {showIndResetConfirmation && (
        <BaseModal
          isOpen={showIndResetConfirmation}
          title="Confirm Reset"
          onClose={handleResetCancel}
          footer={
            <div className="flex gap-2">
              <button
                onClick={handleIndResetConfirm}
                className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={handleResetCancel}
                className="flex-1 text-slate-700 hover:bg-slate-100 rounded-lg font-bold py-2 px-4 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          }
          maxWidth="max-w-sm"
        >
          <p className="text-slate-600">Are you sure you want to reset all independent leg data? This action cannot be undone.</p>
        </BaseModal>
      )}
      {showShareView && mapImage && (
        <ShareView
          mapImage={mapImage}
          mapDimensions={mapDimensions}
          controls={controls}
          legs={legs}
          variants={variants}
          dpi={dpi}
          scale={scale}
          drawingScale={drawingScale}
          eventName={eventName}
          onClose={() => setShowShareView(false)}
        />
      )}
    </div>
  );
}
