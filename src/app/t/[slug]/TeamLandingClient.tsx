"use client";

// src/app/t/[slug]/TeamLandingClient.tsx
// 团队落地页客户端组件 — 4 状态 UI

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, LogIn, ShieldAlert, Mail, Lock, Loader2, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { TeamHeroBanner } from "@/components/teams/TeamHeroBanner";
import { TeamMemberList } from "@/components/teams/TeamMemberList";
import type { TeamInfo, TeamMember } from "@/types/teams";

interface Props {
  team: TeamInfo;
  isAuthenticated: boolean;
  membership: { role: string } | null;
  members: TeamMember[];
  isSuspended: boolean;
  initialCredits?: number;
  initialDisplayName?: string | null;
}

export function TeamLandingClient({
  team,
  isAuthenticated,
  membership,
  members,
  isSuspended,
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
          <TeamHeroBanner team={team} />
          <SuspendedState />
        </div>
      ) : isAuthenticated && membership ? (
        <div className="max-w-4xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
          <TeamHeroBanner team={team} />
          <MemberState members={members} />
        </div>
      ) : isAuthenticated && !membership ? (
        <div className="max-w-4xl mx-auto pt-[88px] pb-6 md:pt-[100px] md:pb-8 px-6 md:px-8 space-y-6 relative z-10">
          <TeamHeroBanner team={team} />
          <NonMemberState />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto pt-[88px] pb-6 md:pt-[120px] md:pb-8 px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* 左侧：团队信息 */}
            <div className="space-y-6">
              <TeamHeroBanner team={team} />
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

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
            邮箱
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
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

function MemberState({ members }: { members: TeamMember[] }) {
  const params = useParams();
  const slug = params?.slug as string;

  return (
    <div className="space-y-6">
      <Link
        href={`/t/${slug}/dashboard`}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors"
      >
        <LayoutDashboard size={16} />
        进入团队控制台
      </Link>
      <TeamMemberList members={members} />
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
