import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getUserTeamMembership } from "@/lib/teams";
import UnifiedNavbar from "@/components/UnifiedNavbar";
import TeamBillingClient from "./TeamBillingClient";

export const dynamic = "force-dynamic";

export default async function TeamBillingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions as any) as any;

  if (!(session as any)?.user) {
    redirect(`/t/${slug}`);
  }

  const userUid = (session as any).user.userUid;
  const userEmail = session.user.email;

  const team = await getTeamBySlug(slug);
  if (!team) redirect("/");

  let membership = await getUserTeamMembership(userUid, team.team_uid);
  if (!membership && userEmail && team.admin_email === userEmail) {
    membership = { role: "owner" };
  }
  if (!membership) redirect(`/t/${slug}`);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-main)" }}>
      <UnifiedNavbar
        initialCredits={(session as any).user.credits}
        initialDisplayName={(session as any).user.name || null}
        initialAvatarUrl={(session as any).user.image || null}
      />
      <main className="max-w-3xl mx-auto pt-[88px] md:pt-[100px] pb-10 px-6">
        <TeamBillingClient
          teamUid={team.team_uid}
          teamName={team.team_name}
          teamSlug={team.slug}
          plan={team.plan}
          maxCreditsMonth={team.max_credits_month ?? null}
        />
      </main>
    </div>
  );
}
