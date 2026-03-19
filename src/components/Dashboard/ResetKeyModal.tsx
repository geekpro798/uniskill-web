// src/components/Dashboard/ResetKeyModal.tsx
// Modal component for confirming API Key reset
// 复用 TopUpModal 的样式规范，提供一致的控制台交互体验

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ResetKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function ResetKeyModal({ isOpen, onClose, onConfirm }: ResetKeyModalProps) {
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
            // 注意：onConfirm 内部已经处理了展示新 Key 的逻辑
            onClose();
        } catch (error) {
            console.error("Reset Key Error:", error);
        } finally {
            setIsProcessing(false);
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
                        onClick={onClose}
                        className="absolute inset-0 bg-[#070b14]/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md glass-card-heavy p-6 sm:p-8 border border-red-500/20 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Reset API Key?</h2>
                            <p className="text-sm text-slate-400 px-4">
                                Your current API key will stop working <span className="text-red-400 font-bold underline">immediately</span>. This action cannot be undone.
                            </p>
                        </div>

                        {/* Danger Box */}
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                            <ul className="text-xs text-slate-500 space-y-2 text-left">
                                <li className="flex gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    Existing integrations using this key will fail.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    A new key will be generated for you once.
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className={`
                                    w-full py-4 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all
                                    flex items-center justify-center gap-3
                                    ${isProcessing 
                                        ? "bg-slate-700 cursor-not-allowed opacity-50 text-slate-400" 
                                        : "bg-red-600 hover:bg-red-500 active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.2)]"}
                                `}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Resetting Key...</span>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        <span>Confirm Reset</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-xl text-slate-400 font-bold text-sm uppercase tracking-widest hover:text-white transition-all"
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
