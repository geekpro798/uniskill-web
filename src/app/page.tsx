/* ─── 主页面入口：组装 Landing Page 的所有区块 ─────────────────────────
   渲染顺序：Navbar → Hero → HowItWorks → Pricing → Footer
   ─────────────────────────────────────────────────────────────────────── */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import SkillShowcase from "@/components/homepage/SkillShowcase";
import PricingSection from "@/components/PricingSection";
import CreatorHubSection from "@/components/homepage/CreatorHubSection";
import Footer from "@/components/Footer";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  let displayName = null;

  if (session?.user) {
    const userUid = (session.user as any).userUid;
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_uid', userUid)
      .single();
    displayName = profile?.display_name || null;
  }

  // 🌟 同时预取首页 Showcase 所需的真实技能 (Pre-fetching ALL active skills)
  const { data: skills, error: skillsError } = await supabase
    .from('skills')
    .select('skill_name, display_name, status, emoji, tags')
    .limit(100); // Fetch more to ensure we see them

  if (skillsError) {
    console.error("Home page skills fetch error:", skillsError);
  } else {
    console.log("Home page fetched skills count:", skills?.length);
  }

  return (
    <main className="min-h-screen font-sans">
      {/* 固定顶部导航栏并传入预取的名字 */}
      <Navbar initialDisplayName={displayName} />

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
