// frontend/src/components/SkillDetail.tsx
// Logic: V1 Dark Aesthetic + Response Output Schema + Playground Button

"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
// Navbar 需要确保是透明/深色底，去除毛玻璃白光
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Breadcrumbs, { BreadcrumbItem } from "@/components/Breadcrumbs";

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
    visuals?: {
        Icon: any;
        styles: {
            box: string;
            text: string;
            border: string;
            glow: string;
        };
    };
    customBreadcrumbs?: BreadcrumbItem[];
    tags?: string[];
}

export interface SkillDetailProps {
    skill_name: string;
    skill: SkillSpec;
    isOfficial: boolean;
    isOwner: boolean;
    status?: string; // 🌟 新增：显式支持 Private / Community / Official
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

export const SkillDetail: React.FC<SkillDetailProps> = ({ skill_name, skill, isOfficial, isOwner, status }) => {
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
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
            <UnifiedNavbar />

            <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 w-full flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">

                    {/* ── 左侧：主内容区 (7/10) ── */}
                    <div className="lg:col-span-7 space-y-12">
                        <Breadcrumbs 
                            items={skill.customBreadcrumbs || [
                                { label: "Store", href: "/skills" },
                                { label: skill.display_name || skill_name }
                            ]} 
                        />

                        {/* 1. 核心信息与参数组 (Wrapped to isolate from parent space-y-12) */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border transition-all duration-500 ${skill.visuals?.styles.box || 'bg-blue-500/10'} ${skill.visuals?.styles.border || 'border-blue-500/20'} ${skill.visuals?.styles.glow || 'shadow-blue-500/20'} premium-icon-glow shimmer-active`}>
                                    {skill.visuals ? (
                                        <div className={`w-10 h-10 flex items-center justify-center ${skill.visuals.styles.text}`}>
                                            <skill.visuals.Icon weight="duotone" />
                                        </div>
                                    ) : (
                                        <span className="text-3xl">🧩</span>
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
                                         <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase border ${
                                            (status === 'Official' || isOfficial)
                                              ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                              : (status === 'Community')
                                                ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                                                : "bg-slate-500/10 text-slate-400 border-slate-500/25"
                                          }`}>
                                            {status || (isOfficial ? "Official" : "Community")}
                                          </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-lg leading-relaxed max-w-2xl mt-6" style={{ color: "var(--color-text-secondary)" }}>
                                {skill.description}
                            </p>

                            {/* 1.1 标签展示 (Tags) */}
                            {skill.tags && skill.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                                    {skill.tags.map((tag) => (
                                        <span 
                                            key={tag} 
                                            className="px-2.5 py-1 border rounded-lg text-[10px] font-mono font-bold tracking-wider transition-colors uppercase"
                                            style={{ 
                                                backgroundColor: "var(--color-bg-secondary)", 
                                                borderColor: "var(--color-border)",
                                                color: "var(--color-text-secondary)",
                                                opacity: 0.8
                                            }}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                        {/* 2. 参数表区域 */}
                        <div className="border rounded-xl p-6 mt-2" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Parameters Specification</h3>
                            {parameterList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed">
                                        <thead>
                                            <tr className="border-b text-[10px] uppercase" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", opacity: 0.5 }}>
                                                <th className="pb-4 font-semibold w-[20%]">Name</th>
                                                <th className="pb-4 font-semibold w-[15%]">Type</th>
                                                <th className="pb-4 font-semibold w-[15%]">Required</th>
                                                <th className="pb-4 font-semibold w-[50%]">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="transition-colors duration-500">
                                            {parameterList.map((p) => (
                                                <tr key={p.name} className="hover:bg-white/[0.02] transition-colors border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
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
                                 </div>
                            </div>
                            <p className="text-[11px] italic" style={{ color: "var(--color-text-secondary)", opacity: 0.4 }}>Billable in Credits based on execution settings.</p>
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
