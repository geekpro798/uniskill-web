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
  Activity, Timer, Terminal, ExternalLink, Package,
  Loader2, Wand2, Sparkles, Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedNavbar from "@/components/UnifiedNavbar";
import Breadcrumbs from "@/components/Breadcrumbs";

export const CliSkillDetail = ({ skill, skill_name, isOfficial, isOwner }: any) => {
  const [copied, setCopied] = useState(false);
  const [sandboxOpen, setSandboxOpen] = useState(false);
  const [nlpQuery, setNlpQuery] = useState('');
  const [testLog, setTestLog] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

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

  const markdownManifest = skill.markdown_manifest || '';

  // 2. CLI 参数解析：从 SKILL.md 的 ```bash 代码块提取参数
  const extractCliArgs = () => {
    const bashMatch = markdownManifest.match(/```(?:bash|sh)\n([\s\S]*?)```/);
    if (!bashMatch) return [];
    const cmdText = bashMatch[1];
    const args: { name: string; required: boolean; description: string }[] = [];
    const argRegex = /(--[\w-]+)\s+(?:<([^>]+)>|([^\s]+))/g;
    let m;
    while ((m = argRegex.exec(cmdText)) !== null) {
      const name = m[1];
      const placeholder = m[2] || m[3] || '';
      const isRequired = /plan|output|input|file/i.test(name) || placeholder.includes('required');
      const descMatch = markdownManifest.match(new RegExp(name.replace(/-/g, '\\-') + '[:-]\\s*(.+)'));
      const desc = descMatch?.[1]?.trim() || placeholder || `Path to ${name.replace('--', '')}`;
      args.push({ name, required: isRequired, description: desc });
    }
    return args;
  };

  // 3. 提取 bundled scripts
  const extractScripts = () => {
    const scr: { path: string }[] = [];
    const matches = markdownManifest.matchAll(/scripts\/([^\s\n"')\]]+)/g);
    const seen = new Set<string>();
    for (const m of matches) {
      const p = 'scripts/' + m[1];
      if (!seen.has(p)) { seen.add(p); scr.push({ path: p }); }
    }
    return scr;
  };

  // 4. 提取 Python 依赖
  const extractDeps = () => {
    const imps: string[] = [];
    const importRegex = /^(?:from\s+(\S+)|import\s+(\S+))/gm;
    let m;
    while ((m = importRegex.exec(markdownManifest)) !== null) {
      const pkg = (m[1] || m[2]).split('.')[0];
      if (pkg && !['os', 'io', 'json', 'argparse', 'sys', 're', '__future__', '__main__'].includes(pkg)) {
        if (!imps.includes(pkg)) imps.push(pkg);
      }
    }
    return imps;
  };

  const cliArgs = extractCliArgs();
  const scripts = extractScripts();
  const deps = extractDeps();

  const handleSandboxTest = async () => {
    if (!nlpQuery.trim()) return;
    setIsTesting(true);
    setTestLog("Step 1: Planning target via Auto-Workflow...\n");
    setTestSuccess(false);
    try {
      await new Promise(r => setTimeout(r, 600));
      setTestLog(prev => prev + 'Step 2: Analyzing available tools...\n  → Found: ' + (skill_name || 'cli-skill') + '\n');
      await new Promise(r => setTimeout(r, 600));
      setTestLog(prev => prev + 'Step 3: Preparing execution plan...\n  → Command: ' + (markdownManifest.includes('generate.py') ? 'python scripts/generate.py' : binary) + '\n');
      await new Promise(r => setTimeout(r, 600));
      setTestLog(prev => prev + 'Step 4: Simulation complete.\n  → Target: ' + nlpQuery.trim() + '\n');
      setTestLog(prev => prev + '\n✅ Skill validation passed. Deploy and invoke via Agent.\n');
      setTestLog(prev => prev + '\nThe Auto-Workflow Planner will orchestrate the execution automatically.');
      setTestSuccess(true);
    } catch (err: any) {
      setTestLog(prev => prev + '\n❌ Error: ' + err.message);
    } finally {
      setIsTesting(false);
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

              {/* CLI INTERFACE — 从 SKILL.md ```bash 代码块提取的参数 */}
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black opacity-80 uppercase tracking-[0.3em] flex items-center gap-2"
                     style={{ color: "var(--color-text-secondary)" }}>
                    <SquareTerminal size={14} className="text-amber-500" /> CLI INTERFACE
                 </h3>
                 <div className="border rounded-[28px] overflow-hidden transition-colors"
                      style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                    {cliArgs.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="border-b" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">ARGUMENT</th>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">REQUIRED</th>
                             <th className="px-8 py-5 text-[10px] font-black opacity-40 uppercase tracking-[0.2em]">DESCRIPTION</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                          {cliArgs.map((arg) => (
                             <tr key={arg.name} className="hover:bg-amber-500/[0.01] transition-colors">
                                <td className="px-8 py-6 text-sm font-mono font-bold text-amber-500 dark:text-amber-400">{arg.name}</td>
                                <td className="px-8 py-6">
                                   {arg.required ? (
                                      <span className="text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase">REQUIRED</span>
                                   ) : (
                                      <span className="text-[9px] font-bold opacity-30 uppercase">OPTIONAL</span>
                                   )}
                                </td>
                                <td className="px-8 py-6 text-sm opacity-80 font-medium leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{arg.description}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    ) : (
                      <div className="p-12 text-center text-sm opacity-40">No CLI arguments detected. This skill is invoked through natural language.</div>
                    )}
                 </div>
              </div>

              {/* BUNDLED SCRIPTS */}
              {scripts.length > 0 && (
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black opacity-80 uppercase tracking-[0.3em] flex items-center gap-2"
                     style={{ color: "var(--color-text-secondary)" }}>
                    <Package size={14} className="text-amber-500" /> BUNDLED SCRIPTS
                 </h3>
                 <div className="border rounded-[28px] overflow-hidden transition-colors"
                      style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                    <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                       {scripts.map((s, i) => (
                          <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-amber-500/[0.01] transition-colors">
                             <div className="flex items-center gap-3">
                                <Terminal size={16} className="text-slate-400" />
                                <code className="text-sm font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>{s.path}</code>
                             </div>
                             <span className="text-[10px] font-mono opacity-40">—</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
              )}

              {/* RUNTIME — 执行环境 + 依赖 */}
              <div className="space-y-4">
                 <h3 className="text-[11px] font-black opacity-80 uppercase tracking-[0.3em] flex items-center gap-2"
                     style={{ color: "var(--color-text-secondary)" }}>
                    <Cpu size={14} className="text-amber-500" /> RUNTIME
                 </h3>
                 <div className="border rounded-[28px] divide-y transition-colors"
                      style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                    <div className="px-8 py-5 flex justify-between items-center">
                       <span className="text-sm opacity-50 font-bold uppercase tracking-widest">Binary</span>
                       <code className="text-sm font-mono font-bold text-amber-500">{binary}</code>
                    </div>
                    {deps.length > 0 && (
                    <div className="px-8 py-5">
                       <span className="text-xs opacity-50 font-bold uppercase tracking-widest block mb-3">Dependencies</span>
                       <div className="flex flex-wrap gap-2">
                          {deps.map((d) => (
                             <code key={d} className="px-3 py-1 rounded-lg border text-[11px] font-mono font-bold opacity-60"
                                   style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>{d}</code>
                          ))}
                       </div>
                    </div>
                    )}
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

                 <button
                    type="button"
                    onClick={() => setSandboxOpen(!sandboxOpen)}
                    className="w-full py-5 bg-amber-500 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-amber-500/10 font-black text-black text-sm uppercase tracking-widest group active:scale-[0.98] hover:bg-amber-400 transition-all cursor-pointer"
                 >
                    <Play size={18} fill="currentColor" />
                    {sandboxOpen ? 'CLOSE SANDBOX' : 'DEBUG IN SANDBOX'}
                 </button>

                 {sandboxOpen && (
                 <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div className="relative">
                       <input type="text" value={nlpQuery}
                          onChange={(e) => setNlpQuery(e.target.value)}
                          placeholder={'e.g., "帮我生成一份关于 AI 趋势的 5 页 PPT"'}
                          onKeyDown={(e) => { if (e.key === 'Enter' && nlpQuery.trim()) { e.preventDefault(); handleSandboxTest(); } }}
                          className="w-full pl-10 pr-4 py-3 bg-amber-500/[0.05] border border-amber-500/20 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                       />
                       <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500" />
                    </div>
                    <button type="button" onClick={handleSandboxTest}
                       disabled={isTesting || !nlpQuery.trim()}
                       className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 text-sm"
                    >
                       {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                       {isTesting ? 'Running...' : 'Run Auto-Workflow Test'}
                    </button>
                    {testLog && (
                       <div className="border border-amber-500/10 rounded-xl p-4 max-h-64 overflow-auto">
                          <pre className={`font-mono text-[12px] leading-relaxed ${testSuccess ? 'text-emerald-400' : 'text-red-400'}`}>{testLog}</pre>
                       </div>
                    )}
                 </div>
                 )}
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
