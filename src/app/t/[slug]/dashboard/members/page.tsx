// src/app/t/[slug]/dashboard/members/page.tsx
// 团队成员管理 — 服务器组件

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getTeamMembers, getUserTeamMembership } from "@/lib/teams";
import MembersClient from "./MembersClient";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function TeamMembersPage({
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
    membership = { role: "owner" };
  }

  if (!membership) {
    redirect(`/t/${slug}`);
  }

  const [members, { data: invitations }] = await Promise.all([
    getTeamMembers(team.team_uid),
    getSupabaseAdmin()
      .from("team_invitations")
      .select("*")
      .eq("team_uid", team.team_uid)
      .eq("status", "pending"),
  ]);

  return (
    <MembersClient
      teamUid={team.team_uid}
      teamName={team.name}
      teamSlug={team.slug}
      currentUserUid={userUid}
      currentUserRole={membership.role}
      initialMembers={members}
      initialInvitations={(invitations || []) as any[]}
      initialCredits={session.user.credits}
      initialDisplayName={(session.user as any).displayName || null}
    />
  );
}
