'use client';

import React from 'react';
import { useApp } from '../../lib/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastList: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div id="toast-container" className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => {
          let bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
          let Icon = CheckCircle2;
          
          if (toast.type === 'warning') {
            bgColor = 'bg-amber-50 border-amber-200 text-amber-800';
            Icon = AlertTriangle;
          } else if (toast.type === 'error') {
            bgColor = 'bg-red-50 border-red-200 text-red-800';
            Icon = XCircle;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-lg border shadow-lg flex items-start gap-3 backdrop-blur-xs pointer-events-auto ${bgColor}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
