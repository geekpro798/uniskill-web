"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, Zap, Monitor, LayoutGrid, Plus, LogOut, ChevronDown } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/context/UserContext";

/**
 * UnifiedNavbar: 全站统一导航栏 (v1.0)
 * 核心特性：
 * 1. 自动感知路由：根据 /dashboard 前缀切换导航项
 * 2. 全局资产同步：基于 UserContext 的实时积分展示
 * 3. 零跳变导航：统一的 DOM 结构确保 Next.js 路由切换时视觉丝滑
 */

interface UnifiedNavbarProps {
    initialCredits?: number | undefined;
    initialDisplayName?: string | null;
    initialAvatarUrl?: string | null;
}

export default function UnifiedNavbar({ initialCredits, initialDisplayName, initialAvatarUrl }: UnifiedNavbarProps) {
    const { status } = useSession();
    const pathname = usePathname();
    const { scrollY } = useScroll();
    const context = useUser();

    // 🌟 合并逻辑：优先使用 Props (SSR 注入)，其次使用 Context (全局状态)
    const activeCredits = initialCredits !== undefined ? initialCredits : context.credits;
    const activeDisplayName = initialDisplayName !== undefined ? initialDisplayName : context.displayName;

    // 自动判定模式
    const isDashboard = pathname.startsWith("/dashboard") || pathname === "/settings";
    
    // 滚动动效 (仅在非 Dashboard 模式下更明显，但结构保持一致)
    const navBg = useTransform(
        scrollY,
        [0, 80],
        [isDashboard ? "var(--color-nav-bg)" : "transparent", "var(--color-nav-bg)"]
    );
    const navBorder = useTransform(
        scrollY,
        [0, 80],
        ["rgba(59, 130, 246, 0)", "var(--color-border)"]
    );

    return (
        <motion.header
            style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
            className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl h-16 transition-colors duration-300"
        >
            <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between relative">
                
                {/* ─── 左侧：品牌 Logo (绝对一致) ─── */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                        <LogoIcon />
                        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                            UniSkill
                        </span>
                    </Link>
                </div>

                {/* ─── 中间：模式切换导航 ─── */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
                    {isDashboard ? (
                        <DashboardLinks pathname={pathname} />
                    ) : (
                        <MarketingLinks pathname={pathname} />
                    )}
                </div>

                {/* ─── 右侧：资产 + 主题 + 用户菜单 ─── */}
                <div className="flex items-center gap-3 ml-auto">
                    {(status === "authenticated" || initialCredits !== undefined) && (
                        <CreditsBadge credits={activeCredits} />
                    )}
                    
                    <ThemeToggle />
                    
                    <AuthSection 
                        status={initialCredits !== undefined ? "authenticated" : status} 
                        displayName={activeDisplayName} 
                        initialAvatarUrl={initialAvatarUrl}
                    />
                </div>
            </nav>
        </motion.header>
    );
}

/* ─── 子组件库 ────────────────────────────────────────────────────────── */

// 1. 品牌图标 (Pixel Perfect Match)
function LogoIcon() {
    return (
        <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg rotate-3 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    );
}

// 2. 积分徽章 (Global Integrated)
function CreditsBadge({ credits }: { credits: number | undefined }) {
    if (credits === undefined) {
        return <div className="h-7 w-20 rounded-full animate-pulse bg-blue-500/10 border border-blue-500/20" />;
    }
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold"
        >
            <Zap size={10} className="text-blue-400" fill="currentColor" />
            <span className="text-blue-400">{credits.toLocaleString()}</span>
        </motion.div>
    );
}

// 3. 营销模式链接
function MarketingLinks({ pathname }: { pathname: string }) {
    const isSkillsActive = pathname === "/skills";
    return (
        <>
            <Link
                href="/skills"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    isSkillsActive
                    ? "text-indigo-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-indigo-500/25"
                    : "border-transparent hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:border-blue-500/20"
                }`}
                style={{ color: isSkillsActive ? "var(--color-purple)" : "var(--color-text-secondary)" }}
            >
                <LayoutGrid size={13} />
                Skills
            </Link>
            <Link 
                href="https://docs.uniskill.ai" 
                target="_blank"
                className="px-3 py-1.5 text-sm font-medium border border-transparent hover:text-blue-400 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
            >
                Docs
            </Link>
            <Link 
                href="/#pricing"
                className="px-3 py-1.5 text-sm font-medium border border-transparent hover:text-blue-400 transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
            >
                Pricing
            </Link>
        </>
    );
}

// 4. 管理模式链接
function DashboardLinks({ pathname }: { pathname: string }) {
    const links = [
        { href: '/dashboard', label: 'Stats', icon: Monitor },
        { href: '/dashboard/myskills', label: 'My Skills', icon: LayoutGrid },
        { href: '/dashboard/billing', label: 'Billing', icon: Zap },
    ];

    return (
        <>
            {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                            active
                            ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                            : "border-transparent hover:bg-white/5"
                        }`}
                        style={{ color: active ? "var(--color-blue)" : "var(--color-text-secondary)" }}
                    >
                        <Icon size={13} />
                        {label}
                    </Link>
                );
            })}
        </>
    );
}

// 5. 身份校验与下拉菜单
function AuthSection({ status, displayName, initialAvatarUrl }: { status: string, displayName: string | null, initialAvatarUrl?: string | null }) {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (status === "loading") {
        return <div className="w-8 h-8 rounded-xl bg-slate-700/50 animate-pulse" />;
    }

    if (status === "authenticated" || session?.user) {
        const userImage = session?.user?.image || initialAvatarUrl;
        const userName = displayName || session?.user?.name || "Account";

        return (
            <div className="relative" ref={menuRef}>
                <button
                    onMouseEnter={() => setIsMenuOpen(true)}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center gap-2 p-1.5 rounded-xl transition-all border ${
                        isMenuOpen ? "border-blue-500/30 bg-[var(--color-toggle-bg)]" : "border-transparent"
                    } hover:bg-[var(--color-toggle-bg)]`}
                >
                    {userImage ? (
                        <img src={userImage} className="w-8 h-8 rounded-xl border border-white/10" alt="Avatar" />
                    ) : (
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center">
                            <Monitor size={16} className="text-slate-500" />
                        </div>
                    )}
                    <span 
                        className="hidden md:block text-xs font-medium truncate max-w-[120px]" 
                        title={userName}
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {userName}
                    </span>
                    <ChevronDown size={12} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            className="absolute right-0 mt-1 w-48 py-1.5 glass-card shadow-2xl z-[60]"
                            style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
                            onMouseLeave={() => setIsMenuOpen(false)}
                        >
                            <MenuLink href="/dashboard" icon={Monitor} label="Dashboard" active={isActive("/dashboard")} />
                            <MenuLink href="/dashboard/myskills/new" icon={Plus} label="Create New Skill" active={isActive("/dashboard/myskills/new")} />
                            <MenuLink href="/settings" icon={Settings} label="Settings" active={isActive("/settings")} />
                            <div className="my-1 h-[px] bg-white/5" style={{ backgroundColor: "var(--color-border)" }} />
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-500/80 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                            >
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-all"
        >
            Sign in
        </button>
    );
}

function MenuLink({ href, icon: Icon, label, active }: { href: string, icon: any, label: string, active: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors border-l-2 ${
                active
                ? "text-blue-500 bg-gradient-to-r from-blue-500/10 to-purple-500/5 border-blue-500"
                : "border-transparent hover:bg-white/5"
            }`}
            style={{ color: active ? "var(--color-blue)" : "var(--color-text-secondary)" }}
        >
            <Icon size={14} />
            {label}
        </Link>
    );
}
