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
                const profileObj = profile as any;
                const result = await handleUserRegistration({
                    id: profileObj?.id ?? user.id,
                    email: user.email,
                    username: user.name,
                    image: user.image,
                    github_url: profileObj?.html_url,
                });
                (user as any).credits = result.profile.credits;
                (user as any).tier = result.profile.tier;
                (user as any).userUid = result.profile.user_uid;
                (user as any).authorizedWallet = result.profile.authorized_wallet ?? null;
                (user as any).githubId = (profileObj?.id ?? "").toString();
                return true;
            } catch (error) {
                console.error("[NextAuth] signIn error:", error);
                return false;
            }
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.githubId       = (user as any).githubId;
                token.userUid        = (user as any).userUid;
                token.authorizedWallet = (user as any).authorizedWallet;
                token.credits        = (user as any).credits;
                token.tier           = (user as any).tier;
            }

            // 🌟 Handle manual session updates (triggered by updateSession())
            if (trigger === "update" && session) {
                if (session.authorizedWallet !== undefined) {
                    token.authorizedWallet = session.authorizedWallet;
                }
                if (session.credits !== undefined) {
                    token.credits = session.credits;
                }
            }
            
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id              = token.sub ?? "";
                session.user.userUid         = token.userUid as string | undefined;
                session.user.githubId        = token.githubId as string | undefined;
                session.user.authorizedWallet = token.authorizedWallet as string | null | undefined;
                session.user.credits         = token.credits as number | undefined;
                session.user.tier            = token.tier as string | undefined;
            }
            return session;
        },
    },
};
