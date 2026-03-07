// src/app/skills/page.tsx
// Logic: Dynamic Skills Store Page using Client-side fetching

"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

// 逻辑：定义从网关 API 拉取到的动态技能结构
interface DynamicSkill {
    id: string;
    name: string;
    description: string;
    isOfficial: boolean;
}

/**
 * Logic: A helper to assign beautiful UI metadata based on skill ID
 * 逻辑：根据动态技能 ID，自动映射分配对应的图标和渐变色，保留原有的优秀 UI 质感
 */
function getSkillTheme(id: string) {
    const themes: Record<string, any> = {
        "uniskill_search": { emoji: "🔍", from: "from-blue-500", to: "to-cyan-400", border: "hover:border-blue-500/40", cost: 1 },
        "uniskill_scrape": { emoji: "🕷️", from: "from-purple-500", to: "to-violet-400", border: "hover:border-purple-500/40", cost: 2 },
        "uniskill_news": { emoji: "📰", from: "from-cyan-500", to: "to-teal-400", border: "hover:border-cyan-500/40", cost: 1 },
        "uniskill_social": { emoji: "💬", from: "from-green-500", to: "to-emerald-400", border: "hover:border-green-500/40", cost: 3 },
        "uniskill_extract": { emoji: "🗂️", from: "from-yellow-500", to: "to-amber-400", border: "hover:border-yellow-500/40", cost: 2 },
        "uniskill_vision": { emoji: "👁️", from: "from-pink-500", to: "to-rose-400", border: "hover:border-pink-500/40", cost: 5 },
        // 逻辑：为未知/新上传的技能提供一个通用的优美默认主题
        "default": { emoji: "⚡", from: "from-indigo-500", to: "to-purple-500", border: "hover:border-indigo-500/40", cost: 5 }
    };
    return themes[id] || themes["default"];
}

/* ─── 动态技能卡片组件 ─── */
function SkillCard({ skill, index }: { skill: DynamicSkill; index: number }) {
    // 逻辑：获取该技能对应的 UI 主题
    const theme = getSkillTheme(skill.id);

    return (
        <motion.a
            href={`/skills/${skill.id}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index + 0.2, duration: 0.45 }}
            className={`glass-card p-6 border border-slate-700/50 ${theme.border} hover:shadow-lg transition-all duration-300 group block cursor-pointer`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center text-2xl shadow-lg`}>
                    {theme.emoji}
                </div>
                {/* 逻辑：根据是否为官方技能，动态渲染徽章状态 */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${skill.isOfficial
                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/25"
                    }`}>
                    {skill.isOfficial ? "Official" : "Community"}
                </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{skill.name}</h3>
            {/* 逻辑：如果描述过长，进行优雅截断 */}
            <p className="text-sm text-slate-400 leading-relaxed mb-5 line-clamp-3">{skill.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                <code className="text-xs text-slate-500 bg-slate-800/70 px-2 py-1 rounded font-mono">{skill.id}</code>
                <div className="flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                    </svg>
                    <span className="text-xs font-bold text-purple-300">{theme.cost} CR</span>
                    <span className="text-xs text-slate-600">/ call</span>
                </div>
            </div>
        </motion.a>
    );
}

/* ─── Skills Store 主页面 ─── */
export default function SkillsPage() {
    const { data: session, status } = useSession();
    const [liveCredits, setLiveCredits] = useState<number | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    // 逻辑：新增技能列表状态和加载状态
    const [skills, setSkills] = useState<DynamicSkill[]>([]);
    const [isLoadingSkills, setIsLoadingSkills] = useState(true);

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

    // 逻辑：组件挂载时，从网关拉取真实的 KV 技能列表
    useEffect(() => {
        async function fetchSkills() {
            try {
                // 注意：使用环境变量或真实网关域名，并去除可能自带的 /v1 尾巴
                const rawGatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://api.uniskill.ai';
                const gatewayUrl = rawGatewayUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
                const res = await fetch(`${gatewayUrl}/v1/skills`);
                const json = await res.json();
                if (json.success) {
                    setSkills(json.data);
                }
            } catch (error) {
                console.error("Failed to load skills from gateway:", error);
            } finally {
                setIsLoadingSkills(false);
            }
        }
        fetchSkills();
    }, []);

    useEffect(() => {
        if (status !== "authenticated") return;
        setLiveCredits(session?.user?.credits ?? 500);
        fetchLiveCredits();
        window.addEventListener("focus", fetchLiveCredits);
        return () => window.removeEventListener("focus", fetchLiveCredits);
    }, [status]);

    const isLoggedIn = status === "authenticated";
    const rawKey = session?.user?.rawKey;
    const displayKey = isLoggedIn && rawKey ? rawKey : "your_api_key";
    const hasRealKey = isLoggedIn && !!rawKey;
    const isLoadingAuth = status === "loading";

    const installCommand = `curl -s https://uniskill.ai/setup-skills.sh | bash -s -- ${displayKey}`;

    const handleCopyInstall = async () => {
        await navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    return (
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            <Navbar />
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
                        {isLoadingAuth ? (
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
                <div className="mt-12">
                    <motion.h2
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.4 }}
                        className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4"
                    >
                        {isLoadingSkills ? "Loading Skills..." : `${skills.length} Available Skills`}
                    </motion.h2>

                    {/* 逻辑：数据加载完毕后动态渲染，否则显示骨架屏或空状态 */}
                    {isLoadingSkills ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {skills.map((skill, i) => <SkillCard key={skill.id} skill={skill} index={i} />)}
                        </div>
                    )}
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
