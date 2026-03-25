import { ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { pixelsToMeters, calcTotalPixelDistance } from '../../utils/geometry';
import { IndependentLeg, Point } from '../../types';

interface IndependentLegDrawingPanelProps {
  independentLegs: IndependentLeg[];
  pendingStart: { x: number; y: number } | null;
  selectedLegId: number | null;
  onSelectLeg: (id: number) => void;
  onDeleteLeg: (id: number) => void;
  currentDrawing: Point[];
  onUndo: () => void;
  onSave: () => void;
  dpi: number;
  scale: number;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  isVariantsMode: boolean;
}

export default function IndependentLegDrawingPanel({
  independentLegs,
  pendingStart,
  selectedLegId,
  onSelectLeg,
  onDeleteLeg,
  currentDrawing,
  onUndo,
  onSave,
  dpi,
  scale,
  autoRotate,
  onToggleAutoRotate,
  isVariantsMode,
}: IndependentLegDrawingPanelProps) {
  const drawingLength = pixelsToMeters(calcTotalPixelDistance(currentDrawing), dpi, scale);
  const selectedIndex = independentLegs.findIndex(l => l.id === selectedLegId);

  return (
    <section className="space-y-3">
      {/* Leg placement instruction / list */}
      <div className="space-y-2">
        {independentLegs.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {independentLegs.map(leg => (
              <div
                key={leg.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs cursor-pointer no-drag ${
                  selectedLegId === leg.id
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                onClick={() => onSelectLeg(leg.id)}
              >
                <span className="font-bold text-slate-700 flex-1">{leg.label}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteLeg(leg.id); }}
                  className="text-slate-300 hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                  title="Delete leg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant drawing panel (shown in variants sub-mode) */}
      {isVariantsMode && independentLegs.length > 0 && (
        <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div>
            <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Select Leg</h2>
            <div className="flex items-center gap-2 bg-white rounded-md border border-blue-200 p-1">
              <button
                onClick={() => selectedIndex > 0 && onSelectLeg(independentLegs[selectedIndex - 1].id)}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag cursor-pointer"
                disabled={selectedIndex <= 0}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 text-center font-bold text-sm">
                {independentLegs.find(l => l.id === selectedLegId)?.label ?? 'Select a leg'}
              </div>
              <button
                onClick={() => selectedIndex < independentLegs.length - 1 && onSelectLeg(independentLegs[selectedIndex + 1].id)}
                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag cursor-pointer"
                disabled={selectedIndex >= independentLegs.length - 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm pt-2 border-t border-blue-100">
            <span className="text-slate-600">Drawing Route:</span>
            <span className="font-mono font-bold text-blue-700">{drawingLength.toFixed(1)}m</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onUndo}
              disabled={currentDrawing.length <= 1}
              className="flex-1 bg-white border border-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium hover:bg-slate-50 disabled:opacity-50 no-drag cursor-pointer"
            >
              Undo
            </button>
            <button
              onClick={onSave}
              disabled={currentDrawing.length < 2}
              className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 no-drag cursor-pointer"
            >
              Save
            </button>
          </div>

          <div className="border-t border-blue-100 pt-2">
            <button
              onClick={onToggleAutoRotate}
              className={`w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-medium border transition-all no-drag cursor-pointer ${
                autoRotate
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw size={12} />
              {autoRotate ? 'Leg Aligned' : 'Align Leg'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
