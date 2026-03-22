import { useState } from 'react';
import { Trash2, Edit2, FileText } from 'lucide-react';
import { pixelsToMeters, calcTotalPixelDistance } from '../../utils/geometry';
import { Leg, Variant, AppMode } from '../../types';
import LegNotesModal from '../LegNotesModal';

interface LegAnalysisProps {
  legs: Leg[];
  variants: Variant[];
  selectedLegIndex: number;
  setSelectedLegIndex: (i: number) => void;
  setMode: (mode: AppMode) => void;
  deleteVariant: (id: number) => void;
  editVariant: (id: number) => void;
  dpi: number;
  scale: number;
  onUpdateLegNotes: (legIndex: number, notes: string) => void;
}

export default function LegAnalysis({ 
  legs, 
  variants, 
  selectedLegIndex, 
  setSelectedLegIndex, 
  setMode, 
  deleteVariant, 
  editVariant, 
  dpi, 
  scale, 
  onUpdateLegNotes 
}: LegAnalysisProps) {
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedLegForNotes, setSelectedLegForNotes] = useState<number | null>(null);

  const handleOpenNotesModal = (legIndex: number) => {
    setSelectedLegForNotes(legIndex);
    setNotesModalOpen(true);
  };

  const handleSaveNotes = (notes: string) => {
    if (selectedLegForNotes !== null) {
      onUpdateLegNotes(selectedLegForNotes, notes);
    }
  };

  const selectedLegNotes = selectedLegForNotes !== null ? legs[selectedLegForNotes]?.notes : undefined;

  return (
    <>
      <section className="space-y-3 text-sm pb-10">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Leg Analysis</h2>
        <div className="space-y-3">
          {legs.map(leg => {
            const legVariants = variants.filter(v => v.legIndex === leg.index);
            const isSelected = selectedLegIndex === leg.index;

            return (
              <div
                key={leg.index}
                className={`bg-white border rounded-xl overflow-hidden transition-all no-drag ${isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}
              >                <div
                  className={`px-3 py-2 border-b border-slate-100 flex items-center cursor-pointer gap-2 ${isSelected ? 'bg-blue-50' : 'bg-slate-50'}`}
                  onClick={() => { setMode('variants'); setSelectedLegIndex(leg.index); }}
                >
                  <span className="text-xs font-black text-slate-700">{leg.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenNotesModal(leg.index); }}
                    className="text-slate-400 hover:text-blue-500 transition-colors p-1 shrink-0"
                    title="Add or edit notes"
                  >
                    <FileText size={14} />
                  </button>
                  {leg.notes && (
                    <div className="w-1 h-1 rounded-full bg-slate-400" title="This leg has notes" />
                  )}
                  <span className="text-[11px] font-mono text-slate-400 ml-auto">Straight: {leg.straightLength.toFixed(0)}m</span>
                </div><div className="p-2 space-y-1.5">
                  {legVariants.length === 0 ? (
                    <div className="text-[10px] text-slate-400 italic text-center py-1">No routechoices drawn yet</div>
                  ) : (
                    (() => {
                      const shortestVariantLen = Math.min(
                        ...legVariants.map(variant => pixelsToMeters(calcTotalPixelDistance(variant.points), dpi, scale))
                      );
                      return legVariants.map(v => {
                        const actualLen = pixelsToMeters(calcTotalPixelDistance(v.points), dpi, scale);
                        const percentExtra = ((actualLen / shortestVariantLen) - 1) * 100;
                        return (
                          <div key={v.id} className="flex items-center justify-between group bg-slate-50 rounded-lg px-2 py-1.5 border border-slate-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: v.color }} />
                              <span className="text-xs font-bold w-4">{v.name}</span>
                              <span className="text-xs font-mono font-medium truncate">{actualLen.toFixed(0)}m</span>
                              <span className={`text-[10px] font-bold ${percentExtra > 10 ? 'text-orange-500' : 'text-slate-400'}`}>
                                (+{percentExtra.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); setMode('variants'); editVariant(v.id); }}
                                className="text-slate-300 hover:text-blue-500 p-1 rounded transition-colors cursor-pointer"
                                title="Edit variant"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteVariant(v.id); }}
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

      {selectedLegForNotes !== null && (
        <LegNotesModal
          isOpen={notesModalOpen}
          legLabel={legs[selectedLegForNotes]?.label || ''}
          notes={selectedLegNotes}
          onSave={handleSaveNotes}
          onClose={() => setNotesModalOpen(false)}
        />
      )}
    </>
  );
}
