"use client";

// src/components/SignInModal.tsx
// GitHub OAuth 弹窗授权确认 Modal
// 流程：确认弹窗 → 打开 OAuth 小窗口 → 授权成功 → 自动关闭 + 刷新 Session

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ─── 打开 GitHub OAuth 弹窗的工具函数 ──────────────────────────────────
   使用 window.open 在居中小窗口中打开 GitHub 授权页
   ─────────────────────────────────────────────────────────────────────── */
function openOAuthPopup(url: string): Window | null {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    return window.open(
        url,
        "github-oauth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
}

/* ─── SignInModal Props ─── */
interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/* ─── SignInModal 组件 ──────────────────────────────────────────────────
   三个阶段：idle（等待确认）→ authorizing（弹窗已打开，等待授权）→ success（授权完成）
   ─────────────────────────────────────────────────────────────────────── */
export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
    const [phase, setPhase] = useState<"idle" | "authorizing" | "success">("idle");
    const popupRef = useRef<Window | null>(null);
    const { update: updateSession } = useSession();
    const router = useRouter();

    /* ─── 监听来自 popup-success 页面的 postMessage ─── */
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            /* 安全校验：只接受同域消息 */
            if (event.origin !== window.location.origin) return;
            if (event.data !== "uniskill-auth-success") return;

            /* 收到授权成功信号 */
            setPhase("success");
            popupRef.current?.close();

            /* 刷新 NextAuth Session，让主页感知到登录状态变化 */
            await updateSession();

            /* 短暂展示成功状态后关闭 Modal，跳转 Dashboard */
            setTimeout(() => {
                onClose();
                setPhase("idle");
                router.push("/dashboard");
                router.refresh();
            }, 1200);
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [onClose, updateSession, router]);

    /* 重置阶段（Modal 关闭时） */
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setPhase("idle"), 300);
        }
    }, [isOpen]);

    /* ─── 点击授权按钮：打开 GitHub OAuth 弹窗 ─── */
    const handleAuthorize = () => {
        /* callbackUrl 指向自动关闭的 popup-success 页面 */
        const callbackUrl = `${window.location.origin}/auth/popup-success`;
        const oauthUrl = `/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        popupRef.current = openOAuthPopup(oauthUrl);
        setPhase("authorizing");

        /* 如果用户关闭了弹窗但没完成授权，恢复 idle */
        const checkClosed = setInterval(() => {
            if (popupRef.current?.closed && phase !== "success") {
                setPhase("idle");
                clearInterval(checkClosed);
            }
        }, 500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ─── 背景遮罩 ─── */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                        onClick={() => phase === "idle" && onClose()}
                    />

                    {/* ─── Modal 内容 ─── */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="glass-card w-full max-w-sm p-8 text-center pointer-events-auto relative overflow-hidden">
                            {/* 顶部渐变装饰线 */}
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-purple-500/0" />

                            {/* ─── Phase: idle — 确认授权 ─── */}
                            {phase === "idle" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* 图标 */}
                                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-black text-white mb-2">Sign in to UniSkill.io</h2>
                                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                        We'll open a small window to authorize your GitHub account. No passwords stored.
                                    </p>

                                    {/* GitHub 授权按钮 */}
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleAuthorize}
                                        className="btn-primary w-full flex items-center justify-center gap-3 mb-3"
                                    >
                                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <span>Continue with GitHub</span>
                                    </motion.button>

                                    {/* 取消 */}
                                    <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
                                        Cancel
                                    </button>
                                </motion.div>
                            )}

                            {/* ─── Phase: authorizing — 等待弹窗中完成授权 ─── */}
                            {phase === "authorizing" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-4">
                                    <div className="w-12 h-12 mx-auto mb-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                    <p className="text-white font-semibold mb-1">Waiting for authorization...</p>
                                    <p className="text-slate-400 text-sm">Complete the sign-in in the popup window</p>
                                    <button
                                        onClick={() => { popupRef.current?.focus(); }}
                                        className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-2"
                                    >
                                        Click here if the popup was blocked
                                    </button>
                                </motion.div>
                            )}

                            {/* ─── Phase: success — 授权成功 ─── */}
                            {phase === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-4"
                                >
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                                        <motion.svg
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{ duration: 0.4, delay: 0.1 }}
                                            width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"
                                        >
                                            <polyline points="20,6 9,17 4,12" />
                                        </motion.svg>
                                    </div>
                                    <p className="text-white font-bold mb-1">Authorization Successful!</p>
                                    <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
