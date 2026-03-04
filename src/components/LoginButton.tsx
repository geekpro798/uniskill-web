import { siteConfig } from "@/config/site";

/**
 * LoginButton Component
 * 登录按钮组件，演示如何使用 siteConfig
 */
export const LoginButton = () => {
    const handleLogin = () => {
        // Logic: Construct the full redirect URL
        // 逻辑：构造完整的重定向 URL
        const redirectUrl = `${siteConfig.links.url}${siteConfig.auth.callback}`;
        console.log("Redirecting to:", redirectUrl);

        // Perform login...
        // 在此处执行登录逻辑，例如跳转到 redirectUrl
        window.location.href = redirectUrl;
    };

    return (
        <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
            Log In
        </button>
    );
};
