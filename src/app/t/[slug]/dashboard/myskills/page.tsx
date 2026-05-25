// src/app/t/[slug]/dashboard/myskills/page.tsx
// 团队技能管理页 — 服务器组件

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getUserTeamMembership } from "@/lib/teams";
import TeamSkillsClient from "./TeamSkillsClient";

export const dynamic = "force-dynamic";

export default async function TeamSkillsPage({
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

  if (!membership && userEmail && team.admin_email === userEmail) {
    membership = { role: 'owner' };
  }

  if (!membership) {
    redirect(`/t/${slug}`);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [profileResult, skillsResult] = await Promise.all([
    userUid
      ? supabaseAdmin
          .from('profiles')
          .select('credits, display_name')
          .eq('user_uid', userUid)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from('skills')
      .select('*')
      .eq('team_uid', team.team_uid)
      .order('skill_name', { ascending: true }),
  ]);

  const profile = profileResult.data;

  return (
    <TeamSkillsClient
      teamUid={team.team_uid}
      teamName={team.name}
      teamSlug={team.slug}
      membership={membership}
      initialCredits={profile?.credits ?? session.user.credits}
      initialDisplayName={profile?.display_name || null}
      initialSkills={skillsResult.data || []}
    />
  );
}
