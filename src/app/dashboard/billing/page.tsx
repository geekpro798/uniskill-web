"use client";

// src/app/dashboard/billing/page.tsx
// Billing & Credit History 页面 — 展示全部积分变动记录

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

interface CreditEvent {
    id: string;
    skill_name: string;
    amount: number;
    created_at: string;
}

/* ── 相对/绝对时间格式化 ── */
function formatTime(isoString: string): { relative: string; absolute: string } {
    const date = new Date(isoString);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    let relative = "";
    if (diff < 60) relative = `${diff}s ago`;
    else if (diff < 3600) relative = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) relative = `${Math.floor(diff / 3600)}h ago`;
    else relative = `${Math.floor(diff / 86400)}d ago`;
    const absolute = date.toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
    return { relative, absolute };
}

export default function BillingPage() {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState<CreditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status !== "authenticated") return;
        // 拉取全部积分事件（API 限制最多 100 条）
        fetch("/api/user/credit-events?limit=100")
            .then((r) => r.json())
            .then((d) => setEvents(d.events ?? []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, [status]);

    /* 未登录 */
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <button onClick={() => signIn("github")} className="btn-primary">
                    Sign in to view billing
                </button>
            </div>
        );
    }

    /* 加载中 */
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const credits = session?.user?.credits;

    return (
        <div className="min-h-screen bg-[#0a0f1e] bg-grid">
            <DashboardNavbar credits={credits} totalCredits={500} />

            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* 返回按钮 + 标题 */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 5l-7 7 7 7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-black text-white mb-1">Billing & Credits</h1>
                    <p className="text-slate-500 text-sm">Full credit usage history</p>
                </motion.div>

                {/* 积分事件列表 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden"
                >
                    {/* 表头 */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-slate-800/60 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <span>Type</span>
                        <span>Skill</span>
                        <span className="text-right">Time</span>
                        <span className="text-right">Amount</span>
                    </div>

                    {loading ? (
                        /* 骨架 */
                        <ul className="divide-y divide-slate-800/50">
                            {[...Array(5)].map((_, i) => (
                                <li key={i} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 animate-pulse items-center">
                                    <div className="w-6 h-6 rounded-full bg-slate-700/60" />
                                    <div className="h-3 w-28 rounded bg-slate-700/60" />
                                    <div className="h-3 w-16 rounded bg-slate-700/40" />
                                    <div className="h-3 w-8 rounded bg-slate-700/60" />
                                </li>
                            ))}
                        </ul>
                    ) : events.length === 0 ? (
                        /* 空状态 */
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-600">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            <p className="text-sm">No credit events yet</p>
                            <p className="text-xs text-slate-700 max-w-xs text-center">
                                Events will appear here once you start using API skills or receive credit top-ups.
                            </p>
                        </div>
                    ) : (
                        /* 事件行：数据由 API 按 created_at DESC 排序 */
                        <ul className="divide-y divide-slate-800/50">
                            {events.map((evt) => {
                                const isDeduction = evt.amount < 0;
                                const { relative, absolute } = formatTime(evt.created_at);
                                return (
                                    <li
                                        key={evt.id}
                                        className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors"
                                    >
                                        {/* 方向图标 */}
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDeduction ? "bg-rose-500/10" : "bg-green-500/10"}`}>
                                            {isDeduction ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19,12 12,19 5,12" />
                                                </svg>
                                            ) : (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5,12 12,5 19,12" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* 技能名称 */}
                                        <span className="text-sm font-medium text-slate-300 truncate">{evt.skill_name}</span>

                                        {/* 时间（hover 显示绝对时间） */}
                                        <span className="text-xs text-slate-500 text-right" title={absolute}>{relative}</span>

                                        {/* 金额 */}
                                        <span className={`text-sm font-semibold tabular-nums text-right ${isDeduction ? "text-rose-400" : "text-green-400"}`}>
                                            {isDeduction ? evt.amount : `+${evt.amount}`}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </motion.div>

                {events.length > 0 && (
                    <p className="text-xs text-slate-700 text-center mt-4">
                        Showing {events.length} event{events.length !== 1 ? "s" : ""}
                    </p>
                )}
            </main>
        </div>
    );
}
