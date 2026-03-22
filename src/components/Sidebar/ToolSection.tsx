import React from 'react';
import { MapPin, Route } from 'lucide-react';
import { AppMode } from '../../types';

interface ToolSectionProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  controlsCount: number;
}

export default function ToolSection({ mode, setMode, controlsCount }: ToolSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tool Selection</h2>
        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">ALT + DRAG TO MOVE</span>
      </div>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setMode('controls')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 no-drag cursor-pointer ${mode === 'controls' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MapPin size={14} /> Course
        </button>
        <button
          onClick={() => setMode('variants')}
          disabled={controlsCount < 2}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 disabled:opacity-50 no-drag cursor-pointer ${mode === 'variants' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Route size={14} /> Variants
        </button>
      </div>
    </section>
  );
}
