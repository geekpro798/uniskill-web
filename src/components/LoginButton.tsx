import { signIn } from "next-auth/react";
import { siteConfig } from "@/config/site";

/**
 * LoginButton Component
 * 登录按钮组件，演示如何使用 siteConfig
 */
export const LoginButton = () => {
    const handleLogin = () => {
        // Logic: Redirect to GitHub login via NextAuth custom path or direct URL
        // 逻辑：通过 NextAuth 触发登录或跳转
        const callbackUrl = "/dashboard";
        signIn("github", { callbackUrl });
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
