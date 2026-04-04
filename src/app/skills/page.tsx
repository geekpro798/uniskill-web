// frontend/src/app/skills/page.tsx
// Logic: V5 Skills Store with Hybrid Design & Rendering Guard

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, Server, Briefcase, TrendingUp, Wrench, Video, Share2, ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import UnifiedNavbar from "@/components/UnifiedNavbar";
import { resolveSkillVisuals } from "@/lib/skill-visual-identity";
import { CliSkillCardAligned } from "@/components/skills/CliSkillCardAligned";

// ── 1. 全局数据字典 (Data Dictionaries) ──
const CATEGORIES = [
    { id: "all", label: "All Skills", icon: LayoutGrid },
    { id: "web_search", label: "Web & Search", icon: Search },
    { id: "devops_infra", label: "DevOps & Infra", icon: Server },
    { id: "workspace_data", label: "Workspace & Data", icon: Briefcase },
    { id: "media_intelligence", label: "Media & Intelligence", icon: Video },
    { id: "social_outreach", label: "Social & Outreach", icon: Share2 },
    { id: "finance_trading", label: "Finance & Trading", icon: TrendingUp },
    { id: "utilities", label: "Utilities", icon: Wrench }
];

export default function SkillsStorePage() {
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

    const [realSkills, setRealSkills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({ sortBy, order: sortOrder });
                const response = await fetch(`/api/skills?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    const formatted = (data || []).map((s: any) => ({
                        ...s,
                        visuals: resolveSkillVisuals(s)
                    }));
                    setRealSkills(formatted);
                }
            } catch (error) {
                console.error("Failed to load skills:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSkills();
    }, [sortBy, sortOrder]);

    const stats = useMemo(() => {
        const categoryCounts: Record<string, number> = { all: realSkills.length };
        let officialCount = 0;
        let communityCount = 0;
        realSkills.forEach(skill => {
            if (skill.status === "Private" || skill.state !== "active") return;
            const cat = skill.category || "utilities";
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            if (skill.status === "Official") officialCount++;
            else if (skill.status === "Community") communityCount++;
        });
        return { categoryCounts, officialCount, communityCount };
    }, [realSkills]);

    const filteredSkills = useMemo(() => {
        return realSkills.filter(skill => {
            const matchCategory = activeCategory === "all" || skill.category === activeCategory;
            const matchStatus = filterVisibility === "all" || 
                (filterVisibility === "official" && skill.status === "Official") ||
                (filterVisibility === "community" && skill.status === "Community");
            const isPubliclyVisible = skill.status !== "Private" && skill.state === "active";
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

            <main className="max-w-7xl mx-auto px-6 pl-24 lg:px-8 pt-28 pb-20 w-full flex-grow flex flex-col lg:flex-row gap-6">
                <aside className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-28 space-y-1">
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 px-3 opacity-60">Categories</h2>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${activeCategory === cat.id
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "border-transparent opacity-70 hover:opacity-100 hover:bg-[var(--color-menu-hover-bg)]"
                                    }`}
                            >
                                <cat.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="flex-grow text-left">{cat.label}</span>
                                <span className="text-[10px] opacity-40 font-mono">({stats.categoryCounts[cat.id] || 0})</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl border shadow-sm transition-colors duration-300 mb-8" 
                        style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
                        
                        <motion.div 
                            layout
                            initial={false}
                            animate={{ width: isMobile ? "100%" : (isSearchFocused ? 420 : 220), flexGrow: isMobile ? 1 : 0 }}
                            className={`relative group transition-all duration-300 ${isSearchFocused ? 'z-10' : 'z-0'}`}
                        >
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${isSearchFocused ? 'text-blue-500' : 'text-slate-400'}`} />
                            <input
                                type="text"
                                placeholder={isSearchFocused ? "Search skills..." : "Search..."}
                                value={searchQuery}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none transition-all text-sm font-medium shadow-sm ${
                                    isSearchFocused 
                                    ? "ring-4 ring-blue-500/10 border-blue-500/50" 
                                    : "hover:border-[var(--color-border-hover)]"
                                }`}
                                style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                            />
                        </motion.div>

                        <motion.div layout className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <div className="flex items-center p-1 rounded-xl border" style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                                {(['all', 'official', 'community'] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterVisibility(filter)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${filterVisibility === filter ? 'shadow-sm bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] opacity-60'}`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center p-1 rounded-xl border" style={{ backgroundColor: "var(--color-toggle-bg)", borderColor: "var(--color-border)" }}>
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg ${viewMode === 'grid' ? "bg-[var(--color-bg-primary)] text-blue-400" : "text-slate-400 opacity-60"}`}><LayoutGrid size={16} /></button>
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? "bg-[var(--color-bg-primary)] text-blue-400" : "text-slate-400 opacity-60"}`}><List size={16} /></button>
                            </div>
                        </motion.div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-60">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-mono animate-pulse">Scanning Registry...</p>
                        </div>
                    ) : (
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
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl border ${skill.visuals?.styles?.box || 'bg-slate-500/10'} ${skill.visuals?.styles?.border || 'border-slate-500/20'} ${skill.visuals?.styles?.text || 'text-slate-400'} flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-105`}>
                                                        {skill.visuals?.Icon ? <skill.visuals.Icon weight="duotone" /> : "🧩"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{skill.display_name}</span>
                                                        <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed opacity-80">{skill.description}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-500 font-bold">U</div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 opacity-80">@uniskill</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 shrink-0">
                                                    <div className="flex items-center gap-1 text-purple-500 font-black italic text-sm">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" /></svg>
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
                                    {filteredSkills.map((skill, index) => {
                                        // 🌟 核心分发：如果是 CLI 类型，渲染工业级专属卡片
                                        if (skill.implementation?.type === 'cli') {
                                            return <CliSkillCardAligned key={skill.skill_name} skill={skill} />;
                                        }

                                        // 否则：保持 100% 原始样式（白底浅色卡片）
                                        return (
                                            <motion.a
                                                href={`/skills/${skill.skill_name}`}
                                                key={skill.skill_name}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2, delay: index * 0.03 }}
                                                className="glass-card border transition-all duration-300 group block cursor-pointer flex flex-col h-full p-[18px] hover:shadow-2xl hover:-translate-y-1"
                                                style={{ border: `1px solid var(--color-border)` }}
                                                onMouseEnter={(e) => {
                                                    const textStyle = skill.visuals?.styles?.text || 'text-blue-400';
                                                    const color = textStyle.split('-')[1] || 'blue';
                                                    e.currentTarget.style.borderColor = `rgba(var(--color-${color}-rgb), 0.4)`;
                                                    e.currentTarget.style.boxShadow = `0 10px 30px -5px rgba(var(--color-${color}-rgb), 0.2)`;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-12 h-12 text-2xl rounded-xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${skill.visuals?.styles?.box || "bg-slate-500/10"} ${skill.visuals?.styles?.border || "border-slate-500/20"} ${skill.visuals?.styles?.text || "text-slate-400"}`}>
                                                        {skill.visuals?.Icon ? <skill.visuals.Icon weight="duotone" /> : "🧩"}
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${skill.status === "Official" ? "bg-blue-500/10 text-blue-400 border-blue-500/25" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"}`}>
                                                        {skill.status || "Community"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col flex-grow">
                                                    <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-blue-500 transition-colors">{skill.display_name}</h3>
                                                    <p className="text-sm leading-relaxed mb-3 flex-grow line-clamp-3 text-[var(--color-text-secondary)]">{skill.description}</p>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 mt-auto border-t border-[var(--color-border)]">
                                                    <code className="text-[10px] px-2 py-1 rounded font-mono border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] opacity-60">{skill.skill_name}</code>
                                                    <div className="flex items-center gap-1">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" /></svg>
                                                        <span className="text-xs font-bold text-purple-400">{skill.credits_per_call ?? 1} CR</span>
                                                    </div>
                                                </div>
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            )}
                        </AnimatePresence>
                    )}
                </section>
            </main>
        </div>
    );
}
