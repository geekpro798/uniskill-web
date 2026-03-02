// src/types/next-auth.d.ts
// NextAuth session 和 JWT 类型扩展
// 将自定义字段（rawToken、credits）注入 Session 和 JWT 类型

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            // 首次登录时才有值，用于前端一次性展示给用户
            rawToken?: string;
            // 用户当前剩余调用配额
            credits?: number;
        };
    }

    interface Profile {
        // GitHub OAuth Profile 额外字段
        id: number;
        login: string;
        avatar_url: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        githubId?: string;
        rawToken?: string;
        credits?: number;
    }
}
