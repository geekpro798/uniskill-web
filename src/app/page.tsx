/* ─── 主页面入口：组装 Landing Page 的所有区块 ─────────────────────────
   渲染顺序：Navbar → Hero → HowItWorks → Pricing → Footer
   ─────────────────────────────────────────────────────────────────────── */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* 固定顶部导航栏 */}
      <Navbar />

      {/* 主视觉区域 */}
      <HeroSection />

      {/* 流程说明区块 */}
      <HowItWorks />

      {/* 定价区块 */}
      <PricingSection />

      {/* 页脚 */}
      <Footer />
    </main>
  );
}
