import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LegNotesModalProps {
  isOpen: boolean;
  legLabel: string;
  notes: string | undefined;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export default function LegNotesModal({ isOpen, legLabel, notes, onSave, onClose }: LegNotesModalProps) {
  const [inputValue, setInputValue] = useState(notes || '');

  useEffect(() => {
    setInputValue(notes || '');
  }, [notes, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(inputValue);
    onClose();
  };

  const handleCancel = () => {
    setInputValue(notes || '');
    onClose();
  };  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Notes for {legLabel}</h2>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add notes about this leg..."
            className="w-full h-48 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
