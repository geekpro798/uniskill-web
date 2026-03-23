import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const userUid = (session.user as any).userUid;

  // 🌟 在服务端预取关键数据，彻底消除“闪烁” (Server-side prefetch)
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, display_name')
    .eq('user_uid', userUid)
    .single();

  return (
    <DashboardClient 
      initialCredits={profile?.credits ?? session.user.credits}
      initialDisplayName={profile?.display_name || null}
    />
  );
}
