import BaseModal from '@/components/BaseModal';
import { handleNumericInput, inputEventGuard } from '@/utils/geometry';

interface CalibrationModalProps {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

export default function CalibrationModal({ value, onChange, onApply, onCancel }: CalibrationModalProps) {
  const footer = (
    <div className="flex flex-col gap-2">
      <button
        onClick={onApply}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-blue-700 transition-all cursor-pointer"
      >
        Apply Calibration
      </button>
      <button
        onClick={onCancel}
        className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600 cursor-pointer transition-colors"
      >
        Cancel
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      title="Distance Between Points"
      onClose={onCancel}
      footer={footer}
      maxWidth="max-w-sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-tight">
            Enter distance in meters
          </label>
          <input
            autoFocus
            type="text"
            value={value}
            onMouseDown={inputEventGuard}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleNumericInput(e.target.value, onChange)}
            className="w-full border-2 border-slate-100 focus:border-blue-500 rounded-xl py-4 px-5 text-2xl font-black outline-none bg-slate-50 select-text cursor-text pointer-events-auto"
          />
        </div>
      </div>
    </BaseModal>
  );
}
