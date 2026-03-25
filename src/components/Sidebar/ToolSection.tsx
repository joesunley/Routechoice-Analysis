import { MapPin, Route, Layers } from 'lucide-react';
import { AppMode, WorkflowMode } from '../../types';

interface ToolSectionProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  workflowMode: WorkflowMode;
  setWorkflowMode: (m: WorkflowMode) => void;
  canDrawVariants: boolean;
}

export default function ToolSection({ mode, setMode, workflowMode, setWorkflowMode, canDrawVariants }: ToolSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tool Selection</h2>
        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">ALT + DRAG TO MOVE</span>
      </div>

      {/* Workflow toggle */}
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setWorkflowMode('course')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex justify-center items-center gap-1.5 no-drag cursor-pointer ${workflowMode === 'course' ? 'bg-white shadow-sm text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Route size={13} /> Analysis
        </button>
        <button
          onClick={() => setWorkflowMode('independent')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex justify-center items-center gap-1.5 no-drag cursor-pointer ${workflowMode === 'independent' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Layers size={13} /> Planning
        </button>
      </div>

      {/* Inner mode toggle */}
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setMode('controls')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 no-drag cursor-pointer ${mode === 'controls' ? `bg-white shadow-sm ${workflowMode === 'course' ? 'text-pink-600' : 'text-purple-600'}` : 'text-slate-500 hover:text-slate-700'}`}
        >
          <MapPin size={14} /> {workflowMode === 'course' ? 'Course' : 'Place Legs'}
        </button>
        <button
          onClick={() => setMode('variants')}
          disabled={!canDrawVariants}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md flex justify-center items-center gap-1.5 disabled:opacity-50 no-drag cursor-pointer ${mode === 'variants' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Route size={14} /> Routechoices
        </button>
      </div>
    </section>
  );
}

