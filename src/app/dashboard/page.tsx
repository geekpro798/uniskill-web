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
    <DashboardClient 
      initialCredits={profile?.credits ?? session.user.credits}
      initialDisplayName={profile?.display_name || null}
    />
  );
}
