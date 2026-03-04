// src/config/site.ts
// Logic: Simplified environment configuration for UniSkill
// 逻辑：UniSkill 的简化环境配置，仅支持本地与生产

const isProduction = process.env.NODE_ENV === "production";

export const siteConfig = {
    // Use www.uniskill.ai for production, localhost for local dev
    // 生产环境使用 www.uniskill.ai，本地开发使用 localhost
    url: isProduction
        ? "https://www.uniskill.ai"
        : "http://localhost:3000",

    // Gateway API endpoint
    // 技能网关 API 端点
    apiEndpoint: isProduction
        ? "https://api.uniskill.ai/v1"
        : "http://localhost:3000/api",

    // Common metadata
    // 公共元数据
    name: "UniSkill",
    description: "Powering AI agents with universal skills.",
};

/**
 * Logic: Helper to get the correct callback URL for OAuth
 * 逻辑：获取正确的 OAuth 回调地址辅助函数
 */
export const getCallbackUrl = (provider: string) => {
    return `${siteConfig.url}/api/auth/callback/${provider}`;
};

export const footerConfig = {
    // Column 1: The Product (High-level entry points)
    // 第一列：产品（高层级入口）
    product: [
        {
            label: "Skill Catalog",
            // Logic: Link to a unified page listing all Search, Scrape, and Social skills
            // 逻辑：链接至统一页面，展示所有搜索、抓取和社交技能
            href: "/skills"
        },
        { label: "Pricing", href: "/#pricing" },
    ],

    // Column 2: Developers (Technical support and health)
    // 第二列：开发者（技术支持与健康度）
    resources: [
        { label: "Documentation", href: "https://docs.uniskill.ai" },
        { label: "API Reference", href: "https://docs.uniskill.ai/api-reference" },
        {
            label: "System Status",
            // Logic: External status page to build developer trust
            // 逻辑：外部状态页，用于建立开发者信任
            href: "https://status.uniskill.ai"
        },
    ],

    // Column 3: Company (The basics)
    // 第三列：公司（基础信息）
    legal: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
    ],
};
