// src/app/skills/page.tsx
// Skills Store 页面 — 公开路由，无需登录即可访问
// 路由：/skills

"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

/* ─── 技能数据定义 ─── */
const SKILLS = [
    {
        id: "search",
        name: "Search",
        emoji: "🔍",
        gradientFrom: "from-blue-500",
        gradientTo: "to-cyan-400",
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
        <motion.a
            href={`/skills/${skill.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index + 0.2, duration: 0.45 }}
            className={`glass-card p-6 border border-slate-700/50 ${skill.borderColor} hover:shadow-lg transition-all duration-300 group block cursor-pointer`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skill.gradientFrom} ${skill.gradientTo} flex items-center justify-center text-2xl shadow-lg`}>
                    {skill.emoji}
                </div>
                {/* 状态徽章：Active 绿色，Beta 橙色 */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${skill.status === "Active"
                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                    : "bg-orange-500/10 text-orange-400 border-orange-500/25"
                    }`}>
                    {skill.status}
                </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{skill.name}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">{skill.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <code className="text-xs text-slate-500 bg-slate-800/70 px-2 py-1 rounded font-mono">{skill.plugin}</code>
                <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                    </svg>
                    <span className="text-xs font-bold text-purple-300">{skill.costPerCall} CR</span>
                    <span className="text-xs text-slate-600">/ call</span>
                </div>
            </div>
        </motion.a>
    );
}

/* ─── Skills Store 主页面 ─────────────────────────────────────────────────
   公开路由：无需登录，任何人均可访问
   ─────────────────────────────────────────────────────────────────────── */
export default function SkillsPage() {
    // 读取 session（公开页面，status 可能为 unauthenticated）
    const { data: session, status } = useSession();
    const [liveCredits, setLiveCredits] = useState<number | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    // 已登录时拉取最新 credits
    const fetchLiveCredits = async () => {
        try {
            const res = await fetch("/api/user/credits");
            if (res.ok) {
                const data = await res.json();
                if (typeof data.credits === "number") setLiveCredits(data.credits);
            }
        } catch (e) {
            console.error("Failed to fetch credits", e);
        }
    };

    useEffect(() => {
        // 仅认证通过后才请求 credits 接口，避免 guest 触发无效请求
        if (status !== "authenticated") return;
        setLiveCredits(session?.user?.credits ?? 500);
        fetchLiveCredits();
        window.addEventListener("focus", fetchLiveCredits);
        return () => window.removeEventListener("focus", fetchLiveCredits);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    /* ── Key 注入逻辑 ──────────────────────────────────────────────────────
       已登录且有 rawKey（首次登录）→ 注入真实 key，显示 Copy 按钮
       已登录但无 rawKey（非首次）→ 占位符，提示去 Dashboard 查看
       未登录 → 占位符，按钮改为 Sign in to get Key
       ─────────────────────────────────────────────────────────────────────── */
    const isLoggedIn = status === "authenticated";
    const rawKey = session?.user?.rawKey;
    const displayKey = isLoggedIn && rawKey ? rawKey : "your_api_key";
    const hasRealKey = isLoggedIn && !!rawKey;
    const isLoading = status === "loading";

    const installCommand = `curl -s https://uniskill.ai/setup-skills.sh | bash -s -- ${displayKey}`;

    const handleCopyInstall = async () => {
        await navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    return (
        // 使用主站 Navbar（已包含 Skills 高亮支持），页面背景与首页保持一致
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            <Navbar />

            {/* 顶部 Navbar 占位（Navbar 是 fixed 定位，需要 padding-top 避免内容被遮挡） */}
            <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">

                {/* ── 页面标题 ── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black text-white">Skills Store</h1>
                    </div>
                    <p className="text-slate-500 text-sm pl-12">Browse and install AI-powered skills for your agent — configured as plugins, not a gateway</p>
                </motion.div>

                {/* ── One-Click Suite Installation ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="mb-8 glass-card p-6 border border-indigo-500/25 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/70 to-indigo-500/0" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-indigo-500/15 rounded-md flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                                        <polyline points="4,17 10,11 4,5" /><line x1="12" y1="19" x2="20" y2="19" />
                                    </svg>
                                </div>
                                <h2 className="text-sm font-bold text-white">One-Click Suite Installation</h2>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Installs all skills as <span className="text-indigo-400 font-medium">tool-mode plugins</span> — your local model settings remain intact.
                            </p>
                        </div>

                        {/* 右侧按钮：根据登录状态条件渲染 */}
                        {isLoading ? (
                            <div className="w-40 h-8 rounded-lg bg-slate-700/50 animate-pulse shrink-0" />
                        ) : isLoggedIn ? (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCopyInstall}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${copied
                                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 hover:border-indigo-400/50"
                                    }`}
                            >
                                {copied ? (
                                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg> Copied!</>
                                ) : (
                                    <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy Command</>
                                )}
                            </motion.button>
                        ) : (
                            // 未登录：登录后跳回 /skills 页面，注入真实 key
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => signIn("github", { callbackUrl: "/skills" })}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60 transition-all shrink-0"
                            >
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                Sign in to get Key
                            </motion.button>
                        )}
                    </div>

                    {/* 终端命令代码块 */}
                    <div className="code-block text-xs leading-relaxed font-mono flex items-start gap-2 overflow-x-auto">
                        <span className="text-slate-600 select-none shrink-0">$</span>
                        <span>
                            <span className="text-blue-400">curl</span>
                            <span className="text-slate-400"> -s </span>
                            <span className="text-green-400">https://uniskill.ai/setup-skills.sh</span>
                            <span className="text-slate-400"> | </span>
                            <span className="text-blue-400">bash</span>
                            <span className="text-slate-400"> -s -- </span>
                            {/* 根据登录状态与 rawKey 动态渲染 key 颜色与内容 */}
                            <span className={hasRealKey ? "text-cyan-400" : "text-slate-500 italic"}>{displayKey}</span>
                        </span>
                    </div>

                    {!hasRealKey && (
                        <p className="mt-3 text-xs text-slate-600">
                            {isLoggedIn
                                ? "⚠ Your key is only shown once at first sign-in. Go to Dashboard to review your account."
                                : "Sign in with GitHub to inject your real API key into this command."}
                        </p>
                    )}
                </motion.div>

                {/* ── Skills 卡片网格 ── */}
                <div>
                    <motion.h2
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
                        className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4"
                    >
                        {SKILLS.length} Available Skills
                    </motion.h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {SKILLS.map((skill, i) => <SkillCard key={skill.id} skill={skill} index={i} />)}
                    </div>
                </div>

                {/* ── Option B 架构说明 ── */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
                    className="mt-10 p-5 rounded-xl border border-slate-700/40 bg-slate-800/20"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-300 mb-1">Option B — Tool Mode Architecture</p>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Skills are registered as individual tool-mode plugins in your agent&apos;s configuration. This preserves your existing local model settings (e.g., Ollama, LM Studio) and only routes specific tool calls through UniSkill. Your API key identifies your account for credit billing.
                            </p>
                        </div>
                    </div>
                </motion.div>

            </main>
        </div>
    );
}
