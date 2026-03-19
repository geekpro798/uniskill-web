import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            id: string;
            userUid?: string;
            githubId?: string;
            rawKey?: string;
            keyPreview?: string;
            credits?: number;
            tier?: string;
        } & DefaultSession["user"]
    }

    interface User {
        githubId?: string;
        userUid?: string;
        rawKey?: string;
        keyPreview?: string;
        credits?: number;
        tier?: string;
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        userUid?: string;
        githubId?: string;
        rawKey?: string;
        keyPreview?: string;
        credits?: number;
        tier?: string;
    }
}
