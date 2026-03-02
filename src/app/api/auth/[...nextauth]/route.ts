// src/app/api/auth/[...nextauth]/route.ts
// NextAuth.js GitHub OAuth 配置与路由处理
// 集成 GitHub Provider + 首次登录自动发码逻辑

import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { handleUserRegistration } from "@/lib/auth";

export const dynamic = "force-dynamic";

/* ─── NextAuth 核心配置 ──────────────────────────────────────────────── */

const handler = NextAuth({
    /* 配置 GitHub OAuth Provider */
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
    ],

    /* JWT 策略：将自定义数据存入加密 JWT，无需数据库 session 表 */
    session: {
        strategy: "jwt",
    },

    /* ─── Callbacks：控制登录 & Session 行为 ─── */
    callbacks: {
        /* signIn：每次用户登录时触发，处理首次注册逻辑 */
        async signIn({ user, account, profile }) {
            // 仅处理 GitHub 登录
            if (account?.provider !== "github") return false;

            try {
                const result = await handleUserRegistration({
                    id: profile?.id ?? user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                });

                // 将首次注册的 rawToken 和 credits 临时挂载到 user 对象
                // 这些值会通过 jwt callback 传递给 session
                (user as any).rawToken = result.rawToken;
                (user as any).credits = result.profile.credits;
                (user as any).githubId = (profile?.id ?? "").toString();

                return true;
            } catch (error) {
                console.error("[NextAuth] signIn error:", error);
                return false; // 登录失败，阻止进入
            }
        },

        /* jwt：首次登录时将自定义字段写入 JWT token */
        async jwt({ token, user }) {
            if (user) {
                // user 对象仅在首次登录时可用
                token.githubId = (user as any).githubId;
                token.rawToken = (user as any).rawToken;
                token.credits = (user as any).credits;
            }
            return token;
        },

        /* session：将 JWT 中的数据暴露给前端 useSession() */
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? "";
                // rawToken 仅在首次登录后的第一个 session 请求中存在
                // 展示给用户后，客户端应清理掉（不持久化）
                session.user.rawToken = token.rawToken as string | undefined;
                session.user.credits = token.credits as number | undefined;
            }
            return session;
        },
    },
});

/* ─── 导出 GET/POST handler 供 App Router 使用 ─── */
export { handler as GET, handler as POST };
