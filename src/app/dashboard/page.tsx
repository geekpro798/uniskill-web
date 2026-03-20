'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";
import TopUpModal from "@/components/Dashboard/TopUpModal";
import ResetKeyModal from "@/components/Dashboard/ResetKeyModal";
import { supabase } from "@/lib/supabase";
import { 
  Zap, Key, Terminal, BarChart3, ArrowUpRight, 
  Plus, Layers, ExternalLink, Activity, ShieldCheck, 
  Copy, CheckCircle2, ChevronRight, Eye, EyeOff,
  History, Monitor, Code2, Globe, Lock, MoreVertical
} from 'lucide-react';

// ==========================================
// Component: Tool Suite Integration
const IntegrationTerminal = ({ apiKey }: { apiKey?: string }) => {
  const [platform, setPlatform] = useState<'mac' | 'win'>('mac');
  const [copied, setCopied] = useState(false);

  const command = platform === 'mac' 
    ? (apiKey ? `curl -fsSL https://uniskill.ai/connect.sh | bash -s -- ${apiKey}` : 'curl -fsSL https://uniskill.ai/connect.sh | bash')
    : (apiKey ? `$env:UNISKILL_KEY="${apiKey}"; irm https://uniskill.ai/connect.ps1 | iex` : 'irm https://uniskill.ai/connect.ps1 | iex');

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-sm text-left relative group transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
            <Monitor size={20} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Tool Suite Integration</h3>
        </div>
        <div className="flex bg-[#f3f4f6] dark:bg-slate-800/50 rounded-[12px] p-1 border border-slate-200/50 dark:border-slate-700/50">
          <button 
            onClick={() => setPlatform('mac')}
            className={`px-4 py-1.5 text-xs font-bold rounded-[8px] transition-all ${platform === 'mac' ? 'bg-[#e0e7ff] text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >Mac / Linux</button>
          <button 
            onClick={() => setPlatform('win')}
            className={`px-4 py-1.5 text-xs font-bold rounded-[8px] transition-all ${platform === 'win' ? 'bg-[#e0e7ff] text-[#2563eb] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >Windows</button>
        </div>
      </div>

      <div className="rounded-[16px] border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 shadow-sm">
        <div className="bg-[#f1f5f9] dark:bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
           <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
           </div>
           <span className="text-[11px] font-mono italic text-slate-500 font-bold ml-4 user-select-none">Terminal</span>
           <button 
             onClick={handleCopy}
             className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors"
           >
             {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
             <span>Copy</span>
           </button>
        </div>
        <div className="p-5 font-mono text-[14px] leading-relaxed break-all bg-white dark:bg-slate-950 flex gap-3">
           <span className="text-slate-400 font-bold">$</span>
           <div className="flex-1">
              {platform === 'mac' ? (
                <>
                  <span className="text-blue-500">curl</span> 
                  <span className="text-slate-500 ml-1.5">-fsSL</span> 
                  <span className="text-emerald-500 ml-2">https://uniskill.ai/connect.sh</span> 
                  <span className="text-slate-400 ml-2">|</span> 
                  <span className="text-blue-500 ml-2">bash</span>
                  {apiKey && (
                    <>
                      <span className="text-slate-400 ml-2">-s --</span> 
                      <span className="text-emerald-500 ml-2">{apiKey}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  {apiKey && (
                    <>
                      <span className="text-slate-400">$env:UNISKILL_KEY="</span>
                      <span className="text-emerald-500">{apiKey}</span>
                      <span className="text-slate-400">"; </span>
                    </>
                  )}
                  <span className="text-blue-500">irm</span> 
                  <span className="text-emerald-500 ml-2">https://uniskill.ai/connect.ps1</span> 
                  <span className="text-slate-400 ml-2">|</span> 
                  <span className="text-blue-500 ml-2">iex</span>
                </>
              )}
           </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-4">
        One command to connect your local IDE (Cursor/Claude) to UniSkill network.
      </p>
    </div>
  );
};

// ==========================================
// Component: Recent Activity
// Logic: 展示最新的 API 消费和微交易流水
// ==========================================
const RecentActivity = ({ logs, loading }: { logs: any[], loading: boolean }) => {
  return (
    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] overflow-hidden shadow-sm text-left">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
        <h3 className="text-[12px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History size={14} className="text-slate-400" />
          Recent Activity
        </h3>
        <Link href="/dashboard/billing" className="text-[10px] font-bold text-blue-500 hover:underline">View All</Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
        {loading ? (
          <div className="px-5 py-8 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : logs.length > 0 ? (
          logs.map(log => (
            <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono truncate max-w-[120px]">
                  {log.skill_name || 'System'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(log.created_at).toLocaleString('zh-CN', { 
                    year: 'numeric', month: '2-digit', day: '2-digit', 
                    hour: '2-digit', minute: '2-digit', hour12: false 
                  }).replace(/\//g, '-')}
                </span>
              </div>
              <span className={`text-[11px] font-black font-mono ${log.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {log.amount > 0 ? `+${log.amount}` : log.amount}
              </span>
            </div>
          ))
        ) : (
          <div className="px-5 py-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            No activity yet
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// Main Page: Dashboard Console
// Logic: Credits、技能资产及安全配置的管理中枢
// ==========================================
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [liveCredits, setLiveCredits] = useState<number | undefined>(undefined);
  
  // API Key 重置后的临时明文及预览状态
  const [resetRawKey, setResetRawKey] = useState<string | undefined>(undefined);
  const [resetKeyPreview, setResetKeyPreview] = useState<string | undefined>(undefined);
  const [skills, setSkills] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [invocationStats, setInvocationStats] = useState({ daily: 0, lifetime: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

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

  const fetchSkills = async () => {
    // 使用 userUid 兼容 auth 层 (session 对象中的标识符)
    const uid = (session?.user as any)?.userUid || session?.user?.id;
    if (!uid) return;
    try {
      setLoadingSkills(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('creator_uid', uid) // 修正字段名：经查证，skills 表使用 creator_uid 标识作者
        .order('skill_name', { ascending: true }); // 使用 skill_name 排序，该表没有 created_at

      if (error) throw error;
      setSkills(data || []);
    } catch (e) {
      console.error("Failed to fetch skills", e);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchInvocations = async () => {
    const uid = (session?.user as any)?.userUid || session?.user?.id;
    if (!uid) return;
    try {
      // 1. 获取 24h 内的调用次数 (Count 24h invocations via negative credit events)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: dailyCount, error: dailyError } = await supabase
        .from('credit_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_uid', uid)
        .lt('amount', 0) // 仅计算扣费事件 (只有负值才是调用)
        .gte('created_at', twentyFourHoursAgo);

      if (dailyError) throw dailyError;

      // 2. 获取累计调用总次数 (Count lifetime invocations via negative credit events)
      const { count: lifetimeCount, error: lifetimeError } = await supabase
        .from('credit_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_uid', uid)
        .lt('amount', 0); // 仅计算扣费事件

      if (lifetimeError) throw lifetimeError;

      setInvocationStats({ 
        daily: dailyCount || 0, 
        lifetime: lifetimeCount || 0 
      });
    } catch (e) {
      console.error("Failed to fetch invocations", e);
    }
  };

  const fetchRecentActivity = async () => {
    const uid = (session?.user as any)?.userUid || session?.user?.id;
    if (!uid) return;
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('credit_events')
        .select('id, skill_name, amount, created_at')
        .eq('user_uid', uid)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (e) {
      console.error("Failed to fetch recent activity", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchLiveCredits();
    fetchSkills();
    fetchInvocations();
    fetchRecentActivity();
    window.addEventListener("focus", fetchLiveCredits);
    return () => window.removeEventListener("focus", fetchLiveCredits);
  }, [status, session?.user?.id]);

  const handleConfirmReset = async () => {
    try {
      const res = await fetch("/api/user/reset-key", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResetRawKey(data.rawKey);
        setResetKeyPreview(data.keyPreview);
      } else {
        throw new Error("Failed to reset key");
      }
    } catch (e) {
      console.error("Failed to reset key", e);
      alert("Error resetting key. Please try again.");
      throw e;
    }
  };

  const privateCount = skills.filter(s => s.is_public === false).length;
  const publicCount = skills.filter(s => s.is_public === true).length;

  // 首页统计看板展示的核心数据逻辑
  const stats = [
    { 
      label: 'Credits Balance', 
      value: liveCredits !== undefined ? liveCredits.toLocaleString() : '---', 
      icon: Zap, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10'
    },
    { 
      label: '24h Invocations', 
      value: invocationStats.daily.toLocaleString(), 
      icon: Activity, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10',
      totalLifetime: invocationStats.lifetime >= 1000 
        ? `${(invocationStats.lifetime / 1000).toFixed(1)}K` 
        : invocationStats.lifetime.toString() 
    },
    { 
      label: 'Live Skills', 
      value: loadingSkills ? '---' : skills.length.toString(), 
      icon: Layers, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      breakdown: { private: privateCount, public: publicCount } // 资产分布展示逻辑
    },
  ];

  const handleCopyKey = () => {
    const key = resetRawKey || session?.user?.rawKey || "";
    if (!key) return;
    const textArea = document.createElement("textarea");
    textArea.value = key;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const finalRawKey = resetRawKey || session?.user?.rawKey;
  const finalKeyPreview = resetKeyPreview || session?.user?.keyPreview;

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans relative" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid"></div>
      {/* 顶部 Navbar */}
      <DashboardNavbar credits={liveCredits} totalCredits={500} />

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">{session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "uniskillai"}</span> 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your UniSkill API Gateway dashboard.</p>
          </div>
          <div className="flex items-center gap-2">
             <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-sm transition-all text-xs">
                <BarChart3 size={14} /> Analytics
             </button>
             <button 
               onClick={() => window.location.href = '/dashboard/skills/new'}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md active:scale-95 text-xs"
             >
                <Plus size={16} /> Deploy Skill
             </button>
          </div>
        </header>

        {/* Top 3-Card Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] group hover:border-blue-500/30 transition-all shadow-sm text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
              </div>
              
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                
                {/* 针对 Live Skills 的 P/S 拆解标签 */}
                {stat.label === 'Live Skills' ? (
                  <div className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-tighter">
                    <span>{stat.breakdown?.private}P</span>
                    <span className="opacity-30">|</span>
                    <span className="text-purple-400">{stat.breakdown?.public}S</span>
                  </div>
                ) : (
                  <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <ArrowUpRight size={8} /> 12%
                  </div>
                )}
              </div>

              {/* 视觉化资产分布条 */}
              {stat.label === 'Live Skills' && (
                <div className="flex h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${skills.length > 0 ? (privateCount / skills.length) * 100 : 0}%` }}></div>
                   <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${skills.length > 0 ? (publicCount / skills.length) * 100 : 0}%` }}></div>
                </div>
              )}

              {/* 累计总调用量统计栏 */}
              {stat.label === '24h Invocations' && (
                <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Lifetime Calls</span>
                   <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">{stat.totalLifetime}</span>
                </div>
              )}

              {stat.label === 'Credits Balance' && (
                <button 
                  onClick={() => setIsTopUpModalOpen(true)}
                  className="text-[9px] font-black text-blue-500 hover:underline uppercase tracking-tighter"
                >Buy Credits &rarr;</button>
              )}
            </div>
          ))}
        </div>

        {/* Main Section: My Skills Workspace (2/3) vs Operations Sidebar (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Workspace Area: Skill Assets */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-sm text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-blue-500" />
                  My Skills
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.location.href='/dashboard/skills/new'} className="text-[11px] font-bold text-slate-400 hover:text-blue-500">+ New</button>
                  <button onClick={() => window.location.href='/dashboard/skills'} className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1">Manage All <ChevronRight size={12} /></button>
                </div>
              </div>
              <div className="p-0">
                {loadingSkills ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading Workspace...</span>
                    </div>
                  </div>
                ) : skills.length > 0 ? (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {skills.map((skill) => (
                      <div 
                        key={skill.id} 
                        className="p-4 md:p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all flex items-center justify-between group cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/skills/${skill.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 group-hover:border-blue-500/30 transition-all shadow-sm">
                            <Code2 className="text-slate-400 group-hover:text-blue-500 transition-colors" size={22} />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{skill.name || "Unnamed Skill"}</h4>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border ${
                                skill.is_public 
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {skill.is_public ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px] md:max-w-[400px] font-medium italic">
                              {skill.description || 'Professional AI tool for advanced automation logic.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="hidden md:flex flex-col items-end gap-1">
                             <div className="flex items-center gap-1.5">
                                <Activity size={10} className="text-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">Active</span>
                             </div>
                             <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter">Last call 12m ago</span>
                          </div>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-300 group-hover:text-blue-500">
                             <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[24px] bg-slate-50/30 dark:bg-[#0d0f16]/30 m-6">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl mb-4 shadow-sm border border-slate-100 dark:border-slate-700">
                      <Code2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">No skills deployed yet</h3>
                    <p className="text-slate-400 text-[11px] max-w-[240px] text-center mb-6 leading-relaxed font-medium">
                      Build your own private AI tools using Markdown, or install community skills from the marketplace.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => window.location.href='/dashboard/skills/new'} className="px-5 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-md active:scale-95 transition-all">+ Create Private Skill</button>
                      <button className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                        <Globe size={12} strokeWidth={3} /> Visit Store
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Operations Sidebar */}
          <div className="space-y-6">
            
            {/* API Key Management */}
            <div className={`p-5 bg-white dark:bg-[#0f1117] border rounded-[24px] shadow-sm text-left transition-all ${finalRawKey ? 'border-yellow-500/30' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${finalRawKey ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      <Key size={12} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Your API Key</span>
                  </div>
                  <button 
                    onClick={() => setIsResetModalOpen(true)}
                    className="text-[9px] font-black text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest bg-slate-50 dark:bg-slate-800/30 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800"
                  >
                    Reset
                  </button>
                </div>

                {finalRawKey && (
                  <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-yellow-500/8 border border-yellow-500/20">
                     <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-tight leading-none italic">
                        This key is shown ONCE — copy it now and store it securely
                     </span>
                  </div>
                )}

                <div className={`bg-slate-50 dark:bg-[#161b22] border rounded-lg p-2.5 mb-2 flex items-center gap-2 ${finalRawKey ? 'border-yellow-500/20' : 'border-slate-100 dark:border-slate-800'}`}>
                  <code className={`text-[12px] font-mono truncate flex-1 ${finalRawKey && showKey ? 'text-green-500' : 'text-slate-500'}`}>
                    {finalRawKey 
                      ? (showKey ? finalRawKey : "us-••••••••••••••••••••••••••••••••") 
                      : (finalKeyPreview || "us-••••••••••••••••••••••••••••••••")}
                  </code>
                  <div className="flex items-center gap-1">
                    {finalRawKey && (
                      <button onClick={() => setShowKey(!showKey)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                    <button 
                      onClick={finalRawKey ? handleCopyKey : undefined} 
                      disabled={!finalRawKey}
                      className={`p-1 transition-colors ${finalRawKey ? 'text-slate-400 hover:text-slate-600' : 'text-slate-200 dark:text-slate-800 cursor-not-allowed'}`}
                    >
                      {copiedKey ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 italic font-sans leading-none">
                  {finalRawKey ? 'Save this key now — it will be hidden after refresh.' : 'Key is hidden — shown once at registration.'}
                </p>
            </div>

            <IntegrationTerminal apiKey={finalRawKey || undefined} />

            <RecentActivity logs={recentLogs} loading={loadingLogs} />

            <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[28px] text-white shadow-xl relative overflow-hidden group text-left">
               <ShieldCheck className="absolute -right-2 -bottom-2 w-24 h-24 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
               <h3 className="text-base font-black mb-1.5 relative z-10">M2M Security</h3>
               <p className="text-blue-100 text-[10px] leading-relaxed mb-5 relative z-10 max-w-[180px]">
                 Enable strict wallet verification to secure your endpoints against API key leakage.
               </p>
               <button className="w-full py-2 bg-white text-blue-600 font-black rounded-lg text-[10px] hover:bg-blue-50 transition-all shadow-md active:scale-95 relative z-10 uppercase tracking-widest">
                 Harden My Endpoints
               </button>
            </div>
          </div>

        </div>

      </div>

      <TopUpModal 
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        user={{
          userUid: session?.user?.userUid,
          email: session?.user?.email || undefined
        }}
      />

      <ResetKeyModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
