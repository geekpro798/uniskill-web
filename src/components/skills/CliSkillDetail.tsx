/**
 * src/components/skills/CliSkillDetail.tsx
 * 
 * Logic: UniSkill Industrial Detail View (V13.5 - Real Data Synchronization)
 * 职责：专为 CLI 运行时设计的详情页。已将 Invocations 切换至真实接口数据。
 */

'use client';

import React, { useState } from 'react';
import { 
  Box, Cpu, ShieldCheck, Zap, 
  Play, Copy, ChevronRight,
  Info, Lock, Share2, Braces,
  Settings, Check, Globe, SquareTerminal,
  Activity, Timer, Terminal, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Breadcrumbs from "@/components/Breadcrumbs";

export const CliSkillDetail = ({ skill, skill_name, isOfficial, isOwner }: any) => {
  const [copied, setCopied] = useState(false);

  // 1. 数据解析：切换至真实调用量
  const implementation = skill.implementation || {};
  const binary = implementation.binary || 'exec';
  const command = implementation.command || (implementation.args && implementation.args.join(' ')) || 'execute';
  const metadata = skill.metadata || {};
  const imageTag = metadata.image_tag || metadata.image || 'v2.5';
  const invocations = skill.total_calls || 0; // 🌟 切换至真实数据，移除 84200 占位符
  const credits = skill.credits_per_call || skill.cost_per_call || 1;

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(skill_name || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * 极简代码语法高亮渲染
   */
  const renderCommand = () => {
    return (
      <div className="font-mono text-sm sm:text-base leading-relaxed flex flex-wrap gap-x-2 gap-y-3 transition-colors duration-300">
        <span className="text-amber-500 dark:text-amber-500 font-black">$ {binary}</span>
        <span className="text-slate-900 dark:text-white transition-colors">{command}</span>
        
        {implementation.args?.map((arg: string, idx: number) => {
          const isVar = arg.includes('{{');
          return (
            <span key={idx} 
                  className={`px-2 py-0.5 rounded transition-all ${
                    isVar 
                    ? 'bg-blue-500/10 dark:bg-[#1e293b] border border-blue-500/20 dark:border-[#3b82f6]/40 text-blue-600 dark:text-[#3b82f6] font-bold' 
                    : 'text-slate-500 dark:text-slate-400'
                  }`}>
              {arg}
            </span>
          );
        })}
        <span className="text-slate-400 dark:text-slate-600 select-none">--json</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans selection:bg-amber-500/30"
         style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
      <UnifiedNavbar />

      <main className="max-w-7xl mx-auto px-10 pt-32 pb-20">
        
        {/* ── 0. Top Navigation & Header Row ── */}
        <div className="space-y-8 mb-12">
           
           <Breadcrumbs items={[{ label: "Store", href: "/skills" }, { label: skill.display_name || skill_name }]} />

           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="flex gap-8 items-center">
                 <div className="relative w-24 h-24 rounded-[2.5rem] border flex items-center justify-center text-5xl shadow-sm transition-all"
                      style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                    {skill.emoji || '⚙️'}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                 </div>
                 
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <h1 className="text-4xl font-extrabold mb-1 tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                         {skill.display_name}
                       </h1>
                       <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                          Runtime: CLI
                       </span>
                    </div>
                    <p className="text-lg opacity-80 font-medium max-w-2xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                       {skill.description}
                    </p>
                    <div className="flex items-center gap-6">
                       <div onClick={handleCopyId} className="group flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all hover:border-amber-500/20"
                            style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                          <code className="text-[11px] font-mono font-bold text-slate-600 group-hover:text-amber-500 transition-colors">
                             {skill_name}
                          </code>
                          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-700" />}
                       </div>
                       <div className="flex items-center gap-5 text-[10px] font-bold opacity-60 uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Activity size={14} className="text-blue-500" /> {invocations} INVOCATIONS</span>
                          <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> OFFICIAL VERIFIED</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="border p-6 rounded-[32px] min-w-[180px] shadow-sm relative overflow-hidden group transition-colors"
                   style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                 <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-3 text-center">Execution Cost</p>
                 <div className="flex items-center justify-center gap-2 text-3xl font-black text-amber-500">
                    <Zap size={24} className="fill-amber-500" />
                    {credits} <span className="text-sm opacity-40 uppercase font-black">CR</span>
                 </div>
              </div>
           </div>
        </div>

        {/* ── 2. Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           <div className="lg:col-span-8 space-y-14">
              
              {/* EXECUTION SYNTAX */}
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black opacity-80 uppercase tracking-[0.3em] flex items-center gap-2"
                     style={{ color: "var(--color-text-secondary)" }}>
                    <SquareTerminal size={14} className="text-amber-500" /> EXECUTION SYNTAX
                 </h3>
                 <div className="relative p-7 rounded-[28px] border transition-all"
                      style={{ 
                        backgroundColor: "var(--color-bg-secondary)", 
                        borderColor: "var(--color-border)" 
                      }}>
                    {renderCommand()}
                    <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-amber-500/[0.03] to-transparent pointer-events-none" />
                 </div>
              </div>

              {/* PARAMETER SCHEMA */}
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black opacity-80 uppercase tracking-[0.3em] flex items-center gap-2"
                     style={{ color: "var(--color-text-secondary)" }}>
                    <Braces size={14} className="text-amber-500" /> PARAMETER SCHEMA
                 </h3>
                 <div className="border rounded-[28px] overflow-hidden transition-colors"
                      style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">NAME</th>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">TYPE</th>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">REQUIREMENT</th>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">DESCRIPTION</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                          {Object.entries(skill.parameters?.properties || skill.parameters || {}).map(([key, val]: [string, any]) => (
                             <tr key={key} className="hover:bg-amber-500/[0.01] transition-colors">
                                <td className="px-8 py-6 text-sm font-bold text-blue-500 dark:text-blue-400">{key}</td>
                                <td className="px-8 py-6 text-[10px] font-black opacity-40 uppercase tracking-widest">{val.type || 'ANY'}</td>
                                <td className="px-8 py-6">
                                   {skill.parameters?.required?.includes(key) ? (
                                      <span className="text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase">REQUIRED</span>
                                   ) : (
                                      <span className="text-[9px] font-bold opacity-30 uppercase">OPTIONAL</span>
                                   )}
                                </td>
                                <td className="px-8 py-6 text-sm opacity-80 font-medium leading-relaxed transition-colors" style={{ color: "var(--color-text-secondary)" }}>{val.description}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>

           <aside className="lg:col-span-4 space-y-8 h-fit">
              <div className="border rounded-[40px] p-10 space-y-10 shadow-sm transition-all"
                   style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] flex items-center gap-3">
                       <Box size={14} /> EXECUTION SUBSTRATE
                    </h4>
                    <div className="space-y-5">
                       <div className="flex justify-between items-center text-xs">
                          <span className="opacity-50 font-bold uppercase tracking-widest">Image</span>
                          <code className="text-[11px] font-mono border px-3 py-1 rounded-md transition-all"
                                style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                             uniskill/cli:{imageTag}
                          </code>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="opacity-50 font-bold uppercase tracking-widest">Compute</span>
                          <span className="text-[9px] font-black border px-3 py-1 rounded-md transition-all uppercase"
                                style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                             STANDARD-1X
                          </span>
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="opacity-50 font-bold uppercase tracking-widest">Auth Integrity</span>
                          <span className="flex items-center gap-2 text-emerald-500 font-black uppercase">
                             <ShieldCheck size={14} strokeWidth={3} /> MANAGED
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 pt-10 border-t" style={{ borderColor: "var(--color-border)" }}>
                    <h4 className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Lock size={12} /> LINKED VAULT SECRETS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {skill_name.includes('lark') ? (
                          ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'].map(s => (
                             <span key={s} className="px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold opacity-60 transition-all uppercase"
                                   style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
                                {s}
                             </span>
                          ))
                       ) : (
                          <span className="text-[10px] italic opacity-40">NO SECRETS LINKED</span>
                       )}
                    </div>
                 </div>

                 <button className="w-full py-5 bg-amber-500 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-amber-500/10 font-black text-black text-sm uppercase tracking-widest group active:scale-[0.98] hover:bg-amber-400 transition-all">
                    <Play size={18} fill="currentColor" />
                    DEBUG IN SANDBOX
                 </button>
              </div>

              <div className="p-8 rounded-[32px] bg-amber-500/[0.03] border border-amber-500/10 flex gap-4 transition-all">
                 <div className="text-amber-500 mt-1">
                    <Info size={16} strokeWidth={3} />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">SUBSTRATE INFO</p>
                    <p className="text-[11px] opacity-50 leading-relaxed font-medium transition-colors">
                       This CLI tool executes in a fresh Firecracker Micro-VM. Your Vault secrets are purged from memory immediately after execution.
                    </p>
                 </div>
              </div>
           </aside>
        </div>
      </main>
    </div>
  );
};

export default CliSkillDetail;
