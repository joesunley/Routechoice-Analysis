import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Check } from 'lucide-react';
import LegPreviewMap from './LegPreviewMap';
import { exportShareHtml } from '../utils/shareExport';
import { Control, Leg, Variant, MapDimensions } from '../types';
import { calcTotalPixelDistance, pixelsToMeters } from '../utils/geometry';

interface ShareViewProps {
  mapImage: string;
  mapDimensions: MapDimensions;
  controls: Control[];
  legs: Leg[];
  variants: Variant[];
  dpi: number;
  scale: number;
  drawingScale: number;
  onClose: () => void;
}

export default function ShareView({
  mapImage,
  mapDimensions,
  controls,
  legs,
  variants,
  dpi,
  scale,
  drawingScale,
  onClose,
}: ShareViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentIndex(i => Math.min(legs.length - 1, i + 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [legs.length, onClose]);

  const leg = legs[currentIndex];
  if (!leg) return null;

  const legVariants = variants.filter(v => v.legIndex === leg.index);
  const shortestLen =
    legVariants.length > 0
      ? Math.min(...legVariants.map(v => pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale)))
      : 0;

  const handleExport = () => {
    exportShareHtml({ mapImage, mapDimensions, controls, legs, variants, dpi, scale, drawingScale });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2 text-pink-400 font-bold text-base">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f6339a " stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-route-icon lucide-route"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
          <span className='text-white'>Routechoice Analysis</span>
        </div>
        <span className="text-white font-bold text-lg">{leg.label}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Download size={14} />
            Export HTML
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map preview */}
        <div className="flex-1 min-w-0">
          <LegPreviewMap
            key={currentIndex}
            mapImage={mapImage}
            mapDimensions={mapDimensions}
            controls={controls}
            legVariants={legVariants}
            legIndex={leg.index}
            dpi={dpi}
            scale={scale}
            drawingScale={drawingScale}
          />
        </div>

        {/* Info panel */}
        <div className="w-80 shrink-0 border-l border-slate-700 bg-slate-800 text-white overflow-y-auto flex flex-col gap-5 p-5">
          {/* Leg summary */}
          <div>
            <h3 className="text-xl font-bold">{leg.label}</h3>
            <p className="text-slate-400 text-sm mt-1">Straight-line: {leg.straightLength.toFixed(0)}m</p>
          </div>

          {/* Routechoices */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Routechoices</h4>
            {legVariants.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No routechoices drawn</p>
            ) : (
              <div className="space-y-2">
                {legVariants.map(v => {
                  const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
                  const percentExtra = shortestLen > 0 ? ((actualLen / shortestLen) - 1) * 100 : 0;
                  const isChosen = v.chosen === true;
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
                        isChosen
                          ? 'bg-green-900/40 border-green-600'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: v.color }}
                      />
                      <span className={`font-bold text-sm ${isChosen ? 'text-green-300' : 'text-white'}`}>
                        {isChosen && '★ '}{v.name}
                      </span>
                      <span className="text-sm font-mono ml-auto">{actualLen.toFixed(0)}m</span>
                      {percentExtra > 0 && (
                        <span
                          className={`text-xs font-bold ${
                            percentExtra > 10 ? 'text-orange-400' : 'text-slate-400'
                          }`}
                        >
                          +{percentExtra.toFixed(0)}%
                        </span>
                      )}
                      {isChosen && <Check size={13} className="text-green-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {leg.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</h4>
              <p className="text-slate-300 text-sm bg-slate-700 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {leg.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 shrink-0">
        <button
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-white px-3 py-1.5 rounded-lg font-medium border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {legs.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === currentIndex ? 'bg-blue-400' : 'bg-slate-600 hover:bg-slate-400'
              }`}
              title={legs[i].label}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentIndex(i => Math.min(legs.length - 1, i + 1))}
          disabled={currentIndex === legs.length - 1}
          className="flex items-center gap-1 text-white px-3 py-1.5 rounded-lg font-medium border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
