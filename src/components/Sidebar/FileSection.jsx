import React from 'react';
import { Upload, Save, FolderOpen } from 'lucide-react';

export default function FileSection({ onLoadMap, onLoadData, onSaveData, hasControls, fileInputRef, loadDataRef }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Files</h2>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-4 rounded-md border border-blue-200 transition-colors text-sm font-medium no-drag"
      >
        <Upload size={16} /> Load Map Image
      </button>
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onLoadMap} />

      <div className="flex gap-2">
        <button
          onClick={() => loadDataRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium no-drag"
        >
          <FolderOpen size={14} /> Load Data
        </button>
        <input type="file" accept=".json" ref={loadDataRef} className="hidden" onChange={onLoadData} />
        <button
          onClick={onSaveData}
          disabled={!hasControls}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 px-2 rounded-md border border-slate-200 transition-colors text-xs font-medium disabled:opacity-50 no-drag"
        >
          <Save size={14} /> Save Data
        </button>
      </div>
    </section>
  );
}
