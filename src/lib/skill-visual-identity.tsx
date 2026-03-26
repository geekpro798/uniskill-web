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
  'tools':     { icon: 'Wrench',   color: 'blue' },
  'ai':        { icon: 'Robot',    color: 'pink' },
  'data':      { icon: 'Database', color: 'emerald' },
  'content':   { icon: 'Newspaper',color: 'sky' },
  'analytics': { icon: 'Activity', color: 'emerald' },
  'finance':   { icon: 'Bank',     color: 'amber' },
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

  // --- 🌟 阶段 1: 显式表情符号 (Legacy Emoji) ---
  if (skill.emoji) {
    return {
      Icon: () => <span className="text-lg leading-none">{skill.emoji}</span>,
      styles: THEME_MAP.indigo,
      isAiAssigned: false
    };
  }

  // --- 🌟 阶段 2: AI 建议的视觉身份 (AI-Driven Metadata) ---
  let aiVisuals = skill.visuals || skill.metadata?.visuals || {};

  // 🌟 Fallback: 如果没有结构化元数据，从 markdown 源码中抓取
  if (!aiVisuals.suggested_icon && skill.markdown_manifest) {
    const iconMatch = skill.markdown_manifest.match(/suggested_icon:\s*([^\s\n]+)/);
    const themeMatch = skill.markdown_manifest.match(/theme_color:\s*([^\s\n]+)/);
    if (iconMatch) {
      aiVisuals = {
        suggested_icon: iconMatch[1].replace(/['"]/g, '').trim(),
        theme_color: themeMatch ? themeMatch[1].replace(/['"]/g, '').trim() : 'blue'
      };
    }
  }

  if (aiVisuals.suggested_icon && (Phosphor as any)[aiVisuals.suggested_icon]) {
    const aiColor = (aiVisuals.theme_color || 'blue') as ThemeColor;
    return {
      Icon: (Phosphor as any)[aiVisuals.suggested_icon],
      styles: THEME_MAP[aiColor] || THEME_MAP.blue,
      isAiAssigned: true
    };
  }

  // --- 🌟 阶段 3: 关键词模糊匹配 (Keyword Match) ---
  const searchStr = `${name} ${displayName} ${tags.join(' ')}`;
  for (const [key, config] of Object.entries(KEYWORD_RULES)) {
    if (searchStr.includes(key)) {
      return {
        Icon: (Phosphor as any)[config.icon] || Phosphor.Cube,
        styles: THEME_MAP[config.color],
        isAiAssigned: false
      };
    }
  }

  // --- 🌟 阶段 4: 分类降级 (Category Fallback) ---
  const primaryTag = tags.length > 0 ? tags[0] : null;
  if (primaryTag && CATEGORY_FALLBACKS[primaryTag]) {
    const config = CATEGORY_FALLBACKS[primaryTag];
    return {
      Icon: (Phosphor as any)[config.icon] || Phosphor.Cube,
      styles: THEME_MAP[config.color],
      isAiAssigned: false
    };
  }

  // --- 🌟 阶段 5: 全局兜底 (Final Fallback) ---
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
