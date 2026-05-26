"use client";

// src/app/t/[slug]/TeamLandingClient.tsx
// 团队落地页客户端组件 — 4 状态 UI

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, LogIn, ShieldAlert, Mail, Lock, Loader2, Eye, EyeOff, Crown, UserCog, BarChart3, Zap, Layers, Users, CreditCard, Activity, ArrowRight, Clock } from "lucide-react";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { TeamHeroBanner } from "@/components/teams/TeamHeroBanner";
import type { TeamInfo, TeamMember } from "@/types/teams";

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-purple-500" },
  admin: { label: "Admin", icon: UserCog, color: "text-blue-500" },
  member: { label: "Member", icon: Users, color: "text-slate-400" },
  viewer: { label: "Viewer", icon: Eye, color: "text-slate-400" },
};

interface Props {
  team: TeamInfo;
  isAuthenticated: boolean;
  membership: { role: string } | null;
  members: TeamMember[];
  isSuspended: boolean;
  skillCount: number;
  monthlyUsage: number;
  recentEvents: any[];
  initialCredits?: number;
  initialDisplayName?: string | null;
}

export function TeamLandingClient({
  team,
  isAuthenticated,
  membership,
  members,
  isSuspended,
  skillCount,
  monthlyUsage,
  recentEvents,
  initialCredits,
  initialDisplayName,
}: Props) {
  return (
    <div
      className="min-h-screen transition-colors duration-500 font-sans"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none bg-grid" />
      <UnifiedNavbar
        initialCredits={initialCredits}
        initialDisplayName={initialDisplayName}
      />

      {isSuspended ? (
        <div className="max-w-4xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
          <TeamHeroBanner team={team} showDashboard={isAuthenticated} />
          <SuspendedState />
        </div>
      ) : isAuthenticated && membership ? (
        <div className="max-w-4xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
          <TeamHeroBanner team={team} showDashboard={isAuthenticated} />
          <MemberState members={members} team={team} skillCount={skillCount} monthlyUsage={monthlyUsage} recentEvents={recentEvents} />
        </div>
      ) : isAuthenticated && !membership ? (
        <div className="max-w-4xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
          <TeamHeroBanner team={team} showDashboard={isAuthenticated} />
          <NonMemberState />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto pt-[88px] pb-6 md:pt-[120px] md:pb-8 px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* 左侧：团队信息 */}
            <div className="space-y-6">
              <TeamHeroBanner team={team} showDashboard={isAuthenticated} />
              <div
                className="rounded-2xl border p-6 hidden lg:block"
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <h3 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  平台能力
                </h3>
                <ul className="space-y-3">
                  {[
                    { label: 'AI 技能市场', desc: '灵活部署与调用' },
                    { label: '专属网关', desc: '低延迟高性能访问' },
                    { label: '团队协作', desc: '管理员统一管控成员' },
                    { label: '用量监控', desc: '实时查看团队配额消耗' },
                  ].map((f) => (
                    <li key={f.label} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                          {f.label}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                          {f.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 右侧：登录表单 */}
            <UnauthenticatedState />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── State A: 未认证 ─── */

function UnauthenticatedState() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // 页面加载时从 localStorage 恢复记住的邮箱
  useEffect(() => {
    const saved = localStorage.getItem("team_login_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("team-credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "邮箱或密码错误" : result.error);
        setLoading(false);
      } else {
        // 记住账号：登录成功后存储邮箱
        if (rememberMe) {
          localStorage.setItem("team_login_email", email);
        } else {
          localStorage.removeItem("team_login_email");
        }
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message || "登录失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl border p-8 md:p-10 space-y-6"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="space-y-2">
        <div className="inline-flex p-2.5 rounded-full bg-blue-500/10 text-blue-500">
          <LogIn size={24} />
        </div>
        <h2 className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>
          团队登录
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          使用企业管理员账号登录，即可访问团队资源。
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            邮箱
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            密码
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              required
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-medium bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-red-500 text-center">{error}</p>
        )}

        {/* 记住账号 */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            记住账号
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          登录
        </button>
      </form>
    </div>
  );
}

/* ─── State B: 已认证非成员 ─── */

function NonMemberState() {
  return (
    <div
      className="rounded-2xl border p-8 md:p-12 text-center space-y-5"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-500">
        <ShieldAlert size={28} />
      </div>
      <div>
        <h2 className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>
          暂无访问权限
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          你尚未加入该团队。请联系团队管理员为你开通权限。
        </p>
      </div>
      <a
        href="/dashboard"
        className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-colors"
      >
        返回控制台
      </a>
    </div>
  );
}

/* ─── State C: 成员已认证 ─── */

function MemberState({
  members,
  team,
  skillCount,
  monthlyUsage,
  recentEvents,
}: {
  members: TeamMember[];
  team: TeamInfo;
  skillCount: number;
  monthlyUsage: number;
  recentEvents: any[];
}) {
  const slug = team.slug;

  const quickLinks = [
    { href: `/t/${slug}/dashboard`, label: "Stats", icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
    { href: `/t/${slug}/dashboard/myskills`, label: "My Skills", icon: Layers, color: "text-purple-500", bg: "bg-purple-500/10" },
    { href: `/t/${slug}/dashboard/members`, label: "Members", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { href: `/t/${slug}/dashboard/billing`, label: "Billing", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Skills", value: skillCount, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Members", value: members.length, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Monthly Usage", value: monthlyUsage.toLocaleString(), icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", suffix: " credits" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border text-center"
            style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
          >
            <div className={`inline-flex p-2 rounded-lg ${stat.bg} ${stat.color} mb-2`}>
              <stat.icon size={18} />
            </div>
            <p className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>
              {stat.value}{stat.suffix || ""}
            </p>
            <p className="text-[10px] uppercase font-bold tracking-widest mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="p-4 rounded-xl border hover:border-blue-500/30 transition-all group"
            style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
          >
            <div className={`inline-flex p-2 rounded-lg ${link.bg} ${link.color} mb-2`}>
              <link.icon size={16} />
            </div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              {link.label}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
              Open <ArrowRight size={10} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity + Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
        >
          <div
            className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <Clock size={14} className="text-slate-400" />
              Recent Activity
            </h3>
            <Link href={`/t/${slug}/dashboard/billing`} className="text-[10px] font-bold text-blue-500 hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {recentEvents.length > 0 ? (
              recentEvents.map((evt: any) => (
                <div key={evt.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold truncate max-w-[140px]" style={{ color: "var(--color-text-primary)" }}>
                      {evt.skill_name}
                    </p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--color-text-secondary)" }}>
                      {evt.request_id?.slice(0, 12) || evt.id}
                    </p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${evt.amount < 0 ? "text-rose-400" : "text-emerald-500"}`}>
                    {evt.amount < 0 ? evt.amount : `+${evt.amount}`}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                No activity yet
              </div>
            )}
          </div>
        </div>

        {/* Members overview */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
        >
          <div
            className="px-5 py-3 border-b flex items-center justify-between"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
              <Users size={14} className="text-slate-400" />
              Members ({members.length})
            </h3>
            <Link href={`/t/${slug}/dashboard/members`} className="text-[10px] font-bold text-blue-500 hover:underline">
              Manage
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {members.slice(0, 5).map((m) => {
              const config = ROLE_CONFIG[m.role] || ROLE_CONFIG.member;
              const Icon = config.icon;
              return (
                <div key={m.user_uid} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {(m.username || m.email || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold truncate" style={{ color: "var(--color-text-primary)" }}>
                      {m.username || m.email || m.user_uid?.slice(0, 8)}
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                    <Icon size={10} />
                    {config.label}
                  </span>
                </div>
              );
            })}
            {members.length > 5 && (
              <div className="px-5 py-3 text-center">
                <Link href={`/t/${slug}/dashboard/members`} className="text-xs font-bold text-blue-500 hover:underline">
                  View all {members.length} members
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── State D: 团队已暂停 ─── */

function SuspendedState() {
  return (
    <div
      className="rounded-2xl border p-8 md:p-12 text-center space-y-5"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-500">
        <AlertTriangle size={28} />
      </div>
      <div>
        <h2 className="text-lg font-black" style={{ color: "var(--color-text-primary)" }}>
          团队已暂停
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
          该团队目前不可用。如有疑问请联系团队管理员或客服。
        </p>
      </div>
      <a
        href="/"
        className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-colors"
      >
        返回首页
      </a>
    </div>
  );
}
