"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── 定价方案数据：4 个层级，price=0 代表免费 ──────────────────────────
   checkoutUrl 为 null 时按钮跳转 /register，否则跳转 Lemon Squeezy 结算页
   ────────────────────────────────────────────────────────────────────── */
const plans = [
    {
        id: "free",
        name: "Free",
        price: 0,
        priceDisplay: "$0",
        period: "",
        credits: "500 Credits",
        label: "Welcome Gift — No Credit Card Required",
        labelColor: "text-slate-400",
        features: [
            "500 credits one-time",
            "30 RPM limit",
            "All skill types included",
            "Community support",
            "API access",
            "Usage analytics",
        ],
        checkoutUrl: null, // 免费计划 → 跳转注册页
        highlighted: false,
        gradient: "from-slate-600 to-slate-700",
        borderClass: "border-white/10",
        badgeText: null,
    },
    {
        id: "starter",
        name: "Starter",
        price: 9.9,
        priceDisplay: "$9.90",
        period: "/mo",
        credits: "10,000 Credits",
        label: "",
        labelColor: "",
        features: [
            "10,000 credits / month",
            "60 RPM limit",
            "All skill types included",
            "Email support",
            "API access",
            "Usage analytics",
            "7-day Basic History",
        ],
        checkoutUrl: "https://uniskill.lemonsqueezy.com/checkout/starter", // Lemon Squeezy 结算链接
        highlighted: false,
        gradient: "from-blue-600 to-blue-700",
        borderClass: "border-blue-500/20",
        badgeText: null,
    },
    {
        id: "pro",
        name: "Pro",
        price: 29.9,
        priceDisplay: "$29.90",
        period: "/mo",
        credits: "35,000 Credits",
        label: "Most Popular",
        labelColor: "text-blue-400",
        features: [
            "35,000 credits / month",
            "300 RPM limit",
            "All skill types included",
            "Priority support",
            "API access",
            "Usage analytics",
            "30-day Deep Audit Logs",
        ],
        checkoutUrl: "https://uniskill.lemonsqueezy.com/checkout/pro", // Lemon Squeezy 结算链接
        highlighted: true, // Pro 卡片高亮，使用 ring-2 ring-blue-500
        gradient: "from-blue-500 to-purple-600",
        borderClass: "border-blue-500/50",
        badgeText: "Most Popular",
    },
    {
        id: "scale",
        name: "Scale",
        price: 99.9,
        priceDisplay: "$99.90",
        period: "/mo",
        credits: "150,000 Credits",
        label: "",
        labelColor: "",
        features: [
            "150,000 credits / month",
            "1,000 RPM limit",
            "All skill types included",
            "Dedicated support",
            "API access",
            "Usage analytics",
            "Early Beta Access",
            "90-day Full Compliance Logs",
        ],
        checkoutUrl: "https://uniskill.lemonsqueezy.com/checkout/scale", // Lemon Squeezy 结算链接
        highlighted: false,
        gradient: "from-purple-600 to-pink-600",
        borderClass: "border-purple-500/20",
        badgeText: null,
    },
];

/* ─── 工具消耗权重配置：定义各类技能的积分消耗规则 ──────────────────────
   用于在定价区块下方展示计费说明表格
   ────────────────────────────────────────────────────────────────────── */
const consumptionWeights = [
    {
        tool: "Basic Connector",
        weight: 1,
        description: "Simple API passthrough calls",
        color: "text-slate-400",
        dotColor: "bg-slate-400",
    },
    {
        tool: "Search / News Skill",
        weight: 10,
        description: "Web search & news aggregation",
        color: "text-blue-400",
        dotColor: "bg-blue-400",
    },
    {
        tool: "Advanced Web Scrape",
        weight: 20,
        description: "Full-page extraction & parsing",
        color: "text-purple-400",
        dotColor: "bg-purple-400",
    },
    {
        tool: "Social Media Trends",
        weight: 30,
        description: "Real-time social signal analysis",
        color: "text-pink-400",
        dotColor: "bg-pink-400",
    },
];

/* ─── PricingSection 组件：主页定价区块 ─────────────────────────────────
   响应式布局：移动端 1 列 → 平板 2 列 → 桌面 4 列
   ────────────────────────────────────────────────────────────────────── */
export default function PricingSection() {
    const router = useRouter();
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.05 });

    /* ─── 按钮点击处理：免费计划跳注册，付费计划跳 Lemon Squeezy ─── */
    function handlePlanClick(plan: (typeof plans)[number]) {
        if (!plan.checkoutUrl) {
            router.push("/register");
        } else {
            window.open(plan.checkoutUrl, "_blank", "noopener,noreferrer");
        }
    }

    return (
        <section
            ref={sectionRef}
            id="pricing"
            className="relative py-28 px-6 lg:px-8 overflow-hidden"
        >
            {/* ─── 背景装饰光晕 ─── */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* ─── 区块标题 ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase text-blue-400 border border-blue-500/30 bg-blue-500/5 mb-5">
                        Pricing
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-5">
                        Simple, <span className="gradient-text">Credit-Based</span> Pricing
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Pay only for what your agents use. Scale up or down as your needs evolve.
                    </p>
                    <p className="text-blue-400/80 text-sm font-medium mt-2">
                        Fair pricing with lifetime credits.
                    </p>
                </motion.div>

                {/* ─── 定价卡片网格：移动 1 列 / 平板 2 列 / 桌面 4 列 ──────────
            使用 responsive grid 实现响应式断点控制
            ────────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                                duration: 0.6,
                                delay: 0.1 + index * 0.12,
                                ease: [0.25, 0.46, 0.45, 0.94] as const,
                            }}
                            className="relative"
                        >
                            {/* Pro 卡片高亮标签 "Most Popular" */}
                            {plan.badgeText && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                                        {plan.badgeText}
                                    </span>
                                </div>
                            )}

                            {/* ─── 卡片主体 ───
                  Pro 计划使用 ring-2 ring-blue-500 实现蓝色高亮边框
                  ──────────────── */}
                            <div
                                className={`
                  glass-card h-full flex flex-col p-7 ${plan.borderClass}
                  transition-all duration-300 hover:-translate-y-1
                  ${plan.highlighted
                                        ? "ring-2 ring-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                                        : "hover:border-white/20"}
                `}
                            >
                                {/* 顶部：计划名称 + 图标渐变条 */}
                                <div className={`w-10 h-1.5 rounded-full bg-gradient-to-r ${plan.gradient} mb-5`} />

                                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>

                                {/* 副标签（如 Most Popular / Welcome Gift）*/}
                                {plan.label && (
                                    <p className={`text-xs font-medium mb-4 ${plan.labelColor}`}>
                                        {plan.label}
                                    </p>
                                )}
                                {!plan.label && <div className="mb-4" />}

                                {/* 价格展示 */}
                                <div className="mb-5">
                                    <span className="text-4xl font-black text-white">
                                        {plan.priceDisplay}
                                    </span>
                                    {plan.period && (
                                        <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
                                    )}
                                </div>

                                {/* 积分额度 */}
                                <div
                                    className={`
                    px-3 py-2 rounded-lg text-sm font-semibold mb-6
                    bg-gradient-to-r ${plan.gradient} bg-opacity-10
                    text-white border border-white/10
                  `}
                                >
                                    ✦ {plan.credits}
                                </div>

                                {/* 功能列表 */}
                                <ul className="space-y-2.5 mb-8 flex-1">
                                    {plan.features.map((feat) => (
                                        <li
                                            key={feat}
                                            className="flex items-start gap-2 text-sm text-slate-400"
                                        >
                                            <svg
                                                className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                            >
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                            {feat}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA 按钮：Pro 使用主色，其余使用描边样式 */}
                                <button
                                    onClick={() => handlePlanClick(plan)}
                                    className={`
                    w-full py-3 rounded-xl text-sm font-semibold transition-all duration-300
                    ${plan.highlighted
                                            ? "btn-primary"
                                            : "btn-outline hover:border-blue-500/40"}
                  `}
                                >
                                    {plan.highlighted ? (
                                        <span className="relative z-10">
                                            {plan.price === 0 ? "Get Started Free" : `Get ${plan.name}`}
                                        </span>
                                    ) : plan.price === 0 ? (
                                        "Get Started Free"
                                    ) : (
                                        `Get ${plan.name}`
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── 计费权重说明表格 ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="mt-16"
                >
                    <div className="glass-card border-white/10 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2"
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                            </div>
                            <h3 className="text-white font-bold text-lg">
                                Consumption Weights
                            </h3>
                            <span className="text-slate-500 text-sm">
                                — points deducted per API call
                            </span>
                        </div>

                        {/* ─── 权重表格：桌面端 4 列横排，移动端 2 列 ───────────────
                响应式断点：sm:grid-cols-2 → lg:grid-cols-4
                ─────────────────────────────────────────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {consumptionWeights.map((item) => (
                                <div
                                    key={item.tool}
                                    className="relative p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                                >
                                    {/* 权重值（大字） */}
                                    <div className={`text-3xl font-black mb-1 ${item.color}`}>
                                        {item.weight}
                                        <span className="text-sm font-medium ml-1 opacity-70">pts</span>
                                    </div>

                                    {/* 工具名称 */}
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
                                        <span className="text-white text-sm font-semibold">
                                            {item.tool}
                                        </span>
                                    </div>

                                    {/* 描述 */}
                                    <p className="text-slate-500 text-xs leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* 底部补充说明 */}
                        <p className="text-slate-600 text-xs mt-5 text-center">
                            Credits are deducted per successful API call. Keep your credits even after cancellation. Your balance is yours until it&apos;s spent.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
