"use client";

import React from 'react';
import { 
  Search, 
  Globe, 
  Share2, 
  Database, 
  Image as ImageIcon, 
  Newspaper, 
  Zap, 
  BarChart3, 
  Cpu, 
  Code, 
  Link2, 
  Layers, 
  Compass,
  Activity 
} from 'lucide-react';

/**
 * Enhanced Marquee Skill Showcase (v4.3 - Fixed ReferenceError)
 * 职责：展示三条特定的技能轨道，修复了 Activity 图标未定义的错误。
 */

// 1. 全局图标映射器 (Global Icon Mapper - for real skills)
const getIconForSkill = (skill: any) => {
  // If the database has an emoji, use it
  if (skill.emoji) return <span className="text-lg">{skill.emoji}</span>;
  
  // Fallback map based on tags or name
  const name = (skill.display_name || skill.skill_name || "").toLowerCase();
  if (name.includes('search')) return <Globe size={18} />;
  if (name.includes('scrape') || name.includes('find')) return <Search size={18} />;
  if (name.includes('math') || name.includes('calc')) return <Zap size={18} />;
  if (name.includes('art') || name.includes('gen') || name.includes('image')) return <ImageIcon size={18} />;
  if (name.includes('crypto') || name.includes('price') || name.includes('market')) return <BarChart3 size={18} />;
  if (name.includes('data') || name.includes('analyt')) return <Database size={18} />;
  
  return <Cpu size={18} />;
};

const getColorForCategory = (category: string) => {
  const map: Record<string, { color: string, bg: string }> = {
    'tools': { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    'ai': { color: 'text-pink-400', bg: 'bg-pink-500/10' },
    'data': { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'utilities': { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    'default': { color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
  };
  return map[category] || map['default'];
};

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
          const { color, bg } = getColorForCategory(skill.category);
          return (
            <div 
              key={`${skill.id}-${idx}`}
              className="inline-flex items-center gap-3 mx-3 px-5 py-3 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-blue-500/20 hover:bg-[var(--color-menu-hover-bg)] transition-all cursor-pointer group shadow-sm"
              onClick={() => window.location.href = `/dashboard/skills/${skill.skill_name}`}
            >
              <div className={`p-2 rounded-xl ${bg} ${color} group-hover:scale-105 transition-transform duration-300 flex items-center justify-center`}>
                {skill.icon}
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
    const status = s.status || "Community"; // Default to Community if missing
    const tags = s.tags || [];
    
    // Explicitly check for data category
    const isData = tags.includes('data') || (s.skill_name || "").toLowerCase().includes('data') || (s.display_name || "").toLowerCase().includes('data');
    
    const category = isData ? 'data' : 
                     (tags.includes('ai') || status.toLowerCase() === 'community') ? 'ai' : 
                     status.toLowerCase() === 'official' ? 'tools' : 'default';
    
    return {
      id: s.skill_uid || s.skill_name,
      skill_name: s.skill_name,
      title: s.display_name || s.skill_name,
      status: status,
      category: category,
      icon: getIconForSkill(s),
      emoji: s.emoji
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
          <Layers size={10} />
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
