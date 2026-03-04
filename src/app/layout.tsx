import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

/* ─── 字体配置：使用 Inter 字体提升文字质感 ─── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* ─── SEO 元数据配置 ─── */
export const metadata: Metadata = {
  title: "UniSkill — One Key. Infinite Skills. Built for Agents.",
  description:
    "The managed API gateway for AI agents. Stop managing API keys, start building intelligence. Access Search, Scrape, Social and more with a single unified token.",
  keywords: ["AI gateway", "AI agents", "API gateway", "LLM tools", "agent skills"],
  openGraph: {
    title: "UniSkill — Managed API Gateway for AI Agents",
    description: "One Key. Infinite Skills. Built for Agents.",
    type: "website",
  },
};

/* ─── 根布局：注入字体 + SessionProvider + 全局暗色背景 ─── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#0a0f1e] text-white antialiased">
        {/* Providers 包裹层包含 NextAuth SessionProvider */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

