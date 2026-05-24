// src/components/teams/TeamHeroBanner.tsx
// 团队头部卡片

import React from 'react';
import { Building2, Users, Globe } from 'lucide-react';
import type { TeamInfo } from '@/types/teams';

const PLAN_LABELS: Record<string, string> = {
  mode1: '共享网关',
  mode2: '专属网关',
  mode3: '私有化',
};

export function TeamHeroBanner({ team }: { team: TeamInfo }) {
  return (
    <div
      className="rounded-2xl border p-6 md:p-8"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0">
          {team.name?.charAt(0) || '?'}
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl md:text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
            {team.name}
          </h1>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-bold"
            >
              {PLAN_LABELS[team.plan] || team.plan}
            </span>
            <span className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              uniskill.ai/t/{team.slug}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm pt-1" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {team.member_count ?? 0} 位成员
            </span>
            <span className={`flex items-center gap-1.5 font-bold ${
              team.status === 'active' ? 'text-emerald-600' :
              team.status === 'suspended' ? 'text-red-600' : 'text-amber-600'
            }`}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'currentColor' }} />
              {team.status === 'active' ? '运营中' :
               team.status === 'suspended' ? '已暂停' : team.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
