// src/app/settings/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import SettingsDashboard from "../../components/Settings";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  const userUid = (session.user as any).userUid;

  // 1. 获取用户 Profile 数据 (Fetch user profile data)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_uid', userUid)
    .single();

  // 这里的 profile 可能包含 bio, display_name, github_url, secrets, tier 等数据
  const githubUrl = profile?.github_url || "";
  const handle = githubUrl.split("/").pop() || session.user.name?.replace(/\s+/g, '-').toLowerCase() || session.user.email?.split("@")[0] || "user";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg-main)" }}>
      <DashboardNavbar 
        credits={session.user.credits} 
        totalCredits={100} 
        userName={profile?.display_name || undefined}
      />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <SettingsDashboard 
          initialUser={{
            name: profile?.display_name || session.user.name || "User",
            email: session.user.email || "",
            image: session.user.image || "",
            bio: profile?.bio || "",
            githubUrl: githubUrl,
            handle: handle,
            tier: profile?.tier || "Free",
            provider: (session.user as any).provider || "github",
            secrets: profile?.secrets || {}
          }} 
        />
      </main>
    </div>
  );
}
