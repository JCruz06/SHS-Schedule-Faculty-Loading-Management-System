import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  severity?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  severity = 'danger',
}) => {
  if (!isOpen) return null;

  let iconBg = 'bg-red-50 text-red-600 border border-red-100';
  let confirmBtnBg = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
  let Icon = AlertTriangle;

  if (severity === 'warning') {
    iconBg = 'bg-amber-50 text-amber-600 border border-amber-100';
    confirmBtnBg = 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500';
  } else if (severity === 'info') {
    iconBg = 'bg-blue-50 text-blue-600 border border-blue-100';
    confirmBtnBg = 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    Icon = Info;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Close button top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 pr-6">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
