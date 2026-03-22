import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pixelsToMeters, calcTotalPixelDistance } from '../../utils/geometry';

export default function LegDrawingPanel({ legs, selectedLegIndex, setSelectedLegIndex, currentDrawing, onUndo, onSave, dpi, scale }) {
  const drawingLength = pixelsToMeters(calcTotalPixelDistance(currentDrawing), dpi, scale);

  return (
    <section className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
      <div>
        <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Select Leg</h2>
        <div className="flex items-center gap-2 bg-white rounded-md border border-blue-200 p-1">
          <button
            onClick={() => setSelectedLegIndex(Math.max(0, selectedLegIndex - 1))}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag"
            disabled={selectedLegIndex === 0}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex-1 text-center font-bold text-sm">
            {legs[selectedLegIndex]?.label || `Leg ${selectedLegIndex + 1}`}
          </div>
          <button
            onClick={() => setSelectedLegIndex(Math.min(legs.length - 1, selectedLegIndex + 1))}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 no-drag"
            disabled={selectedLegIndex === legs.length - 1}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm pt-2 border-t border-blue-100">
        <span className="text-slate-600">Drawing Route:</span>
        <span className="font-mono font-bold text-blue-700">{drawingLength.toFixed(1)}m</span>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onUndo}
          disabled={currentDrawing.length === 0}
          className="flex-1 bg-white border border-slate-300 text-slate-700 py-1.5 rounded text-xs font-medium hover:bg-slate-50 disabled:opacity-50 no-drag"
        >
          Undo
        </button>
        <button
          onClick={onSave}
          disabled={currentDrawing.length < 2}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 no-drag"
        >
          Save
        </button>
      </div>
    </section>
  );
}
