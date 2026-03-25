"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ─── 三步流程数据配置 ──────────────────────────────────────────────────
   每个步骤包含：编号、标题、描述、图标 SVG、代码示例片段
   ─────────────────────────────────────────────────────────────────────── */
const steps = [
    {
        number: "01",
        title: "Provision",
        subtitle: "Get your unified key",
        description:
            "Register once on UniSkill and receive a single gateway key. No provider accounts, no individual API key management.",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        ),
        color: "from-blue-500 to-blue-600",
        glowColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "border-blue-500/20",
        snippet: 'key = "us-xxxx-xxxx"',
        snippetColor: "var(--color-code-keyword)",
        badge: "1 Key",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
        number: "02",
        title: "Connect",
        subtitle: "Route through UniSkill Gateway",
        description:
            "Point your AI agent to the UniSkill endpoint. Works with any framework — LangChain, AutoGen, CrewAI, or custom agents.",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 10h4l-8-8-8 8h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7z" />
                <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
            </svg>
        ),
        color: "from-purple-500 to-purple-600",
        glowColor: "rgba(139, 92, 246, 0.2)",
        borderColor: "border-purple-500/20",
        snippet: 'base_url = "api.uniskill.ai"',
        snippetColor: "var(--color-code-string)",
        badge: "Zero Config",
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
        number: "03",
        title: "Execute",
        subtitle: "Access every skill instantly",
        description:
            "Your agent can now call Search, Scrape, Social, and more — all through one unified interface. UniSkill handles routing, auth, and billing.",
        icon: (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
            </svg>
        ),
        color: "from-cyan-500 to-cyan-600",
        glowColor: "rgba(6, 182, 212, 0.2)",
        borderColor: "border-cyan-500/20",
        snippet: "skills: [Search, Scrape, Social]",
        snippetColor: "var(--color-code-keyword)",
        badge: "All Skills",
        badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    },
];

/* ─── HowItWorks 组件：主流程说明区块 ─────────────────────────────────
   使用 useInView 钩子实现卡片滚动触发动画
   ─────────────────────────────────────────────────────────────────────── */
export default function HowItWorks() {
    /* 整个 Section 的 InView 引用 */
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

    return (
        <section
            ref={sectionRef}
            id="how-it-works"
            className="relative pt-12 pb-24 overflow-hidden"
            style={{ backgroundColor: "var(--color-bg-primary)" }}
        >
            {/* ─── 背景光晕装饰 ─── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* ─── 区块标题 ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-6"
                >
                    {/* 小标签 */}
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase text-purple-400 border border-purple-500/30 bg-purple-500/5 mb-5">
                        How It Works
                    </span>
                    {/* 主标题 */}
                    <h2 className="text-4xl md:text-5xl font-black leading-tight mb-[15px] max-w-4xl mx-auto" style={{ color: "var(--color-text-primary)" }}>
                        From Zero to{" "}
                        <span className="gradient-text">Full Capability</span>{" "}
                        in 3 Steps
                    </h2>
                    {/* 副标题 */}
                    <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
                        No provider accounts. No credential rotation. No rate limit headaches.
                    </p>
                </motion.div>

                {/* ─── 三步卡片网格 ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">

                    {/* 步骤卡片之间的连接线（仅桌面端显示） */}
                    <div className="hidden md:block absolute top-[72px] left-[33%] right-[33%] h-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.1 + index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                            className="group relative"
                        >
                            {/* 卡片主体 */}
                            <div
                                className={`glass-card h-full p-8 border-slate-200 dark:${step.borderColor} relative overflow-hidden transition-all duration-300 hover:-translate-y-1`}
                                style={{
                                    boxShadow: `0 0 0 0 ${step.glowColor}`,
                                }}
                                onMouseEnter={(e) => {
                                    /* 鼠标悬停时激活光晕效果 */
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${step.glowColor}, 0 0 80px ${step.glowColor.replace("0.2", "0.05")}`;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 transparent";
                                }}
                            >
                                {/* 卡片顶部：步骤编号 + 图标 */}
                                <div className="flex items-start justify-between mb-6">
                                    {/* 图标容器 */}
                                    <div
                                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} p-3 text-white flex items-center justify-center`}
                                    >
                                        {step.icon}
                                    </div>

                                    {/* 步骤编号 */}
                                    <span className="text-6xl font-black text-slate-900/5 dark:text-white/5 font-mono leading-none">
                                        {step.number}
                                    </span>
                                </div>

                                {/* 步骤标题 */}
                                <h3 className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{step.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-3">{step.subtitle}</p>

                                {/* 步骤描述 */}
                                <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
                                    {step.description}
                                </p>

                                <div className="code-block mb-4 font-bold text-[13px]">
                                    <span style={{ color: "var(--color-code-flag)" }}>$ </span>
                                    <span style={{ color: step.snippetColor }}>{step.snippet}</span>
                                </div>

                                {/* 功能徽章 */}
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${step.badgeColor}`}>
                                    ✦ {step.badge}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>


            </div>
        </section>
    );
}
