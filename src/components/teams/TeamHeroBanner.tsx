// src/components/teams/TeamHeroBanner.tsx
// 团队头部卡片

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TeamInfo } from '@/types/teams';

const PLAN_LABELS: Record<string, string> = {
  mode1: '共享网关',
  mode2: '专属网关',
  mode3: '私有化',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  lead: { label: '潜在', color: 'text-amber-600 bg-amber-500/10' },
  active: { label: '运营中', color: 'text-emerald-600 bg-emerald-500/10' },
  suspended: { label: '已暂停', color: 'text-red-600 bg-red-500/10' },
};

export function TeamHeroBanner({ team }: { team: TeamInfo }) {
  const statusConfig = STATUS_LABELS[team.status] || {
    label: team.status,
    color: 'text-slate-500 bg-slate-500/10',
  };

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
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black" style={{ color: 'var(--color-text-primary)' }}>
              {team.name}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded text-xs font-bold">
              {PLAN_LABELS[team.plan] || team.plan}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${statusConfig.color}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} />
              {statusConfig.label}
            </span>
          </div>
          <div className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
            uniskill.ai/t/{team.slug}
          </div>
        </div>
        <Link
          href={`/t/${team.slug}/dashboard`}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
        >
          进入控制台
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
