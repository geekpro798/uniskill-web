'use client';

import React from 'react';
import * as Phosphor from '@phosphor-icons/react';

/**
 * UniSkill Unified Visual System (v8.0 - Hybrid Edition)
 * 职责：全站视觉中枢。融合 AI 指定标识、关键词匹配与分类兜底。
 * 视觉标准：Phosphor Duotone + 10% Alpha Theme Colors.
 */

// ----------------------------------------------------------------------
// 1. 定义配色方案 (Color Palette)
// ----------------------------------------------------------------------
export type ThemeColor = 'blue' | 'purple' | 'emerald' | 'pink' | 'amber' | 'indigo' | 'rose' | 'slate' | 'cyan' | 'sky';

export interface ThemeStyles {
  box: string;
  text: string;
  border: string;
  glow: string;
}

const THEME_MAP: Record<ThemeColor, ThemeStyles> = {
  blue:    { box: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    glow: 'shadow-blue-500/20' },
  purple:  { box: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  glow: 'shadow-purple-500/20' },
  emerald: { box: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
  pink:    { box: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/20',    glow: 'shadow-pink-500/20' },
  amber:   { box: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/20' },
  indigo:  { box: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20',  glow: 'shadow-indigo-500/20' },
  rose:    { box: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20',    glow: 'shadow-rose-500/20' },
  slate:   { box: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20',   glow: 'shadow-slate-500/20' },
  cyan:    { box: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    glow: 'shadow-cyan-500/20' },
  sky:     { box: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20',     glow: 'shadow-sky-500/20' },
};

// ----------------------------------------------------------------------
// 2. 关键词与分类映射 (Mapping Rules)
// ----------------------------------------------------------------------
const KEYWORD_RULES: Record<string, { icon: string; color: ThemeColor }> = {
  // 1. 核心工具类 (Tools & Utils)
  'search':   { icon: 'MagnifyingGlass', color: 'blue' },
  'web':      { icon: 'Browsers',        color: 'blue' },
  'scrape':   { icon: 'MagnifyingGlass', color: 'purple' },
  'extract':  { icon: 'ListBullets',     color: 'purple' },
  'weather':  { icon: 'CloudSun',        color: 'amber' },
  'forecast': { icon: 'CloudSun',        color: 'amber' },

  // 2. AI & 智能化 (AI & Smart)
  'ai':       { icon: 'Robot',           color: 'pink' },
  'chat':     { icon: 'ChatText',        color: 'pink' },
  'llm':      { icon: 'Cpu',             color: 'pink' },
  'gpt':      { icon: 'Sparkle',         color: 'pink' },

  // 3. 数据与分析 (Data & Analysis)
  'data':     { icon: 'Database',        color: 'emerald' },
  'sql':      { icon: 'Database',        color: 'emerald' },
  'chart':    { icon: 'ChartBar',        color: 'purple' },
  'market':   { icon: 'TrendUp',         color: 'amber' },

  // 4. 开发与技术 (Dev & Tech)
  'github':   { icon: 'GithubLogo',      color: 'slate' },
  'code':     { icon: 'CodeBlock',       color: 'indigo' },
  'terminal': { icon: 'TerminalWindow',  color: 'indigo' },

  // 5. 内容与媒体 (Content & Media)
  'news':     { icon: 'Newspaper',       color: 'sky' },
  'image':    { icon: 'Palette',         color: 'rose' },
  'art':      { icon: 'Palette',         color: 'rose' },
};

const CATEGORY_FALLBACKS: Record<string, { icon: string; color: ThemeColor }> = {
  'web_search':         { icon: 'MagnifyingGlass', color: 'blue'    },
  'devops_infra':       { icon: 'HardDrive',       color: 'indigo'  },
  'workspace_data':      { icon: 'Briefcase',       color: 'emerald' },
  'media_intelligence':  { icon: 'VideoCamera',     color: 'rose'    },
  'social_outreach':    { icon: 'ShareNetwork',     color: 'sky'     },
  'finance_trading':    { icon: 'TrendUp',         color: 'amber'   },
  'utilities':          { icon: 'Wrench',          color: 'blue'    },
  // Legacy support & Other fallbacks
  'tools':              { icon: 'Wrench',          color: 'blue'    },
  'ai':                 { icon: 'Robot',           color: 'pink'    },
  'data':                { icon: 'Database',        color: 'emerald' },
};

export interface SkillVisuals {
  Icon: any;
  styles: ThemeStyles;
  isAiAssigned: boolean;
}

/**
 * 核心匹配函数 (getSkillVisuals) - v8.0 Standard
 * 实现级联匹配逻辑：显式 > AI 建议 > 关键词 > 分类
 */
const resolveSkillVisuals = (skill: any): SkillVisuals => {
    const name = (skill.skill_name || '').toLowerCase();
    const displayName = (skill.display_name || '').toLowerCase();
    const tags = (skill.tags || []).map((t: string) => t.toLowerCase());

    // --- 🌟 阶段 1: 视觉元数据提取 (Metadata & Identification) ---
    const aiVisuals = skill.visuals || skill.metadata?.visuals || {};
    const searchStr = `${name} ${displayName} ${tags.join(' ')}`;

    // --- 🌟 阶段 2: 确定主色调 (Determine Theme Color) ---
    let themeColor: ThemeColor = 'blue'; // 默认底色
    let colorSource: 'metadata' | 'keyword' | 'fallback' = 'fallback';

    // 1. 优先采用 AI/Manifest 指定的颜色
    if (aiVisuals.theme_color && THEME_MAP[aiVisuals.theme_color as ThemeColor]) {
        themeColor = aiVisuals.theme_color as ThemeColor;
        colorSource = 'metadata';
    } 
    // 2. 其次通过关键词匹配倾向
    else {
        for (const [key, config] of Object.entries(KEYWORD_RULES)) {
            if (searchStr.includes(key)) {
                themeColor = config.color;
                colorSource = 'keyword';
                break;
            }
        }
    }

    // --- 🌟 阶段 3: 确定图标元件 (Determine Icon Component) ---
    let IconComponent: any = Phosphor.Cube;
    let isAiAssigned = false;

    // 1. 如果有 Emoji，它是第一优先级的图标表现
    if (skill.emoji) {
        IconComponent = () => <span className="text-lg leading-none">{skill.emoji}</span>;
    }
    // 2. 其次检查 AI 建议的 Phosphor 图标
    else if (aiVisuals.suggested_icon && (Phosphor as any)[aiVisuals.suggested_icon]) {
        IconComponent = (Phosphor as any)[aiVisuals.suggested_icon];
        isAiAssigned = true;
    }
    // 3. 最后通过关键词匹配图标
    else {
        for (const [key, config] of Object.entries(KEYWORD_RULES)) {
            if (searchStr.includes(key)) {
                IconComponent = (Phosphor as any)[config.icon] || Phosphor.Cube;
                break;
            }
        }
    }

    // --- 🌟 阶段 4: 分类与兜底 (Fallbacks) ---
    // 如果仍然是 fallback (无明确匹配)，根据分类映射
    if (colorSource === 'fallback') {
        const primaryTag = tags.length > 0 ? tags[0] : null;
        if (primaryTag && CATEGORY_FALLBACKS[primaryTag]) {
            const config = CATEGORY_FALLBACKS[primaryTag];
            themeColor = config.color;
            if (!skill.emoji) IconComponent = (Phosphor as any)[config.icon] || IconComponent;
        } else if ((skill.status || "").toLowerCase() === 'official') {
            themeColor = 'blue';
            if (!skill.emoji) IconComponent = Phosphor.Wrench;
        }
    }

    return {
        Icon: IconComponent,
        styles: THEME_MAP[themeColor],
        isAiAssigned
    };
  const status = (skill.status || "").toLowerCase();
  if (status === 'official') {
    return { Icon: Phosphor.Wrench, styles: THEME_MAP.blue, isAiAssigned: false };
  }

  return {
    Icon: Phosphor.Cube,
    styles: THEME_MAP.slate,
    isAiAssigned: false
  };
};

export { resolveSkillVisuals };
export default resolveSkillVisuals;
