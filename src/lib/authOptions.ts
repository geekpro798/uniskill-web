// src/lib/authOptions.ts
// Shared NextAuth config object used by both the route handler and getServerSession

import { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { handleUserRegistration } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "github") return false;
            try {
                const result = await handleUserRegistration({
                    id: profile?.id ?? user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                });
                (user as any).rawKey = result.rawKey;
                (user as any).credits = result.profile.credits;
                (user as any).userUid = result.profile.user_uid;
                (user as any).githubId = (profile?.id ?? "").toString();
                return true;
            } catch (error) {
                console.error("[NextAuth] signIn error:", error);
                return false;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                token.githubId = (user as any).githubId;
                token.userUid = (user as any).userUid;
                token.rawKey = (user as any).rawKey;
                token.credits = (user as any).credits;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? "";
                session.user.userUid = token.userUid as string | undefined;
                session.user.githubId = token.githubId as string | undefined;
                session.user.rawKey = token.rawKey as string | undefined;
                session.user.credits = token.credits as number | undefined;
            }
            return session;
        },
    },
};
