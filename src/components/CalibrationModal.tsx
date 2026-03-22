import { handleNumericInput, inputEventGuard } from '../utils/geometry';

interface CalibrationModalProps {
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  onCancel: () => void;
}

export default function CalibrationModal({ value, onChange, onApply, onCancel }: CalibrationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-100 no-drag">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-96">
        <h3 className="font-bold text-xl mb-4">Distance Between Points</h3>
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
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onApply}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all cursor-pointer"
          >
            Apply Calibration
          </button>
          <button
            onClick={onCancel}
            className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
