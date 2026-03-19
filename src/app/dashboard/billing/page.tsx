"use client";

// src/app/dashboard/billing/page.tsx
// Billing & Credit History 页面 — 展示全部积分变动记录

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";
import { formatDateTime } from "@/lib/utils";

interface CreditEvent {
    id: string;
    request_id: string;
    skill_name: string;
    amount: number;
    created_at: string;
}


export default function BillingPage() {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState<CreditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState<"all" | "usage" | "topup">("all");
    const [liveCredits, setLiveCredits] = useState<number | undefined>(undefined);
    const eventsPerPage = 10;

    // Derived values: 1. Filter events based on type
    const filteredEvents = events.filter((evt) => {
        if (filterType === "all") return true;
        if (filterType === "usage") return evt.amount < 0;
        if (filterType === "topup") return evt.amount > 0;
        return true;
    });

    // Derived values: 2. Calculate pagination on FILTERED events
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const currentEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

    const fetchLiveCredits = async () => {
        if (!session?.user?.id) return;
        try {
            const res = await fetch("/api/user/credits");
            if (res.ok) {
                const data = await res.json();
                if (typeof data.credits === "number") {
                    setLiveCredits(data.credits);
                }
            }
        } catch (e) {
            console.error("Failed to fetch live credits", e);
        }
    };

    useEffect(() => {
        if (status !== "authenticated") return;
        // 拉取全部积分事件（API 限制最多 100 条）
        fetch("/api/user/credit-events?limit=100")
            .then((r) => r.json())
            .then((d) => setEvents(d.events ?? []))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));

        // SWR: 初始由 fetchLiveCredits 获取最新值（展示骨架屏）
        fetchLiveCredits();
        window.addEventListener("focus", fetchLiveCredits);
        return () => window.removeEventListener("focus", fetchLiveCredits);
    }, [status, session?.user?.id]);

    /* 未登录 */
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-primary)" }}>
                <button onClick={() => signIn("github")} className="btn-primary">
                    Sign in to view billing
                </button>
            </div>
        );
    }

    /* 加载中 */
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-primary)" }}>
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const credits = liveCredits;

    return (
        <div className="min-h-screen bg-grid" style={{ backgroundColor: "var(--color-bg-primary)" }}>
            <DashboardNavbar credits={credits} totalCredits={500} />

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="flex items-end justify-between mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-xs transition-colors mb-4"
                            style={{ color: "var(--color-text-secondary)" }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text-primary)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 5l-7 7 7 7" />
                            </svg>
                            Back to Dashboard
                        </Link>
                        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--color-text-primary)" }}>Billing & Credits</h1>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Full credit usage history</p>
                    </motion.div>

                    {/* Type 筛选器 - 右侧对齐 */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="flex items-center gap-1 p-1 rounded-lg border"
                        style={{ backgroundColor: "var(--color-os-tabs-bg)", borderColor: "var(--color-border)" }}
                    >
                        <button
                            onClick={() => { setFilterType("all"); setCurrentPage(1); }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'all' ? 'shadow-sm' : ''}`}
                            style={{ 
                                backgroundColor: filterType === 'all' ? "var(--color-tab-active-bg)" : "transparent",
                                color: filterType === 'all' ? "var(--color-tab-active-text)" : "var(--color-text-secondary)",
                                border: filterType === 'all' ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent"
                            }}
                        >
                            All
                        </button>
                        <button
                            onClick={() => { setFilterType("usage"); setCurrentPage(1); }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'usage' ? 'shadow-sm' : ''}`}
                            style={{ 
                                backgroundColor: filterType === 'usage' ? "var(--color-tab-active-bg)" : "transparent",
                                color: filterType === 'usage' ? "var(--color-tab-active-text)" : "var(--color-text-secondary)",
                                border: filterType === 'usage' ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent"
                            }}
                        >
                            Usage
                        </button>
                        <button
                            onClick={() => { setFilterType("topup"); setCurrentPage(1); }}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterType === 'topup' ? 'shadow-sm' : ''}`}
                            style={{ 
                                backgroundColor: filterType === 'topup' ? "var(--color-tab-active-bg)" : "transparent",
                                color: filterType === 'topup' ? "var(--color-tab-active-text)" : "var(--color-text-secondary)",
                                border: filterType === 'topup' ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent"
                            }}
                        >
                            Top-ups
                        </button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card overflow-hidden"
                >
                    {/* 表头 */}
                    <div 
                        className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b text-[10px] uppercase font-bold tracking-widest"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-toggle-bg)" }}
                    >
                        <span>Type</span>
                        <span>Skill</span>
                        <span>Request ID</span>
                        <span className="text-right">Time</span>
                        <span className="text-right">Amount</span>
                    </div>

                    {loading ? (
                        /* 骨架 */
                        <ul className="flex flex-col">
                            {[...Array(5)].map((_, i) => (
                                <li key={i} className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-4 animate-pulse items-center border-b" style={{ borderColor: "var(--color-border)" }}>
                                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: "var(--color-menu-hover-bg)" }} />
                                    <div className="h-3 w-28 rounded" style={{ backgroundColor: "var(--color-menu-hover-bg)" }} />
                                    <div className="h-3 w-32 rounded" style={{ backgroundColor: "var(--color-menu-hover-bg)" }} />
                                    <div className="h-3 w-16 rounded" style={{ backgroundColor: "var(--color-menu-hover-bg)" }} />
                                    <div className="h-3 w-8 rounded" style={{ backgroundColor: "var(--color-menu-hover-bg)" }} />
                                </li>
                            ))}
                        </ul>
                    ) : events.length === 0 ? (
                        /* 空状态 */
                        <div className="flex flex-col items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-secondary)" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                            <p className="text-sm font-semibold">No credit events yet</p>
                            <p className="text-xs max-w-xs text-center opacity-70">
                                Events will appear here once you start using API skills or receive credit top-ups.
                            </p>
                        </div>
                    ) : (
                        /* 事件行：数据由 API 按 created_at DESC 排序 */
                        <ul className="flex flex-col">
                            {currentEvents.map((evt) => {
                                const isDeduction = evt.amount < 0;
                                return (
                                    <li
                                        key={evt.id}
                                        className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-4 items-center transition-colors group/row border-b last:border-0"
                                        style={{ borderColor: "var(--color-border)" }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-menu-hover-bg)"}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
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
                                        <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{evt.skill_name}</span>

                                        {/* Request ID */}
                                        <span
                                            className="text-[10px] font-mono truncate cursor-pointer flex items-center gap-1 group/id transition-colors"
                                            style={{ color: "var(--color-text-secondary)" }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(evt.request_id || evt.id);
                                            }}
                                            title="Click to copy Request ID"
                                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-blue)"}
                                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-secondary)"}
                                        >
                                            {evt.request_id || evt.id}
                                            <svg className="opacity-0 group-hover/id:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        </span>

                                        {/* 时间 */}
                                        <span className="text-[11px] text-right whitespace-nowrap font-medium" style={{ color: "var(--color-text-secondary)" }}>{formatDateTime(evt.created_at)}</span>

                                        {/* 金额 */}
                                        <span className={`text-sm font-bold tabular-nums text-right ${isDeduction ? "text-rose-400" : "text-green-500"}`}>
                                            {isDeduction ? evt.amount : `+${evt.amount}`}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div 
                            className="flex items-center justify-between px-5 py-4 border-t"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-toggle-bg)" }}
                        >
                            <span className="text-[11px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Showing {filteredEvents.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-md border transition-all disabled:opacity-30 disabled:pointer-events-none"
                                    style={{ 
                                        color: "var(--color-text-secondary)", 
                                        backgroundColor: "var(--color-bg-primary)",
                                        borderColor: "var(--color-border)"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-menu-hover-bg)"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg-primary)"}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-md border transition-all disabled:opacity-30 disabled:pointer-events-none"
                                    style={{ 
                                        color: "var(--color-text-secondary)", 
                                        backgroundColor: "var(--color-bg-primary)",
                                        borderColor: "var(--color-border)"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-menu-hover-bg)"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--color-bg-primary)"}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

                {filteredEvents.length > 0 && totalPages <= 1 && (
                    <p className="text-[10px] uppercase font-bold tracking-widest text-center mt-6" style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}>
                        Total {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
                    </p>
                )}
            </main>
        </div>
    );
}
