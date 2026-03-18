"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

/* ─── Lemon Squeezy 静态跳转链接 ──────────────────────── */
const LEMON_SQUEEZY_LINKS = {
    starter: "https://uniskill.lemonsqueezy.com/checkout/buy/e1cb85d2-ee60-444d-9400-a4e06a3d7852",
    pro: "https://uniskill.lemonsqueezy.com/checkout/buy/76565e2c-265d-487f-a148-a0525e372fe1",
    scale: "https://uniskill.lemonsqueezy.com/checkout/buy/842bc7aa-02cd-4035-a125-99364215fd30",
};

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
        checkoutUrl: null,
        highlighted: false,
        gradient: "from-slate-600 to-slate-700",
        borderClass: "border-white/10",
        badgeText: null,
        buttonText: "Get Started Free",
    },
    {
        id: "starter",
        name: "Starter",
        price: 9.9,
        priceDisplay: "$9.90",
        period: "",
        credits: "10,000 Credits",
        label: "",
        labelColor: "",
        features: [
            "10,000 lifetime credits",
            "60 RPM limit (Account Upgrade)",
            "All skill types included",
            "Email support",
            "API access",
            "7-day Basic History",
        ],
        checkoutUrl: LEMON_SQUEEZY_LINKS.starter,
        highlighted: false,
        gradient: "from-blue-600 to-blue-700",
        borderClass: "border-blue-500/20",
        badgeText: null,
        buttonText: "Unlock Starter Tier",
    },
    {
        id: "pro",
        name: "Pro",
        price: 29.9,
        priceDisplay: "$29.90",
        period: "",
        credits: "35,000 Credits",
        label: "Most Popular",
        labelColor: "text-blue-400",
        features: [
            "35,000 lifetime credits",
            "300 RPM limit (Account Upgrade)",
            "All skill types included",
            "Priority support",
            "API access",
            "30-day Deep Audit Logs",
        ],
        checkoutUrl: LEMON_SQUEEZY_LINKS.pro,
        highlighted: true,
        gradient: "from-blue-500 to-purple-600",
        borderClass: "border-blue-500/50",
        badgeText: "Most Popular",
        buttonText: "Unlock Pro Tier",
    },
    {
        id: "scale",
        name: "Scale",
        price: 99.9,
        priceDisplay: "$99.90",
        period: "",
        credits: "150,000 Credits",
        label: "",
        labelColor: "",
        features: [
            "150,000 lifetime credits",
            "1,000 RPM limit (Account Upgrade)",
            "All skill types included",
            "Dedicated support",
            "API access",
            "90-day Full Compliance Logs",
        ],
        checkoutUrl: LEMON_SQUEEZY_LINKS.scale,
        highlighted: false,
        gradient: "from-purple-600 to-pink-600",
        borderClass: "border-purple-500/20",
        badgeText: null,
        buttonText: "Unlock Scale Tier",
    },
];

/* ─── 工具消耗权重配置：定义各类技能的积分消耗规则 ──────────────────────
   用于在定价区块下方展示计费说明表格
   ────────────────────────────────────────────────────────────────────── */
const consumptionWeights = [
    {
        tool: "Utility Skills",
        weight: "0",
        description: "Time&Math",
        color: "text-slate-400",
        dotColor: "bg-slate-400",
    },
    {
        tool: "Search Skills",
        weight: "5",
        description: "Web search & news aggregation",
        color: "text-blue-400",
        dotColor: "bg-blue-400",
    },
    {
        tool: "Web Scraper",
        weight: "15",
        description: "Full-page extraction & parsing",
        color: "text-purple-400",
        dotColor: "bg-purple-400",
    },
    {
        tool: "Expert Skills",
        weight: "20+",
        description: "Real-time social signal analysis",
        color: "text-pink-400",
        dotColor: "bg-pink-400",
    },
];

/* ─── 等级权重定义：用于高水位线逻辑 (Tier Weights) ─── */
const TIER_WEIGHTS: Record<string, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    scale: 3,
};

/* ─── 封装内容组件以使用 useSearchParams（需配合 Suspense）─── */
function PricingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // 获取当前用户等级并映射权重
    const currentUserTier = (session?.user as any)?.tier?.toLowerCase() || "free";
    const currentWeight = TIER_WEIGHTS[currentUserTier] || 0;

    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.05 });

    // 当前正在进行的跳转状态 (Loading state for redirection)
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    // ─── 核心逻辑： handleCheckout 处理三段式跳转 ───
    const handleCheckout = async (tierId: string) => {
        setLoadingTier(tierId);

        // 分支 1：未登录 — 拦截并跳转 GitHub (Zero-step OAuth)
        if (status === "unauthenticated") {
            const currentUrl = window.location.origin + window.location.pathname;
            // 携带意图参数回跳，实现登录后自动触发
            await signIn("github", {
                callbackUrl: `${currentUrl}?buy=${tierId}#pricing`,
            });
            return;
        }

        // 分支 2：已登录
        const user = session?.user;
        const plan = plans.find((p) => p.id === tierId);

        if (!plan) {
            setLoadingTier(null);
            return;
        }

        // 如果是免费档，直接跳转控制台
        if (plan.price === 0) {
            router.push("/dashboard");
            return;
        }

        // 分支 3：付费档 — 动态注入 Lemon Squeezy 传参
        try {
            const baseUrl = plan.checkoutUrl;
            if (!baseUrl) return;

            const urlObj = new URL(baseUrl);

            // 1. 注入用户 Email
            urlObj.searchParams.append("checkout[email]", user?.email || "");

            // 2. 注入关键的 Supabase UID（用于 Webhook 自动发货）
            urlObj.searchParams.append("checkout[custom][user_uid]", (user as any)?.userUid || "");

            // 3. 注入支付成功后的回跳地址（LS 结束后自动返回 dashboard）
            urlObj.searchParams.append("embed", "0");
            urlObj.searchParams.append("redirect_url", `${window.location.origin}/dashboard`);
            urlObj.searchParams.append("locale", "en"); // 强制使用英文界面，防止语种识别错误

            // 跳转前清理当前 URL 的意图参数，防止后退时反复跳转
            if (searchParams.get("buy")) {
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.delete("buy");
                router.replace(`${window.location.pathname}?${newParams.toString()}${window.location.hash}`, { scroll: false });
            }

            // 执行外部跳转
            window.location.href = urlObj.toString();
        } catch (err) {
            console.error("Failed to construct checkout URL", err);
            setLoadingTier(null);
        }
    };

    // ─── 自动触发：授权回来后检测 buy 参数并自动拉起 ───
    useEffect(() => {
        const buyIntent = searchParams.get("buy");
        if (buyIntent && status === "authenticated") {
            // 让用户感知到授权已成功，稍微延迟拉起支付
            handleCheckout(buyIntent);
        }
    }, [searchParams, status]);

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
                        Top up on demand and unlock powerful account capabilities.
                    </p>
                    <p className="text-blue-400/80 text-sm font-medium mt-2">
                        Fair pricing with lifetime credits.
                    </p>
                </motion.div>

                {/* ─── 定价卡片网格：移动 1 列 / 平板 2 列 / 桌面 4 列 ──────────
            使用 responsive grid 实现响应式断点控制
            ────────────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    {plans.map((plan, index) => {
                        const targetWeight = TIER_WEIGHTS[plan.id] || 0;
                        const isCurrentTier = currentUserTier === plan.id;
                        const isLowerTier = currentWeight > targetWeight && plan.id !== "free";
                        const isDisabled = (isCurrentTier || isLowerTier) && status === "authenticated";

                        // 动态按钮文案
                        let buttonLabel = plan.buttonText;
                        if (status === "authenticated") {
                            if (isCurrentTier) buttonLabel = "Current Plan";
                            else if (isLowerTier) buttonLabel = "Included";
                            else if (targetWeight > currentWeight) buttonLabel = `Unlock ${plan.name} Tier`;
                        }

                        return (
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
                                {/* Pro 卡片高亮标签 */}
                                {plan.badgeText && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                                            {plan.badgeText}
                                        </span>
                                    </div>
                                )}

                                <div
                                    className={`
                  glass-card h-full flex flex-col p-7 ${plan.borderClass}
                  transition-all duration-300 ${!isDisabled ? "hover:-translate-y-1" : ""}
                  ${plan.highlighted && !isDisabled
                                            ? "ring-2 ring-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                                            : "hover:border-white/20"}
                  ${isDisabled ? "opacity-80 grayscale-[0.5]" : ""}
                `}
                                >
                                    <div className={`w-10 h-1.5 rounded-full bg-gradient-to-r ${plan.gradient} mb-5`} />
                                    <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>

                                    {plan.label && (
                                        <p className={`text-xs font-medium mb-4 ${plan.labelColor}`}>
                                            {plan.label}
                                        </p>
                                    )}
                                    {!plan.label && <div className="mb-4" />}

                                    <div className="mb-5">
                                        <span className="text-4xl font-black text-white">
                                            {plan.priceDisplay}
                                        </span>
                                    </div>

                                    <div
                                        className={`
                    px-3 py-2 rounded-lg text-sm font-semibold mb-6
                    bg-gradient-to-r ${plan.gradient} bg-opacity-10
                    text-white border border-white/10
                  `}
                                    >
                                        ✦ {plan.credits}
                                    </div>

                                    <ul className="space-y-2.5 mb-8 flex-1">
                                        {plan.features.map((feat) => (
                                            <li key={feat} className="flex items-start gap-2 text-sm text-slate-400">
                                                <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="20,6 9,17 4,12" />
                                                </svg>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => handleCheckout(plan.id)}
                                        disabled={isDisabled || loadingTier === plan.id}
                                        className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                                            plan.popular
                                                ? isDisabled 
                                                    ? "bg-slate-800/50 text-slate-400 border border-slate-700 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.98]"
                                                : isDisabled
                                                    ? "bg-slate-800/50 text-slate-400 border border-slate-700 cursor-not-allowed"
                                                    : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
                                        } ${loadingTier === plan.id ? "opacity-70 cursor-wait" : ""}`}
                                    >
                                        {(isCurrentTier || isLowerTier) && status === "authenticated" && (
                                            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {loadingTier === plan.id ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            buttonLabel
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* 底部补充说明 */}
                <div className="mt-12 text-center">
                    <p className="text-slate-500 text-sm">
                        Need more credits? <a href="/dashboard" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Go to Dashboard to top up</a>
                    </p>
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
                                Marketplace Pricing Examples
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

/* ─── 导出主组件：注入 Suspense 边界 ─── */
export default function PricingSection() {
    return (
        <Suspense fallback={
            <div className="py-28 text-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-24 bg-slate-800 rounded mb-4"></div>
                    <div className="h-10 w-64 bg-slate-800 rounded mb-8"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-7xl px-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-slate-800/50 rounded-2xl"></div>)}
                    </div>
                </div>
            </div>
        }>
            <PricingContent />
        </Suspense>
    );
}
