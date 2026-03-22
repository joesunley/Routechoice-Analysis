import React from 'react';
import { Settings, Ruler } from 'lucide-react';
import { COMMON_SCALES } from '../../constants';
import { handleNumericInput, inputEventGuard } from '../../utils/geometry';

export default function SettingsSection({ scale, setScale, dpi, setDpi, drawingScale, setDrawingScale, mode, onStartCalibrate }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <Settings size={14} /> Settings
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
            onClick={onStartCalibrate}
            className={`w-full flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg text-xs font-bold border transition-all no-drag ${mode === 'calibrate' ? 'bg-orange-500 border-orange-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-orange-200'}`}
          >
            <div className="flex items-center gap-2">
              <Ruler size={16} />
              <span>{mode === 'calibrate' ? 'Calibrating...' : 'Calculate DPI'}</span>
            </div>
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
  );
}
