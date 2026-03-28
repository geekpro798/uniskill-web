// frontend/src/app/skills/page.tsx
// Logic: V2 Skills Store with Real Data Fetching (Dynamic .md Parsing)

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, Monitor, Briefcase, TrendingUp, Wrench, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { resolveSkillVisuals } from "@/lib/skill-visual-identity"; // 🌟 Optimized Identity System

// ── 1. 全局数据字典 (Data Dictionaries) ──

// 逻辑：8 大黄金标准分类配置
const CATEGORIES = [
    { id: "all", label: "All Skills", icon: LayoutGrid },
    { id: "web_search", label: "Web & Search", icon: Search },
    { id: "dev_system", label: "Dev & System", icon: Monitor },
    { id: "workspace_data", label: "Workspace & Data", icon: Briefcase },
    { id: "finance_trading", label: "Finance & Trading", icon: TrendingUp },
    { id: "utilities", label: "Utilities", icon: Wrench }
];

export default function SkillsStorePage() {
    // ── 2. 状态管理 (State Management) ──
    const [activeCategory, setActiveCategory] = useState("all");
    const [filterVisibility, setFilterVisibility] = useState("all");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'popularity' | 'recency' | 'pricing'>('popularity');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 🔴 核心改动 1：引入真实数据的状态管理
    const [realSkills, setRealSkills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // ── 2. 加载数据逻辑 (Data Fetching) ──
    useEffect(() => {
        const fetchSkills = async () => {
            setIsLoading(true);
            try {
                // 🌟 使用服务端排序参数
                const params = new URLSearchParams({
                    sortBy: sortBy,
                    order: sortOrder
                });
                
                const response = await fetch(`/api/skills?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    
                    // 🌟 Apply unified visuals to all skills
                    const formatted = (data || []).map((s: any) => ({
                        ...s,
                        visuals: resolveSkillVisuals(s)
                    }));
                    setRealSkills(formatted);
                }
            } catch (error) {
                console.error("Failed to load skills from Supabase:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSkills();
    }, []);

    // ── 3. 实时统计逻辑 (Real-time Statistics) ──
    const stats = useMemo(() => {
        const categoryCounts: Record<string, number> = { all: realSkills.length };
        let officialCount = 0;
        let communityCount = 0;

        realSkills.forEach(skill => {
            // 🌟 冗余保护：排除私有及测试态技能 (Redundant protection for Private/Testing)
            if (skill.status === "Private" || skill.state !== "active") return;

            // 分类统计
            const cat = skill.category || "utilities";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            
            // 状态统计
            if (skill.status === "Official") officialCount++;
            else if (skill.status === "Community") communityCount++;
        });

        return { categoryCounts, officialCount, communityCount };
    }, [realSkills]);

    // ── 4. 核心检索过滤逻辑 (Filtering & Search Logic) ──
    // 逻辑：过滤引擎现在作用于真实数据 (realSkills)
    const filteredSkills = useMemo(() => {
        return realSkills.filter(skill => {
            // 逻辑 1：匹配左侧分类
            const matchCategory = activeCategory === "all" || skill.category === activeCategory;

            // 逻辑 2：匹配状态 (Official/Community)
            const matchStatus = filterVisibility === "all" || 
                (filterVisibility === "official" && skill.status === "Official") ||
                (filterVisibility === "community" && skill.status === "Community");

            // 🌟 核心增补：排除私有及测试态技能
            const isPubliclyVisible = skill.status !== "Private" && skill.state === "active";

            // 逻辑 3：匹配顶部搜索框（模糊匹配 Name, Description, 以及 Tags）
            const query = searchQuery.toLowerCase().trim();
            const matchSearch = !query ||
                skill.display_name?.toLowerCase().includes(query) ||
                skill.description?.toLowerCase().includes(query) ||
                skill.skill_name?.toLowerCase().includes(query) ||
                (skill.tags && skill.tags.some((tag: string) => tag.toLowerCase().includes(query)));

            return matchCategory && matchStatus && matchSearch && isPubliclyVisible;
        }).sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'popularity') {
                const countA = a.invocations || a.invocation_count || a.usage_count || 0;
                const countB = b.invocations || b.invocation_count || b.usage_count || 0;
                comparison = countB - countA;
            } else if (sortBy === 'recency') {
                comparison = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            } else if (sortBy === 'pricing') {
                const costA = a.credits_per_call || a.cost_per_call || a.cost || 0;
                const costB = b.credits_per_call || b.cost_per_call || b.cost || 0;
                comparison = costB - costA;
            }
            return sortOrder === 'desc' ? comparison : -comparison;
        });
    }, [activeCategory, filterVisibility, searchQuery, sortBy, sortOrder, realSkills]);

    return (
        <div className="min-h-screen transition-colors duration-500 flex flex-col font-sans" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
            <UnifiedNavbar />
|
            {/* ── 移动端：分类悬浮导航轨 (Mobile Floating Rail) ── */}
            <nav className="lg:hidden fixed left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 p-2 bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl shadow-2xl">
                {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`p-3 rounded-xl transition-all relative group ${isActive
                                ? "bg-blue-500/20 text-blue-400 shadow-sm"
                                : "text-slate-400 hover:text-slate-200 hover:bg-[var(--color-menu-hover-bg)]"
                                }`}
                            title={cat.label}
                        >
                            <cat.icon className="w-5 h-5 flex-shrink-0" />
                            {/* 悬停提示 (Simple Tooltip) */}
                            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-xl z-50">
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            <main className="max-w-7xl mx-auto px-6 pl-24 lg:px-8 pt-28 pb-20 w-full flex-grow flex flex-col lg:flex-row gap-6">

                {/* ── 左侧：分类导航栏 (Sidebar Categories) ── */}
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-28 space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 px-3" style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}>Categories</h2>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${activeCategory === cat.id
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "border-transparent opacity-70 hover:opacity-100 hover:bg-[var(--color-menu-hover-bg)]"
                                    }`}
                                style={{ color: activeCategory === cat.id ? "var(--color-blue)" : "var(--color-text-secondary)" }}
                            >
                                <cat.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-grow text-left">{cat.label}</span>
                                <span className="text-[10px] opacity-40 font-mono">({stats.categoryCounts[cat.id] || 0})</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── 右侧：主体内容区 (Main Content) ── */}
                <section className="flex-1 flex flex-col min-w-0">

                    {/* 工具栏：搜索、筛选与视图切换 */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl border shadow-sm transition-colors duration-300 mb-8" 
                        style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                        
                        {/* 1. 搜索框 (Focus Expansion 设计) */}
                        <motion.div 
                            layout
                            initial={false}
                            animate={{ 
                                width: isMobile ? "100%" : (isSearchFocused ? 420 : 220),
                                flexGrow: isMobile ? 1 : 0
                            }}
                            className={`relative group transition-all duration-300 ${isSearchFocused ? 'z-10' : 'z-0'}`}
                        >
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
                            <input
                                type="text"
                                placeholder={isSearchFocused ? "Search skills by name, ID or description..." : "Search..."}
                                value={searchQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none transition-all text-sm font-medium shadow-sm ${
                                    isSearchFocused 
                                    ? "ring-4 ring-blue-500/10 border-blue-500/50 shadow-blue-500/10" 
                                    : "hover:border-[var(--color-border-hover)]"
                                }`}
                                style={{ 
                                    backgroundColor: "var(--color-bg-primary)", 
                                    borderColor: "var(--color-border)",
                                    color: "var(--color-text-primary)"
                                }}
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            )}
                        </motion.div>

                        {/* 右侧：筛选、排序与视图切换 */}
                        <motion.div 
                            layout
                            className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto"
                        >
                            
                            {/* 2. 权限状态筛选 (ALL / OFFICIAL / COMMUNITY) */}
                            <motion.div layout className="flex items-center p-1 rounded-xl border transition-colors shrink-0"
                                style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                                {(['all', 'official', 'community'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterVisibility(filter)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                                            filterVisibility === filter
                                            ? 'shadow-sm'
                                            : 'hover:opacity-80'
                                        }`}
                                        style={{ 
                                            backgroundColor: filterVisibility === filter ? "var(--color-bg-primary)" : "transparent",
                                            color: filterVisibility === filter ? "var(--color-text-primary)" : "var(--color-text-secondary)"
                                        }}
                                    >
                                        {filter} 
                                        <span className="ml-1 opacity-40 font-mono text-[9px]">
                                            ({filter === 'all' ? realSkills.length : filter === 'official' ? stats.officialCount : stats.communityCount})
                                        </span>
                                    </button>
                                ))}
                            </motion.div>

                            {/* 3. 排序框 (Sort Box) */}
                            <motion.div layout className="flex items-center gap-2 p-1 rounded-xl border transition-colors shrink-0"
                                style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                                <div className="flex items-center px-2 py-1 bg-[var(--color-bg-primary)] rounded-lg shadow-sm">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-transparent border-none outline-none text-[11px] font-bold tracking-widest cursor-pointer appearance-none"
                                        style={{ color: "var(--color-text-primary)" }}
                                    >
                                        <option value="popularity">Popularity</option>
                                        <option value="recency">Recency</option>
                                        <option value="pricing">Pricing</option>
                                    </select>
                                    <div className="ml-1 opacity-40">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                                    className="p-1 px-2 hover:bg-[var(--color-menu-hover-bg)] rounded-lg transition-all text-blue-400"
                                >
                                    {sortOrder === 'desc' ? <ArrowDownWideNarrow size={16} /> : <ArrowUpNarrowWide size={16} />}
                                </button>
                            </motion.div>

                            {/* 4. 视图切换按钮 (View Mode Toggles) */}
                            <motion.div layout className="flex items-center p-1 rounded-xl border transition-colors shrink-0"
                                style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? "bg-[var(--color-bg-primary)] shadow-sm text-blue-400" : "text-slate-400 opacity-60"}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? "bg-[var(--color-bg-primary)] shadow-sm text-blue-400" : "text-slate-400 opacity-60"}`}
                                >
                                    <List size={16} />
                                </button>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* 🔴 核心改动 3：增加加载状态的极客过渡动画 */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32" style={{ color: "var(--color-text-secondary)" }}>
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-mono animate-pulse opacity-60">Scanning Registry Files (*.md)...</p>
                        </div>
                    ) : filteredSkills.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {viewMode === 'list' && (
                                    <div className="w-full bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm mb-6">
                                        <div className="grid grid-cols-[1.5fr_2fr_1.2fr_1fr] gap-4 px-6 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            <div>Skill</div>
                                            <div>Summary</div>
                                            <div>Author</div>
                                            <div className="text-right">Cost</div>
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                            {filteredSkills.map((skill, index) => (
                                                <motion.a
                                                    href={`/skills/${skill.skill_name}`}
                                                    key={skill.skill_name}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="grid grid-cols-[1.5fr_2fr_1.2fr_1fr] gap-4 px-6 py-4 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group cursor-pointer"
                                                >
                                                    {/* SKILL: Icon + Name + Version */}
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl border ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.text} flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-105`}>
                                                            <skill.visuals.Icon weight="duotone" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{skill.display_name}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
                                                        </div>
                                                    </div>

                                                    {/* SUMMARY */}
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-80">
                                                        {skill.description}
                                                    </div>

                                                    {/* AUTHOR: Placeholder */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-500 font-bold">U</div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 opacity-80">@uniskill</span>
                                                    </div>

                                                    {/* COST: Credit (Horizontal Single Row) */}
                                                    <div className="flex items-center justify-end gap-3 shrink-0">
                                                        <div className="flex items-center gap-1 text-purple-500 font-black italic text-sm">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                                                            </svg>
                                                            <span>{skill.credits_per_call ?? 1} CR</span>
                                                        </div>
                                                    </div>
                                                </motion.a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'grid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[18px]">
                                        {filteredSkills.map((skill, index) => (
                                            <motion.a
                                                href={`/skills/${skill.skill_name}`}
                                                key={skill.skill_name}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: index * 0.03 }}
                                                className={`glass-card border transition-all duration-300 group block cursor-pointer flex flex-col h-full p-[18px] 
                                                    hover:shadow-2xl hover:-translate-y-1`}
                                                style={{ 
                                                    border: `1px solid var(--color-border)`,
                                                }}
                                                onMouseEnter={(e) => {
                                                    const color = skill.visuals.styles.text.split('-')[1]; // e.g., 'blue'
                                                    e.currentTarget.style.borderColor = `rgba(var(--color-${color}-rgb), 0.4)`;
                                                    e.currentTarget.style.boxShadow = `0 10px 30px -5px rgba(var(--color-${color}-rgb), 0.2)`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 text-2xl rounded-xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.text}`}>
                                                        <skill.visuals.Icon weight="duotone" />
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${skill.status === "Official"
                                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                                        }`}>
                                                        {skill.status || "Community"}
                                                    </span>
                                                </div>
 
                                                <div className="flex flex-col flex-grow">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className={`text-base font-bold transition-colors group-hover:brightness-125`} 
                                                            style={{ 
                                                                color: "var(--color-text-primary)",
                                                                // Use JS to handle the dynamic hover color to keep it reliable
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                const color = skill.visuals.styles.text.split('-')[1];
                                                                e.currentTarget.style.color = `var(--color-${color}-400)`;
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.color = "var(--color-text-primary)";
                                                            }}
                                                        >
                                                            {skill.display_name}
                                                        </h3>
                                                    </div>

                                                    <p className="text-sm leading-relaxed mb-3 flex-grow line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>{skill.description}</p>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 mt-auto border-t" style={{ borderColor: "var(--color-border)" }}>
                                                    <code className="text-[10px] px-2 py-1 rounded font-mono border" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)", opacity: 0.6 }}>{skill.skill_name}</code>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                                                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                                                            </svg>
                                                            <span className="text-xs font-bold text-purple-400">
                                                                {skill.credits_per_call ?? skill.cost_per_call ?? 1} CR
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.a>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                    ) : (
                        // 空状态提示
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border text-[var(--color-text-secondary)]" 
                                style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)", opacity: 0.5 }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>No skills found</h3>
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}>We couldn't find any skills matching "{searchQuery}" in this category.</p>
                            <button
                                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                                className="mt-6 text-sm text-blue-400 hover:text-blue-300 font-semibold"
                            >
                                Clear all filters
                            </button>
                        </motion.div>
                    )}
                </section>
            </main>
        </div>
    );
}
