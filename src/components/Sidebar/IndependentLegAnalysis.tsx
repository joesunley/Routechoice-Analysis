import { useState } from 'react';
import { Trash2, Edit2, FileText, Check, Share2 } from 'lucide-react';
import { pixelsToMeters, calcTotalPixelDistance } from '../../utils/geometry';
import { IndependentLeg, Variant, AppMode } from '../../types';
import LegNotesModal from '../LegNotesModal';

interface IndependentLegAnalysisProps {
  independentLegs: IndependentLeg[];
  variants: Variant[];
  selectedLegId: number | null;
  onSelectLeg: (id: number) => void;
  setMode: (mode: AppMode) => void;
  deleteVariant: (id: number) => void;
  editVariant: (id: number) => void;
  dpi: number;
  scale: number;
  onUpdateLegNotes: (id: number, notes: string) => void;
  onSelectVariant: (variantId: number) => void;
  onExportShare: () => void;
}

export default function IndependentLegAnalysis({
  independentLegs,
  variants,
  selectedLegId,
  onSelectLeg,
  setMode,
  deleteVariant,
  editVariant,
  dpi,
  scale,
  onUpdateLegNotes,
  onSelectVariant,
  onExportShare,
}: IndependentLegAnalysisProps) {
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesLegId, setNotesLegId] = useState<number | null>(null);

  const notesLeg = notesLegId !== null ? independentLegs.find(l => l.id === notesLegId) : null;

  return (
    <>
      <section className="space-y-3 text-sm pb-10">
        <div className="flex items-center">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leg Analysis</h2>
          <button
            onClick={onExportShare}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-500 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-blue-50"
            title="Export share view"
          >
            <Share2 size={13} />
            Export
          </button>
        </div>

        <div className="space-y-3">
          {independentLegs.map(leg => {
            const legVariants = variants.filter(v => v.legIndex === leg.id);
            const isSelected = selectedLegId === leg.id;
            const straightMeters = pixelsToMeters(leg.straightLength, dpi, scale);

            return (
              <div
                key={leg.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all no-drag ${
                  isSelected ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'
                }`}
              >
                <div
                  className={`px-3 py-2 border-b border-slate-100 flex items-center cursor-pointer gap-2 ${
                    isSelected ? 'bg-purple-50' : 'bg-slate-50'
                  }`}
                  onClick={() => { setMode('variants'); onSelectLeg(leg.id); }}
                >
                  <span className="text-xs font-black text-slate-700">{leg.label}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setNotesLegId(leg.id);
                      setNotesModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-purple-500 transition-colors p-1 shrink-0"
                    title="Add or edit notes"
                  >
                    <FileText size={14} />
                  </button>
                  {leg.notes && <div className="w-1 h-1 rounded-full bg-slate-400" title="This leg has notes" />}
                  <span className="text-[11px] font-mono text-slate-400 ml-auto">
                    Straight: {straightMeters.toFixed(0)}m
                  </span>
                </div>

                <div className="p-2 space-y-1.5">
                  {legVariants.length === 0 ? (
                    <div className="text-[10px] text-slate-400 italic text-center py-1">No routechoices drawn yet</div>
                  ) : (
                    (() => {
                      const shortest = Math.min(
                        ...legVariants.map(v => pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale))
                      );
                      return legVariants.map(v => {
                        const len = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
                        const pct = ((len / shortest) - 1) * 100;
                        return (
                          <div
                            key={v.id}
                            className="flex items-center justify-between group bg-slate-50 rounded-lg px-2 py-1.5 border-2 border-slate-200"
                          >
                            <div className="flex items-center gap-1 overflow-hidden">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                              <span className="text-xs font-bold w-4">{v.name}</span>
                              <button
                                onClick={() => onSelectVariant(v.id)}
                                className={`w-3 h-3 p-0 shrink-0 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                                  v.chosen === true ? 'text-green-600 border-green-600' : 'border-slate-400'
                                }`}
                                title="Mark as chosen variant"
                              >
                                {v.chosen === true && <Check size={10} />}
                              </button>
                              <span className="text-xs font-mono font-medium ml-2">{len.toFixed(0)}m</span>
                              <span className={`text-[10px] font-bold ${pct > 10 ? 'text-orange-500' : 'text-slate-400'}`}>
                                (+{pct.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => { e.stopPropagation(); setMode('variants'); editVariant(v.id); }}
                                className="text-slate-300 hover:text-blue-500 p-1 rounded transition-colors cursor-pointer"
                                title="Edit variant"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); deleteVariant(v.id); }}
                                className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                title="Delete variant"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {notesLeg && (
        <LegNotesModal
          isOpen={notesModalOpen}
          legLabel={notesLeg.label}
          notes={notesLeg.notes}
          onSave={notes => onUpdateLegNotes(notesLeg.id, notes)}
          onClose={() => setNotesModalOpen(false)}
        />
      )}
    </>
  );
}
