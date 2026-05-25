import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import { getTeamBySlug } from "@/lib/teams";
import CreateSkillClient from "@/app/dashboard/myskills/new/CreateSkillClient";

export const dynamic = "force-dynamic";

export default async function TeamCreateSkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions as any);

  if (!(session as any)?.user) {
    redirect(`/t/${slug}`);
  }

  const userUid = (session as any).user.userUid;

  const team = await getTeamBySlug(slug);
  if (!team) {
    redirect("/");
  }

  // 只有 owner/admin 可以创建团队技能
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: membership } = await supabaseAdmin
    .from("team_members")
    .select("role")
    .eq("team_uid", team.team_uid)
    .eq("user_uid", userUid)
    .maybeSingle();

  const isOwner = team.admin_uid === userUid;
  const isAdmin = membership?.role === "admin";
  if (!isOwner && !isAdmin) {
    redirect(`/t/${slug}/dashboard`);
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("credits, display_name")
    .eq("user_uid", userUid)
    .maybeSingle();

  return (
    <CreateSkillClient
      initialCredits={profile?.credits ?? (session as any).user.credits}
      initialDisplayName={profile?.display_name || null}
      teamUid={team.team_uid}
      teamSlug={team.slug}
    />
  );
}
