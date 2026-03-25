import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import SkillsClient from "./SkillsClient";

export default async function SkillsPage() {
  const session = await getServerSession(authOptions as any);

  if (!session?.user) {
    redirect("/");
  }

  const userUid = (session.user as any).userUid;

  // 🌟 Server-side prefetch to eliminate "flicker"
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, display_name')
    .eq('user_uid', userUid)
    .single();

  return (
    <SkillsClient 
      initialCredits={profile?.credits ?? (session.user as any).credits}
      initialDisplayName={profile?.display_name || null}
    />
  );
}
