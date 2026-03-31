import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function BaseModal({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm h-[100vh]">
      <div className={`bg-white rounded-lg shadow-xl ${maxWidth} w-full mx-4`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {children}
        </div>

        {footer && (
          <div className="border-t border-slate-200 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
