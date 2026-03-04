/**
 * Site Configuration Object
 * 站点全局配置对象
 */
export const siteConfig = {
    // The primary domain for the production environment
    // 生产环境的主域名
    domain: "uniskill.ai",

    // Base URLs for different services
    // 不同服务的基础 URL
    links: {
        // Current site origin (handles local dev and production)
        // 当前站点的根地址（自动处理本地开发与生产环境）
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://uniskill.ai",

        // UniSkill Gateway API address
        // UniSkill 网关 API 地址
        api: process.env.NEXT_PUBLIC_API_URL || "https://api.uniskill.ai/v1",

        // Lemon Squeezy store or checkout link
        // Lemon Squeezy 商店或结账链接
        billing: "https://uniskill.lemonsqueezy.com",
    },

    // Auth related configurations
    // 身份认证相关配置
    auth: {
        // Redirect after login
        // 登录后的重定向地址
        callback: "/auth/callback",
        // Primary login page
        // 主登录页面
        login: "/login",
    }
};

// Type definition for the config (optional but helpful for TS)
// 配置对象的类型定义（可选，有助于 TypeScript 类型推导）
export type SiteConfig = typeof siteConfig;
