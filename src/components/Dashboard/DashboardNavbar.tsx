// src/components/Dashboard/DashboardNavbar.tsx
// Dashboard 内部顶部导航栏 — 包含品牌 Logo、路由链接和用户操作区
// 该组件在 /dashboard 及其所有子路由中复用

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";

interface DashboardNavbarProps {
    // 当前用户剩余 credits（由父页面通过 liveCredits 传入，支持实时刷新）
    credits?: number;
    totalCredits?: number;
}


export default function DashboardNavbar({ credits, totalCredits = 500 }: DashboardNavbarProps) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const user = session?.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // 判断当前路由是否与给定路径匹配（用于高亮导航项）
    const isActive = (path: string) => pathname === path;

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* ── Logo 区域（左侧） ── */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-white text-sm">UniSkill</span>
                    </Link>
                </div>

                {/* ── 右侧：Credits 徽章 + 用户下拉菜单 ── */}
                <div className="flex items-center gap-4">

                    {/* Credits 余额徽章 */}
                    {typeof credits === "number" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold"
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                            </svg>
                            <span className="text-blue-400">{credits}</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-500">{totalCredits}</span>
                        </motion.div>
                    )}

                    {/* 用户下拉菜单容器 */}
                    <div
                        className="relative"
                        ref={menuRef}
                        onMouseEnter={() => setIsMenuOpen(true)}
                        onMouseLeave={() => setIsMenuOpen(false)}
                    >
                        <button
                            className={`flex items-center gap-2 p-1.5 rounded-xl transition-all outline-none group border ${isMenuOpen ? "border-blue-500/30 bg-white/5" : "border-transparent"
                                } hover:border-blue-500/30 hover:bg-white/5`}
                        >
                            {/* 用户头像 */}
                            {user?.image ? (
                                <img
                                    src={user.image}
                                    alt={user?.name ?? "User"}
                                    className="w-8 h-8 rounded-full border border-white/10 group-hover:border-white/20 transition-colors"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                            )}

                            {/* 用户名与展开图标 */}
                            <span className="hidden md:block text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                                {user?.name ?? "Account"}
                            </span>
                            <svg
                                width="12" height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className={`text-slate-500 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        {/* 下拉列表内容 */}
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-1 w-48 py-1.5 glass-card border border-white/10 shadow-2xl z-[60]"
                                >
                                    {/* Dashboard 链接 */}
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors ${isActive("/dashboard")
                                            ? "text-blue-400 bg-blue-500/10"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                            }`}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                        Dashboard
                                    </Link>

                                    {/* 分割线 */}
                                    <div className="my-1 h-[1px] bg-white/5" />

                                    {/* 登出按钮 */}
                                    <button
                                        onClick={() => signOut({ callbackUrl: "/" })}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
