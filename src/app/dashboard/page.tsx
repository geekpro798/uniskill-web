import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const userUid = (session.user as any).userUid;

  // 🌟 特权预取器：使用 Service Role 绕过 RLS (Privileged admin client)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 🚀 并行化：并发查询个人资料和技能摘要，极大缩短 TTFB
  const [profileResult, skillsResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('credits, display_name')
      .eq('user_uid', userUid)
      .maybeSingle(),
    supabaseAdmin
      .from('skills')
      .select('*')
      .eq('owner_uid', userUid)
      .order('skill_name', { ascending: true })
  ]);

  const profile = profileResult.data;
  const skillsData = skillsResult.data || [];

  return (
    <DashboardClient 
      initialCredits={profile?.credits ?? session.user.credits}
      initialDisplayName={profile?.display_name || null}
      initialSkills={skillsData}
    />
  );
}
