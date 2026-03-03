"use client";

// src/app/dashboard/page.tsx
// UniSkill.io Dashboard — 用户登录后的主控制台
// 展示：UniSkill Token（首次登录仅此一次）、剩余配额、快速接入代码

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ─── Token 展示卡片组件 ────────────────────────────────────────────────
   首次登录时显示原始 Token，用户必须立即复制保存，刷新后不可再查
   ─────────────────────────────────────────────────────────────────────── */
function TokenCard({ rawToken }: { rawToken?: string }) {
    const [copied, setCopied] = useState(false);
    const [revealed, setRevealed] = useState(false);

    /* 复制 Token 到剪贴板 */
    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!rawToken) {
        /* 已有 Token（非首次登录） */
        return (
            <div className="glass-card p-6 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-300">Your API Token</p>
                        <p className="text-xs text-slate-500">Token is hidden for security — it was shown once at registration</p>
                    </div>
                </div>
                <div className="code-block flex items-center justify-between gap-4">
                    <span className="text-slate-500">us-••••••••-••••-••••-••••-••••••••••••</span>
                    <span className="text-xs text-slate-600 border border-slate-700 px-2 py-1 rounded">Hidden</span>
                </div>
            </div>
        );
    }

    /* 首次登录：展示原始 Token，提示立即复制 */
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 border border-yellow-500/30 relative overflow-hidden"
        >
            {/* 警告光晕 */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500/0 via-yellow-500/80 to-yellow-500/0" />

            {/* 一次性提示横幅 */}
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-xs text-yellow-400 font-semibold">
                    This token is shown ONCE — copy it now and store it securely
                </span>
            </div>

            <p className="text-sm font-semibold text-slate-300 mb-3">Your API Token</p>

            {/* Token 显示区域 */}
            <div className="code-block flex items-center justify-between gap-4 mb-3">
                <span className={`text-green-400 font-mono text-sm ${!revealed ? "blur-sm select-none" : ""} transition-all`}>
                    {rawToken}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {/* 显示/隐藏 Toggle */}
                    <button
                        onClick={() => setRevealed(!revealed)}
                        className="p-2 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
                        title={revealed ? "Hide token" : "Reveal token"}
                    >
                        {revealed ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                    {/* 复制按钮 */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopy(rawToken)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${copied
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                            }`}
                    >
                        {copied ? (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg> Copied!</>
                        ) : (
                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Copy Token</>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── 配额进度条组件 ─────────────────────────────────────────────────── */
function CreditsBar({ credits = 50, total = 50 }: { credits?: number; total?: number }) {
    const pct = Math.max(0, Math.min(100, (credits / total) * 100));
    const color = pct > 50 ? "from-blue-500 to-cyan-400" : pct > 20 ? "from-yellow-500 to-orange-400" : "from-red-500 to-rose-400";

    return (
        <div className="glass-card p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">Credits Remaining</span>
                </div>
                <span className="text-2xl font-black text-white">{credits}<span className="text-sm text-slate-500 font-normal ml-1">/ {total}</span></span>
            </div>
            {/* 进度条 */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                />
            </div>
            <p className="text-xs text-slate-600 mt-2">Each API call consumes 1 credit · <a href="#" className="text-blue-500 hover:underline">Upgrade plan</a></p>
        </div>
    );
}

/* ─── 快速接入代码示例组件 ───────────────────────────────────────────── */
function QuickstartCard({ token }: { token?: string }) {
    const [copied, setCopied] = useState(false);
    const displayToken = token ?? "us-your-token-here";

    const codeSnippet = `curl https://api.uniskill.io/v1/search \\
  -H "Authorization: Bearer ${displayToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "latest AI agent frameworks"}'`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeSnippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass-card p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                            <polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">Quick Start</span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs text-slate-500 border border-slate-700 hover:border-slate-600 hover:text-slate-300 transition-all"
                >
                    {copied ? "✓ Copied" : "Copy"}
                </motion.button>
            </div>
            <div className="code-block text-xs leading-relaxed whitespace-pre-wrap break-all">
                <span className="text-blue-400">curl</span>
                <span className="text-slate-300"> https://api.uniskill.io/v1/search \</span>{"\n"}
                {"  "}<span className="text-yellow-400">-H</span>
                <span className="text-green-400"> &quot;Authorization: Bearer <span className="text-cyan-400">{displayToken}</span>&quot;</span>{" \\"}{"\n"}
                {"  "}<span className="text-yellow-400">-H</span>
                <span className="text-green-400"> &quot;Content-Type: application/json&quot;</span>{" \\"}{"\n"}
                {"  "}<span className="text-yellow-400">-d</span>
                <span className="text-slate-300"> &apos;&#123;&quot;query&quot;: &quot;latest AI agent frameworks&quot;&#125;&apos;</span>
            </div>
        </div>
    );
}

/* ─── Dashboard 主页面 ──────────────────────────────────────────────────
   受保护路由：未登录自动跳转到 GitHub OAuth 页面
   ─────────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { data: session, status } = useSession();

    // ── ALL HOOKS MUST BE AT TOP LEVEL (React Rules of Hooks) ──
    const initialCredits = session?.user?.credits ?? 50;
    const [liveCredits, setLiveCredits] = useState<number>(initialCredits);

    const fetchLiveCredits = async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/user/credits");
            if (res.ok) {
                const data = await res.json();
                if (typeof data.credits === "number") {
                    setLiveCredits(data.credits);
                }
            }
        } catch (e) {
            console.error("Failed to fetch live credits", e);
        }
    };

    useEffect(() => {
        if (status !== "authenticated") return;
        fetchLiveCredits();
        window.addEventListener("focus", fetchLiveCredits);
        return () => window.removeEventListener("focus", fetchLiveCredits);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    /* 未认证：显示登录提示 */
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-10 text-center max-w-md w-full"
                >
                    <div className="w-14 h-14 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Sign in to UniSkill.io</h1>
                    <p className="text-slate-400 text-sm mb-8">Access your API token and usage dashboard</p>
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => signIn("github")}
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

    /* 加载中 */
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    /* 已登录：渲染 Dashboard */
    /* 已登录：渲染 Dashboard */
    const user = session?.user;
    const rawToken = user?.rawToken;
    const credits = liveCredits;

    return (
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            {/* ─── 顶部 Navbar ─── */}
            <header className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-sm">UniSkill<span className="gradient-text">.io</span></span>
                    </Link>

                    {/* 用户信息 + 登出 */}
                    <div className="flex items-center gap-3">
                        {user?.image && (
                            <img src={user.image} alt={user?.name ?? "User"} className="w-8 h-8 rounded-full border border-slate-700" />
                        )}
                        <span className="hidden sm:block text-sm text-slate-400">{user?.name}</span>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="btn-outline text-xs px-3 py-1.5"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Dashboard 主内容 ─── */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* 欢迎标题 */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl font-black text-white mb-1">
                        Welcome back, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-slate-500 text-sm">Your UniSkill.io API Gateway dashboard</p>
                </motion.div>

                {/* 首次登录一次性 Toast 提醒 */}
                <AnimatePresence>
                    {rawToken && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 px-4 py-3 rounded-lg bg-green-500/8 border border-green-500/20 flex items-center gap-3"
                        >
                            <span className="text-green-400 text-lg">🎉</span>
                            <div>
                                <p className="text-sm font-semibold text-green-400">Account created successfully!</p>
                                <p className="text-xs text-slate-400">Your API token has been provisioned with 50 free credits</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── 卡片网格 ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Token 卡片（跨两列） */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <TokenCard rawToken={rawToken} />
                    </motion.div>

                    {/* 配额卡片 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <CreditsBar credits={credits} total={50} />
                    </motion.div>

                    {/* 快速接入代码 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <QuickstartCard token={rawToken} />
                    </motion.div>
                </div>

                {/* ─── 可用技能列表 ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="mt-5 glass-card p-6 border border-slate-700/50"
                >
                    <p className="text-sm font-semibold text-slate-300 mb-4">Available Skills</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                            { name: "Search", icon: "🔍", color: "blue" },
                            { name: "Scrape", icon: "🕷️", color: "purple" },
                            { name: "News", icon: "📰", color: "cyan" },
                            { name: "Social", icon: "💬", color: "green" },
                            { name: "Extract", icon: "🗂️", color: "yellow" },
                            { name: "Vision", icon: "👁️", color: "pink" },
                        ].map((skill) => (
                            <div key={skill.name} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-default">
                                <span className="text-2xl">{skill.icon}</span>
                                <span className="text-xs font-medium text-slate-400">{skill.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
