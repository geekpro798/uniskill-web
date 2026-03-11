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
    name: string;
    description: string;
    costPerCall?: number; // 👈 补全定价字段
    parameters: Record<string, any>;
    returns?: Record<string, any> | null;
    implementation: Record<string, any>;
}

export interface SkillDetailProps {
    skillId: string;
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

export const SkillDetail: React.FC<SkillDetailProps> = ({ skillId, skill, isOfficial, isOwner }) => {
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

    const meta = META_FALLBACK[skillId] || META_FALLBACK["default"];

    // 逻辑：如果网关/数据库还没有返回 returns 字段，或者为空，我们优先使用模拟元数据进行展示
    const finalReturns = (skill.returns && Object.keys(skill.returns).length > 0) ? skill.returns : meta.returns;
    const hasReturns = finalReturns && Object.keys(finalReturns).length > 0;

    const curlCommand = `curl -X POST https://api.uniskill.ai/v1/execute \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skillName": "${skillId}",
    "params": {} 
  }'`;

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-slate-300 flex flex-col">
            {/* 逻辑：强制全局覆盖，防止 Next.js 默认的 body 白色底色露出 */}
            <style dangerouslySetInnerHTML={{ __html: `html, body { background-color: #0a0f1e !important; }` }} />
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 w-full flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">

                    {/* ── 左侧：主内容区 (7/10) ── */}
                    <div className="lg:col-span-7 space-y-12">

                        {/* 1. 顶部 Header */}
                        <div className="mb-8">
                            {/* 逻辑：主标题显示给人类看的友好 Name */}
                            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                                {skill.name || skillId}
                            </h1>

                            <div className="flex items-center gap-3">
                                {/* 逻辑：副标题/徽章显示给机器执行用的严格 ID，并配有一键复制功能 */}
                                <div className="group flex items-center gap-2 bg-[#050810]/80 border border-slate-700/80 px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer hover:border-blue-500/50 transition-colors"
                                    onClick={() => {
                                        navigator.clipboard.writeText(skillId);
                                        // TODO: Add toast notification if needed
                                    }}
                                    title="Click to copy Skill ID"
                                >
                                    <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">ID:</span>
                                    <code className="text-blue-400 font-mono text-sm font-bold group-hover:text-blue-300 transition-colors">
                                        {skillId}
                                    </code>
                                    <svg className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>

                                {/* 逻辑：其他状态徽章，如官方认证 */}
                                <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase border bg-blue-500/10 text-blue-400 border-blue-500/25">
                                    {isOfficial ? "Official" : "Community"}
                                </span>
                            </div>

                            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mt-6">
                                {skill.description}
                            </p>
                        </div>

                        {/* 2. 参数表区域 */}
                        <div className="border border-slate-800/80 rounded-xl p-6 bg-[#0a0f1e]">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Parameters Specification</h3>
                            {parameterList.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left table-fixed">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[10px] text-slate-600 uppercase">
                                                <th className="pb-4 font-semibold w-[20%]">Name</th>
                                                <th className="pb-4 font-semibold w-[15%]">Type</th>
                                                <th className="pb-4 font-semibold w-[15%]">Required</th>
                                                <th className="pb-4 font-semibold w-[50%]">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {parameterList.map((p) => (
                                                <tr key={p.name} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="py-4 font-mono text-sm text-cyan-400">{p.name}</td>
                                                    <td className="py-4 text-xs text-slate-500">{p.type}</td>
                                                    <td className="py-4 text-xs">
                                                        {p.required ? <span className="text-rose-500">Yes</span> : "No"}
                                                    </td>
                                                    <td className="py-4 text-sm text-slate-400 leading-relaxed pr-4">{p.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic py-4">No parameters required for this skill.</p>
                            )}
                        </div>

                        {/* 3. 返回结果示例 (NEW: Response Schema) */}
                        <div className="border border-slate-800/80 rounded-xl p-6 bg-[#0a0f1e]">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6">Response Example</h3>

                            {/* 逻辑：只有当后端真正传来了内容，才渲染翠绿色代码块，否则显示提示信息 */}
                            {hasReturns ? (
                                <>
                                    <div className="bg-[#050810] border border-slate-800/50 rounded-lg p-5 overflow-x-auto">
                                        <pre className="text-sm font-mono text-emerald-400 leading-relaxed">
                                            <code>{JSON.stringify(finalReturns, null, 2)}</code>
                                        </pre>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-4 italic">
                                        * Output is heavily compressed by UniSkill formatter to save LLM context tokens.
                                    </p>
                                </>
                            ) : (
                                <div className="bg-[#050810] border border-slate-800/50 rounded-lg p-8 flex items-center justify-center">
                                    <p className="text-sm text-slate-500 italic">Example response schema not provided by the developer.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 右侧：统计与集成 (3/10) (维持原样) ── */}
                    <div className="lg:col-span-3 space-y-5">
                        <motion.div className="p-5 border border-slate-800/80 rounded-xl bg-[#0a0f1e]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pricing</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-300">Cost per Request</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-xl font-black text-white">{skill.costPerCall ?? 0}</span>
                                    <span className="text-[10px] text-slate-500 ml-0.5 font-bold">CR</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-600 italic">Credits deducted per API call.</p>
                        </motion.div>

                        <motion.div className="p-5 border border-slate-800/80 rounded-xl bg-[#0a0f1e]">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Performance</p>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Latency</span>
                                    <span className="font-bold text-cyan-400">{meta.latency}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Success Rate</span>
                                    <span className="font-bold text-green-400">{meta.rate}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div className="p-5 border border-slate-800/80 rounded-xl bg-[#0a0f1e]">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Integration</p>
                                {hasRealKey && <CopyButton text={curlCommand} />}
                            </div>
                            <div className="code-block text-[11px] font-mono overflow-x-auto bg-[#050810] border border-slate-800/50 p-4 rounded-lg leading-relaxed text-slate-300">
                                <span className="text-blue-400">curl</span> -X POST https://api.uniskill.ai/v1/execute \
                                <br /> -H "Authorization: Bearer <span className={hasRealKey ? "text-cyan-400" : "text-slate-600"}>{displayKey}</span>" \
                                <br /> -d '&#123;"skillName": "<span className="text-green-400">{skillId}</span>"&#125;'
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
                            <Link href="/skills" className="inline-flex items-center text-xs text-slate-500 hover:text-white transition-colors">
                                ← Back to store
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
