// src/components/Dashboard/DashboardNavbar.tsx
// Dashboard 内部顶部导航栏 — 包含品牌 Logo、路由链接和用户操作区
// 该组件在 /dashboard 及其所有子路由中复用

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";

interface DashboardNavbarProps {
    // 当前用户剩余 credits（由父页面通过 liveCredits 传入，支持实时刷新）
    credits?: number;
    totalCredits?: number;
}

/* ─── Zap 图标：用于 Skills 导航链接 ─── */
function ZapIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
        </svg>
    );
}

export default function DashboardNavbar({ credits, totalCredits = 50 }: DashboardNavbarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const user = session?.user;

    // 判断当前路由是否与给定路径匹配（用于高亮导航项）
    const isActive = (path: string) => pathname === path;

    return (
        <header className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* ── Logo + 导航链接区域（左侧） ── */}
                <div className="flex items-center gap-6">
                    {/* 品牌 Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-sm">UniSkill<span className="gradient-text">.io</span></span>
                    </Link>

                    {/* 路由导航链接 */}
                    <nav className="hidden sm:flex items-center gap-1">
                        {/* Dashboard 概览链接 */}
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive("/dashboard")
                                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                }`}
                        >
                            {/* 概览图标 */}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                            Overview
                        </Link>

                        {/* Skills Store 链接：路由匹配时高亮显示 */}
                        <Link
                            href="/dashboard/skills"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive("/dashboard/skills")
                                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                }`}
                        >
                            <ZapIcon size={12} />
                            Skills
                        </Link>
                    </nav>
                </div>

                {/* ── 右侧：Credits 徽章 + 用户信息 + 登出 ── */}
                <div className="flex items-center gap-3">

                    {/* Credits 余额徽章：持久显示在右上角 */}
                    {typeof credits === "number" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-xs font-semibold"
                        >
                            {/* 闪电图标 */}
                            <ZapIcon size={10} color="#a78bfa" />
                            {/* 显示剩余 / 总量格式 */}
                            <span className="text-purple-300">{credits}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-500">{totalCredits}</span>
                        </motion.div>
                    )}

                    {/* 用户头像 */}
                    {user?.image && (
                        <img
                            src={user.image}
                            alt={user?.name ?? "User"}
                            className="w-8 h-8 rounded-full border border-slate-700"
                        />
                    )}

                    {/* 用户名（中等屏幕以上显示） */}
                    <span className="hidden md:block text-sm text-slate-400">{user?.name}</span>

                    {/* 登出按钮 */}
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="btn-outline text-xs px-3 py-1.5"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
}
