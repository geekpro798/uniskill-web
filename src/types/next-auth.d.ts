// 将自定义字段（rawKey、credits）注入 Session 和 JWT 类型

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            githubId?: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            // 首次登录时才有值，用于前端一次性展示给用户
            rawKey?: string;
            // 全局唯一标识符
            userUid?: string;
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
        userUid?: string;
        rawKey?: string;
        credits?: number;
    }
}
