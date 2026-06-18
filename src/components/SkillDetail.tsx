// frontend/src/components/SkillDetail.tsx
// Logic: V7 Unified Detail Dispatcher (Hybrid Runtime Mode)
// Standards: 100% Isolation for Legacy vs Industrial UI

"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Breadcrumbs, { BreadcrumbItem } from "@/components/Breadcrumbs";
import { CliSkillDetail } from "./skills/CliSkillDetail";

export interface SkillSpec {
    display_name: string;
    description: string;
    cost_per_call?: number;
    credits_per_call?: number;
    parameters: Record<string, any>;
    returns?: Record<string, any> | null;
    implementation: Record<string, any>;
    visuals?: any;
    markdown_manifest?: string;
    customBreadcrumbs?: BreadcrumbItem[];
    tags?: string[];
}

export interface SkillDetailProps {
    skill_name: string;
    skill: SkillSpec;
    isOfficial: boolean;
    isOwner: boolean;
    status?: string; 
}

/**
 * ==========================================
 *枢纽组件 (The Dispatcher)
 * ==========================================
 */
export const SkillDetail: React.FC<SkillDetailProps> = (props) => {
  const { skill } = props;
  
  // 🌟 核心分发逻辑：识别运行时类型 (Runtime Identity Check)
  if (skill.implementation?.type === 'cli') {
    return <CliSkillDetail {...props} />;
  }

  // 默认：渲染原始 Legacy 详情页 (Legacy Skill View)
  return <LegacySkillDetailContent {...props} />;
};

/**
 * ==========================================
 * 原始设计模式 (Legacy Skill View)
 * 职责：保持 100% 原始白底卡片设计，不影响 API/Native 技能体验。
 * ==========================================
 */
const LegacySkillDetailContent: React.FC<SkillDetailProps> = ({ skill_name, skill, isOfficial, isOwner, status }) => {
    const { data: session } = useSession();
    const isLoggedIn = !!session;
    const hasRealKey = isLoggedIn && session.user?.image;
    const displayKey = hasRealKey ? "usk_app_7v2k...9z1" : "YOUR_API_KEY";

    const properties = skill.parameters?.properties || skill.parameters || {};
    const required = skill.parameters?.required || [];

    const parameterList = Object.keys(properties).map(key => ({
        name: key,
        ...properties[key],
        required: required.includes(key) || properties[key].required
    }));

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
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-10 items-start">
                    {/* ── Top Left: Breadcrumbs & Header Details ── */}
                    <div className="lg:col-span-7 space-y-12">
                        <Breadcrumbs items={skill.customBreadcrumbs || [{ label: "Store", href: "/skills" }, { label: skill.display_name || skill_name }]} />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-6">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl border ${skill.visuals?.styles.box || 'bg-blue-500/10'} ${skill.visuals?.styles.border || 'border-blue-500/20'}`}>
                                    {skill.visuals ? <div className={`w-10 h-10 flex items-center justify-center ${skill.visuals.styles.text}`}><skill.visuals.Icon weight="duotone" /></div> : <span>🧩</span>}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-extrabold mb-1 tracking-tight" style={{ color: "var(--color-text-primary)" }}>{skill.display_name || skill_name}</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="group flex items-center gap-2 border px-3 py-1.5 rounded-lg">
                                            <code className="text-blue-400 font-mono text-sm font-bold">{skill_name}</code>
                                        </div>
                                         <span className="px-2.5 py-1 rounded-md text-xs font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400">
                                            {status || (isOfficial ? "Official" : "Community")}
                                          </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-lg leading-relaxed mt-6" style={{ color: "var(--color-text-secondary)" }}>{skill.description}</p>
                        </div>
                    </div>
                    
                    {/* ── Top Right: Spacer to keep layout correct on desktop ── */}
                    <div className="hidden lg:block lg:col-span-3 h-0" />

                    {/* ── Bottom Left: Parameters Specification ── */}
                    <div className="lg:col-span-7">
                        <div className="border rounded-xl p-6" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-6 opacity-60">Parameters Specification</h3>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b text-[10px] uppercase opacity-50"><th className="pb-4 w-[20%]">Name</th><th className="pb-4 w-[15%]">Type</th><th className="pb-4 w-[15%]">Required</th><th className="pb-4 w-[50%]">Description</th></tr>
                                </thead>
                                <tbody>
                                    {parameterList.map((p) => (
                                        <tr key={p.name} className="border-b last:border-0"><td className="py-4 font-mono text-sm text-cyan-400">{p.name}</td><td className="py-4 text-xs opacity-60">{p.type}</td><td className="py-4 text-xs">{p.required ? "Yes" : "No"}</td><td className="py-4 text-sm leading-relaxed">{p.description}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Bottom Right: Pricing (Aligned with Parameters Specification) ── */}
                    <div className="lg:col-span-3">
                       <div className="p-5 border rounded-xl" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-4 opacity-60">Pricing</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">Cost per Request</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black">{skill.credits_per_call ?? 1}</span>
                                    <span className="text-[10px] font-bold uppercase opacity-50">CR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SkillDetail;
