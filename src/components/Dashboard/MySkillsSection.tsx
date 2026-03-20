"use client";

// src/components/Dashboard/MySkillsSection.tsx
// 优化后的 My Skills 区域组件：提供更高级的空状态和更清晰的 CTA 引导。

import React, { useState } from 'react';
import { ArrowRight, Plus, TerminalSquare, Compass } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function MySkillsSection() {
    // 逻辑：模拟技能列表。目前设为空数组以展示优化后的“空状态”建议。
    const [skills] = useState([]);

    return (
        <div className="glass-card overflow-hidden">
            {/* ── 区域头部 (Section Header) ── */}
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border-subtle)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>My Skills</h3>
                
                <div className="flex items-center gap-5">
                    {/* 快捷按钮：新建私有技能 */}
                    <Link 
                        href="/skills"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors font-medium group"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                        New Skill
                    </Link>
                    
                    {/* 次要链接：前往所有技能列表 */}
                    <Link 
                        href="/skills"
                        className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        Explore All Skills <ArrowRight size={14} />
                    </Link>
                </div>
            </div>

            {/* ── 内容区域 (Content Area) ── */}
            <div className="p-6">
                {skills.length === 0 ? (
                    /* ==========================================
                       优化后的空状态展示 (Optimized Empty State)
                       ========================================== */
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-10 px-4 border border-dashed rounded-xl"
                        style={{ 
                            borderColor: "var(--color-border)",
                            backgroundColor: "rgba(148, 163, 184, 0.03)"
                        }}
                    >
                        {/* 装饰性占位图标 */}
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center mb-4 border"
                            style={{ 
                                backgroundColor: "var(--color-toggle-bg)",
                                borderColor: "var(--color-border)"
                            }}
                        >
                            <TerminalSquare className="w-6 h-6" style={{ color: "var(--color-text-secondary)" }} />
                        </div>

                        <h4 className="font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                            No skills deployed yet
                        </h4>
                        <p className="text-xs mb-6 text-center max-w-[280px]" style={{ color: "var(--color-text-secondary)" }}>
                            Build your own private AI tools using Markdown, or install community skills from the store.
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {/* 主按钮：创建私有技能 (CTA) */}
                            <Link 
                                href="/skills"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
                            >
                                <Plus size={14} />
                                Create Private Skill
                            </Link>
                            
                            {/* 次要按钮：访问商店 */}
                            <Link 
                                href="/skills"
                                className="px-4 py-2 bg-transparent hover:bg-slate-500/5 border text-xs font-semibold rounded-lg transition-all flex items-center gap-2 active:scale-95"
                                style={{ 
                                    borderColor: "var(--color-border)",
                                    color: "var(--color-text-secondary)" 
                                }}
                            >
                                <Compass size={14} />
                                Visit Store
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    /* ==========================================
                       技能列表 (Skills Grid) - 未来展示已安装技能时使用
                       ========================================== */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {skills.map((skill: any, index) => (
                            <div key={index} className="p-4 border rounded-lg transition-all">
                                {/* 未来完善技能展示卡片的逻辑 */}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
