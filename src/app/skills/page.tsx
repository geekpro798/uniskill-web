// frontend/src/app/skills/page.tsx
// Logic: V2 Skills Store with Real Data Fetching (Dynamic .md Parsing)

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    // ── 3. 核心检索过滤逻辑 (Filtering & Search Logic) ──
    // 逻辑：过滤引擎现在作用于真实数据 (realSkills)
    const filteredSkills = useMemo(() => {
        return realSkills.filter(skill => {
            // 逻辑 1：匹配左侧分类
            const matchCategory = activeCategory === "all" || skill.category === activeCategory;

            // 逻辑 2：匹配顶部搜索框（模糊匹配 Name, Description, 以及 Tags）
            const query = searchQuery.toLowerCase().trim();
            const matchSearch = !query ||
                skill.name?.toLowerCase().includes(query) ||
                skill.description?.toLowerCase().includes(query) ||
                skill.id?.toLowerCase().includes(query) ||
                (skill.tags && skill.tags.some((tag: string) => tag.toLowerCase().includes(query)));

            return matchCategory && matchSearch;
        });
    }, [activeCategory, searchQuery, realSkills]);

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-slate-300 flex flex-col font-sans">
            <style dangerouslySetInnerHTML={{ __html: `html, body { background-color: #0a0f1e !important; }` }} />
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-20 w-full flex-grow flex flex-col lg:flex-row gap-6">

                {/* ── 左侧：分类导航栏 (Sidebar Categories) ── */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="sticky top-28 space-y-1">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-3">Categories</h2>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat.id
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                                    }`}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── 右侧：主体内容区 (Main Content) ── */}
                <section className="flex-1 flex flex-col min-w-0">

                    {/* 顶部搜索框 (Search Bar) */}
                    <div className="mb-8 relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search skills by name, description, or tags (e.g., 'finance', 'github')..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#050810]/50 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 backdrop-blur-md shadow-inner"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>

                    {/* 🔴 核心改动 3：增加加载状态的极客过渡动画 */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-mono animate-pulse">Scanning Registry Files (*.md)...</p>
                        </div>
                    ) : filteredSkills.length > 0 ? (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredSkills.map((skill, index) => (
                                    <motion.a
                                        href={`/skills/${skill.id}`}
                                        key={skill.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        className={`glass-card p-6 border border-slate-700/50 ${skill.borderColor || "hover:border-blue-500/40"} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block cursor-pointer flex flex-col h-full bg-[#0a0f1e]/80`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${skill.gradientFrom || "from-blue-500"} ${skill.gradientTo || "to-cyan-400"} flex items-center justify-center text-2xl shadow-lg`}>
                                                {skill.emoji || "⚡"}
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${skill.status === "Official"
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                                                }`}>
                                                {skill.status || "Community"}
                                            </span>
                                        </div>

                                        <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">{skill.name}</h3>

                                        <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow line-clamp-3">{skill.description}</p>

                                        {/* Tags 标签展示区 */}
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {skill.tags && skill.tags.map((tag: string) => (
                                                <span key={tag} className="px-2 py-1 bg-slate-800/60 border border-slate-700/50 rounded-md text-[10px] text-slate-400 font-mono tracking-wide group-hover:border-slate-600 transition-colors">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mt-auto">
                                            <code className="text-[10px] text-slate-500 bg-[#050810] px-2 py-1 rounded font-mono border border-slate-800">{skill.id}</code>
                                            <div className="flex items-center gap-1">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                                                    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
                                                </svg>
                                                <span className="text-xs font-bold text-purple-400">{skill.costPerCall || 1} CR</span>
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
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/30 flex items-center justify-center mb-4 border border-slate-700/50 text-slate-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No skills found</h3>
                            <p className="text-sm text-slate-500">We couldn't find any skills matching "{searchQuery}" in this category.</p>
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
