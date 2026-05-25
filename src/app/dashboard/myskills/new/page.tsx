import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { createClient } from "@supabase/supabase-js";
import CreateSkillClient from "./CreateSkillClient";

export const dynamic = "force-dynamic";

export default async function CreateSkillPage() {
  const session = await getServerSession(authOptions as any) as any;

  if (!(session as any)?.user) {
    redirect("/");
  }

  const userUid = (session as any).user.userUid;

  // 🌟 特权预取：使用 Service Role 绕过 RLS 彻底消除“闪烁” (Privileged server-side prefetch)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits, display_name')
    .eq('user_uid', userUid)
    .maybeSingle();

  return (
    <CreateSkillClient 
      initialCredits={profile?.credits ?? (session as any).user.credits}
      initialDisplayName={profile?.display_name || null}
    />
  );
}
