// src/app/dashboard/skills/page.tsx
// Skills Store 页面 — 展示所有可用技能及一键安装脚本
// 路由：/dashboard/skills

"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

/* ─── 技能数据定义 ─────────────────────────────────────────────────────────
   每个技能包含：名称、图标 SVG、描述、状态（Active/Beta）、每次调用消耗 credits
   ─────────────────────────────────────────────────────────────────────── */
const SKILLS = [
    {
        id: "search",
        name: "Search",
        emoji: "🔍",
        gradientFrom: "from-blue-500",
        gradientTo: "to-cyan-400",
        glowColor: "shadow-blue-500/20",
        borderColor: "hover:border-blue-500/40",
        description: "AI-powered web search with semantic ranking. Returns structured results with titles, URLs, and summaries from across the web.",
        status: "Active" as const,
        costPerCall: 1,
        plugin: "uniskill_search",
    },
    {
        id: "scrape",
        name: "Scrape",
        emoji: "🕷️",
        gradientFrom: "from-purple-500",
        gradientTo: "to-violet-400",
        glowColor: "shadow-purple-500/20",
        borderColor: "hover:border-purple-500/40",
        description: "Extract full-page content from any URL. Handles JavaScript-rendered pages, returns clean markdown-formatted text.",
        status: "Active" as const,
        costPerCall: 2,
        plugin: "uniskill_scrape",
    },
    {
        id: "news",
        name: "News",
        emoji: "📰",
        gradientFrom: "from-cyan-500",
        gradientTo: "to-teal-400",
        glowColor: "shadow-cyan-500/20",
        borderColor: "hover:border-cyan-500/40",
        description: "Real-time news aggregation from 50,000+ sources. Filter by topic, region, and recency. Results include sentiment scores.",
        status: "Active" as const,
        costPerCall: 1,
        plugin: "uniskill_news",
    },
    {
        id: "social",
        name: "Social",
        emoji: "💬",
        gradientFrom: "from-green-500",
        gradientTo: "to-emerald-400",
        glowColor: "shadow-green-500/20",
        borderColor: "hover:border-green-500/40",
        description: "Monitor social media trends across Twitter/X, Reddit, and HN. Extract insights, track mentions, and analyze engagement.",
        status: "Beta" as const,
        costPerCall: 3,
        plugin: "uniskill_social",
    },
    {
        id: "extract",
        name: "Extract",
        emoji: "🗂️",
        gradientFrom: "from-yellow-500",
        gradientTo: "to-amber-400",
        glowColor: "shadow-yellow-500/20",
        borderColor: "hover:border-yellow-500/40",
        description: "Structured data extraction from documents, PDFs, and web pages. Output clean JSON matching your defined schema.",
        status: "Active" as const,
        costPerCall: 2,
        plugin: "uniskill_extract",
    },
    {
        id: "vision",
        name: "Vision",
        emoji: "👁️",
        gradientFrom: "from-pink-500",
        gradientTo: "to-rose-400",
        glowColor: "shadow-pink-500/20",
        borderColor: "hover:border-pink-500/40",
        description: "Analyze images, screenshots, and charts with multimodal AI. Extract text, describe scenes, and answer visual questions.",
        status: "Beta" as const,
        costPerCall: 5,
        plugin: "uniskill_vision",
    },
];

/* ─── 技能卡片组件 ─── */
function SkillCard({ skill, index }: { skill: typeof SKILLS[0]; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index + 0.2, duration: 0.45 }}
            className={`glass-card p-6 border border-slate-700/50 ${skill.borderColor} ${skill.glowColor} hover:shadow-lg transition-all duration-300 group`}
        >
            {/* 顶部：图标 + 状态标签 */}
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skill.gradientFrom} ${skill.gradientTo} flex items-center justify-center text-2xl shadow-lg`}>
                    {skill.emoji}
                </div>
                {/* 状态徽章：Active 绿色，Beta 橙色 */}
                <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${skill.status === "Active"
                            ? "bg-green-500/10 text-green-400 border-green-500/25"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/25"
                        }`}
                >
                    {skill.status}
                </span>
            </div>

            {/* 技能名称 */}
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{skill.name}</h3>

            {/* 描述 */}
            <p className="text-sm text-slate-400 leading-relaxed mb-5">{skill.description}</p>

            {/* 底部：Plugin 标识 + 费用 */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                {/* Plugin 名称（用于 LLM 工具调用） */}
                <code className="text-xs text-slate-500 bg-slate-800/70 px-2 py-1 rounded font-mono">
                    {skill.plugin}
                </code>
                {/* 每次调用费用（CR = credit）*/}
                <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                    </svg>
                    <span className="text-xs font-bold text-purple-300">{skill.costPerCall} CR</span>
                    <span className="text-xs text-slate-600">/ call</span>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Skills Store 主页面 ─────────────────────────────────────────────────
   受保护路由：未登录用户不可访问
   ─────────────────────────────────────────────────────────────────────── */
export default function SkillsPage() {
    const { data: session, status } = useSession();
    // 实时 credits 状态（初始值从 session 读取）
    const [liveCredits, setLiveCredits] = useState<number>(session?.user?.credits ?? 50);
    const [copied, setCopied] = useState(false);

    // 从 API 路由获取最新 credits
    const fetchLiveCredits = async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/user/credits");
            if (res.ok) {
                const data = await res.json();
                if (typeof data.credits === "number") setLiveCredits(data.credits);
            }
        } catch (e) {
            console.error("Failed to fetch credits on skills page", e);
        }
    };

    // 页面挂载 + 窗口获得焦点时刷新 credits
    useEffect(() => {
        if (status !== "authenticated") return;
        fetchLiveCredits();
        window.addEventListener("focus", fetchLiveCredits);
        return () => window.removeEventListener("focus", fetchLiveCredits);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // 用户会话中的 rawApiToken（Option B Tool Mode 脚本命令注入）
    const rawApiToken = session?.user?.rawToken;
    // 若 token 不可用（非首次登录），显示占位符提示
    const displayToken = rawApiToken ?? "your-token-here";

    // 一键 Suite 安装命令：使用 install-skills.sh 以 Tool Mode 配置一组插件
    const installCommand = `curl -s https://uniskill.io/install-skills.sh | bash -s -- ${displayToken}`;

    const handleCopyInstall = async () => {
        await navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    /* ── 未登录状态处理 ── */
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-10 text-center max-w-md w-full"
                >
                    <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                        ⚡
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Sign in to view Skills Store</h1>
                    <p className="text-slate-400 text-sm mb-8">Access the full library of UniSkill plugins</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => signIn("github", { callbackUrl: "/dashboard/skills" })}
                        className="btn-primary w-full flex items-center justify-center gap-3"
                    >
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span>Continue with GitHub</span>
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    /* ── 加载中状态 ── */
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading Skills Store...</span>
                </div>
            </div>
        );
    }

    /* ── 已登录：渲染完整 Skills Store 页面 ── */
    return (
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            {/* ── Navbar：复用共享 DashboardNavbar 组件，传入实时 credits ── */}
            <DashboardNavbar credits={liveCredits} totalCredits={50} />

            <main className="max-w-5xl mx-auto px-6 py-10">

                {/* ── 页面标题 ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        {/* Zap 图标装饰 */}
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-white">Skills Store</h1>
                    </div>
                    <p className="text-slate-500 text-sm pl-12">Browse and install AI-powered skills for your agent — configured as plugins, not a gateway</p>
                </motion.div>

                {/* ── One-Click Suite Installation 区域 ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-8 glass-card p-6 border border-indigo-500/25 relative overflow-hidden"
                >
                    {/* 顶部光晕线 */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/70 to-indigo-500/0" />

                    {/* 标题行 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {/* 终端图标 */}
                                <div className="w-6 h-6 bg-indigo-500/15 rounded-md flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                                        <polyline points="4,17 10,11 4,5" />
                                        <line x1="12" y1="19" x2="20" y2="19" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-white">One-Click Suite Installation</h2>
                            </div>
                            {/* Option B Tool Mode 说明 */}
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Installs all skills as <span className="text-indigo-400 font-medium">tool-mode plugins</span> — your local model settings remain intact.
                            </p>
                        </div>

                        {/* 复制按钮 */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyInstall}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${copied
                                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400/50"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copy Command
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* 终端命令代码块 */}
                    <div className="code-block text-xs leading-relaxed font-mono flex items-start gap-2 overflow-x-auto">
                        <span className="text-slate-600 select-none shrink-0">$</span>
                        <span>
                            <span className="text-blue-400">curl</span>
                            <span className="text-slate-400"> -s </span>
                            {/* 安装脚本 URL：使用 install-skills.sh 以区别于通用 install.sh */}
                            <span className="text-green-400">https://uniskill.io/install-skills.sh</span>
                            <span className="text-slate-400"> | </span>
                            <span className="text-blue-400">bash</span>
                            <span className="text-slate-400"> -s -- </span>
                            {/* 注入用户 token：首次登录有值则高亮，否则显示占位符 */}
                            <span className={rawApiToken ? "text-cyan-400" : "text-slate-500 italic"}>
                                {displayToken}
                            </span>
                        </span>
                    </div>

                    {/* 若 token 不可用，显示提示 */}
                    {!rawApiToken && (
                        <p className="mt-3 text-xs text-amber-600/70">
                            ⚠ Your token is only shown once at first login — re-sign in or copy it from the Overview page.
                        </p>
                    )}
                </motion.div>

                {/* ── Skills 卡片网格 ── */}
                <div>
                    <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4"
                    >
                        {SKILLS.length} Available Skills
                    </motion.h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {SKILLS.map((skill, i) => (
                            <SkillCard key={skill.id} skill={skill} index={i} />
                        ))}
                    </div>
                </div>

                {/* ── 底部 Option B 架构说明 ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-10 p-5 rounded-xl border border-slate-700/40 bg-slate-800/20"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Option B — Tool Mode Architecture</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Skills are registered as individual tool-mode plugins in your agent&apos;s configuration. This preserves your existing local model settings (e.g., Ollama, LM Studio) and only routes specific tool calls through UniSkill. Your API key in the command above identifies your account for credit billing.
                            </p>
                        </div>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
