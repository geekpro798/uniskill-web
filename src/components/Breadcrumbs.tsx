"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
    homeHref?: string;
    homeLabel?: string;
}

/**
 * Breadcrumbs Component
 * 职责：提供统一的页面路径导航。
 * 特色：
 * 1. 响应式：移动端自动显示为单向"返回"链接，桌面端显示完整层级。
 * 2. 动效：悬停时文字平移与色彩变化。
 * 3. 语义化：遵循 WAI-ARIA 标准。
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = "", homeHref = "/", homeLabel = "Home" }) => {
    // 基础首页项 (Base Home Item)
    const allItems = [{ label: homeLabel, href: homeHref }, ...items];

    return (
        <nav 
            aria-label="Breadcrumb" 
            className={`flex items-center text-[11px] font-bold uppercase tracking-widest mb-6 ${className}`}
        >
            {/* ── 桌面端视图 (Desktop: Full Path) ── */}
            <ol className="hidden sm:flex items-center gap-2.5">
                {allItems.map((item, index) => {
                    const isLast = index === allItems.length - 1;
                    
                    return (
                        <React.Fragment key={index}>
                            <li className="flex items-center gap-2.5">
                                {item.href && !isLast ? (
                                    <Link
                                        href={item.href}
                                        className="group flex items-center gap-1.5 transition-all"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        {index === 0 && <Home size={12} className="opacity-60 group-hover:text-blue-500 transition-colors" />}
                                        <motion.span 
                                            whileHover={{ x: 2 }}
                                            className="group-hover:text-blue-500 transition-colors"
                                        >
                                            {item.label}
                                        </motion.span>
                                    </Link>
                                ) : (
                                    <span 
                                        className="flex items-center gap-1.5 select-none" 
                                        style={{ color: "var(--color-text-primary)" }}
                                    >
                                        {index === 0 && <Home size={12} className="opacity-40" />}
                                        {item.label}
                                    </span>
                                )}
                            </li>
                            {!isLast && (
                                <ChevronRight 
                                    size={10} 
                                    className="opacity-20" 
                                    style={{ color: "var(--color-text-secondary)" }} 
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </ol>

            {/* ── 移动端视图 (Mobile: Single Back Button) ── */}
            <div className="sm:hidden flex items-center">
                <Link
                    href={items.length > 1 ? (items[items.length - 2].href || "/") : (allItems[allItems.length - 2]?.href || "/")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm active:scale-95 transition-all"
                    style={{ 
                        color: "var(--color-text-secondary)",
                        borderColor: "var(--color-border)"
                    }}
                >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                </Link>
            </div>
        </nav>
    );
};

export default Breadcrumbs;
