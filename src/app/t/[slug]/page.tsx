// src/app/t/[slug]/page.tsx
// 团队落地页 — 服务器组件：数据获取

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getTeamMembers, getUserTeamMembership } from "@/lib/teams";
import { TeamLandingClient } from "./TeamLandingClient";

export const dynamic = "force-dynamic";

export default async function TeamLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [session, team] = await Promise.all([
    getServerSession(authOptions),
    getTeamBySlug(slug),
  ]);

  if (!team) {
    return <TeamNotFound />;
  }

  const userUid = (session?.user as any)?.userUid as string | undefined;
  const userEmail = session?.user?.email;

  let membership: { role: string } | null = null;
  let members: Awaited<ReturnType<typeof getTeamMembers>> = [];

  if (userUid) {
    membership = await getUserTeamMembership(userUid, team.team_uid);
  }

  // 兜底：用邮箱匹配 admin_email（管理员可能还没加入 team_members）
  if (!membership && userEmail && team.admin_email === userEmail) {
    membership = { role: 'owner' };
  }

  if (membership) {
    members = await getTeamMembers(team.team_uid);
  }

  return (
    <TeamLandingClient
      team={team}
      isAuthenticated={!!session?.user}
      membership={membership}
      members={members}
      isSuspended={team.status === "suspended"}
      initialCredits={session?.user?.credits}
      initialDisplayName={(session?.user as any)?.displayName || null}
    />
  );
}

function TeamNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-primary)" }}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black" style={{ color: "var(--color-text-primary)" }}>
          团队不存在
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          该团队链接无效或已被删除。
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-colors"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
