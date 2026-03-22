import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Settings, MapPin, Route, Save, FolderOpen, 
  Trash2, Undo, CheckCircle, Crosshair, Map, Hand,
  ZoomIn, ZoomOut, Maximize, Ruler, Sliders, ChevronLeft, ChevronRight,
  Info, X, MousePointer2
} from 'lucide-react';

// --- Mathematical Modeling & Helpers ---

const calcPixelDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

const calcTotalPixelDistance = (points) => {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calcPixelDistance(points[i], points[i + 1]);
  }
  return total;
};

const pixelsToMeters = (pixels, dpi, scale) => {
  if (!dpi || !scale || pixels === 0) return 0;
  return ((pixels / dpi) * 2.54 * scale) / 100;
};

const calculateDpiFromPoints = (pixels, meters, scale) => {
  if (!meters || !scale || pixels === 0) return 150;
  return (pixels * 2.54 * scale) / (meters * 100);
};

const VARIANT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
const COMMON_SCALES = [4000, 5000, 7500, 10000, 15000];

export default function App() {
  // --- State Management ---
  const [mapImage, setMapImage] = useState(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  
  const [scale, setScale] = useState(4000);
  const [dpi, setDpi] = useState(150);
  const [drawingScale, setDrawingScale] = useState(1.0); 
  
  const [controls, setControls] = useState([]); 
  const [variants, setVariants] = useState([]); 
  
  const [mode, setMode] = useState('controls'); 
  const [selectedLegIndex, setSelectedLegIndex] = useState(0);
  const [currentDrawing, setCurrentDrawing] = useState([]);
  
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [tempCalibrationValue, setTempCalibrationValue] = useState("500");
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  // Dragging States
  const [isDragging, setIsDragging] = useState(false);
  const [isAltDragging, setIsAltDragging] = useState(false);
  const [draggedControlId, setDraggedControlId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });
  const [altKeyPressed, setAltKeyPressed] = useState(false);

  const svgRef = useRef(null);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);
  const loadDataRef = useRef(null);

  const viewportState = useRef({ zoom, pan });
  useEffect(() => {
    viewportState.current = { zoom, pan };
  }, [zoom, pan]);

  // Keyboard Listeners for Alt Key
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.altKey) setAltKeyPressed(true); };
    const handleKeyUp = (e) => { if (!e.altKey) setAltKeyPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Map Loading & Auto-Fit ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setMapDimensions({ width: img.width, height: img.height });
          setMapImage(event.target.result);
          const availableWidth = window.innerWidth - 320; 
          const availableHeight = window.innerHeight;
          const fitZoom = Math.min(availableWidth / img.width, availableHeight / img.height) * 0.90;
          setZoom(fitZoom > 0 ? fitZoom : 1);
          setPan({ x: (availableWidth - (img.width * fitZoom)) / 2, y: (availableHeight - (img.height * fitZoom)) / 2 });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Zoom & Pan Event Handlers ---
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const onWheel = (e) => {
      e.preventDefault();
      const { zoom, pan } = viewportState.current;
      const zoomSensitivity = 0.0015;
      const delta = -e.deltaY * zoomSensitivity;
      let newZoom = zoom * (1 + delta);
      newZoom = Math.max(0.01, Math.min(newZoom, 50));
      const rect = workspace.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mapX = (mouseX - pan.x) / zoom;
      const mapY = (mouseY - pan.y) / zoom;
      const newPanX = mouseX - mapX * newZoom;
      const newPanY = mouseY - mapY * newZoom;
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    workspace.addEventListener('wheel', onWheel, { passive: false });
    return () => workspace.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    if (e.button !== 0) return;

    const rect = svgRef.current?.getBoundingClientRect();
    const mapX = rect ? (e.clientX - rect.left) / zoom : 0;
    const mapY = rect ? (e.clientY - rect.top) / zoom : 0;

    // Alt + Click logic: find nearest control to drag
    if (e.altKey && controls.length > 0) {
      let nearest = null;
      let minDist = Infinity;
      const threshold = 50 / zoom; // Detection radius

      controls.forEach(c => {
        const d = calcPixelDistance({ x: mapX, y: mapY }, c);
        if (d < minDist && d < threshold) {
          minDist = d;
          nearest = c;
        }
      });

      if (nearest) {
        setIsAltDragging(true);
        setDraggedControlId(nearest.id);
        return; 
      }
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - viewportState.current.pan.x, y: e.clientY - viewportState.current.pan.y });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isAltDragging && draggedControlId !== null) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      
      setControls(prev => prev.map(c => 
        c.id === draggedControlId ? { ...c, x, y } : c
      ));
      return;
    }

    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (e) => {
    if (isAltDragging) {
      setIsAltDragging(false);
      setDraggedControlId(null);
      return;
    }

    if (!isDragging) return;
    setIsDragging(false);
    const distMoved = Math.sqrt(Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2));
    if (distMoved < 5) handleMapClick(e);
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); 
    if (mode === 'variants' && currentDrawing.length >= 1) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      const lastPoint = currentDrawing[currentDrawing.length - 1];
      const dist = calcPixelDistance(lastPoint, { x, y });
      const finalPoints = dist > 10 ? [...currentDrawing, { x, y }] : currentDrawing;
      if (finalPoints.length >= 2) handleFinishVariant(finalPoints);
      else setCurrentDrawing([]);
    }
  };

  const handleMapClick = (e) => {
    if (!svgRef.current || !mapImage || showCalibrationModal) return;
    if (e.altKey) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (x < 0 || x > mapDimensions.width || y < 0 || y > mapDimensions.height) return;
    
    if (mode === 'controls') {
      setControls([...controls, { id: Date.now(), x, y }]);
    } else if (mode === 'variants') {
      if (controls.length < 2) return;
      setCurrentDrawing([...currentDrawing, { x, y }]);
    } else if (mode === 'calibrate') {
      const newPoints = [...calibrationPoints, { x, y }];
      setCalibrationPoints(newPoints);
      if (newPoints.length === 2) setShowCalibrationModal(true);
    }
  };

  const finalizeCalibration = () => {
    const pxDist = calcPixelDistance(calibrationPoints[0], calibrationPoints[1]);
    const meters = parseFloat(tempCalibrationValue);
    if (!isNaN(meters) && meters > 0) {
      const newDpi = calculateDpiFromPoints(pxDist, meters, scale);
      setDpi(Math.round(newDpi));
      setMode('controls');
    }
    setCalibrationPoints([]);
    setShowCalibrationModal(false);
  };

  const resetZoom = () => {
    const fitZoom = Math.min((window.innerWidth - 320) / mapDimensions.width, window.innerHeight / mapDimensions.height) * 0.90;
    setZoom(fitZoom > 0 ? fitZoom : 1);
    setPan({ x: (window.innerWidth - 320 - (mapDimensions.width * fitZoom)) / 2, y: (window.innerHeight - (mapDimensions.height * fitZoom)) / 2 });
  };

  const handleFinishVariant = (pointsOverride = null) => {
    const pointsToSave = pointsOverride || currentDrawing;
    if (pointsToSave.length < 2) {
      setCurrentDrawing([]);
      return;
    }
    const existingLegVariants = variants.filter(v => v.legIndex === selectedLegIndex);
    const color = VARIANT_COLORS[existingLegVariants.length % VARIANT_COLORS.length];
    const name = String.fromCharCode(65 + existingLegVariants.length);
    const newVariant = { id: Date.now(), legIndex: selectedLegIndex, points: pointsToSave, color, name };
    setVariants([...variants, newVariant]);
    setCurrentDrawing([]);
  };

  const deleteVariant = (id) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

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
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.scale) setScale(data.scale);
          if (data.dpi) setDpi(data.dpi);
          if (data.drawingScale) setDrawingScale(data.drawingScale);
          if (data.controls) setControls(data.controls);
          if (data.variants) setVariants(data.variants);
        } catch (error) {}
      };
      reader.readAsText(file);
    }
  };

  const legs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < controls.length - 1; i++) {
      const p1 = controls[i];
      const p2 = controls[i+1];
      const pxDist = calcPixelDistance(p1, p2);
      const getLabel = (idx) => {
        if (idx === 0) return 'S';
        if (idx === controls.length - 1) return 'F';
        return idx.toString();
      };
      arr.push({
        index: i,
        start: p1,
        end: p2,
        label: `Leg ${getLabel(i)}-${getLabel(i+1)}`,
        straightLength: pixelsToMeters(pxDist, dpi, scale)
      });
    }
    return arr;
  }, [controls, dpi, scale]);

  const BASE_CONTROL_RADIUS = 25;
  const BASE_LINE_WIDTH = 2.917; 
  const BASE_TEXT_SIZE = 35;
  const BASE_VARIANT_TEXT_SIZE = 22;

  const handleNumericInput = (val, setter) => {
    const num = val.replace(/[^0-9.]/g, '');
    setter(num);
  };

  const inputEventGuard = (e) => {
    e.stopPropagation();
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
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg z-10 flex-shrink-0">
        <div className="p-4 bg-slate-900 text-white flex items-center gap-2">
          <Route className="text-pink-500" />
          <h1 className="font-bold text-lg tracking-wide">2DRerun Clone</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* File Management */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Files</h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md border border-blue-200 transition-colors text-sm font-medium no-drag"
            >
              <Upload size={16} /> Load Map Image
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
            
            <div className="flex gap-2">
              <button onClick={() => loadDataRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium no-drag">
                <FolderOpen size={14} /> Load Data
              </button>
              <input type="file" accept=".json" ref={loadDataRef} className="hidden" onChange={importData} />
              <button onClick={exportData} disabled={controls.length === 0} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium disabled:opacity-50 no-drag">
                <Save size={14} /> Save Data
              </button>
            </div>
          </section>

          {/* Configuration Settings */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Settings size={14}/> Settings
            </h2>
            
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-tight">Map Scale (1:X)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_SCALES.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setScale(s)}
                      className={`px-2 py-1 text-[10px] font-bold rounded border transition-all no-drag ${scale == s ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                    >
                      {s / 1000}k
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={scale} 
                  onMouseDown={inputEventGuard}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNumericInput(e.target.value, setScale)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono no-drag select-text cursor-text pointer-events-auto" 
                  placeholder="Custom scale..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tight">Digital Precision (DPI)</label>
                <input 
                  type="text" 
                  value={dpi} 
                  onMouseDown={inputEventGuard}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleNumericInput(e.target.value, setDpi)} 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono no-drag select-text cursor-text pointer-events-auto" 
                />
              </div>

              <div className="relative pt-2">
                <button 
                  onClick={() => { setMode('calibrate'); setCalibrationPoints([]); }}
                  className={`w-full flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg text-xs font-bold border transition-all no-drag ${mode === 'calibrate' ? 'bg-orange-500 border-orange-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-orange-200'}`}
                >
                  <div className="flex items-center gap-2"><Ruler size={16} /><span>{mode === 'calibrate' ? 'Calibrating...' : 'Calculate DPI'}</span></div>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1 uppercase">
                  <span>Course Scale</span>
                  <span className="font-mono bg-blue-100 text-blue-700 px-1.5 rounded">{drawingScale.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.2" max="5" step="0.1" value={drawingScale} 
                  onChange={(e) => setDrawingScale(parseFloat(e.target.value))}
                  onMouseDown={inputEventGuard}
                  className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600 no-drag pointer-events-auto"
                />
              </div>
            </div>
          </section>

          {/* Tools Toggle */}
          {mapImage && (
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tool Selection</h2>
                <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">ALT + DRAG TO MOVE</span>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setMode('controls')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 no-drag ${mode === 'controls' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <MapPin size={14}/> Course
                </button>
                <button 
                  onClick={() => setMode('variants')}
                  disabled={controls.length < 2}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 disabled:opacity-50 no-drag ${mode === 'variants' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Route size={14}/> Variants
                </button>
              </div>
            </section>
          )}

          {/* Leg Drawing Context */}
          {mapImage && mode === 'variants' && legs.length > 0 && (
             <section className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
               <div>
                  <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Select Leg</h2>
                  <div className="flex items-center gap-2 bg-white rounded-md border border-blue-200 p-1">
                    <button onClick={() => setSelectedLegIndex(Math.max(0, selectedLegIndex - 1))} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag" disabled={selectedLegIndex === 0}><ChevronLeft size={16} /></button>
                    <div className="flex-1 text-center font-bold text-sm">{legs[selectedLegIndex]?.label || `Leg ${selectedLegIndex + 1}`}</div>
                    <button onClick={() => setSelectedLegIndex(Math.min(legs.length - 1, selectedLegIndex + 1))} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag" disabled={selectedLegIndex === legs.length - 1}><ChevronRight size={16} /></button>
                  </div>
               </div>
               <div className="flex justify-between items-center text-sm pt-2 border-t border-blue-100">
                 <span className="text-slate-600">Drawing Route:</span>
                 <span className="font-mono font-bold text-blue-700">{pixelsToMeters(calcTotalPixelDistance(currentDrawing), dpi, scale).toFixed(1)}m</span>
               </div>
               <div className="flex gap-2 mt-1">
                 <button onClick={() => setCurrentDrawing(currentDrawing.slice(0, -1))} disabled={currentDrawing.length === 0} className="flex-1 bg-white border border-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium hover:bg-slate-50 disabled:opacity-50 no-drag">Undo</button>
                 <button onClick={() => handleFinishVariant()} disabled={currentDrawing.length < 2} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 no-drag">Save</button>
               </div>
             </section>
          )}

          {/* Leg Analysis & Variants List */}
          {legs.length > 0 && (
            <section className="space-y-3 text-sm pb-10">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leg Analysis</h2>
              <div className="space-y-3">
                {legs.map(leg => {
                  const legVariants = variants.filter(v => v.legIndex === leg.index);
                  const isSelected = selectedLegIndex === leg.index && mode === 'variants';
                  
                  return (
                    <div key={leg.index} className={`bg-white border rounded-xl overflow-hidden transition-all no-drag ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                      <div 
                        className={`px-3 py-2 border-b border-slate-100 flex justify-between items-center cursor-pointer ${isSelected ? 'bg-blue-50' : 'bg-slate-50'}`}
                        onClick={() => { setMode('variants'); setSelectedLegIndex(leg.index); }}
                      >
                        <span className="text-xs font-black text-slate-700">{leg.label}</span>
                        <span className="text-[11px] font-mono text-slate-400">Straight: {leg.straightLength.toFixed(0)}m</span>
                      </div>
                      
                      <div className="p-2 space-y-1.5">
                        {legVariants.length === 0 ? (
                          <div className="text-[10px] text-slate-400 italic text-center py-1">No variants drawn yet</div>
                        ) : (
                          legVariants.map(v => {
                            const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
                            const percentExtra = ((actualLen / leg.straightLength) - 1) * 100;
                            return (
                              <div key={v.id} className="flex items-center justify-between group bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }}></div>
                                  <span className="text-xs font-bold w-4">{v.name}</span>
                                  <span className="text-xs font-mono font-medium truncate">{actualLen.toFixed(0)}m</span>
                                  <span className={`text-[10px] font-bold ${percentExtra > 10 ? 'text-orange-500' : 'text-slate-400'}`}>
                                    (+{percentExtra.toFixed(0)}%)
                                  </span>
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteVariant(v.id); }}
                                  className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div 
        ref={workspaceRef}
        className={`flex-1 bg-slate-800 overflow-hidden relative transition-colors`}
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
      >
        {!mapImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
            <Map size={64} className="mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-slate-400">No Map Loaded</h2>
            <p className="max-w-xs mt-2 text-sm">Upload an orienteering map image to start planning your course and analyzing route variants.</p>
          </div>
        )}
        
        {mapImage && (
          <div 
            className="absolute top-0 left-0 bg-white origin-top-left shadow-2xl" 
            style={{ 
              width: mapDimensions.width, height: mapDimensions.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <img src={mapImage} alt="Map" className="absolute inset-0 pointer-events-none select-none" />
            <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Calibration UI */}
              {calibrationPoints.map((p, i) => (
                <g key={`calib-${i}`}>
                  <circle cx={p.x} cy={p.y} r={8 / zoom} fill="#f97316" stroke="white" strokeWidth={2 / zoom} />
                  <text x={p.x + 10 / zoom} y={p.y - 10 / zoom} fill="#f97316" fontSize={14 / zoom} fontWeight="bold" stroke="white" strokeWidth={4 / zoom} paintOrder="stroke">{i + 1}</text>
                </g>
              ))}
              
              {/* Course Controls */}
              {controls.map((c, i) => {
                const circleRadius = BASE_CONTROL_RADIUS * drawingScale;
                const isStart = i === 0;
                const isFinish = i === controls.length - 1 && i !== 0;
                const isBeingDragged = draggedControlId === c.id;

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
                    <g key={c.id} opacity={isBeingDragged ? 0.6 : 1}>
                      <polygon 
                        points={`${p1} ${p2} ${p3}`} 
                        fill="none" 
                        stroke="#ec4899" 
                        strokeWidth={BASE_LINE_WIDTH * drawingScale} 
                        transform={`translate(${c.x}, ${c.y}) rotate(${rotation})`}
                      />
                      <text x={c.x + size} y={c.y - size} fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold" stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke">S</text>
                    </g>
                  );
                }

                if (isFinish) {
                  return (
                    <g key={c.id} opacity={isBeingDragged ? 0.6 : 1}>
                      <circle cx={c.x} cy={c.y} r={circleRadius * 0.7} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
                      <circle cx={c.x} cy={c.y} r={circleRadius * 1.1} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
                      <text x={c.x + circleRadius * 1.1} y={c.y - circleRadius * 1.1} fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold" stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke">F</text>
                    </g>
                  );
                }

                return (
                  <g key={c.id} opacity={isBeingDragged ? 0.6 : 1}>
                    <circle cx={c.x} cy={c.y} r={circleRadius} fill="none" stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale} />
                    <text x={c.x + circleRadius} y={c.y - circleRadius} fill="#ec4899" fontSize={BASE_TEXT_SIZE * drawingScale} fontWeight="bold" stroke="white" strokeWidth={4 * drawingScale} paintOrder="stroke">{i}</text>
                  </g>
                );
              })}

              {/* Course Leg Lines */}
              {controls.length >= 2 && controls.map((c, i) => {
                if (i === 0) return null;
                const p1 = controls[i-1];
                const p2 = c;
                const dist = calcPixelDistance(p1, p2);
                const circleRadius = BASE_CONTROL_RADIUS * drawingScale;
                
                const startMargin = (i - 1 === 0) ? circleRadius * 1.1 : circleRadius;
                const endMargin = (i === controls.length - 1) ? circleRadius * 1.2 : circleRadius;
                
                if (dist < startMargin + endMargin) return null;
                
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                return (
                  <line 
                    key={`line-${i}`}
                    x1={p1.x + Math.cos(angle) * startMargin} y1={p1.y + Math.sin(angle) * startMargin}
                    x2={p2.x - Math.cos(angle) * endMargin} y2={p2.y - Math.sin(angle) * endMargin}
                    stroke="#ec4899" strokeWidth={BASE_LINE_WIDTH * drawingScale}
                  />
                );
              })}

              {/* Course Route Variants */}
              {variants.map(v => (
                <g key={v.id}>
                  <polyline 
                    points={v.points.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none" stroke={v.color} strokeWidth={BASE_LINE_WIDTH * drawingScale} strokeDasharray={v.legIndex === selectedLegIndex ? "none" : "10,10"} opacity={v.legIndex === selectedLegIndex ? 1 : 0.3}
                  />
                  {v.legIndex === selectedLegIndex && (
                    <text 
                      x={v.points[Math.floor(v.points.length/2)].x} 
                      y={v.points[Math.floor(v.points.length/2)].y} 
                      fill={v.color} fontSize={BASE_VARIANT_TEXT_SIZE * drawingScale} fontWeight="bold" stroke="white" strokeWidth={2 * drawingScale} paintOrder="stroke"
                    >
                      {v.name}
                    </text>
                  )}
                </g>
              ))}

              {/* Drawing Preview */}
              {currentDrawing.length > 0 && (
                <polyline 
                  points={currentDrawing.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="#3b82f6" strokeWidth={BASE_LINE_WIDTH * drawingScale} strokeDasharray="5,5"
                />
              )}
            </svg>
          </div>
        )}
      </div>

      {/* DPI Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] no-drag">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-96">
            <h3 className="font-bold text-xl mb-4">Finalize Scale</h3>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">Distance in Meters</label>
            <input 
              autoFocus type="text" value={tempCalibrationValue}
              onMouseDown={inputEventGuard}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleNumericInput(e.target.value, setTempCalibrationValue)}
              className="w-full border-2 border-slate-100 focus:border-blue-500 rounded-xl py-4 px-5 text-2xl font-black outline-none bg-slate-50 select-text cursor-text pointer-events-auto"
            />
            <div className="flex flex-col gap-2 mt-4">
              <button onClick={finalizeCalibration} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all">Apply Calibration</button>
              <button onClick={() => { setShowCalibrationModal(false); setCalibrationPoints([]); }} className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}