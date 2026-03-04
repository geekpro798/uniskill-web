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
