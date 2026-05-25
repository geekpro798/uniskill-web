// src/lib/authOptions.ts
// Shared NextAuth config — GitHub OAuth + Admin Email/Password

import { type NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { handleUserRegistration } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { verifyPassword } from "@/lib/password";
import { getUserTeams } from "@/lib/teams";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            id: "team-credentials",
            name: "Team Login",
            credentials: {
                email: { label: "邮箱", type: "email" },
                password: { label: "密码", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const supabase = getSupabaseAdmin();
                const normalizedEmail = (credentials.email as string).toLowerCase().trim();

                // 先不加 status 过滤，查出所有字段看实际值
                const { data: teamRaw } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('admin_email', normalizedEmail)
                    .maybeSingle();

                console.log('[Team Login] Query result for', normalizedEmail, ':', JSON.stringify(teamRaw));

                if (!teamRaw) {
                    console.warn('[Team Login] No team found for email:', normalizedEmail);
                    return null;
                }

                if (teamRaw.status === 'suspended' || teamRaw.status === 'cancelled') {
                    console.warn('[Team Login] Team is suspended/cancelled, status:', teamRaw.status);
                    return null;
                }

                if (!teamRaw.password_hash) {
                    console.error('[Team Login] Team found but no password_hash set');
                    return null;
                }

                const valid = verifyPassword(credentials.password as string, teamRaw.password_hash);
                if (!valid) {
                    console.warn('[Team Login] Password mismatch for:', normalizedEmail);
                    return null;
                }

                // 自愈：存量团队可能没有 admin_uid，先补上
                let adminUid = teamRaw.admin_uid as string | null;
                if (!adminUid) {
                    const { randomUUID } = await import('crypto');
                    adminUid = randomUUID();
                    await supabase
                        .from('teams')
                        .update({ admin_uid: adminUid })
                        .eq('team_uid', teamRaw.team_uid);
                    console.log('[Team Login] Self-healed: generated admin_uid for team', teamRaw.team_uid);
                }

                // 自愈：存量团队 owner 可能没有 profiles 记录，自动补建
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('user_uid')
                    .eq('user_uid', adminUid)
                    .maybeSingle();

                if (!existingProfile) {
                    await supabase.from('profiles').insert({
                        user_uid: adminUid,
                        github_id: `email:${normalizedEmail}`,
                        email: normalizedEmail,
                        username: normalizedEmail,
                        credits: 0,
                        tier: 'FREE',
                    });
                    console.log('[Team Login] Self-healed: created profile for owner', adminUid);

                    // 同时确保 owner 在 team_members 中
                    const { data: existingMember } = await supabase
                        .from('team_members')
                        .select('role')
                        .eq('team_uid', teamRaw.team_uid)
                        .eq('user_uid', adminUid)
                        .maybeSingle();

                    if (!existingMember) {
                        await supabase.from('team_members').insert({
                            team_uid: teamRaw.team_uid,
                            user_uid: adminUid,
                            role: 'owner',
                        });
                        console.log('[Team Login] Self-healed: added owner to team_members', adminUid);
                    }
                }

                return {
                    id: adminUid,
                    email: teamRaw.admin_email,
                    name: teamRaw.name,
                    userUid: adminUid,
                    teamUid: teamRaw.team_uid as string,
                    teamRole: 'owner',
                };
            },
        }),
        CredentialsProvider({
            id: "admin-credentials",
            name: "Admin Login",
            credentials: {
                email: { label: "邮箱", type: "email" },
                password: { label: "密码", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const supabase = getSupabaseAdmin();
                const normalizedEmail = (credentials.email as string).toLowerCase().trim();

                const { data: adminUser } = await supabase
                    .from('admin_users')
                    .select('*')
                    .eq('email', normalizedEmail)
                    .eq('status', 'active')
                    .maybeSingle();

                if (!adminUser || !adminUser.password_hash) return null;

                const valid = verifyPassword(credentials.password as string, adminUser.password_hash);
                if (!valid) return null;

                await supabase
                    .from('admin_users')
                    .update({ last_active_at: new Date().toISOString() })
                    .eq('user_uid', adminUser.user_uid);

                return {
                    id: adminUser.user_uid || adminUser.email,
                    email: adminUser.email,
                    name: adminUser.name || adminUser.email,
                    adminRole: adminUser.role as string,
                    userUid: adminUser.user_uid as string | undefined,
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Credentials providers — already verified in authorize()
            if (account?.provider === "team-credentials" || account?.provider === "admin-credentials") {
                return true;
            }

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
                // Admin credentials fields
                token.adminRole       = (user as any).adminRole;
                token.teamUid         = (user as any).teamUid;
                token.teamRole        = (user as any).teamRole;

                if (token.userUid) {
                    try {
                        const teams = await getUserTeams(token.userUid);
                        token.teamIds = teams.map((t) => t.team_uid);
                        token.teamSlugs = teams.map((t) => t.slug);
                        // 同步团队列表到 Gateway KV（user:profile.teams）
                        const { syncUserTeamsToGateway } = await import('@/lib/teams');
                        syncUserTeamsToGateway(token.userUid).catch(() => {});
                    } catch {
                        token.teamIds = [];
                        token.teamSlugs = [];
                    }
                }

                // 团队凭证登录时 admin_uid 可能为 null，但 teamUid 已设置
                // 此时直接查 teams 表获取 slug，确保 teamSlugs 不为空
                if (token.teamUid && (!token.teamSlugs || token.teamSlugs.length === 0)) {
                    try {
                        const supabase = createClient(
                            process.env.NEXT_PUBLIC_SUPABASE_URL!,
                            process.env.SUPABASE_SERVICE_ROLE_KEY!
                        );
                        const { data: teamData } = await supabase
                            .from('teams')
                            .select('team_uid, slug')
                            .eq('team_uid', token.teamUid)
                            .maybeSingle();
                        if (teamData?.slug) {
                            token.teamIds = [teamData.team_uid];
                            token.teamSlugs = [teamData.slug];
                        }
                    } catch {
                        // silently ignore
                    }
                }
            }

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
                session.user.teamIds         = token.teamIds as string[] | undefined;
                session.user.teamSlugs       = token.teamSlugs as string[] | undefined;
                (session.user as any).teamUid   = token.teamUid as string | undefined;
                (session.user as any).teamRole  = token.teamRole as string | undefined;
                // Admin fields
                (session.user as any).adminRole   = token.adminRole as string | undefined;
            }
            return session;
        },
    },
    pages: {
        signIn: '/admin/login',
    },
};
