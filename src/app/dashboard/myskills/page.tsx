import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import SkillsClient from "./SkillsClient";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const session = await getServerSession(authOptions as any) as any;

  if (!(session as any)?.user) {
    redirect("/");
  }

  const userUid = (session as any).user.userUid;

  // 🌟 特权预取器：使用 Service Role 绕过 RLS (Privileged admin client)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 🚀 并行化：同时查询个人资料和技能列表，将延迟从 A+B 优化为 max(A, B)
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
    <SkillsClient 
      initialCredits={profile?.credits ?? (session as any).user.credits}
      initialDisplayName={profile?.display_name || null}
      initialSkills={skillsData}
    />
  );
}
