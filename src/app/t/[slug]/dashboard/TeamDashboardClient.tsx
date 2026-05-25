"use client";

// src/app/t/[slug]/dashboard/TeamDashboardClient.tsx
// 团队控制台客户端组件 — 完整的团队 Dashboard

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users, BarChart3, Settings, ArrowLeft, Crown, UserCog, Eye,
  Zap, Layers, Activity, Plus, ChevronRight, Trash2, PlayCircle,
  Edit3, Code2, Wallet, ShieldCheck, Copy, CheckCircle2, EyeOff,
} from "lucide-react";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import TopUpModal from "@/components/Dashboard/TopUpModal";
import DeleteSkillModal from "@/components/Dashboard/DeleteSkillModal";
import WalletSetup from "@/components/auth/WalletSetup";
import { TeamMemberList } from "@/components/teams/TeamMemberList";
import { supabase } from "@/lib/supabase";
import { resolveSkillVisuals } from "@/lib/skill-visual-identity";
import type { TeamInfo, TeamMember } from "@/types/teams";

const STATUS_LABELS: Record<string, string> = {
  lead: "潜在",
  active: "运营中",
  suspended: "已暂停",
  cancelled: "已取消",
};

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-purple-500" },
  admin: { label: "Admin", icon: UserCog, color: "text-blue-500" },
  member: { label: "Member", icon: Eye, color: "text-slate-400" },
  viewer: { label: "Viewer", icon: Eye, color: "text-slate-400" },
};

interface Props {
  team: TeamInfo;
  members: TeamMember[];
  membership: { role: string };
  initialSkills?: any[];
  initialCredits?: number;
  initialDisplayName?: string | null;
}

export function TeamDashboardClient({
  team,
  members,
  membership,
  initialSkills,
  initialCredits,
  initialDisplayName,
}: Props) {
  const { data: session, status, update: updateSession } = useSession();
  const params = useParams();
  const slug = params?.slug as string;

  // -- state --
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<{ uid: string; name: string } | null>(null);
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [walletSetupCompletedLocal, setWalletSetupCompletedLocal] = useState(false);
  const [hideWallet, setHideWallet] = useState(true);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const [liveCredits, setLiveCredits] = useState<number | undefined>(initialCredits);
  const [skills, setSkills] = useState<any[]>(initialSkills || []);
  const [loadingSkills, setLoadingSkills] = useState(!initialSkills);

  const handleCopyWallet = () => {
    const addr = (session?.user as any)?.authorizedWallet;
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  // Decorate skills with visuals
  const richSkills = React.useMemo(() => {
    return skills.map((s: any) => ({
      ...s,
      visuals: resolveSkillVisuals(s),
    }));
  }, [skills]);

  const fetchLiveCredits = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/user/credits", {
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.credits === "number") setLiveCredits(data.credits);
    } catch {
      // silent
    }
  };

  const fetchSkills = async () => {
    if (!team.team_uid) return;
    try {
      setLoadingSkills(true);
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("team_uid", team.team_uid)
        .order("skill_name", { ascending: true });
      if (error) throw error;
      setSkills(data || []);
    } catch (e) {
      console.error("Failed to fetch team skills", e);
    } finally {
      setLoadingSkills(false);
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
        .from("skills")
        .delete()
        .eq("skill_uid", skillToDelete.uid);
      if (error) throw error;
      setSkills((prev) => prev.filter((s) => s.skill_uid !== skillToDelete.uid));
    } catch (err: any) {
      console.error("[Delete Error]", err.message);
      alert("Failed to delete the skill. Please try again.");
    } finally {
      setSkillToDelete(null);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchLiveCredits();

    const params = new URLSearchParams(window.location.search);
    const needRelink = params.get("relink") === "true";

    if (needRelink) {
      setShowWalletSetup(true);
      window.history.replaceState({}, "", `/t/${slug}/dashboard`);
    }

    if (!initialSkills || initialSkills.length === 0) {
      fetchSkills();
    }

    window.addEventListener("focus", fetchLiveCredits);
    return () => window.removeEventListener("focus", fetchLiveCredits);
  }, [status, session?.user, initialSkills, walletSetupCompletedLocal]);

  const handleWalletSetupComplete = async (address?: string) => {
    setWalletSetupCompletedLocal(true);
    setShowWalletSetup(false);
    await updateSession({ authorizedWallet: address || null });
  };

  const liveSkills = skills.filter((s) => s.state === "active");
  const draftCount = skills.filter((s) => s.state === "testing").length;

  const stats = [
    {
      label: "成员",
      value: members.length,
      icon: Users,
    },
    {
      label: "方案",
      value: team.plan === "mode1" ? "共享网关" : team.plan,
      icon: Settings,
    },
    {
      label: "积分上限/月",
      value: (team.max_credits_month ?? 0).toLocaleString(),
      icon: Zap,
    },
  ];

  return (
    <div
      className="min-h-screen transition-colors duration-500 font-sans relative"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid" />
      <UnifiedNavbar
        initialCredits={liveCredits}
        initialDisplayName={initialDisplayName}
      />

      <div className="max-w-7xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/t/${slug}`}
            className="inline-flex items-center gap-1.5 font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {team.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>
            控制台
          </span>
        </div>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {team.name}
              <span className={`ml-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold align-middle ${
                team.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              }`}>
                {STATUS_LABELS[team.status] || team.status}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              管理团队技能、成员与配额。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
              {ROLE_CONFIG[membership.role]?.label || membership.role}
            </span>
            <button
              onClick={() => window.location.href = `/t/${slug}/dashboard/myskills/new`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md active:scale-95 text-xs"
            >
              <Plus size={16} /> 部署技能
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] group hover:border-blue-500/30 transition-all shadow-sm text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Main layout: Skills (left) + Sidebar (Wallet + Members, right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: Skills */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden shadow-sm text-left">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers size={18} className="text-blue-500" />
                  团队技能
                </h2>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/t/${slug}/dashboard/myskills`}
                    className="text-[11px] font-bold text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    全部技能
                  </Link>
                  <button
                    onClick={() => window.location.href = `/t/${slug}/dashboard/myskills/new`}
                    className="text-[11px] font-bold text-slate-400 hover:text-blue-500"
                  >
                    + 新建
                  </button>
                </div>
              </div>
              <div className="p-0">
                {loadingSkills ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                        加载中...
                      </span>
                    </div>
                  </div>
                ) : richSkills.length > 0 ? (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {richSkills.map((skill: any) => {
                      const isTesting = skill.state === "testing";
                      return (
                        <div
                          key={skill.skill_uid}
                          className={`p-4 md:p-5 transition-all flex items-center justify-between group cursor-pointer relative border-b last:border-0 ${
                            isTesting
                              ? "border-amber-500/40 border-dashed bg-amber-50/10 dark:bg-amber-900/10 hover:bg-amber-50/50 dark:hover:bg-amber-900/20"
                              : "border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          }`}
                          onClick={() => {
                            if (isTesting) {
                              window.location.href = `/t/${slug}/dashboard/myskills/new?resume=${skill.skill_uid}`;
                            } else {
                              window.location.href = `/t/${slug}/dashboard`;
                            }
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center border transition-all shadow-sm ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.text} group-hover:scale-105`}
                            >
                              <skill.visuals.Icon size={20} weight="duotone" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                                  {skill.display_name || skill.name || "Unnamed Skill"}
                                </h4>
                                <span
                                  className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border ${
                                    skill.status === "Community"
                                      ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                      : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  }`}
                                >
                                  {skill.status === "Community" ? "Public" : "Private"}
                                </span>
                                {isTesting && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse">
                                    Draft
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px] md:max-w-[400px] font-medium italic mb-1">
                                {skill.description || "Professional AI tool for advanced automation logic."}
                              </p>
                              <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-[9px] font-mono font-bold text-slate-400 group-hover:border-blue-500/30 transition-all">
                                {skill.skill_name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex flex-col items-end gap-1 mr-2">
                              {isTesting ? (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500">
                                      In Sandbox
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter">
                                    Pending Deploy
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <Activity size={10} className="text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                                      Active
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400 font-mono uppercase tracking-tighter">
                                    Team skill
                                  </span>
                                </>
                              )}
                            </div>
                            {isTesting ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) =>
                                    handleDelete(
                                      skill.skill_uid,
                                      skill.display_name || skill.skill_name || "Draft",
                                      e
                                    )
                                  }
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                  title="Discard Draft"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/t/${slug}/dashboard/myskills/new?resume=${skill.skill_uid}`;
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                  <PlayCircle size={12} /> Resume
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {(skill.status === "Private" || skill.status === "Community") && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.location.href = `/t/${slug}/dashboard/myskills/new?resume=${skill.skill_uid}`;
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                                    title="Edit Skill"
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
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                      暂无团队技能
                    </h3>
                    <p className="text-slate-400 text-[11px] max-w-[240px] text-center mb-6 leading-relaxed font-medium">
                      为该团队部署第一个 AI 技能，所有团队成员均可使用。
                    </p>
                    <button
                      onClick={() => window.location.href = `/t/${slug}/dashboard/myskills/new`}
                      className="px-5 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      + 部署团队技能
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right sidebar: Wallet + Members */}
          <div className="space-y-6">
            {/* Wallet card */}
            <div className="p-5 bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm text-left">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
                    <Wallet size={12} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Sovereign Wallet
                  </span>
                  <ShieldCheck
                    size={13}
                    className={
                      (session?.user as any)?.authorizedWallet
                        ? "text-emerald-500"
                        : "text-slate-400"
                    }
                  />
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-100 dark:border-slate-800 rounded-lg p-3 mb-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5 flex-grow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    MPC-TSS Address
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-slate-900 dark:text-slate-300 break-all pr-2">
                      {(session?.user as any)?.authorizedWallet
                        ? hideWallet
                          ? `${(session?.user as any).authorizedWallet.substring(0, 6)}...${(session?.user as any).authorizedWallet.substring(38)}`
                          : (session?.user as any).authorizedWallet
                        : "—"}
                    </span>
                    {(session?.user as any)?.authorizedWallet && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setHideWallet(!hideWallet)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title={hideWallet ? "Show Wallet" : "Mask Wallet"}
                        >
                          {hideWallet ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={handleCopyWallet}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          title="Copy Wallet Address"
                        >
                          {copiedWallet ? (
                            <CheckCircle2 size={12} className="text-emerald-500 animate-pulse" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(session?.user as any)?.authorizedWallet ? (
                <p className="text-[9px] text-slate-400 italic font-sans leading-relaxed">
                  Your identity is secured by Particle Network MPC. Requests to the gateway must be
                  signed via EIP-191.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    调用技能 / 设置 Session Key 前，请先激活您的 MPC 主权钱包。
                  </p>
                  <button
                    onClick={() => setShowWalletSetup(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    激活钱包
                  </button>
                </div>
              )}
            </div>

            {/* Team Members */}
            <TeamMemberList members={members} />
          </div>
        </div>
      </div>

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        user={{
          userUid: (session?.user as any)?.userUid,
          email: session?.user?.email || undefined,
        }}
      />

      {showWalletSetup && <WalletSetup onComplete={handleWalletSetupComplete} />}

      <DeleteSkillModal
        isOpen={!!skillToDelete}
        skillName={skillToDelete?.name || ""}
        onClose={() => setSkillToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
