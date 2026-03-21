// frontend/src/app/skills/page.tsx
// Logic: V2 Skills Store with Real Data Fetching (Dynamic .md Parsing)

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List } from 'lucide-react';
import Navbar from "@/components/Navbar";

// ── 1. 全局数据字典 (Data Dictionaries) ──

// 逻辑：8 大黄金标准分类配置
const CATEGORIES = [
    { id: "all", label: "All Skills", icon: "🌌" },
    { id: "web_search", label: "Web & Search", icon: "🔍" },
    { id: "dev_system", label: "Dev & System", icon: "💻" },
    { id: "workspace_data", label: "Workspace & Data", icon: "🗂️" },
    { id: "finance_trading", label: "Finance & Trading", icon: "📈" },
    { id: "social_comms", label: "Social & Comms", icon: "💬" },
    { id: "marketing_crm", label: "Marketing & CRM", icon: "🎯" },
    { id: "media_design", label: "Media & Design", icon: "🎨" },
    { id: "utilities", label: "Utilities", icon: "🧰" }
];

export default function SkillsStorePage() {
    // ── 2. 状态管理 (State Management) ──
    const [activeCategory, setActiveCategory] = useState("all");
    const [filterVisibility, setFilterVisibility] = useState("all");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState("");

    // 🔴 核心改动 1：引入真实数据的状态管理
    const [realSkills, setRealSkills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🔴 核心改动 2：组件挂载时，从您的后端网关拉取真实技能列表
    useEffect(() => {
        const fetchSkills = async () => {
            try {
                // 逻辑：这个接口会在后端遍历 /skills 目录下的所有 .md 文件
                // 并使用 parser.ts 将它们解析为标准的 JSON 数组返回
                const response = await fetch('/api/skills');
                if (response.ok) {
                    const json = await response.json();
                    // 逻辑：支持 json 直接是数组或者包装在 data 字段中
                    const data = Array.isArray(json) ? json : (json.data || []);
                    setRealSkills(data);
                }
            } catch (error) {
                console.error("Failed to load skills from MD files:", error);
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
        });
    }, [activeCategory, filterVisibility, searchQuery, realSkills]);

    return (
        <div className="min-h-screen transition-colors duration-500 flex flex-col font-sans" style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-secondary)" }}>
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 w-full flex-grow flex flex-col lg:flex-row gap-6">

                {/* ── 左侧：分类导航栏 (Sidebar Categories) ── */}
                <aside className="w-full lg:w-64 shrink-0">
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
                                <span className="text-lg">{cat.icon}</span>
                                <span className="flex-grow text-left">{cat.label}</span>
                                <span className="text-[10px] opacity-40 font-mono">({stats.categoryCounts[cat.id] || 0})</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── 右侧：主体内容区 (Main Content) ── */}
                <section className="flex-1 flex flex-col min-w-0">

                    {/* ==========================================
                        工具栏：搜索、筛选与视图切换 (Toolbar: Search, Filter & View Toggle)
                        ========================================== */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl border shadow-sm transition-colors duration-300 mb-8" 
                        style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                        
                        {/* 左侧：搜索框 (Left: Search input) */}
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
                            <input
                            type="text"
                            placeholder="Search skills by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                            style={{ 
                                backgroundColor: "var(--color-bg-primary)", 
                                borderColor: "var(--color-border)",
                                color: "var(--color-text-primary)"
                            }}
                            />
                        </div>

                        {/* 右侧：筛选器与视图切换 (Right: Filters & View Toggle) */}
                        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            
                            {/* 权限状态筛选 (Visibility Filters: All / Official / Community) */}
                            <div className="flex items-center p-1 rounded-xl border transition-colors shrink-0"
                                style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                            {(['all', 'official', 'community'] as const).map((filter) => (
                                <button
                                key={filter}
                                onClick={() => setFilterVisibility(filter)}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all ${
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
                                <span className="ml-1 opacity-40 font-mono">
                                    ({filter === 'all' ? realSkills.length : filter === 'official' ? stats.officialCount : stats.communityCount})
                                </span>
                                </button>
                            ))}
                            </div>

                            {/* 极简竖线分隔符 (Minimalist Vertical Divider) */}
                            <div className="w-px h-6 hidden sm:block" style={{ backgroundColor: "var(--color-border)" }}></div>

                            {/* 视图切换器 (View Mode Toggle: Grid / List) */}
                            <div className="flex items-center p-1 rounded-xl border transition-colors shrink-0"
                                style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-all ${
                                viewMode === 'grid' ? 'shadow-sm' : 'hover:opacity-80'
                                }`}
                                style={{ 
                                    backgroundColor: viewMode === 'grid' ? "var(--color-bg-primary)" : "transparent",
                                    color: viewMode === 'grid' ? "var(--color-text-primary)" : "var(--color-text-secondary)"
                                }}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-all ${
                                viewMode === 'list' ? 'shadow-sm' : 'hover:opacity-80'
                                }`}
                                style={{ 
                                    backgroundColor: viewMode === 'list' ? "var(--color-bg-primary)" : "transparent",
                                    color: viewMode === 'list' ? "var(--color-text-primary)" : "var(--color-text-secondary)"
                                }}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            </div>
                        </div>
                    </div>

                    {/* 🔴 核心改动 3：增加加载状态的极客过渡动画 */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32" style={{ color: "var(--color-text-secondary)" }}>
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-mono animate-pulse opacity-60">Scanning Registry Files (*.md)...</p>
                        </div>
                    ) : filteredSkills.length > 0 ? (
                        <motion.div 
                            layout 
                            className={viewMode === 'grid' 
                                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                                : "flex flex-col gap-4"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredSkills.map((skill, index) => (
                                    <motion.a
                                        href={`/skills/${skill.skill_name}`}
                                        key={skill.skill_name}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className={`glass-card border ${skill.borderColor || ""} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block cursor-pointer flex ${viewMode === 'grid' ? 'flex-col h-full p-6' : 'flex-row items-center p-4 gap-6'}`}
                                        style={{ border: `1px solid var(--color-border)` }}
                                    >
                                        <div className={`flex ${viewMode === 'grid' ? 'items-start justify-between mb-4' : 'items-center gap-4 shrink-0'}`}>
                                            <div className={`${viewMode === 'grid' ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl'} rounded-xl bg-gradient-to-br ${skill.gradientFrom || "from-blue-500"} ${skill.gradientTo || "to-cyan-400"} flex items-center justify-center shadow-lg`}>
                                                {skill.emoji === "github" ? (
                                                    <svg width={viewMode === 'grid' ? "24" : "20"} height={viewMode === 'grid' ? "24" : "20"} fill="currentColor" viewBox="0 0 24 24" className="text-white">
                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                    </svg>
                                                ) : (
                                                    skill.emoji || "⚡"
                                                )}
                                            </div>
                                            {viewMode === 'grid' && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${skill.status === "Official"
                                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                                    }`}>
                                                    {skill.status || "Community"}
                                                </span>
                                            )}
                                        </div>

                                        <div className={`flex flex-col ${viewMode === 'grid' ? 'flex-grow' : 'flex-grow py-2 mx-4'}`}>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-base font-bold group-hover:text-blue-500 transition-colors" style={{ color: "var(--color-text-primary)" }}>{skill.display_name}</h3>
                                                {viewMode === 'list' && (
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase border ${skill.status === "Official"
                                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                                        }`}>
                                                        {skill.status || "Community"}
                                                    </span>
                                                )}
                                            </div>

                                            <p className={`text-sm leading-relaxed ${viewMode === 'grid' ? 'mb-6 flex-grow line-clamp-3' : 'line-clamp-1 opacity-70 mb-0'}`} style={{ color: "var(--color-text-secondary)" }}>{skill.description}</p>

                                            {/* Tags (Only in Grid to avoid clutter in List) */}
                                            {viewMode === 'grid' && (
                                                <div className="flex flex-wrap gap-2 mb-5">
                                                    {skill.tags && skill.tags.slice(0, 3).map((tag: string) => (
                                                        <span key={tag} className="px-2 py-1 border rounded-md text-[10px] font-mono tracking-wide transition-colors"
                                                            style={{ 
                                                                backgroundColor: "var(--color-bg-secondary)", 
                                                                borderColor: "var(--color-border)",
                                                                color: "var(--color-text-secondary)"
                                                            }}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className={`${viewMode === 'grid' ? 'flex items-center justify-between pt-4 mt-auto border-t' : 'flex items-center gap-6 shrink-0'}`} style={{ borderColor: "var(--color-border)" }}>
                                            {viewMode === 'grid' && <code className="text-[10px] px-2 py-1 rounded font-mono border" style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)", opacity: 0.6 }}>{skill.skill_name}</code>}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                                                        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                                                    </svg>
                                                    <span className="text-xs font-bold text-purple-400">
                                                        {skill.credits_per_call ?? skill.cost_per_call ?? 1} CR
                                                    </span>
                                                </div>
                                                <span className="text-slate-700 font-bold text-[10px]">|</span>
                                                <span className="text-xs font-bold text-emerald-400">
                                                    {skill.usd_per_call || 0} $
                                                </span>
                                            </div>
                                        </div>
                                    </motion.a>
                                ))}
                            </AnimatePresence>
                        </motion.div>
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
