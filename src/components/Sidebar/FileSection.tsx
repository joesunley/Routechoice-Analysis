import React from 'react';
import { Upload, Save, FolderOpen } from 'lucide-react';

interface FileSectionProps {
  onLoadMap: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveData: () => void;
  hasControls: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  loadDataRef: React.RefObject<HTMLInputElement | null>;
  eventName: string;
  setEventName: (name: string) => void;
}

export default function FileSection({ onLoadMap, onLoadData, onSaveData, hasControls, fileInputRef, loadDataRef, eventName, setEventName }: FileSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Event</h2>
      <input
        type="text"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        placeholder="Event name (optional)"
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white no-drag select-text cursor-text pointer-events-auto"
      />
      
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Project Files</h2>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md border border-blue-200 transition-colors text-sm font-medium no-drag cursor-pointer"
      >
        <Upload size={16} /> Load Map Image
      </button>
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onLoadMap} />

      <div className="flex gap-2">
        <button
          onClick={() => loadDataRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium no-drag cursor-pointer"
        >
          <FolderOpen size={14} /> Load Data
        </button>
        <input type="file" accept=".json" ref={loadDataRef} className="hidden" onChange={onLoadData} />
        <button
          onClick={onSaveData}
          disabled={!hasControls}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium disabled:opacity-50 no-drag cursor-pointer"
        >
          <Save size={14} /> Save Data
        </button>
      </div>
    </section>
  );
}
