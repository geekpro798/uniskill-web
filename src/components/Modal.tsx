// src/components/Modal.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, AlertTriangle, X } from "lucide-react";

interface ModalProps {
  show: boolean;
  type: 'confirm' | 'alert';
  title: string;
  message: React.ReactNode;
  onConfirm?: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  show,
  type,
  title,
  message,
  onConfirm,
  onClose,
  confirmText,
  cancelText
}) => {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-2 rounded-full flex-shrink-0 ${type === 'confirm' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500'}`}>
                {type === 'confirm' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h4>
                <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {message}
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              {type === 'confirm' ? (
                <>
                  <button 
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    {cancelText || "Cancel"}
                  </button>
                  <button 
                    onClick={() => {
                      onConfirm?.();
                      onClose();
                    }}
                    className="px-6 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {confirmText || "Delete"}
                  </button>
                </>
              ) : (
                <button 
                  onClick={onClose}
                  className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                >
                  {confirmText || "Got it"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
