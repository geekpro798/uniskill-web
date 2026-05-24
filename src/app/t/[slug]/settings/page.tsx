import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import { getTeamBySlug } from "@/lib/teams";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import TeamSettingsClient from "./TeamSettingsClient";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // 只有 owner/admin 可以访问设置
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-main)" }}>
      <UnifiedNavbar
        initialCredits={(session as any).user.credits}
        initialDisplayName={(session as any).user.name || null}
        initialAvatarUrl={(session as any).user.image || null}
      />
      <main className="max-w-5xl mx-auto pt-[88px] md:pt-[100px] pb-12 px-6">
        <TeamSettingsClient
          team={{
            team_uid: team.team_uid,
            name: team.name,
            slug: team.slug,
            status: team.status,
            plan: team.plan,
            admin_email: team.admin_email || "",
            contact_name: team.contact_name || "",
            contact_email: team.contact_email || "",
            contact_phone: team.contact_phone || "",
            max_members: team.max_members,
            max_skills: team.max_skills,
            max_credits_month: team.max_credits_month,
            monthly_fee_usd: team.monthly_fee_usd,
          }}
          userUid={userUid}
        />
      </main>
    </div>
  );
}
