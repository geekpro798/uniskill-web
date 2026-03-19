// frontend/src/components/SkillDetail.tsx
// Logic: V1 Dark Aesthetic + Response Output Schema + Playground Button

"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
// Navbar 需要确保是透明/深色底，去除毛玻璃白光
import Navbar from "@/components/Navbar";

// 逻辑：升级后的平台化标准数据规范，新增 returns 字段
export interface SkillSpec {
    display_name: string;
    description: string;
    cost_per_call?: number; 
    credits_per_call?: number;
    usd_per_call?: number;
    payment_type?: 'credits' | 'usd';
    parameters: Record<string, any>;
    returns?: Record<string, any> | null;
    implementation: Record<string, any>;
    gradientFrom?: string;
    gradientTo?: string;
}

export interface SkillDetailProps {
    skill_name: string;
    skill: SkillSpec;
    isOfficial: boolean;
    isOwner: boolean;
}

const META_FALLBACK: Record<string, any> = {
    "uniskill_search": {
        cost: 5, latency: "1.2s", rate: "99.8%",
        returns: {
            "status": "success",
            "data": {
                "results": [
                    { "title": "Example Title", "url": "https://example.com", "snippet": "Example snippet content..." }
                ]
            }
        }
    },
    "uniskill_news": {
        cost: 1, latency: "0.8s", rate: "100%",
        returns: {
            "status": "success",
            "data": {
                "articles": [
                    { "title": "News Headline", "source": "Bloomberg", "published_at": "2023-10-01" }
                ]
            }
        }
    },
    "default": {
        cost: 1, latency: "0.8s", rate: "100%",
        returns: {
            "status": "success",
            "data": {}
        }
    }
};

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors"
        >
            {copied ? "COPIED!" : label}
        </button>
    );
}

export const SkillDetail: React.FC<SkillDetailProps> = ({ skill_name, skill, isOfficial, isOwner }) => {
    const { data: session } = useSession();
    const isLoggedIn = !!session;
    const hasRealKey = isLoggedIn && session.user?.image;
    const displayKey = hasRealKey ? "usk_app_7v2k...9z1" : "YOUR_API_KEY";

    // 逻辑：兼容 JSON Schema 格式与旧版平铺格式
    const properties = skill.parameters?.properties || skill.parameters || {};
    const required = skill.parameters?.required || [];

    const parameterList = Object.keys(properties).map(key => ({
        name: key,
        ...properties[key],
        required: required.includes(key) || properties[key].required
    }));

    const meta = META_FALLBACK[skill_name] || META_FALLBACK["default"];

    // 逻辑：如果网关/数据库还没有返回 returns 字段，或者为空，我们优先使用模拟元数据进行展示
    const finalReturns = (skill.returns && Object.keys(skill.returns).length > 0) ? skill.returns : meta.returns;
    const hasReturns = finalReturns && Object.keys(finalReturns).length > 0;

    const curlCommand = `curl -X POST https://api.uniskill.ai/v1/execute \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skill_name": "${skill_name}",
    "params": {} 
  }'`;

    return (
        <div className="min-h-screen transition-colors duration-500 flex flex-col" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 w-full flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">

                    {/* ── 左侧：主内容区 (7/10) ── */}
                    <div className="lg:col-span-7 space-y-12">

                        {/* 1. 顶部 Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${skill.gradientFrom || "from-blue-500"} ${skill.gradientTo || "to-cyan-400"} flex items-center justify-center text-3xl shadow-2xl`}>
                                    {(skill as any).emoji === "github" ? (
                                        <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    ) : (
                                        (skill as any).emoji || "⚡"
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-extrabold mb-1 tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                                        {skill.display_name || skill_name}
                                    </h1>
                                    <div className="flex items-center gap-3">
                                        {/* 逻辑：副标题/徽章显示给机器执行用的严格 ID */}
                                        <div className="group flex items-center gap-2 border px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer transition-colors"
                                            style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(skill_name);
                                            }}
                                            title="Click to copy Skill ID"
                                        >
                                            <span className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>ID:</span>
                                            <code className="text-blue-400 font-mono text-sm font-bold group-hover:text-blue-500 transition-colors">
                                                {skill_name}
                                            </code>
                                            <svg className="w-4 h-4 transition-colors ml-1" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase border bg-blue-500/10 text-blue-400 border-blue-500/25">
                                            {isOfficial ? "Official" : "Community"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed max-w-2xl mt-6" style={{ color: "var(--color-text-secondary)" }}>
                                {skill.description}
                            </p>

                        {/* 2. 参数表区域 */}
                        <div className="border rounded-xl p-6" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Parameters Specification</h3>
                            {parameterList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed">
                                        <thead>
                                            <tr className="border-b text-[10px] uppercase transition-colors duration-500" style={{ borderColor: "var(--color-border-subtle)", color: "var(--color-text-secondary)", opacity: 0.5 }}>
                                                <th className="pb-4 font-semibold w-[20%]">Name</th>
                                                <th className="pb-4 font-semibold w-[15%]">Type</th>
                                                <th className="pb-4 font-semibold w-[15%]">Required</th>
                                                <th className="pb-4 font-semibold w-[50%]">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y transition-colors duration-500" style={{ borderColor: "var(--color-border-subtle)" }}>
                                            {parameterList.map((p) => (
                                                <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 font-mono text-sm text-cyan-400">{p.name}</td>
                                                    <td className="py-4 text-xs" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>{p.type}</td>
                                                    <td className="py-4 text-xs">
                                                        {p.required ? <span className="text-rose-500 font-bold">Yes</span> : "No"}
                                                    </td>
                                                    <td className="py-4 text-sm leading-relaxed pr-4" style={{ color: "var(--color-text-secondary)" }}>{p.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm italic py-4" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>No parameters required for this skill.</p>
                            )}
                        </div>

                        {/* 3. 返回结果示例 (NEW: Response Schema) */}
                        <div className="border rounded-xl p-6" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Response Example</h3>

                            {/* 逻辑：只有当后端真正传来了内容，才渲染翠绿色代码块，否则显示提示信息 */}
                            {hasReturns ? (
                                <>
                                    <div className="border rounded-lg p-5 overflow-x-auto" style={{ backgroundColor: "var(--color-terminal-bg)", borderColor: "var(--color-border)" }}>
                                        <pre className="text-sm font-mono leading-relaxed" style={{ color: "var(--color-code-string)" }}>
                                            <code>{JSON.stringify(finalReturns, null, 2)}</code>
                                        </pre>
                                    </div>
                                    <p className="text-xs mt-4 italic" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>
                                        * Output is heavily compressed by UniSkill formatter to save LLM context tokens.
                                    </p>
                                </>
                            ) : (
                                <div className="border rounded-lg p-8 flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                                    <p className="text-sm text-slate-500 italic">Example response schema not provided by the developer.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 右侧：统计与集成 (3/10) (维持原样) ── */}
                    <div className="lg:col-span-3 space-y-5">
                        <motion.div className="p-5 border rounded-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Pricing</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Cost per Request</span>
                                <div className="flex items-center gap-3 text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black" style={{ color: "var(--color-text-primary)" }}>{skill.credits_per_call ?? skill.cost_per_call ?? 0}</span>
                                        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>CR</span>
                                     </div>
                                     <span className="text-slate-700 font-bold opacity-30">|</span>
                                     <span className="text-xl font-black font-mono text-emerald-500">{skill.usd_per_call ?? 0} $</span>
                                 </div>
                            </div>
                            <p className="text-[11px] italic" style={{ color: "var(--color-text-secondary)", opacity: 0.4 }}>Billable in Credits or USD based on execution settings.</p>
                        </motion.div>

                        <motion.div className="p-5 border rounded-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Performance</p>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span style={{ color: "var(--color-text-secondary)" }}>Latency</span>
                                    <span className="font-bold text-cyan-400">{meta.latency}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span style={{ color: "var(--color-text-secondary)" }}>Success Rate</span>
                                    <span className="font-bold text-green-400">{meta.rate}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div className="p-5 border rounded-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Integration</p>
                                {hasRealKey && <CopyButton text={curlCommand} />}
                            </div>
                             <div className="code-block text-[11px] font-mono overflow-x-auto p-4 rounded-lg leading-relaxed" style={{ backgroundColor: "var(--color-terminal-bg)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                                <span className="text-blue-500">curl</span> -X POST https://api.uniskill.ai/v1/execute \
                                <br /> -H "Authorization: Bearer <span className={hasRealKey ? "text-cyan-400" : "text-slate-600"}>{displayKey}</span>" \
                                <br /> -d '&#123;"skill_name": "<span className="text-green-500">{skill_name}</span>"&#125;'
                            </div>
                            {!isLoggedIn && (
                                <button
                                    onClick={() => signIn("github")}
                                    className="mt-4 w-full py-2.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                                >
                                    Sign in for API Key
                                </button>
                            )}
                        </motion.div>

                        <div className="pt-2">
                            <Link href="/skills" className="inline-flex items-center text-xs transition-colors" style={{ color: "var(--color-text-secondary)" }}>
                                ← Back to store
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
