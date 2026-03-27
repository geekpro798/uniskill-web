'use client';

import React from 'react';
import { Sparkles, TerminalSquare, Wand2, ArrowRight, Zap, Globe, Coins } from 'lucide-react';
import Link from 'next/link';

export default function CreatorHubSection() {
  // ==========================================
  // 核心资产：创作者 Hub 的三大核心卖点卡片数据
  // (Core Asset: Metadata for Creator Hub Value Prop Cards)
  // ==========================================
  const creatorFeatures = [
    {
      icon: Wand2,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-transparent dark:bg-purple-950/40",
      borderColor: "border-transparent dark:border-purple-800/50",
      title: "No-Code Magic Architect",
      description: "Describe your tool in plain English. Our internal LLM automatically structures parameters and generates valid MCP schemas."
    },
    {
      icon: Zap,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-transparent dark:bg-emerald-950/40",
      borderColor: "border-transparent dark:border-emerald-800/50",
      title: "Instant Edge Deployment",
      description: "Skills are compiled into optimized edge functions on Cloudflare Workers. Your tools run globally in < 1 second."
    },
    {
      icon: Coins, 
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-transparent dark:bg-amber-950/40",
      borderColor: "border-transparent dark:border-amber-800/50",
      title: "Monetize Your Skills (Phase 2)",
      description: "Publish high-value skills to the marketplace. Earn UniSkill credits every time another Agent invokes your tool via our gateway."
    }
  ];

  return (
    <section className="w-full relative pt-16 pb-24 overflow-hidden border-t" style={{ backgroundColor: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}>
      {/* Visual: Glowing top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
      
      {/* Visual: Subtle purple glow in background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <header className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20 mb-4 uppercase tracking-widest transition-all">
            <Sparkles className="w-4 h-4" />
            Introducing the Creator Hub
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-tight" style={{ color: "var(--color-text-primary)" }}>
            Build, Deploy, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Monetize</span> Your AI Tools.
          </h2>
          
          <p className="mt-[15px] text-lg leading-relaxed font-sans max-w-2xl mx-auto" style={{ color: "var(--color-text-primary)" }}>
            Turn any logic or API into a plug-and-play AI Skill instantly. No server required.
          </p>
        </header>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {creatorFeatures.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-black/40 border"
              style={{ backgroundColor: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
            >
              <div className={`inline-flex items-center justify-center ${feature.bgColor} rounded-xl border ${feature.borderColor} mb-6 transition-transform group-hover:scale-110 dark:p-3`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              
              <h4 className="text-xl font-bold tracking-tight mb-3 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-400" style={{ color: "var(--color-text-primary)" }}>
                {feature.title}
              </h4>
              <p className="text-sm leading-relaxed font-sans transition-colors group-hover:opacity-90" style={{ color: "var(--color-text-secondary)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <footer className="mt-14 sm:mt-16 text-center">
          <div className="inline-block p-[1px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-xl shadow-blue-900/10 active:scale-95">
            <Link href="/dashboard/myskills/new">
              <button 
                className="flex items-center gap-2 px-10 py-4 font-extrabold rounded-[15px] transition-colors leading-none tracking-tight group no-underline"
                style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}
              >
                <TerminalSquare className="w-5 h-5" />
                Build Your First Private Skill
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
          <p className="mt-4 text-xs font-sans flex items-center justify-center gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
            <Globe className="w-3.5 h-3.5" /> Deployed within &lt;1 second globally via Cloudflare Edge.
          </p>
        </footer>

      </div>
    </section>
  );
}
