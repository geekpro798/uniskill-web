// src/components/Dashboard/QuickActivity.tsx
// Recent Activity widget — 展示最近 5 条积分变动记录

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CreditEvent {
    id: string;
    skill_name: string;
    amount: number;
    created_at: string;
}

/* ── 相对时间格式化工具 ─────────────────────────────────────── */
function relativeTime(isoString: string): string {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function QuickActivity() {
    const [events, setEvents] = useState<CreditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 挂载后立即拉取最新积分事件数据
        fetch("/api/user/credit-events")
            .then((r) => r.json())
            .then((d) => {
                // 数据映射：将 API 响应直接赋值给状态（降序排列由服务端保证）
                setEvents(d.events ?? []);
            })
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="flex flex-col h-full rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            {/* ── 标题栏 ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                    {/* 活动图标 */}
                    <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-300">Recent Activity</span>
                </div>
                {/* View All 跳转到计费页：→ 符号故意用 aria-hidden 保持可访问性 */}
                <Link
                    href="/dashboard/billing"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
                >
                    View All
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* ── 内容区 ── */}
            <div className="flex-1 flex flex-col justify-center">
                {loading ? (
                    /* 骨架加载态 */
                    <ul className="divide-y divide-slate-800/50">
                        {[...Array(3)].map((_, i) => (
                            <li key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                                <div className="w-6 h-6 rounded-full bg-slate-700/60" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-24 rounded bg-slate-700/60" />
                                    <div className="h-2.5 w-14 rounded bg-slate-700/40" />
                                </div>
                                <div className="h-3 w-8 rounded bg-slate-700/60" />
                            </li>
                        ))}
                    </ul>
                ) : events.length === 0 ? (
                    /* 空状态 */
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-600">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                        <p className="text-xs">No activity yet</p>
                    </div>
                ) : (
                    /* 事件列表：数据由 API 负责按 created_at DESC 排序 */
                    <ul className="divide-y divide-slate-800/50">
                        {events.map((evt) => {
                            // 判断正负决定图标和颜色
                            const isDeduction = evt.amount < 0;
                            return (
                                <li key={evt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/30 transition-colors">
                                    {/* 方向图标：扣减用 rose-400，增加用 green-400 */}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDeduction ? "bg-rose-500/10" : "bg-green-500/10"
                                        }`}>
                                        {isDeduction ? (
                                            /* 向下箭头 = 扣减 */
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <polyline points="19,12 12,19 5,12" />
                                            </svg>
                                        ) : (
                                            /* 向上箭头 = 增加 */
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="19" x2="12" y2="5" />
                                                <polyline points="5,12 12,5 19,12" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* 技能名称 + 相对时间 */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-300 truncate">{evt.skill_name}</p>
                                        <p className="text-xs text-slate-600">{relativeTime(evt.created_at)}</p>
                                    </div>

                                    {/* 变动金额：负数 rose-400，正数 green-400 */}
                                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${isDeduction ? "text-rose-400" : "text-green-400"
                                        }`}>
                                        {isDeduction ? evt.amount : `+${evt.amount}`}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
