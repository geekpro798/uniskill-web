"use client";

import { motion } from "framer-motion";
import QuickstartCard from "./QuickstartCard";

/* ─── 动画配置常量 ───────────────────────────────────────────────────────
   fadeUp: 从下方淡入的通用动画变体，用于主内容区域的入场
   ─────────────────────────────────────────────────────────────────────── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (delay = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

/* ─── HeroSection 组件：着陆页主视觉区域 ──────────────────────────────
   包含：标题、副标题、CTA 按钮、API Token 展示卡片和背景光效
   ─────────────────────────────────────────────────────────────────────── */
export default function HeroSection() {
    return (
        <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-grid pt-32 pb-12">

            {/* ─── 背景装饰：动态光晕球 ─── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* 顶部蓝色光晕 */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/8 blur-[120px]" />
                {/* 左侧紫色光晕 */}
                <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
                {/* 右侧青色光晕 */}
                <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/6 blur-[90px]" />
            </div>

            {/* ─── 主内容容器 ─── */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">

                    {/* 左侧文字内容：在桌面端居左，移动端居中 */}
                    <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
                        {/* 顶部徽章：产品定位标签 */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0}
                            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass-card border border-blue-500/20"
                        >
                            {/* 脉冲指示灯 */}
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                            </span>
                            <span className="text-xs font-semibold text-blue-400 tracking-widest uppercase">
                                The universal skill layer for AI Agents
                            </span>
                        </motion.div>

                        {/* ─── 主标题 ─── */}
                        <motion.h1
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.1}
                            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6"
                        >
                            {/* 第一行：纯白色 */}
                            <span className="text-white block">One Key.</span>
                            {/* 第二行：渐变色强调 */}
                            <span className="gradient-text block">Infinite Skills.</span>
                            {/* 第三行：纯白色 */}
                            <span className="text-white block">Built for Agents.</span>
                        </motion.h1>

                        {/* ─── 副标题 ─── */}
                        <motion.p
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.2}
                            className="text-lg md:text-xl text-slate-400 max-w-2xl lg:max-w-none mb-10 leading-relaxed"
                        >
                            The unified skill layer for autonomous agents.{" "}
                            <span className="text-slate-300">
                                Stop managing API keys, start building intelligence.
                            </span>
                        </motion.p>

                        {/* ─── CTA 按钮组 ─── */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            custom={0.3}
                            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                        >
                            {/* 主 CTA：Get Started */}
                            <motion.button
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base flex items-center justify-center gap-2"
                            >
                                <span>Get Started</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </motion.button>

                            {/* 次级 CTA：View Docs */}
                            <motion.a
                                href="https://docs.uniskill.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.04, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-outline w-full sm:w-auto px-8 py-3.5 text-base flex items-center justify-center gap-2"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14,2 14,8 20,8" />
                                </svg>
                                <span>View Docs</span>
                            </motion.a>
                        </motion.div>
                    </div>

                    {/* 右侧：API Token 展示卡片 */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={0.4}
                        className="lg:pl-6"
                    >
                        <QuickstartCard />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
