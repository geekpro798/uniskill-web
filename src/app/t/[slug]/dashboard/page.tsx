// src/app/t/[slug]/dashboard/page.tsx
// 团队控制台 — 服务器组件：数据获取 + 权限校验

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getTeamMembers, getUserTeamMembership } from "@/lib/teams";
import { TeamDashboardClient } from "./TeamDashboardClient";

export const dynamic = "force-dynamic";

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [session, team] = await Promise.all([
    getServerSession(authOptions),
    getTeamBySlug(slug),
  ]);

  if (!session?.user) {
    redirect("/");
  }

  if (!team) {
    redirect("/");
  }

  const userUid = (session.user as any).userUid as string;
  const userEmail = session.user.email;

  let membership = await getUserTeamMembership(userUid, team.team_uid);

  // 兜底：用邮箱匹配 admin_email
  if (!membership && userEmail && team.admin_email === userEmail) {
    membership = { role: 'owner' };
  }

  if (!membership) {
    redirect(`/t/${slug}`);
  }

  // 并行预取：members + team skills
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [members, skillsResult] = await Promise.all([
    getTeamMembers(team.team_uid),
    supabaseAdmin
      .from('skills')
      .select('*')
      .eq('team_uid', team.team_uid)
      .order('skill_name', { ascending: true }),
  ]);

  return (
    <TeamDashboardClient
      team={team}
      members={members}
      membership={membership}
      initialSkills={skillsResult.data || []}
      initialCredits={session.user.credits}
      initialDisplayName={(session.user as any).displayName || null}
    />
  );
}
