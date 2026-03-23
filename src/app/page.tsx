/* ─── 主页面入口：组装 Landing Page 的所有区块 ─────────────────────────
   渲染顺序：Navbar → Hero → HowItWorks → Pricing → Footer
   ─────────────────────────────────────────────────────────────────────── */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
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

  return (
    <main className="min-h-screen font-sans">
      {/* 固定顶部导航栏并传入预取的名字 */}
      <Navbar initialDisplayName={displayName} />

      {/* 主视觉区域 */}
      <HeroSection />

      {/* 流程说明区块 */}
      <HowItWorks />

      {/* 创作者中心区块 */}
      <CreatorHubSection />

      {/* 定价区块 */}
      <PricingSection />

      {/* 页脚 */}
      <Footer />
    </main>
  );
}
