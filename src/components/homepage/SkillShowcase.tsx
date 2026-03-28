"use client";

import React from 'react';
import { resolveSkillVisuals } from '../../lib/skill-visual-identity'; // 🌟 Optimized Identity System
import { SquaresFour, Compass } from '@phosphor-icons/react';

/**
 * 单一轨道组件 (Single Marquee Track)
 * @param {object} filter - 筛选条件 { status?: string, category?: string }
 */
const MarqueeTrack = ({ skills, filter, speed = '40s', reverse = false }: { skills: any[], filter: { status?: string, category?: string }, speed?: string, reverse?: boolean }) => {
  // 执行多维筛选
  const filteredSkills = skills.filter(skill => {
    if (filter.status && (skill.status || "").toLowerCase() !== filter.status.toLowerCase()) return false;
    if (filter.category && (skill.category || "").toLowerCase() !== filter.category.toLowerCase()) return false;
    return true;
  });

  // 如果筛选结果为空，则物理隐藏该行
  if (filteredSkills.length === 0) {
    return null;
  }

  // 多倍复制确保无缝循环
  const displayItems = [...filteredSkills, ...filteredSkills, ...filteredSkills, ...filteredSkills];

  return (
    <div className="relative flex overflow-hidden py-2">
      <div 
        className="flex whitespace-nowrap animate-marquee-infinite hover:[animation-play-state:paused]"
        style={{ 
          animationDuration: speed,
          animationDirection: reverse ? 'reverse' : 'normal'
        }}
      >
        {displayItems.map((skill, idx) => {
          return (
            <div 
              key={`${skill.id}-${idx}`}
              className="inline-flex items-center gap-3 mx-3 px-5 py-3 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-blue-500/20 hover:bg-[var(--color-menu-hover-bg)] transition-all cursor-pointer group shadow-sm"
              onClick={() => window.location.href = `/skills/${skill.skill_name}`}
            >
              <div className={`p-2 rounded-xl border ${skill.visuals.styles.box} ${skill.visuals.styles.border} ${skill.visuals.styles.text} group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
                <div className="w-5 h-5 flex items-center justify-center">
                  <skill.visuals.Icon weight="duotone" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--color-text-primary)] tracking-tight">{skill.title}</span>
                <span className="text-[9px] font-black text-[var(--color-text-secondary)] opacity-60 tracking-widest font-mono">{skill.skill_name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SkillShowcaseProps {
  initialSkills?: any[];
}

export const SkillShowcase = ({ initialSkills = [] }: SkillShowcaseProps) => {
  // 将数据转换为跑马灯所需的格式 (Map skills to marquee format)
  const formattedSkills = initialSkills.map(s => {
    const status = s.status || "Community";
    const visuals = resolveSkillVisuals(s);
    
    return {
      id: s.skill_uid || s.skill_name,
      skill_name: s.skill_name,
      title: s.display_name || s.skill_name,
      status: status,
      category: (s.tags && s.tags.includes('data')) ? 'data' : 'default', // Keep simple category for track filtering
      visuals: visuals
    };
  });

  return (
    <section className="w-full bg-[var(--color-bg-primary)] py-12 overflow-hidden relative font-sans">
      <style>
        {`
          @keyframes marquee-infinite {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-infinite {
            display: flex;
            width: max-content;
            animation-name: marquee-infinite;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">
          <SquaresFour size={10} />
          Autonomous Ecosystem
        </div>
        
        <h2 className="text-3xl font-black text-[var(--color-text-primary)] tracking-tighter mb-4">
          READY-TO-USE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400">SKILLS</span>
        </h2>
        
        <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto text-sm font-medium leading-relaxed opacity-80">
          Unlock the largest library of AI-executable tools for your autonomous agents. 
        </p>
      </div>

      {/* 三轨并行容器 */}
      <div className="relative space-y-2">
        {/* Track 1: Official Skills */}
        <MarqueeTrack skills={formattedSkills} filter={{ status: 'Official' }} speed="80s" />

        {/* Track 2: Community Skills (Auto-hides if empty) */}
        <MarqueeTrack skills={formattedSkills} filter={{ status: 'Community' }} speed="60s" reverse={true} />
        
        {/* Track 3: High-Value Data Category */}
        <MarqueeTrack skills={formattedSkills} filter={{ category: 'data' }} speed="70s" />

        {/* Edge Overlays (Dynamic based on theme) */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/80 to-transparent z-10 pointer-events-none" />
      </div>

      <div className="mt-10 text-center">
         <button 
           onClick={() => window.location.href = '/skills'}
           className="group flex items-center gap-2 mx-auto px-6 py-2.5 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95"
         >
            <Compass size={14} />
            Explore All Skills
         </button>
      </div>
    </section>
  );
};


export default SkillShowcase;
