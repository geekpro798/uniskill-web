"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import QuickstartCard from "./QuickstartCard";
import { useState, useEffect } from "react";

/* ─── 动画配置常量 ─────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

export default function HeroSection() {
    const [isMobile, setIsMobile] = useState(false);
    const { scrollY } = useScroll();

    // 响应式监听：判断是否为移动端
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 视差滚动偏移量：仅在桌面端生效
    const y1 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 100]);
    const y2 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : -50]);
    const y3 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 150]);

    return (
        <section 
            className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-grid pt-32 pb-8"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
        >

            {/* ─── 背景装饰：动态光晕球 (支持视差效果) ─── */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div 
                    style={{ y: y1 }}
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[120px]" 
                />
                <motion.div 
                    style={{ y: y2 }}
                    className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" 
                />
                <motion.div 
                    style={{ y: y3 }}
                    className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[90px]" 
                />
            </div>

            {/* ─── 主内容容器 ─── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* 左侧文字内容 */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0}
                            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass-card border border-blue-500/20"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                            </span>
                            <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">
                                The universal skill layer for AI Agents
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.1}
                            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
                            style={{ color: "var(--color-text-primary)" }}
                        >
                            <span className="block">One Identity.</span>
                            <span className="gradient-text block">Infinite Skills.</span>
                            <span className="block">Built for Agents.</span>
                        </motion.h1>

                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.2}
                            className="text-lg md:text-xl max-w-2xl lg:max-w-none mb-10 leading-relaxed"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            The unified skill layer for autonomous agents.{" "}
                            <span style={{ opacity: 0.8 }}>
                                No credentials to manage. Just connect your wallet and every skill is ready.
                            </span>
                        </motion.p>

                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.3}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                        >
                            <HeroCTA />
                            <motion.a
                                href="https://docs.uniskill.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="px-8 py-4 bg-transparent border border-[var(--color-border)] dark:border-white/10 text-[var(--color-text-primary)] dark:text-white font-bold rounded-2xl hover:border-blue-500/50 transition-all text-center flex items-center justify-center gap-2 group h-[56px] transition-all"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                </svg>
                                <span>View Docs</span>
                            </motion.a>
                        </motion.div>
                    </div>

                    {/* 右侧：Interactive Terminal 展示 */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.4}
                        className="lg:pl-6 w-full"
                    >
                        <QuickstartCard />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

/* ─── HeroCTA 组件：根据登录状态渲染不同的主按钮 ────────────────────────── */
function HeroCTA() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="w-full sm:w-[160px] h-[56px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        );
    }

    if (session) {
        return (
            <Link href="/dashboard" className="w-full sm:w-auto">
                <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary w-full px-8 py-4 text-base flex items-center justify-center gap-2 h-[56px]"
                >
                    <span>Go to Dashboard</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </motion.button>
            </Link>
        );
    }

    return (
        <motion.button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full sm:w-auto px-8 py-4 text-base flex items-center justify-center gap-2 h-[56px]"
        >
            <span>Get Started</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
        </motion.button>
    );
}
