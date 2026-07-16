'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X, Flag } from 'lucide-react';

interface WithdrawSkillModalProps {
  isOpen: boolean;
  skillName: string;
  isFlagged?: boolean;   // Flagged 状态下措辞略有不同
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function WithdrawSkillModal({
  isOpen,
  skillName,
  isFlagged = false,
  onClose,
  onConfirm,
}: WithdrawSkillModalProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Withdraw Skill Error:', error);
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="absolute inset-0 backdrop-blur-md transition-colors duration-500"
            style={{ backgroundColor: 'var(--color-backdrop)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md glass-card-heavy p-6 sm:p-8 shadow-2xl z-10"
          >
            {/* Close */}
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-toggle-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <X size={20} />
            </button>

            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center mb-8 mt-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border shadow-lg ${
                isFlagged
                  ? 'bg-orange-500/10 border-orange-500/20 shadow-orange-500/15'
                  : 'bg-slate-500/10 border-slate-500/20 shadow-slate-500/10'
              }`}>
                {isFlagged
                  ? <Flag size={32} className="text-orange-500" />
                  : <ArrowDownToLine size={32} className="text-slate-500" />
                }
              </div>
              <h2
                className="text-2xl font-black mb-2 tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Withdraw from Community?
              </h2>
              <p className="text-sm px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                You are about to withdraw{' '}
                <span style={{ color: 'var(--color-text-primary)' }} className="font-black">
                  &ldquo;{skillName}&rdquo;
                </span>{' '}
                from the community.
              </p>
            </div>

            {/* Info Box */}
            <div className={`border rounded-xl p-4 mb-8 ${
              isFlagged
                ? 'bg-orange-500/5 border-orange-500/10'
                : 'bg-slate-500/5 border-slate-200 dark:border-slate-700/50'
            }`}>
              <ul className="text-xs space-y-2 text-left font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  The skill will become <strong>Private</strong> and disappear from the community square.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  Your call history and eligibility progress are preserved.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-black">•</span>
                  You can re-publish anytime once the skill still meets the threshold.
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className={`
                  w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all
                  flex items-center justify-center gap-3
                  ${isProcessing
                    ? 'bg-slate-700 cursor-not-allowed opacity-50 text-slate-400'
                    : isFlagged
                      ? 'bg-orange-500 hover:bg-orange-400 text-white active:scale-[0.98] shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                      : 'bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 text-white active:scale-[0.98]'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Withdrawing...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={16} />
                    <span>Confirm Withdraw</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
