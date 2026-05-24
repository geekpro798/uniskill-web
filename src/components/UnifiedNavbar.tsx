"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Settings, Zap, Monitor, LayoutGrid, Plus, LogOut, ChevronDown, Menu, X, DollarSign, BookOpen, ExternalLink } from "lucide-react";
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

    // Mobile Menu State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // 🌟 移动端交互逻辑优化 (Mobile UX Logic)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMobileMenuOpen &&
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                menuButtonRef.current &&
                !menuButtonRef.current.contains(event.target as Node)
            ) {
                setIsMobileMenuOpen(false);
            }
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    // 自动判定模式
    const isDashboard = pathname.startsWith("/dashboard") || pathname === "/settings";
    const isTeamPage = pathname.startsWith("/t/");
    const isTeamDashboard = isTeamPage && (pathname.includes("/dashboard") || pathname.includes("/myskills") || pathname.includes("/settings"));
    
    // 滚动动效 (仅在非 Dashboard 模式下更明显，但结构保持一致)
    const navBg = useTransform(
        scrollY,
        [0, 80],
        [isDashboard || isTeamDashboard ? "var(--color-nav-bg)" : "transparent", "var(--color-nav-bg)"]
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
                
                {/* ─── 左侧：品牌 Logo ─── */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                        <LogoIcon />
                        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
                            UniSkill
                        </span>
                    </Link>
                </div>

                {/* ─── 中间：模式切换导航 (桌面端) ─── */}
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
                    {isTeamPage ? (
                        isTeamDashboard ? <TeamDashboardLinks pathname={pathname} /> : <TeamLinks />
                    ) : isDashboard ? (
                        <DashboardLinks pathname={pathname} />
                    ) : (
                        <MarketingLinks pathname={pathname} />
                    )}
                </div>

                {/* ─── 右侧：资产 + 主题 + 用户菜单 ─── */}
                <div className="flex items-center gap-3">
                    {!isTeamPage && (status === "authenticated" || initialCredits !== undefined) && (
                        <CreditsBadge credits={activeCredits} />
                    )}
                    
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>
                    
                    <AuthSection
                        status={initialCredits !== undefined ? "authenticated" : status}
                        displayName={activeDisplayName}
                        initialAvatarUrl={initialAvatarUrl}
                        isTeamPage={isTeamPage}
                    />

                    {/* 移动端菜单触发器 */}
                    <button 
                        ref={menuButtonRef}
                        className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* 移动端下拉抽屉 (Mobile Menu Drawer) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        ref={mobileMenuRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="md:hidden absolute top-full left-0 right-0 glass-card border-b overflow-hidden shadow-2xl z-[60]"
                        style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
                    >
                        <div className="p-6 space-y-3">
                            {isTeamPage ? (
                                isTeamDashboard ? <MobileDashboardLinks pathname={pathname} onClose={() => setIsMobileMenuOpen(false)} /> : null
                            ) : isDashboard ? (
                                <MobileDashboardLinks pathname={pathname} onClose={() => setIsMobileMenuOpen(false)} />
                            ) : (
                                <MobileMarketingLinks pathname={pathname} onClose={() => setIsMobileMenuOpen(false)} />
                            )}
                            
                            <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest opacity-50">Theme</span>
                                    <ThemeToggle />
                                </div>
                                {!isTeamPage && status === "authenticated" && activeCredits !== undefined && (
                                    <div className="flex justify-between items-center bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Available Credits</span>
                                        <span className="font-mono font-bold text-blue-500">{activeCredits.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
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

// 2. 积分徽章 (Responsive)
function CreditsBadge({ credits }: { credits: number | undefined }) {
    if (credits === undefined) {
        return <div className="h-7 w-12 sm:w-20 rounded-full animate-pulse bg-blue-500/10 border border-blue-500/20" />;
    }
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold"
        >
            <Zap size={10} className="text-blue-400" fill="currentColor" />
            <span className="text-blue-400 hidden sm:inline">{credits.toLocaleString()}</span>
            <span className="text-blue-400 sm:hidden">
                {credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : credits}
            </span>
        </motion.div>
    );
}

// 3. 团队页面链接
function TeamLinks() {
    return (
        <Link
            href="/skills"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-transparent hover:text-blue-400 transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
        >
            <LayoutGrid size={13} />
            Skills
        </Link>
    );
}

// 3.5 团队控制台链接 (镜像 DashboardLinks)
function TeamDashboardLinks({ pathname }: { pathname: string }) {
    const slug = pathname.split("/")[2];
    const links = [
        { href: `/t/${slug}/dashboard`, label: "Stats", icon: Monitor },
        { href: `/t/${slug}/dashboard`, label: "My Skills", icon: LayoutGrid },
        { href: `/t/${slug}/settings`, label: "Billing", icon: Zap },
    ];

    return (
        <>
            {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/") || (label === "My Skills" && pathname.includes("/myskills"));
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

// 4. 营销模式链接
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
function AuthSection({ status, displayName, initialAvatarUrl, isTeamPage }: { status: string, displayName: string | null, initialAvatarUrl?: string | null, isTeamPage?: boolean }) {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    // 团队页面下提取 slug，构造团队专属路由
    const teamSlug = isTeamPage ? pathname.split("/")[2] : null;
    const dashboardHref = teamSlug ? `/t/${teamSlug}/dashboard` : "/dashboard";
    const deployHref = teamSlug ? `/t/${teamSlug}/myskills/new` : "/dashboard/myskills/new";
    const settingsHref = teamSlug ? `/t/${teamSlug}/settings` : "/settings";

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
                        className="hidden lg:block text-xs font-medium truncate max-w-[120px]" 
                        title={userName}
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {userName}
                    </span>
                    <ChevronDown size={12} className={`hidden lg:block transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
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
                            <MenuLink href={dashboardHref} icon={Monitor} label="Dashboard" active={isActive(dashboardHref)} />
                            <MenuLink href={deployHref} icon={Plus} label="Deploy Skill" active={isActive(deployHref)} />
                            <MenuLink href={settingsHref} icon={Settings} label="Settings" active={isActive(settingsHref)} />
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

    // 团队页面不显示 GitHub 登录入口（页面内有邮箱/密码登录表单）
    if (isTeamPage) return null;

    return (
        <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 transition-all"
        >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span>Sign in with GitHub</span>
        </button>
    );
}

function MenuLink({ href, icon: Icon, label, active, onClick }: { href: string, icon: any, label: string, active: boolean, onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
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

// 6. 移动端专用链接
function MobileMarketingLinks({ pathname, onClose }: { pathname: string, onClose: () => void }) {
    const links = [
        { href: "/skills", label: "Skills", icon: LayoutGrid },
        { href: "https://docs.uniskill.ai", label: "Docs", icon: BookOpen, external: true },
        { href: "/#pricing", label: "Pricing", icon: DollarSign },
    ];

    return (
        <div className="space-y-1">
            {links.map(({ href, label, icon: Icon, external }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        target={external ? "_blank" : undefined}
                        onClick={onClose}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-bold"
                        style={{ color: active ? "var(--color-blue)" : "var(--color-text-secondary)" }}
                    >
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Icon size={18} className="text-blue-500" />
                        </div>
                        {label}
                        {external && <ExternalLink size={12} className="opacity-30 ml-auto" />}
                    </Link>
                );
            })}
        </div>
    );
}

function MobileDashboardLinks({ pathname, onClose }: { pathname: string, onClose: () => void }) {
    const links = [
        { href: '/dashboard', label: 'Stats', icon: Monitor },
        { href: '/dashboard/myskills', label: 'My Skills', icon: LayoutGrid },
        { href: '/dashboard/billing', label: 'Billing', icon: Zap },
    ];

    return (
        <div className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all text-sm font-bold"
                        style={{ color: active ? "var(--color-blue)" : "var(--color-text-secondary)" }}
                    >
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Icon size={18} className="text-blue-500" />
                        </div>
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}
