/**
 * src/components/skills/CliSkillCardAligned.tsx
 * 职责：展示 CLI 类型技能。尺寸与普通 Skill Card 严格 1:1 对齐。
 * 风格：工业风、琥珀色主题、适配深/浅色模式。
 */

import React from 'react';
import { motion } from 'framer-motion';

/**
 * 内部图标组件 (Internal Icon Components)
 * 使用内联 SVG 确保 100% 可运行且无外部依赖。
 */

// 终端图标 (Terminal Icon)
const TerminalIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
    <path d="M112,128a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16h56A8,8,0,0,1,112,128Zm96,64H152a8,8,0,0,0,0,16h56a8,8,0,0,0,0-16Zm16-144V208a24,24,0,0,1-24,24H56a24,24,0,0,1-24-24V48A24,24,0,0,1,56,24H200A24,24,0,0,1,224,48Zm-16,0a8,8,0,0,0-8-8H56a8,8,0,0,0-8,8V208a8,8,0,0,0,8,8H200a8,8,0,0,0,8-8Z" opacity="0.2"></path>
    <path d="M85.66,82.34a8,8,0,0,1,0,11.32L61.31,118l24.35,24.34a8,8,0,0,1-11.32,11.32l-30-30a8,8,0,0,1,0-11.32l30-30A8,8,0,0,1,85.66,82.34ZM104,120H48a8,8,0,0,0,0,16h56a8,8,0,0,0,0-16Zm112,64H152a8,8,0,0,0,0,16h56a8,8,0,0,0,0-16Z"></path>
  </svg>
);

// 闪电图标 (Zap Icon)
const ZapIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
    <path d="M208,96,128,24,48,96h64L48,232l160-136Z" opacity="0.2"></path>
    <path d="M215.79,92.1a8,8,0,0,0-7.79-4.1H144V24a8,8,0,0,0-13.63-5.63l-80,80A8,8,0,0,0,56,112h64L56.37,226.1a8,8,0,0,0,13.26,8.27l144-128A8,8,0,0,0,215.79,92.1ZM128,206.13,128,112a8,8,0,0,0-8-8H77.13L128,52.13V144a8,8,0,0,0,8,8h50.87Z"></path>
  </svg>
);

// 容器图标 (Box Icon)
const BoxIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
    <path d="M224,177.3V78.7a8.1,8.1,0,0,0-4.1-7L132,20.1a8,8,0,0,0-7.9,0L36.1,71.7a8.1,8.1,0,0,0-4.1,7v98.6a8.1,8.1,0,0,0,4.1,7L124.1,236a8,8,0,0,0,7.9,0l87.9-51.7A8.1,8.1,0,0,0,224,177.3Z" opacity="0.2"></path>
    <path d="M223.7,71.4,131.7,21.8a15.8,15.8,0,0,0-15.4,0L24.3,71.4a15.8,15.8,0,0,0-8.3,14v85.2a15.8,15.8,0,0,0,8.3,14l92,49.6a15.8,15.8,0,0,0,15.4,0l92-49.6a15.8,15.8,0,0,0,8.3-14V85.4A15.8,15.8,0,0,0,223.7,71.4ZM124,35.8,202.8,78,124,120.3,45.2,78ZM32,96.3l84,45.3V225.2L32,180V96.3Zm108,128.9V141.6l84-45.3v83.7Z"></path>
  </svg>
);

export function CliSkillCardAligned({ skill }: { skill: any }) {
  if (!skill) {
    return (
      <div className="glass-card border border-slate-800 p-[18px] rounded-2xl bg-slate-900/20 animate-pulse flex flex-col h-[300px] items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
        LOADING SKILL...
      </div>
    );
  }

  return (
    <motion.a
      href={`/skills/${skill.skill_name || ''}`}
      key={skill.skill_name || 'loading'}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card border transition-all duration-300 group block cursor-pointer flex flex-col h-full p-[18px] hover:shadow-2xl hover:-translate-y-1"
      style={{ 
        border: `1px solid var(--color-border)`,
        backgroundColor: 'var(--color-bg-secondary, rgba(15, 17, 26, 0.4))' 
      }}
    >
      {/* 图标与 运行时标签 */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 bg-amber-500/10 border-amber-500/20 text-amber-500">
          <TerminalIcon size={24} />
        </div>
        
        <div className="flex flex-col items-end gap-1.5">
          <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25">
            CLI Runtime
          </span>
          <span className="flex items-center gap-1 text-[8px] font-mono text-slate-500 opacity-60 uppercase">
             <BoxIcon size={10} /> {skill.implementation?.binary || skill.implementation?.command?.split(' ')[0] || 'substrate'}
          </span>
        </div>
      </div>

      {/* 标题与 终端预览 */}
      <div className="flex flex-col flex-grow">
        <h3 className="text-base font-bold mb-2 flex items-center gap-2 group-hover:text-amber-500 transition-colors" 
            style={{ color: "var(--color-text-primary)" }}>
          {skill.display_name || 'Unnamed Skill'}
        </h3>
        
        {/* 命令行伪终端块 (Command Preview) - 适配深浅色背景 */}
        <div className="mb-3 p-2.5 rounded-lg border font-mono text-[11px] relative overflow-hidden group-hover:border-amber-500/30 transition-colors bg-black/5 dark:bg-black/40 border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500/70">
              <span className="select-none text-slate-400 dark:text-slate-600">$</span>
              <span className="truncate">
                {skill.implementation?.binary || 'exec'} {skill.implementation?.command || (skill.implementation?.args && skill.implementation.args.join(' ')) || ''} --json
              </span>
           </div>
           <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[var(--color-bg-secondary)] to-transparent pointer-events-none opacity-50" />
        </div>

        <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--color-text-secondary)", opacity: 0.8 }}>
          {skill.description || 'No description provided.'}
        </p>
      </div>

      {/* 底部 ID 与 消耗 */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <code className="text-[10px] px-2 py-1 rounded font-mono border text-[var(--color-text-secondary)] opacity-60" 
                style={{ backgroundColor: "var(--color-bg-primary)", borderColor: "var(--color-border)" }}>
            {skill.skill_name || 'unknown'}
          </code>
        </div>
        
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-bold">
          <ZapIcon size={12} />
          <span className="text-xs">{skill.credits_per_call || skill.cost_per_call || 1} CR</span>
        </div>
      </div>
    </motion.a>
  );
}

export default CliSkillCardAligned;
