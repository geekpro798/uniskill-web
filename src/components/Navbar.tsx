"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

/* ─── Navbar 组件：固定在顶部的导航栏 ──────────────────────────────────
   功能：随滚动增强背景模糊效果，Logo 在左，Sign In 按钮在右
   ─────────────────────────────────────────────────────────────────── */
export default function Navbar() {
    /* 监听页面滚动，动态调整导航栏背景透明度 */
    const { scrollY } = useScroll();
    /* 检测当前路由，用于 Skills 链接的 active 高亮 */
    const pathname = usePathname();
    const isSkillsActive = pathname === "/skills";
    const navBg = useTransform(
        scrollY,
        [0, 80],
        ["rgba(10, 15, 30, 0)", "rgba(10, 15, 30, 0.85)"]
    );
    const navBorder = useTransform(
        scrollY,
        [0, 80],
        ["rgba(59, 130, 246, 0)", "rgba(59, 130, 246, 0.12)"]
    );

    return (
        /* 固定定位容器 */
        <motion.header
            style={{ backgroundColor: navBg, borderBottomColor: navBorder }}
            className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        >
            <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between relative">

                {/* ─── Logo 区域：左侧品牌标识 ─── */}
                <motion.a
                    href="/"
                    className="flex items-center gap-2.5 group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Logo 图标：蓝紫渐变六边形 */}
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

                    {/* 品牌文字 */}
                    <span className="text-lg font-bold tracking-tight">
                        <span className="text-white">UniSkill</span>
                        <span className="gradient-text">.io</span>
                    </span>
                </motion.a>

                {/* ─── 居中导航区域：Skills / Docs / Pricing ─── */}
                <motion.div
                    className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Skills 链接：路由 /skills，active 时 indigo 高亮 */}
                    <motion.a
                        href="/skills"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isSkillsActive
                            ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/25"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                            }`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                        </svg>
                        Skills
                    </motion.a>

                    {/* Docs 链接：指向外部文档地址 */}
                    <motion.a
                        href="https://docs.uniskill.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
                    >
                        Docs
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                        </svg>
                    </motion.a>

                    {/* Pricing 链接 */}
                    <a
                        href="/pricing"
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
                    >
                        Pricing
                    </a>
                </motion.div>

                {/* ─── 右侧操作区域：仅保留 Sign In / Dashboard ─── */}
                <motion.div
                    className="flex items-center gap-3 ml-auto"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <NavbarAuthButton />
                </motion.div>
            </nav>
        </motion.header>
    );
}

/* ─── NavbarAuthButton：根据登录状态显示不同按钮 ────────────────────────
   - 未登录：显示 Sign in with GitHub 按钮
   - 已登录：显示 Dashboard 链接 + 用户头像（Skills 链接已移至公共区域）
   ─────────────────────────────────────────────────────────────────────── */
function NavbarAuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return <div className="w-32 h-8 rounded-lg bg-slate-700/50 animate-pulse" />;
    }

    if (session?.user) {
        return (
            <div className="flex items-center gap-2">
                <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25 transition-all"
                >
                    Dashboard
                </motion.a>
                {session.user.image && (
                    <button onClick={() => signOut({ callbackUrl: "/" })} title="Sign Out">
                        <img
                            src={session.user.image}
                            alt={session.user.name ?? "User"}
                            className="w-8 h-8 rounded-full border border-slate-700 hover:border-slate-500 transition-colors"
                        />
                    </button>
                )}
            </div>
        );
    }

    /* 未登录：直接跳转 GitHub OAuth */
    return (
        <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-200"
        >
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
        </motion.button>
    );
}
