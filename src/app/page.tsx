/* ─── 主页面入口：组装 Landing Page 的所有区块 ─────────────────────────
   渲染顺序：Navbar → Hero → HowItWorks → Pricing → Footer
   ─────────────────────────────────────────────────────────────────────── */
import UnifiedNavbar from "@/components/UnifiedNavbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import SkillShowcase from "@/components/homepage/SkillShowcase";
import PricingSection from "@/components/PricingSection";
import CreatorHubSection from "@/components/homepage/CreatorHubSection";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // 🌟 特权预取器：如果已登录，获取真实的显示名称和积分 (Privileged pre-fetcher)
  let profile = null;
  if (session?.user?.userUid) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('credits, display_name')
      .eq('user_uid', session.user.userUid)
      .maybeSingle();
    profile = data;
  }

  // 🌟 同时预取首页 Showcase 所需的真实技能 (Pre-fetching ALL active skills)
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('skill_name, display_name, status, emoji, tags')
    .limit(100); // Fetch more to ensure we see them

  if (skillsError) {
    console.error("Home page skills fetch error:", skillsError);
  }

  return (
    <main className="min-h-screen font-sans">
      {/* 固定顶部导航栏并传入预取的名字 */}
      <UnifiedNavbar 
        initialCredits={profile?.credits ?? session?.user?.credits} 
        initialDisplayName={profile?.display_name || session?.user?.name || null}
        initialAvatarUrl={session?.user?.image || null}
      />

      {/* 主视觉区域 */}
      <HeroSection />

      {/* 流程说明区块 */}
      <HowItWorks />

      {/* 核心技能展示区 (Marquee Showcase) */}
      <SkillShowcase initialSkills={skills || []} />

      {/* 创作者中心区块 */}
      <CreatorHubSection />

      {/* 定价区块 */}
      <PricingSection />

      {/* 页脚 */}
      <Footer />
    </main>
  );
}
