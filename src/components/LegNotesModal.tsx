import { useState, useEffect } from 'react';
import BaseModal from './BaseModal';

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

  const handleSave = () => {
    onSave(inputValue);
    onClose();
  };

  const handleCancel = () => {
    setInputValue(notes || '');
    onClose();
  };

  const footer = (
    <div className="flex gap-2 justify-end">
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
  );

  return (
    <BaseModal
      isOpen={isOpen}
      title={`Notes for ${legLabel}`}
      onClose={handleCancel}
      footer={footer}
    >
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Add notes about this leg..."
        className="w-full h-48 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-sm"
        autoFocus
      />
    </BaseModal>
  );
}
