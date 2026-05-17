'use client';
// src/components/auth/WalletSetup.tsx
// 主权身份初始化引导组件 — Particle Network MPC 钱包激活
// Sovereign identity onboarding: Particle Network MPC wallet activation

import React, { useState, useEffect } from 'react';
import { useConnect, useConnectors, useAccount, useDisconnect } from '@particle-network/connectkit';
import { motion } from 'framer-motion';
import { Shield, Zap, CheckCircle2, AlertTriangle, Wallet, Github } from 'lucide-react';

interface WalletSetupProps {
    onComplete: (walletAddress?: string) => void;
}

export default function WalletSetup({ onComplete }: WalletSetupProps) {
    const { connect }              = useConnect();
    const connectors               = useConnectors();
    const { address, isConnected } = useAccount();
    const { disconnect }           = useDisconnect();

    const [step,       setStep]       = useState<'idle' | 'connecting' | 'binding' | 'done' | 'error'>('idle');
    const [errorMsg,   setErrorMsg]   = useState<string>('');
    const [walletAddr, setWalletAddr] = useState<string>('');

    // ✅ 通过 Effect 监听 address 的可用状态，一旦可用立刻执行签售绑定
    useEffect(() => {
        if (step === 'connecting' && isConnected && address) {
            handleBinding(address);
        }
    }, [isConnected, address, step]);

    const handleActivate = async () => {
        setStep('connecting');
        setErrorMsg('');

        try {
            // Find the Particle Auth connector
            const authConnector = connectors.find((c: any) => c.id === 'particleAuth' || c.walletConnectorType === 'particleAuth');
            
            if (!authConnector) {
                throw new Error('Particle Auth connector explicitly missing. Please check your configuration.');
            }

            // ⚠️ 极其致命的拦截坑点（已解决）：
            // 千万不能 `await disconnect()`，这样会让浏览器的点击事件堆栈丢失，导致被弹窗拦截器“静默拦截”。
            // 直接 Fire-and-forget 地调用，保持同步调用流直接唤起 GitHub 登录。
            if (isConnected) {
                disconnect(); 
            }

            // 直接唤起 GitHub 授权窗口（无头模式，丝滑无缝）
            await connect({ 
                connector: authConnector, 
                // @ts-ignore
                authParams: { socialType: 'github' } 
            });

            // Note: The rest of the flow is passed cleanly to the useEffect!
        } catch (err: any) {
            console.error('[WalletSetup] Raw Error:', err);
            
            let extractedMsg = 'An unexpected error occurred';
            if (err instanceof Error) {
                extractedMsg = err.message;
            } else if (err && typeof err === 'object') {
                extractedMsg = err.message || err.error || JSON.stringify(err);
            } else if (typeof err === 'string') {
                extractedMsg = err;
            }

            // 过滤由于用户主动关闭或者提前抛出导致的异常
            if (extractedMsg.toLowerCase().includes('close') || extractedMsg.toLowerCase().includes('cancel') || extractedMsg.includes('User rejected')) {
                setStep('idle');
                return;
            }

            console.error('[WalletSetup] Extracted Message:', extractedMsg);
            setErrorMsg(extractedMsg);
            setStep('error');
        }
    };

    const handleBinding = async (targetAddress: string) => {
        setWalletAddr(targetAddress);
        setStep('binding');

        try {
            const res = await fetch('/api/user/wallet', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ walletAddress: targetAddress }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to link wallet. ' + JSON.stringify(err));
            }

            setStep('done');
            setTimeout(() => {
                onComplete(targetAddress);
            }, 1000);
        } catch (err: any) {
             setErrorMsg(err.message || 'Binding failed');
             setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-md bg-[#0a0f1e] border border-blue-500/20 rounded-2xl shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] overflow-hidden"
            >
                {/* ── Header ── */}
                <div className="relative px-8 pt-8 pb-6 text-center border-b border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent" />
                    <div className="relative">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                {/* 脉冲动画 */}
                                <span className="absolute -inset-1 rounded-2xl bg-blue-500/20 animate-ping" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                            Activate Sovereign Identity
                        </h1>
                        <p className="text-sm text-slate-400">
                            Link your GitHub account to a non-custodial wallet via Particle MPC
                        </p>
                    </div>
                </div>

                {/* ── Feature List ── */}
                <div className="px-8 py-6 space-y-3">
                    {[
                        { icon: Wallet,  text: 'Your wallet is generated from your GitHub identity — no seed phrases needed' },
                        { icon: Shield,  text: 'Particle MPC ensures no single party holds the full private key' },
                        { icon: Zap,     text: 'Restore access anytime by re-authenticating with GitHub' },
                    ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Icon className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                        </div>
                    ))}
                </div>

                {/* ── Wallet Address Preview (after connect) ── */}
                {walletAddr && (
                    <div className="mx-8 mb-4 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Your Wallet Address</p>
                        <p className="text-sm font-mono text-blue-300 break-all">{walletAddr}</p>
                    </div>
                )}

                {/* ── Error Message ── */}
                {step === 'error' && (
                    <div className="mx-8 mb-4 flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{errorMsg}</p>
                    </div>
                )}

                {/* ── Action Button ── */}
                <div className="px-8 pb-8">
                    {step === 'done' ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            Wallet Activated! Redirecting...
                        </motion.div>
                    ) : (
                        <button
                            onClick={handleActivate}
                            disabled={step === 'connecting' || step === 'binding'}
                            className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-300
                                bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                                shadow-[0_8px_30px_-8px_rgba(99,102,241,0.5)] hover:shadow-[0_8px_40px_-8px_rgba(99,102,241,0.7)]
                                hover:scale-[1.02] active:scale-[0.98]
                                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {step === 'connecting' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Connecting via GitHub...
                                </span>
                            ) : step === 'binding' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Linking wallet to your account...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Github className="w-5 h-5" />
                                    Activate Wallet via GitHub
                                </span>
                            )}
                        </button>
                    )}

                    {step === 'error' && (
                        <button
                            onClick={() => setStep('idle')}
                            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
