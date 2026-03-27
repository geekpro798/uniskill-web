"use client";

// src/app/providers.tsx
// 客户端 Provider 包裹层：注入 NextAuth SessionProvider
// 因为 SessionProvider 需要 "use client"，而 layout.tsx 是 Server Component
// 所以需要单独提取成一个客户端组件

import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/context/UserContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <UserProvider>
                {children}
            </UserProvider>
        </SessionProvider>
    );
}
