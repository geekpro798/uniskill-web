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
    "The managed API gateway for AI agents. Stop managing API keys, start building intelligence. Access Search, Scrape, Social and more with a single unified key.",
  keywords: ["AI gateway", "AI agents", "API gateway", "LLM tools", "agent skills"],
  openGraph: {
    title: "UniSkill — Managed API Gateway for AI Agents",
    description: "One Key. Infinite Skills. Built for Agents.",
    type: "website",
  },
};

import ScrollProgress from "@/components/ScrollProgress";
import { ThemeProvider } from "@/components/ThemeProvider";

/* ─── 根布局：注入字体 + SessionProvider + 全局主题管理 ─── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ScrollProgress />
          {/* Providers 包裹层包含 NextAuth SessionProvider */}
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

