// src/components/Dashboard/TopUpModal.tsx
// Modal component for purchasing credit top-up packs directly from the dashboard
// 控制台充值弹窗：支持 10K/50K 纯积分包快速购买

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =========================================================
// Whop Top-up Checkout Links
// Whop 积分充唃套餐购买链接（通过 Whop Dashboard 创建）
// =========================================================
const WHOP_TOPUP_LINKS = {
    '10k': 'https://whop.com/checkout/plan_UFreWJKV7UlA7',
    '50k': 'https://whop.com/checkout/plan_FRuKKZHZqIm27',
};

interface TopUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        userUid?: string;
        email?: string;
    };
}

export default function TopUpModal({ isOpen, onClose, user }: TopUpModalProps) {
    const [selectedPack, setSelectedPack] = useState<'10k' | '50k'>('50k');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCheckout = async () => {
        if (!user || !user.userUid) {
            alert("Session expired. Please log in again.");
            return;
        }

        try {
            setIsProcessing(true);

            // 服务端创建 Whop Checkout Session，由后端将 user_uid 写入 metadata，
            // 确保 Webhook 能正确识别用户并自动完成积分发货。
            const planId = WHOP_TOPUP_LINKS[selectedPack].split('/').pop();

            const res = await fetch('/api/payment/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Checkout creation failed');
            }

            const { url } = await res.json();

            // Simulate UI feedback before redirect
            await new Promise(resolve => setTimeout(resolve, 600));

            // Execute redirect to Whop Checkout
            window.location.href = url;

        } catch (error) {
            console.error("[Top-up Error]", error);
            alert("Unable to initiate top-up. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 backdrop-blur-md transition-colors duration-500"
                        style={{ backgroundColor: "var(--color-backdrop)" }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md glass-card-heavy p-6 sm:p-8 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg transition-all"
                            style={{ color: "var(--color-text-secondary)" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-toggle-bg)"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-text-primary)" }}>Buy API Credits</h2>
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                Credits never expire. Top up anytime.
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-4 mb-8">
                            {/* 10K Option */}
                            <div
                                onClick={() => setSelectedPack('10k')}
                                className={`relative group p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 ${selectedPack === '10k'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'bg-black/5 hover:border-black/10 dark:bg-white/5 dark:hover:border-white/10'
                                    }`}
                                style={{ borderColor: selectedPack === '10k' ? '#3b82f6' : 'var(--color-border)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>10,000 Credits</div>
                                        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>Standard usage</div>
                                    </div>
                                    <div className="font-black text-xl" style={{ color: "var(--color-text-primary)" }}>$9.90</div>
                                </div>
                                {selectedPack === '10k' && (
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 shadow-glow" />
                                )}
                            </div>

                            {/* 50K Option (Best Value) */}
                            <div
                                onClick={() => setSelectedPack('50k')}
                                className={`relative group p-4 rounded-xl cursor-pointer border-2 transition-all duration-300 ${selectedPack === '50k'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'bg-black/5 hover:border-black/10 dark:bg-white/5 dark:hover:border-white/10'
                                    }`}
                                style={{ borderColor: selectedPack === '50k' ? '#a855f7' : 'var(--color-border)' }}
                            >
                                {/* Best Value Badge */}
                                <div className="absolute -top-3 left-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full shadow-lg z-10">
                                    Best Value
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>50,000 Credits</div>
                                        <div className="text-purple-500 text-xs mt-0.5">Pro-grade performance</div>
                                    </div>
                                    <div className="font-black text-xl text-gradient-purple" style={{ color: "var(--color-text-primary)" }}>$39.90</div>
                                </div>
                                {selectedPack === '50k' && (
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 shadow-glow" />
                                )}
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className={`
                                w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all
                                shadow-lg
                                ${isProcessing 
                                    ? "bg-slate-700 cursor-not-allowed text-slate-400" 
                                    : "btn-primary"}
                            `}
                        >
                            {isProcessing ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Initiating Checkout...</span>
                                </div>
                            ) : (
                                `Checkout $${selectedPack === '10k' ? '9.90' : '39.90'}`
                            )}
                        </button>

                        <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
                            <svg className="w-3 h-3" style={{ color: "var(--color-text-secondary)" }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: "var(--color-text-secondary)" }}>Secure Whop Checkout</span>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
