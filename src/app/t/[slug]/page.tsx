import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getTeamBySlug, getTeamMembers, getUserTeamMembership } from "@/lib/teams";
import { createClient } from "@supabase/supabase-js";
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
  let skillCount = 0;
  let monthlyUsage = 0;
  let recentEvents: any[] = [];

  if (userUid) {
    membership = await getUserTeamMembership(userUid, team.team_uid);
  }

  if (!membership && userEmail && team.admin_email === userEmail) {
    membership = { role: 'owner' };
  }

  if (membership) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    members = await getTeamMembers(team.team_uid);
    const memberUids = members.map((m) => m.user_uid).filter(Boolean);
    if (team.admin_uid && !memberUids.includes(team.admin_uid)) {
      memberUids.push(team.admin_uid);
    }

    const [skillsRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from('skills')
        .select('skill_uid', { count: 'exact', head: true })
        .eq('team_uid', team.team_uid),
      memberUids.length > 0
        ? supabaseAdmin
            .from('credit_events')
            .select('id, request_id, skill_name, amount, created_at, user_uid')
            .in('user_uid', memberUids)
            .order('created_at', { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

    skillCount = skillsRes.count || 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    if (eventsRes.data) {
      monthlyUsage = eventsRes.data
        .filter((e: any) => e.amount < 0 && e.created_at >= monthStart)
        .reduce((sum: number, e: any) => sum + Math.abs(e.amount), 0);
      recentEvents = eventsRes.data.slice(0, 5);
    }
  }

  return (
    <TeamLandingClient
      team={team}
      isAuthenticated={!!session?.user}
      membership={membership}
      members={members}
      isSuspended={team.status === "suspended"}
      skillCount={skillCount}
      monthlyUsage={monthlyUsage}
      recentEvents={recentEvents}
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
