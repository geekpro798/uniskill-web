'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import TopUpModal from "@/components/Dashboard/TopUpModal";
import DeleteSkillModal from "@/components/Dashboard/DeleteSkillModal";
import { supabase } from "@/lib/supabase";
import { 
  Zap, Terminal, BarChart3, ArrowUpRight, 
  Plus, Layers, ExternalLink, Activity, ShieldCheck, 
  Copy, CheckCircle2, ChevronRight, Eye, EyeOff,
  History, Monitor, Code2, Globe, Lock, MoreVertical,
  Trash2, PlayCircle, Edit3, Save, Wallet, Shield
} from 'lucide-react';
import { resolveSkillVisuals } from "@/lib/skill-visual-identity";
import WalletSetup from "@/components/auth/WalletSetup";

// ==========================================
// Component: Recent Activity
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

interface DashboardClientProps {
  initialCredits: number | undefined;
  initialDisplayName: string | null;
  initialSkills?: any[];
}

export default function DashboardClient({ initialCredits, initialDisplayName, initialSkills }: DashboardClientProps) {
  const { data: session, status, update: updateSession } = useSession();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<{uid: string, name: string} | null>(null);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  
  // 🌟 使用初始值来避免“闪烁” (Initialize with server-side props to avoid flicker)
  const [liveCredits, setLiveCredits] = useState<number | undefined>(initialCredits);
  const [displayName, setDisplayName] = useState<string | null>(initialDisplayName);
  
  const [skills, setSkills] = useState<any[]>(initialSkills || []);
  const [loadingSkills, setLoadingSkills] = useState(!initialSkills);
  const [invocationStats, setInvocationStats] = useState({ daily: 0, lifetime: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // 🌟 将技能数据实时包装上视觉属性 (Decorate skills with visual visuals)
  const richSkills = React.useMemo(() => {
    return skills.map(s => ({
      ...s,
      visuals: resolveSkillVisuals(s)
    }));
  }, [skills]);

  const fetchLiveCredits = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/user/credits", {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.credits === "number") {
        setLiveCredits(data.credits);
      }
      if (data.displayName) {
        setDisplayName(data.displayName);
      }
    } catch (e) {
      console.warn("[Dashboard] fetchLiveCredits error:", e);
    }
  };

  const fetchSkills = async () => {
    const uid = (session?.user as any)?.userUid || session?.user?.id;
    if (!uid) return;
    try {
      setLoadingSkills(true);
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('owner_uid', uid)
        .order('skill_name', { ascending: true });

      if (error) throw error;
      setSkills(data || []);
    } catch (e) {
      console.error("Failed to fetch skills", e);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchInvocations = async () => {
    try {
      const response = await fetch('/api/user/credit-events?stats=true', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const { count } = await response.json();
      setInvocationStats({ 
        daily: count?.daily || 0, 
        lifetime: count?.lifetime || 0 
      });
    } catch (e) {
      console.error("Failed to fetch invocations", e);
    }
  };

  const handleDelete = async (skillUid: string, skillName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSkillToDelete({ uid: skillUid, name: skillName });
  };

  const confirmDelete = async () => {
    if (!skillToDelete) return;
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('skill_uid', skillToDelete.uid);

      if (error) throw error;
      setSkills(prev => prev.filter(s => s.skill_uid !== skillToDelete.uid));
    } catch (err: any) {
      console.error("[Delete Error]", err.message);
      alert("Failed to delete the skill. Please try again.");
    } finally {
      setSkillToDelete(null);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setLoadingLogs(true);
      const response = await fetch('/api/user/credit-events?limit=3', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const { events } = await response.json();
      setRecentLogs(events || []);
    } catch (e) {
      console.error("Failed to fetch recent activity", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchLiveCredits();
    
    // Check if we need to show wallet setup
    const params = new URLSearchParams(window.location.search);
    const needRelink = params.get('relink') === 'true';
    const noWallet = (session?.user as any)?.authorizedWallet === null;
    
    if (needRelink || noWallet) {
        setShowWalletSetup(true);
        if (needRelink) {
            window.history.replaceState({}, '', '/dashboard');
        }
    }

    // 🌟 如果已经有服务端下发的数据，则跳过初次加载请求 (Skip initial fetch if SSR data exists)
    if (!initialSkills || initialSkills.length === 0) {
      fetchSkills();
    }
    
    fetchInvocations();
    fetchRecentActivity();
    window.addEventListener("focus", fetchLiveCredits);
    return () => window.removeEventListener("focus", fetchLiveCredits);
  }, [status, session?.user, initialSkills]);

  // Removed legacy handleConfirmReset

  const liveSkills = skills.filter(s => s.state === 'active');
  const privateCount = liveSkills.filter(s => s.status === 'Private').length;
  const communityCount = liveSkills.filter(s => s.status === 'Community' || s.status === 'Official').length;
  const liveSkillsCount = liveSkills.length;

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
      value: loadingSkills ? '---' : liveSkillsCount.toString(), 
      icon: Layers, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      breakdown: { private: privateCount, community: communityCount }
    },
  ];

  const handleWalletSetupComplete = async (address?: string) => {
    setShowWalletSetup(false);
    // 🌟 Immediatly update the session with the new wallet address to prevent the popup from reappearing
    await updateSession({ 
      authorizedWallet: address || null 
    }); 
  };

  return (
    <div className="min-h-screen transition-colors duration-500 font-sans relative" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid"></div>
      <UnifiedNavbar 
        initialCredits={liveCredits} 
        initialDisplayName={displayName} 
      />

      <div className="max-w-7xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">{displayName && displayName.trim() !== "" ? displayName : (session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "uniskillai")}</span> 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your UniSkill API Gateway dashboard.</p>
          </div>
          <div className="flex items-center gap-2">

             <button 
               onClick={() => window.location.href = '/dashboard/myskills/new'}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md active:scale-95 text-xs"
             >
                <Plus size={16} /> Deploy Skill
             </button>
          </div>
        </header>

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
                
                {stat.label === 'Live Skills' && (
                  <div className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-tighter">
                    <span>{stat.breakdown?.private}P</span>
                    <span className="opacity-30">|</span>
                    <span className="text-purple-400">{stat.breakdown?.community}C</span>
                  </div>
                )}
              </div>

              {stat.label === 'Live Skills' && (
                <div className="flex h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${liveSkillsCount > 0 ? (privateCount / liveSkillsCount) * 100 : 0}%` }}></div>
                   <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${liveSkillsCount > 0 ? (communityCount / liveSkillsCount) * 100 : 0}%` }}></div>
                </div>
              )}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-sm text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-blue-500" />
                  My Skills
                </h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.location.href='/dashboard/myskills/new'} className="text-[11px] font-bold text-slate-400 hover:text-blue-500">+ New</button>
                  <button onClick={() => window.location.href='/dashboard/myskills'} className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1">Manage All <ChevronRight size={12} /></button>
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
                ) : richSkills.length > 0 ? (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {richSkills.map((skill) => {
                      const isTesting = skill.state === 'testing';
                      return (
                      <div 
                        key={skill.skill_uid}
                        className={`p-4 md:p-5 transition-all flex items-center justify-between group cursor-pointer relative border-b last:border-0 ${
                          isTesting
                            ? 'border-amber-500/40 border-dashed bg-amber-50/10 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20'
                            : 'border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                        }`}
                        onClick={() => {
                          if (isTesting) {
                            window.location.href = `/dashboard/myskills/new?resume=${skill.skill_uid}`;
                          } else {
                            window.location.href = `/dashboard/myskills/${skill.skill_name}`;
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shadow-sm ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.text} group-hover:scale-105`}>
                            <skill.visuals.Icon size={20} weight="duotone" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">{skill.display_name || skill.name || "Unnamed Skill"}</h4>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border ${
                                skill.status === 'Community' 
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {skill.status === 'Community' ? 'Public' : 'Private'}
                              </span>
                              {skill.state === 'testing' && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                                  Draft
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px] md:max-w-[400px] font-medium italic mb-1">
                              {skill.description || 'Professional AI tool for advanced automation logic.'}
                            </p>
                            <div className="mt-1 flex items-center">
                              <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-mono font-bold text-slate-400 group-hover:border-blue-500/30 transition-all">
                                {skill.skill_name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex flex-col items-end gap-1 mr-2">
                             {isTesting ? (
                               <>
                                 <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">In Sandbox</span>
                                 </div>
                                 <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter">Pending Deploy</span>
                               </>
                             ) : (
                               <>
                                 <div className="flex items-center gap-1.5">
                                    <Activity size={10} className="text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">Active</span>
                                 </div>
                                 <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter">Last call 12m ago</span>
                               </>
                             )}
                          </div>
                          
                          {isTesting ? (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => handleDelete(skill.skill_uid, skill.display_name || skill.skill_name || 'Draft', e)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Discard Draft"
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/dashboard/myskills/new?resume=${skill.skill_uid}`;
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                              >
                                <PlayCircle size={12} /> Resume
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {(skill.status === 'Private' || skill.status === 'Community') && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/dashboard/myskills/new?resume=${skill.skill_uid}`;
                                  }}
                                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                  title="Edit Live Skill"
                                >
                                  <Edit3 size={16} />
                                </button>
                              )}
                              <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-300 group-hover:text-blue-500">
                                <ChevronRight size={18} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                      <button onClick={() => window.location.href='/dashboard/myskills/new'} className="px-5 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-md active:scale-95 transition-all text-nowrap">+ Deploy Private Skill</button>
                      <button className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                        <Globe size={12} strokeWidth={3} /> Visit Store
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm text-left">
               <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                      <Wallet size={12} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Sovereign Wallet</span>
                  </div>
               </div>

               <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-100 dark:border-slate-800 rounded-lg p-3 mb-2 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">MPC-TSS Address</span>
                    <span className="text-xs font-mono text-slate-900 dark:text-slate-300">
                      {(session?.user as any)?.authorizedWallet 
                         ? `${(session?.user as any).authorizedWallet.substring(0,6)}...${(session?.user as any).authorizedWallet.substring(38)}` 
                         : 'Not Activated'}
                    </span>
                  </div>
                  <ShieldCheck size={20} className={(session?.user as any)?.authorizedWallet ? "text-emerald-500" : "text-slate-400"} />
               </div>
               
               <p className="text-[9px] text-slate-400 italic font-sans leading-relaxed">
                 Your identity is secured by Particle Network MPC. Requests to the gateway must be signed via EIP-191.
               </p>
            </div>

            <RecentActivity logs={recentLogs} loading={loadingLogs} />
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

      {showWalletSetup && (
        <WalletSetup onComplete={handleWalletSetupComplete} />
      )}

      <DeleteSkillModal
        isOpen={!!skillToDelete}
        skillName={skillToDelete?.name || ''}
        onClose={() => setSkillToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
