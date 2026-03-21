'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X } from 'lucide-react';

interface DeleteSkillModalProps {
    isOpen: boolean;
    skillName: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteSkillModal({ isOpen, skillName, onClose, onConfirm }: DeleteSkillModalProps) {
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error("Delete Skill Error:", error);
        } finally {
            setIsProcessing(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isProcessing ? onClose : undefined}
                        className="absolute inset-0 backdrop-blur-md transition-colors duration-500"
                        style={{ backgroundColor: "var(--color-backdrop)" }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md glass-card-heavy p-6 sm:p-8 shadow-2xl z-10"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="absolute top-4 right-4 p-2 rounded-lg transition-all"
                            style={{ color: "var(--color-text-secondary)" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-toggle-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-8 mt-2">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black mb-2 tracking-tight" style={{ color: "var(--color-text-primary)" }}>Delete Draft?</h2>
                            <p className="text-sm px-4 font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Are you sure you want to delete <span style={{ color: "var(--color-text-primary)" }} className="font-black">"{skillName}"</span>? This action cannot be undone.
                            </p>
                        </div>

                        {/* Danger Box */}
                        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-8">
                            <ul className="text-xs space-y-2 text-left font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                <li className="flex gap-2">
                                    <span className="text-red-500 font-black">•</span>
                                    This draft and its configuration will be permanently destroyed.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-red-500 font-black">•</span>
                                    You will need to re-create it if you change your mind.
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
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Confirm Delete</span>
                                    </>
                                )}
                            </button>
                            
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                                style={{ color: "var(--color-text-secondary)" }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text-primary)"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
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
