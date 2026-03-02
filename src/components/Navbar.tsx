"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import SignInModal from "./SignInModal";

/* ─── Navbar 组件：固定在顶部的导航栏 ──────────────────────────────────
   功能：随滚动增强背景模糊效果，Logo 在左，Sign In 按钮在右
   ─────────────────────────────────────────────────────────────────── */
export default function Navbar() {
    /* 监听页面滚动，动态调整导航栏背景透明度 */
    const { scrollY } = useScroll();
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
            <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">

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

                {/* ─── 右侧操作区域 ─── */}
                <motion.div
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 文档链接 */}
                    <a
                        href="/docs"
                        className="hidden md:block text-sm text-slate-400 hover:text-slate-200 transition-colors font-medium"
                    >
                        Docs
                    </a>

                    {/* 价格链接 */}
                    <a
                        href="/pricing"
                        className="hidden md:block text-sm text-slate-400 hover:text-slate-200 transition-colors font-medium"
                    >
                        Pricing
                    </a>

                    {/* Sign In / Dashboard 按钮：根据登录状态切换 */}
                    <NavbarAuthButton />
                </motion.div>
            </nav>
        </motion.header>
    );
}

/* ─── NavbarAuthButton：根据登录状态显示不同按钮 ────────────────────────
   - 未登录：点击 Sign In → 打开 SignInModal 弹窗确认授权
   - 已登录：显示用户头像 + Dashboard 链接 + Sign Out
   ─────────────────────────────────────────────────────────────────────── */
function NavbarAuthButton() {
    const { data: session, status } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);

    /* 加载中：显示占位骨架 */
    if (status === "loading") {
        return <div className="w-20 h-8 rounded-lg bg-slate-700/50 animate-pulse" />;
    }

    /* 已登录：头像 + Dashboard + Sign Out */
    if (session?.user) {
        return (
            <div className="flex items-center gap-2">
                {/* Dashboard 入口 */}
                <motion.a
                    href="/dashboard"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500/15 border border-blue-500/40 text-blue-400 hover:bg-blue-500/25 transition-all"
                >
                    Dashboard
                </motion.a>
                {/* 用户头像（点击 Sign Out） */}
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

    /* 未登录：Sign In 按钮 → 打开 Modal 弹窗 */
    return (
        <>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-200"
            >
                Sign In
            </motion.button>
            {/* 授权确认 Modal：弹窗打开 GitHub OAuth，授权后自动关闭 */}
            <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}
